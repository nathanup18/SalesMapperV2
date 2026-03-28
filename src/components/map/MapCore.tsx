"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { STATUS_HEX, type Status } from "@/lib/statuses";
import { useAuth } from "@/contexts/AuthContext";
import { perm } from "@/lib/permissions";
import { useMarkers } from "@/hooks/useMarkers";
import { createMarker, updateMarker, softDeleteMarker } from "@/lib/markers";
import type { Marker, MarkerStatus } from "@/lib/types";

import type { MarkerData, MapProviderProps, FlyToTarget } from "./providers/types";
import MarkerPopup from "./MarkerPopup";
import MapControls from "./MapControls";
import EditEventModal from "./EditEventModal";
import AddressSearch from "@/components/search/AddressSearch";
import MarkerFilters, { type FilterState } from "@/components/filters/MarkerFilters";
import AppMenu from "@/components/navigation/AppMenu";

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

type EditTarget = {
  markerId: string;
  address: string | null;
  currentStatus: string;
  currentNotes: string | null;
};

export default function MapCore() {
  const router = useRouter();
  const { user, orgId, membership, loading: authLoading } = useAuth();
  const { markers, loading: markersLoading, error: markersError } = useMarkers(orgId);

  const [isPlacing, setIsPlacing] = useState(false);
  const [placingLoading, setPlacingLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status>("SOLD");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: "ALL", rep: "ALL", date: "ALL" });
  const [showFilters, setShowFilters] = useState(false);

  // ── Access control ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/sign-in"); return; }
    if (!orgId || !membership || membership.status !== "active") {
      router.replace("/no-access");
      return;
    }
    if (!perm(membership, "canViewMap")) {
      router.replace("/no-access");
    }
  }, [authLoading, user, orgId, membership, router]);

  // ── Derived permissions ───────────────────────────────────────────────────────

  const canPlace = perm(membership, "canPlaceMarkers");
  const canEdit  = perm(membership, "canEditMarkers");

  // ── Place flow ────────────────────────────────────────────────────────────────

  const handleMapClick = async (lat: number, lng: number) => {
    if (!orgId || !canPlace) return;
    setPlacingLoading(true);
    try {
      await createMarker({ orgId, lat, lng, status: selectedStatus as MarkerStatus });
    } catch (err) {
      console.error("[handleMapClick] createMarker failed:", err);
      alert(`Marker placement failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setPlacingLoading(false);
    }
  };

  // ── Delete flow ───────────────────────────────────────────────────────────────

  const handleDelete = async (markerId: string) => {
    if (!orgId || !canEdit) return;
    await softDeleteMarker(orgId, markerId);
  };

  // ── Edit flow ─────────────────────────────────────────────────────────────────

  const handleOpenEdit = (marker: Marker) => {
    if (!canEdit) return;
    setEditTarget({
      markerId: marker.id,
      address: marker.address,
      currentStatus: marker.status,
      currentNotes: marker.notes,
    });
  };

  const handleSaveEdit = async (status: string, notes: string, address: string) => {
    if (!editTarget || !orgId || !canEdit) return;
    await updateMarker({
      orgId,
      markerId: editTarget.markerId,
      status: status as MarkerStatus,
      notes: notes || null,
      ...(address !== (editTarget.address ?? "") ? { address: address || null } : {}),
    });
    setEditTarget(null);
  };

  // ── Search / flyTo ────────────────────────────────────────────────────────────

  const flyToCoords = (lat: number, lng: number, zoom?: number) => {
    setFlyTo({ lat, lng, zoom, seq: Date.now() });
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const filteredMarkers = markers.filter((m) => {
    if (filters.status !== "ALL" && m.status !== filters.status) return false;
    if (filters.rep !== "ALL" && m.createdByName !== filters.rep) return false;
    if (filters.date !== "ALL") {
      const d = m.createdAt?.toDate?.();
      if (d) {
        const now = new Date();
        if (filters.date === "TODAY" && d.toDateString() !== now.toDateString()) return false;
        if (filters.date === "WEEK") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (d < weekAgo) return false;
        }
      }
    }
    return true;
  });

  const allReps = [
    ...new Set(markers.map((m) => m.createdByName).filter((n): n is string => !!n)),
  ].sort();

  const markerData: MarkerData[] = filteredMarkers.map((m) => ({
    id: m.id,
    lat: m.lat,
    lng: m.lng,
    color: STATUS_HEX[m.status as Status],
    popupContent: (
      <MarkerPopup
        marker={m}
        // Only pass onEdit if the user has canEditMarkers
        onEdit={canEdit ? () => handleOpenEdit(m) : undefined}
      />
    ),
  }));

  // ── Loading / access guard ────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user || !orgId || !membership || membership.status !== "active") {
    return null; // Redirect is underway
  }

  return (
    <div className="relative w-full h-full">
      <MapProvider
        markers={markerData}
        placingMode={isPlacing}
        onMapClick={canPlace ? handleMapClick : () => {}}
        defaultCenter={[39.7392, -104.9903]}
        defaultZoom={15}
        flyTo={flyTo}
      />

      {markersError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-lg max-w-xs text-center pointer-events-none">
          {markersError}
        </div>
      )}

      {markersLoading && markers.length === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-white text-gray-500 text-xs font-medium px-4 py-2 rounded-lg shadow-md pointer-events-none">
          Loading markers…
        </div>
      )}

      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
        <AddressSearch onResult={(r) => flyToCoords(r.lat, r.lng, 17)} />
        <MarkerFilters
          filters={filters}
          allReps={allReps}
          onChange={setFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
        />
        <AppMenu />
      </div>

      {/* FAB only renders if user can place markers */}
      {canPlace && (
        <MapControls
          isPlacing={isPlacing}
          placingLoading={placingLoading}
          selectedStatus={selectedStatus}
          onStartPlacing={() => setIsPlacing(true)}
          onSelectStatus={(s) => { setSelectedStatus(s); setIsPlacing(true); }}
          onCancelPlacing={() => setIsPlacing(false)}
        />
      )}

      {canEdit && editTarget && (
        <EditEventModal
          address={editTarget.address}
          currentStatus={editTarget.currentStatus}
          currentNotes={editTarget.currentNotes}
          canDelete={true}
          onSave={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
          onDelete={async () => { await handleDelete(editTarget.markerId); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
