/**
 * Geocoding abstraction layer — backed by Mapbox Geocoding API v5.
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN (also readable server-side).
 * To swap providers, replace the fetch calls below.
 * All functions run server-side (called from API routes).
 */

export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type MapboxFeature = {
  place_name: string;
  geometry: { coordinates: [number, number] };
};

type MapboxGeocodingResponse = {
  features: MapboxFeature[];
};

/**
 * Reverse geocode: lat/lng → nearest real-world address label.
 * Returns null on failure — callers must fall back gracefully.
 *
 * NOTE: lat/lng returned in the result are the *original* clicked coordinates,
 * not the geocoded centroid. Markers always stay at the clicked location.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  if (!TOKEN) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${TOKEN}&limit=1&types=address,poi,place`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as MapboxGeocodingResponse;
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      address: feature.place_name,
      // Keep original clicked coordinates — do NOT snap to geocoded centroid
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

/**
 * Forward geocode: address string → coordinates + canonical address label.
 * Returns null if nothing is found or on network error.
 */
export async function geocodeAddress(
  query: string
): Promise<GeocodingResult | null> {
  if (!TOKEN) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as MapboxGeocodingResponse;
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      address: feature.place_name,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    };
  } catch {
    return null;
  }
}
