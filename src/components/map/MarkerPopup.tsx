"use client";

import { STATUS_LABELS, STATUS_BADGE, type Status } from "@/lib/statuses";
import type { Marker } from "@/lib/types";

type Props = {
  marker: Marker;
  /** Omit to hide the Edit button (user lacks canEditMarkers). */
  onEdit?: () => void;
};

/**
 * Provider-agnostic popup content.
 * Shows the marker's current status, notes, and who placed it.
 * Delete is available inside the Edit modal.
 */
export default function MarkerPopup({ marker, onEdit }: Props) {
  const status = marker.status as Status;
  const placedAt = marker.createdAt?.toDate?.()?.toLocaleString() ?? "";

  return (
    <div className="text-sm" style={{ minWidth: 210 }}>
      <p className="font-semibold text-gray-900 mb-1 leading-tight">
        {marker.address ?? "Unknown address"}
      </p>

      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-1 ${
          STATUS_BADGE[status] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {STATUS_LABELS[status] ?? marker.status}
      </span>

      {marker.notes && (
        <p className="text-gray-700 text-xs mb-1 leading-snug">{marker.notes}</p>
      )}

      {marker.createdByName && (
        <p className="text-gray-600 text-xs">By {marker.createdByName}</p>
      )}
      {placedAt && (
        <p className="text-gray-500 text-xs mb-3">{placedAt}</p>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="w-full text-xs bg-blue-600 text-white rounded px-2 py-1.5 hover:bg-blue-700 font-medium"
        >
          Edit
        </button>
      )}
    </div>
  );
}
