"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Marker } from "@/lib/types";

/**
 * Subscribes to the markers for a given org in real time.
 *
 * Uses Firestore's onSnapshot listener — when any user in the org writes a
 * marker, this hook updates automatically without any manual refetch.
 *
 * Soft-deleted markers (deletedAt !== null) are filtered client-side to avoid
 * requiring a composite Firestore index on first run.
 *
 * Note: once you have enough markers that fetching soft-deleted ones is
 * expensive, add a composite index on (deletedAt, createdAt) in the Firebase
 * console and move the filter to the query:
 *   where("deletedAt", "==", null), orderBy("createdAt", "desc")
 */
export function useMarkers(orgId: string | null): {
  markers: Marker[];
  loading: boolean;
  error: string | null;
} {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setMarkers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const markersRef = collection(db, "organizations", orgId, "markers");
    const q = query(markersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all: Marker[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Marker, "id">),
        }));
        // Filter soft-deleted markers client-side
        setMarkers(all.filter((m) => m.deletedAt === null));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useMarkers] onSnapshot error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  return { markers, loading, error };
}
