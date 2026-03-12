"use client";

/**
 * MapboxMap — Mapbox GL / react-map-gl implementation of MapProviderProps.
 *
 * All Mapbox-specific imports and logic live here.
 * To swap providers, create a new file that satisfies MapProviderProps
 * and update the dynamic import in MapCore.tsx.
 */

import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Marker,
  Popup,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import { useEffect, useRef, useState, useCallback } from "react";
import type { MapProviderProps, FlyToTarget } from "./types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const VIEW_KEY = "sm_map_view";

// ── Saved view helpers ────────────────────────────────────────────────────────

type SavedView = { latitude: number; longitude: number; zoom: number };

function loadSavedView(): SavedView | null {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (
      v !== null &&
      typeof v === "object" &&
      "latitude" in v && typeof (v as SavedView).latitude === "number" &&
      "longitude" in v && typeof (v as SavedView).longitude === "number" &&
      "zoom" in v && typeof (v as SavedView).zoom === "number"
    ) {
      return v as SavedView;
    }
  } catch {
    // malformed JSON or localStorage unavailable
  }
  return null;
}

function saveView(v: SavedView) {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(v));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ── Marker dot ────────────────────────────────────────────────────────────────

function MarkerDot({ color, selected }: { color: string; selected: boolean }) {
  return (
    <div
      style={{
        width: selected ? 20 : 16,
        height: selected ? 20 : 16,
        borderRadius: "50%",
        background: color,
        border: `2px solid white`,
        boxShadow: selected
          ? `0 0 0 2px ${color}, 0 2px 6px rgba(0,0,0,0.4)`
          : "0 1px 4px rgba(0,0,0,0.35)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    />
  );
}

// ── FlyTo helper ──────────────────────────────────────────────────────────────

function useFlyTo(mapRef: React.RefObject<MapRef | null>, flyTo: FlyToTarget | null | undefined) {
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 17,
      duration: 800,
      essential: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.seq]);
}

// ── Provider component ────────────────────────────────────────────────────────

export default function MapboxMap({
  markers,
  placingMode,
  onMapClick,
  defaultCenter,
  defaultZoom,
  flyTo,
}: MapProviderProps) {
  const mapRef = useRef<MapRef>(null);
  const markerClickedRef = useRef(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Read saved view once at mount (lazy initializer — runs client-side only).
  // hasSavedView drives whether to skip the "fit all markers" auto-zoom.
  const [initialView] = useState<SavedView>(() => {
    const saved = loadSavedView();
    return saved ?? {
      latitude: defaultCenter[0],
      longitude: defaultCenter[1],
      zoom: defaultZoom,
    };
  });
  const [hasSavedView] = useState(() => loadSavedView() !== null);

  // fittedRef: if we're restoring a saved view, treat "fitting" as already done
  // so we don't override the user's last position with a fitBounds call.
  const fittedRef = useRef(hasSavedView);

  useFlyTo(mapRef, flyTo);

  // Fit map to all markers on first non-empty load — only when there is no saved view.
  useEffect(() => {
    if (!mapRef.current || markers.length === 0 || fittedRef.current) return;
    fittedRef.current = true;
    if (markers.length === 1) {
      mapRef.current.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 16, duration: 600 });
      return;
    }
    let minLat = markers[0].lat, maxLat = markers[0].lat;
    let minLng = markers[0].lng, maxLng = markers[0].lng;
    for (const m of markers) {
      minLat = Math.min(minLat, m.lat);
      maxLat = Math.max(maxLat, m.lat);
      minLng = Math.min(minLng, m.lng);
      maxLng = Math.max(maxLng, m.lng);
    }
    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 70, duration: 800, maxZoom: 17 }
    );
  }, [markers]);

  // Crosshair cursor in placement mode
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = placingMode ? "crosshair" : "";
  }, [placingMode]);

  // Close popup when selected marker is no longer in the list (e.g. filtered out)
  useEffect(() => {
    if (selectedMarkerId && !markers.find((m) => m.id === selectedMarkerId)) {
      setSelectedMarkerId(null);
    }
  }, [markers, selectedMarkerId]);

  // Persist map position on every pan/zoom end (not on every frame)
  const handleMoveEnd = useCallback(
    (e: { viewState: SavedView }) => {
      saveView({
        latitude: e.viewState.latitude,
        longitude: e.viewState.longitude,
        zoom: e.viewState.zoom,
      });
    },
    []
  );

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }
      if (placingMode) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      } else {
        setSelectedMarkerId(null);
      }
    },
    [placingMode, onMapClick]
  );

  const handleMarkerClick = useCallback((markerId: string) => {
    markerClickedRef.current = true;
    setSelectedMarkerId((prev) => (prev === markerId ? null : markerId));
  }, []);

  const selectedMarker = selectedMarkerId
    ? markers.find((m) => m.id === selectedMarkerId) ?? null
    : null;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleMapClick}
      onMoveEnd={handleMoveEnd}
      reuseMaps
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          latitude={m.lat}
          longitude={m.lng}
          anchor="center"
          onClick={() => handleMarkerClick(m.id)}
        >
          <MarkerDot color={m.color} selected={m.id === selectedMarkerId} />
        </Marker>
      ))}

      {selectedMarker && (
        <Popup
          latitude={selectedMarker.lat}
          longitude={selectedMarker.lng}
          anchor="bottom"
          offset={14}
          closeButton
          closeOnClick={false}
          onClose={() => setSelectedMarkerId(null)}
          maxWidth="270px"
          style={{ padding: 0 }}
        >
          {selectedMarker.popupContent}
        </Popup>
      )}
    </Map>
  );
}
