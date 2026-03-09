import { NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";

/**
 * GET /api/geocode?q=<address>          → forward geocode
 * GET /api/geocode?lat=<n>&lng=<n>      → reverse geocode
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (lat && lng) {
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  }

  if (!q?.trim()) {
    return NextResponse.json({ error: "q param required" }, { status: 400 });
  }

  const result = await geocodeAddress(q.trim());
  if (!result) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  return NextResponse.json(result);
}
