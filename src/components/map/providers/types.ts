import type { ReactNode } from "react";

/**
 * A single marker to be rendered on the map.
 * Provider-agnostic: the map provider reads these fields to render
 * an appropriately-coloured marker with an attached popup.
 */
export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  /** Hex colour for the marker dot. */
  color: string;
  /** Content rendered inside the popup / info-window. */
  popupContent: ReactNode;
}

/**
 * Target for programmatic map panning.
 * seq must be set to Date.now() each time to ensure the effect re-fires
 * even when flying to the same coordinates twice.
 */
export interface FlyToTarget {
  lat: number;
  lng: number;
  zoom?: number;
  seq: number;
}

/**
 * Props passed to any map provider component.
 * To swap providers (e.g. Leaflet → Google Maps), implement a new
 * component that satisfies this interface and update the dynamic
 * import in MapCore.tsx.
 */
export interface MapProviderProps {
  markers: MarkerData[];
  /** When true the cursor changes to crosshair and clicks fire onMapClick. */
  placingMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  defaultCenter: [number, number];
  defaultZoom: number;
  /** When set, smoothly pan/zoom the map to this target. */
  flyTo?: FlyToTarget | null;
}
