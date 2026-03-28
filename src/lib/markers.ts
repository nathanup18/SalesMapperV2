import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { MarkerStatus } from "./types";

// ── Geocoding ──────────────────────────────────────────────────────────────────
// Called client-side. NEXT_PUBLIC_MAPBOX_TOKEN is a public token — safe to use
// directly in browser code. Returns null on any failure rather than throwing.

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
        `?access_token=${token}&limit=1&types=address,poi,place`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { features: { place_name: string }[] };
    return data.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}

// ── Create ─────────────────────────────────────────────────────────────────────

interface CreateMarkerParams {
  orgId: string;
  lat: number;
  lng: number;
  status: MarkerStatus;
  notes?: string | null;
}

/**
 * Creates a marker document inside organizations/{orgId}/markers.
 * Reverse-geocodes lat/lng to get a human-readable address.
 * Returns the new document ID.
 */
export async function createMarker(params: CreateMarkerParams): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const address = await reverseGeocode(params.lat, params.lng);

  const markersRef = collection(db, "organizations", params.orgId, "markers");
  const docRef = await addDoc(markersRef, {
    organizationId: params.orgId,   // redundant with path; enforced by Security Rules
    createdByUserId: user.uid,
    createdByName: user.displayName ?? user.email ?? null,
    status: params.status,
    lat: params.lat,
    lng: params.lng,
    address: address ?? `${params.lat.toFixed(5)}, ${params.lng.toFixed(5)}`,
    notes: params.notes ?? null,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// ── Update ─────────────────────────────────────────────────────────────────────

interface UpdateMarkerParams {
  orgId: string;
  markerId: string;
  status?: MarkerStatus;
  notes?: string | null;
  address?: string | null;
}

export async function updateMarker(params: UpdateMarkerParams): Promise<void> {
  const markerRef = doc(
    db,
    "organizations",
    params.orgId,
    "markers",
    params.markerId
  );
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (params.status !== undefined) updates.status = params.status;
  if (params.notes !== undefined) updates.notes = params.notes;
  if (params.address !== undefined) updates.address = params.address;
  await updateDoc(markerRef, updates);
}

// ── Soft delete ────────────────────────────────────────────────────────────────
// Hard deletes are blocked by Security Rules. Setting deletedAt = now() is
// the only supported removal path. The realtime query filters these out.

export async function softDeleteMarker(
  orgId: string,
  markerId: string
): Promise<void> {
  const markerRef = doc(db, "organizations", orgId, "markers", markerId);
  await updateDoc(markerRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
