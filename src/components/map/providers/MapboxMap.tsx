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

// ── FlyTo helper (uses map ref directly, not a hook) ──────────────────────────

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
  const fittedRef = useRef(false);
  // Prevent map click from firing right after a marker click
  const markerClickedRef = useRef(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useFlyTo(mapRef, flyTo);

  // Fit map to all markers on first non-empty load
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

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      // Swallow event if it originated from a marker click
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }
      if (placingMode) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      } else {
        // Clicking the canvas while not placing closes open popup
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
      initialViewState={{
        longitude: defaultCenter[1],
        latitude: defaultCenter[0],
        zoom: defaultZoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleMapClick}
      reuseMaps
    >
      {/* Markers */}
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

      {/* Popup for selected marker */}
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
