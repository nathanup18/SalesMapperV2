"use client";

/**
 * LeafletMap — Leaflet/react-leaflet implementation of MapProviderProps.
 *
 * All Leaflet-specific imports and logic live here.
 * To swap providers, create a new file (e.g. GoogleMap.tsx) that satisfies
 * the same MapProviderProps interface and update the dynamic import in
 * MapCore.tsx.
 */

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import type { MapProviderProps, MarkerData, FlyToTarget } from "./types";

// ── Marker icon factory ───────────────────────────────────────────────────────

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

// ── Internal helpers (must be rendered inside <MapContainer>) ────────────────

/** Fits the viewport to all markers once, on first non-empty render. */
function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (markers.length > 0 && !fitted.current) {
      fitted.current = true;
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [markers, map]);
  return null;
}

/** Listens for map clicks and changes cursor when placing mode is active. */
function ClickHandler({
  active,
  onMapClick,
}: {
  active: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = active ? "crosshair" : "";
  }, [active, map]);
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Smoothly pans the map to a target whenever the target's seq changes.
 * seq must be set to Date.now() on each call to guarantee re-firing even
 * when flying to the same coordinates twice in a row.
 */
function FlyTo({ target }: { target: FlyToTarget | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 17, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.seq]);
  return null;
}

// ── Provider component ────────────────────────────────────────────────────────

export default function LeafletMap({
  markers,
  placingMode,
  onMapClick,
  defaultCenter,
  defaultZoom,
  flyTo,
}: MapProviderProps) {
  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={markers} />
      <ClickHandler active={placingMode} onMapClick={onMapClick} />
      <FlyTo target={flyTo} />

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={makeIcon(m.color)}
        >
          <Popup minWidth={210}>{m.popupContent}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
