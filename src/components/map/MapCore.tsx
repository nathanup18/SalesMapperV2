"use client";

/**
 * MapCore — orchestrator.
 *
 * Responsibilities:
 *   - Fetch houses + their latest event from the API
 *   - Manage placement / edit / filter / search / follow-up state
 *   - Build provider-agnostic MarkerData[]
 *   - Render the map provider + overlay controls + modals
 *
 * To swap map providers:
 *   Change the dynamic import below to point at a different file in
 *   ./providers/ that satisfies MapProviderProps (see providers/types.ts).
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { STATUS_HEX, type Status } from "@/lib/statuses";

import type { MarkerData, MapProviderProps, FlyToTarget } from "./providers/types";
import MarkerPopup from "./MarkerPopup";
import MapControls from "./MapControls";
import EditEventModal from "./EditEventModal";
import AddressSearch from "@/components/search/AddressSearch";
import MarkerFilters, { type FilterState } from "@/components/filters/MarkerFilters";
import AppMenu from "@/components/navigation/AppMenu";

// ── Swap providers here ──────────────────────────────────────────────────────
// Replace "./providers/MapboxMap" with any file satisfying MapProviderProps.
const MapProvider = dynamic<MapProviderProps>(
  () => import("./providers/MapboxMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading map…
      </div>
    ),
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

type DoorEvent = {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  createdByName: string;
  createdAt: string;
};

type House = {
  id: string;
  address: string | null;
  latitude: number;
  longitude: number;
  /** Sorted newest-first by API. Index 0 = current visible state. */
  events: DoorEvent[];
};

type EditTarget = {
  houseId: string;
  address: string | null;
  currentStatus: string;
  currentNotes: string | null;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function MapCore() {
  const [houses, setHouses] = useState<House[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingLoading, setPlacingLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>("SOLD");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: "ALL", rep: "ALL", date: "ALL" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const res = await fetch("/api/houses");
      if (!res.ok) {
        console.error("[fetchHouses] API error:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setHouses(data);
      } else {
        console.error("[fetchHouses] unexpected response shape:", data);
      }
    } catch (err) {
      console.error("[fetchHouses] network error:", err);
    }
  };

  // ── Place flow ───────────────────────────────────────────────────────────────
  // Map tap → immediate POST (server reverse-geocodes + proximity checks).
  // No modal. Placement mode persists until explicitly cancelled.

  const handleMapClick = async (lat: number, lng: number) => {
    setPlacingLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          status: selectedStatus,
          notes: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        console.error("[handleMapClick] placement failed:", res.status, err);
        alert(`Marker placement failed: ${err.error ?? "Server error (check console)"}`);
        return;
      }
      await fetchHouses();
    } catch (err) {
      console.error("[handleMapClick] network error:", err);
      alert("Marker placement failed — check your network connection.");
    } finally {
      setPlacingLoading(false);
      // Intentionally do NOT exit placing mode — persist for next tap
    }
  };

  // ── Delete flow ──────────────────────────────────────────────────────────────
  // Hard delete — removes the House + all DoorEvents (CASCADE).
  // Only reachable via the explicit "Delete marker" button + inline confirmation.

  const handleDelete = async (houseId: string) => {
    await fetch(`/api/houses/${houseId}`, { method: "DELETE" });
    await fetchHouses();
  };

  // ── Edit flow ────────────────────────────────────────────────────────────────
  // Only reachable via the explicit "Edit" button inside a marker popup.
  // Appends EDIT event; if address changed, also PATCHes house + appends ADDRESS_CHANGE event.

  const handleOpenEdit = (houseId: string) => {
    const house = houses.find((h) => h.id === houseId);
    if (!house) return;
    const latest = house.events[0];
    setEditTarget({
      houseId,
      address: house.address,
      currentStatus: latest?.status ?? "NOT_VISITED",
      currentNotes: latest?.notes ?? null,
    });
  };

  const handleSaveEdit = async (status: string, notes: string, address: string) => {
    if (!editTarget) return;

    const tasks: Promise<unknown>[] = [
      fetch(`/api/houses/${editTarget.houseId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EDIT",
          status,
          notes: notes || null,
        }),
      }),
    ];

    // Only PATCH house if address actually changed
    if (address && address !== editTarget.address) {
      tasks.push(
        fetch(`/api/houses/${editTarget.houseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        })
      );
    }

    await Promise.all(tasks);
    setEditTarget(null);
    await fetchHouses();
  };

  // ── Search / flyTo ────────────────────────────────────────────────────────────

  const flyToCoords = (lat: number, lng: number, zoom?: number) => {
    setFlyTo({ lat, lng, zoom, seq: Date.now() });
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  // Client-side filter on the loaded houses
  const filteredHouses = houses.filter((h) => {
    const latest = h.events[0];
    if (filters.status !== "ALL") {
      if (latest?.status !== filters.status) return false;
    }
    if (filters.rep !== "ALL") {
      if (latest?.createdByName !== filters.rep) return false;
    }
    if (filters.date !== "ALL" && latest) {
      const d = new Date(latest.createdAt);
      const now = new Date();
      if (filters.date === "TODAY" && d.toDateString() !== now.toDateString()) return false;
      if (filters.date === "WEEK") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (d < weekAgo) return false;
      }
    }
    return true;
  });

  // All unique rep names (from latest event per house)
  const allReps = [
    ...new Set(
      houses.flatMap((h) => h.events.map((e) => e.createdByName)).filter(Boolean)
    ),
  ].sort();

  // ── Build marker data ─────────────────────────────────────────────────────────

  const markers: MarkerData[] = filteredHouses.map((h) => {
    const latest = h.events[0];
    const status = (latest?.status ?? "NOT_VISITED") as Status;
    return {
      id: h.id,
      lat: h.latitude,
      lng: h.longitude,
      color: STATUS_HEX[status],
      popupContent: (
        <MarkerPopup
          houseId={h.id}
          address={h.address}
          latestEvent={
            latest
              ? {
                  status: latest.status,
                  notes: latest.notes,
                  createdByName: latest.createdByName,
                  createdAt: latest.createdAt,
                  type: latest.type,
                }
              : null
          }
          onEdit={() => handleOpenEdit(h.id)}
        />
      ),
    };
  });

  return (
    <div className="relative w-full h-full">
      {/* Map provider — all Leaflet specifics isolated inside LeafletMap.tsx */}
      <MapProvider
        markers={markers}
        placingMode={isPlacing}
        onMapClick={handleMapClick}
        defaultCenter={[39.7392, -104.9903]}
        defaultZoom={15}
        flyTo={flyTo}
      />

      {/* Top overlay: search + filters + menu */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
        <AddressSearch
          onResult={(r) => flyToCoords(r.lat, r.lng, 17)}
        />
        <MarkerFilters
          filters={filters}
          allReps={allReps}
          onChange={setFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
        />
        <AppMenu />
      </div>

      {/* Bottom-right FAB + placement controls */}
      <MapControls
        isPlacing={isPlacing}
        placingLoading={placingLoading}
        selectedStatus={selectedStatus}
        onStartPlacing={() => setIsPlacing(true)}
        onSelectStatus={(s) => { setSelectedStatus(s); setIsPlacing(true); }}
        onCancelPlacing={() => setIsPlacing(false)}
      />

      {/* Edit modal — only from explicit popup Edit button */}
      {editTarget && (
        <EditEventModal
          address={editTarget.address}
          currentStatus={editTarget.currentStatus}
          currentNotes={editTarget.currentNotes}
          canDelete={true}
          onSave={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
          onDelete={async () => { await handleDelete(editTarget.houseId); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
