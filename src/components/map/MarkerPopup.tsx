"use client";

import { useState } from "react";
import Link from "next/link";
import { STATUS_LABELS, STATUS_BADGE, type Status } from "@/lib/statuses";

type LatestEvent = {
  status: string;
  notes: string | null;
  createdByName: string;
  createdAt: string;
  type: string;
};

type Props = {
  houseId: string;
  address: string | null;
  latestEvent: LatestEvent | null;
  /** Opens the edit modal for this house. */
  onEdit: () => void;
  /** Hard-deletes the house and all its history. */
  onDelete: () => Promise<void>;
};

/**
 * Provider-agnostic popup content.
 * Rendered inside whatever popup/info-window the map provider uses.
 * Shows current state + Edit, History, and Delete actions.
 */
export default function MarkerPopup({
  houseId,
  address,
  latestEvent,
  onEdit,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  if (confirmDelete) {
    return (
      <div className="text-sm" style={{ minWidth: 210 }}>
        <p className="font-semibold mb-1">Delete this marker?</p>
        <p className="text-xs text-gray-500 mb-4 leading-snug">
          This will permanently remove the marker and all its visit history. This cannot be undone.
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 text-xs bg-red-600 text-white rounded px-2 py-1.5 hover:bg-red-700 font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm" style={{ minWidth: 210 }}>
      <p className="font-semibold mb-1 leading-tight">
        {address ?? "Unknown address"}
      </p>

      {latestEvent ? (
        <>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-1 ${
              STATUS_BADGE[latestEvent.status as Status] ??
              "bg-gray-100 text-gray-700"
            }`}
          >
            {STATUS_LABELS[latestEvent.status as Status] ?? latestEvent.status}
          </span>

          {latestEvent.notes && (
            <p className="text-gray-600 text-xs mb-1 leading-snug">
              {latestEvent.notes}
            </p>
          )}

          <p className="text-gray-400 text-xs">
            By {latestEvent.createdByName}
          </p>
          <p className="text-gray-400 text-xs mb-3">
            {new Date(latestEvent.createdAt).toLocaleString()}
          </p>
        </>
      ) : (
        <p className="text-gray-400 text-xs mb-3">No visits recorded yet.</p>
      )}

      <div className="flex gap-1.5 mb-1.5">
        <button
          onClick={onEdit}
          className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1.5 hover:bg-blue-700 font-medium"
        >
          Edit
        </button>
        <Link
          href={`/houses/${houseId}`}
          className="flex-1 text-center text-xs border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 font-medium"
        >
          History
        </Link>
      </div>

      <button
        onClick={() => setConfirmDelete(true)}
        className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1.5 font-medium transition-colors"
      >
        Delete marker
      </button>
    </div>
  );
}
