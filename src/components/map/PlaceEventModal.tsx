"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_BADGE, type Status } from "@/lib/statuses";

type Props = {
  status: Status;
  /** Address of nearby house if one was found within proximity threshold. */
  nearbyAddress: string | null;
  /** True when clicking this spot will create a brand-new House record. */
  isNewHouse: boolean;
  onSave: (notes: string) => Promise<void>;
  onCancel: () => void;
};

/**
 * Confirmation modal shown immediately after the user taps the map.
 * Lets the rep add notes before the event is committed.
 * This is the ONLY point where the POST /api/events call is made.
 */
export default function PlaceEventModal({
  status,
  nearbyAddress,
  isNewHouse,
  onSave,
  onCancel,
}: Props) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <h2 className="font-semibold text-base mb-0.5">
          {isNewHouse ? "New Location" : "Add Visit"}
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          {nearbyAddress ? `Attaching to: ${nearbyAddress}` : "Creating a new house record"}
        </p>

        {/* Status badge — read-only here; chosen before tapping */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Outcome</p>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">
            Notes <span className="text-gray-300">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes…"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 border rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
