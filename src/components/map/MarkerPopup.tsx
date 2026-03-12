"use client";

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
  onEdit: () => void;
};

/**
 * Provider-agnostic popup content.
 * Shows current state + Edit and History actions.
 * Delete is available inside the Edit modal.
 */
export default function MarkerPopup({
  houseId,
  address,
  latestEvent,
  onEdit,
}: Props) {
  return (
    <div className="text-sm" style={{ minWidth: 210 }}>
      <p className="font-semibold text-gray-900 mb-1 leading-tight">
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
            <p className="text-gray-700 text-xs mb-1 leading-snug">
              {latestEvent.notes}
            </p>
          )}

          <p className="text-gray-600 text-xs">
            By {latestEvent.createdByName}
          </p>
          <p className="text-gray-500 text-xs mb-3">
            {new Date(latestEvent.createdAt).toLocaleString()}
          </p>
        </>
      ) : (
        <p className="text-gray-500 text-xs mb-3">No visits recorded yet.</p>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={onEdit}
          className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1.5 hover:bg-blue-700 font-medium"
        >
          Edit
        </button>
        <Link
          href={`/houses/${houseId}`}
          className="flex-1 text-center text-xs border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 font-medium text-gray-700"
        >
          History
        </Link>
      </div>
    </div>
  );
}
