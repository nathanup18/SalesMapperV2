"use client";

import MapCore from "./MapCore";

/**
 * Public entry point for the map.
 * MapCore dynamically imports the Leaflet provider (SSR-safe).
 */
export default function TerritoryMap() {
  return <MapCore />;
}
