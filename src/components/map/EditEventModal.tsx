"use client";

import { useState } from "react";
import {
  PLACEABLE_STATUSES,
  STATUS_LABELS,
  STATUS_HEX,
  type Status,
} from "@/lib/statuses";

type Props = {
  address: string | null;
  currentStatus: string;
  currentNotes: string | null;
  actingUser: string;
  onSave: (status: string, notes: string, address: string) => Promise<void>;
  onCancel: () => void;
};

/**
 * Edit modal — opened from the marker popup via the explicit "Edit" button.
 * Saving appends a new DoorEvent with type="EDIT" (append-only history).
 * Never mutates prior events.
 */
export default function EditEventModal({
  address,
  currentStatus,
  currentNotes,
  actingUser,
  onSave,
  onCancel,
}: Props) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [addressValue, setAddressValue] = useState(address ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(status, notes.trim(), addressValue.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <h2 className="font-semibold text-base mb-0.5">Edit Marker</h2>
        <p className="text-xs text-gray-400 mb-4">
          Saving as:{" "}
          <span className="font-medium text-gray-600">{actingUser || "unknown"}</span>
        </p>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Address</label>
          <input
            type="text"
            value={addressValue}
            onChange={(e) => setAddressValue(e.target.value)}
            placeholder="Enter address…"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Changing address will move the marker to the resolved location.
          </p>
        </div>

        {/* Status selector */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Status</p>
          <div className="flex flex-col gap-1.5">
            {PLACEABLE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="text-left px-2 py-1.5 rounded text-xs font-medium text-white"
                style={{
                  background: STATUS_HEX[s as Status],
                  opacity: status === s ? 1 : 0.4,
                  outline: status === s ? "2px solid white" : "none",
                  outlineOffset: "1px",
                }}
              >
                {status === s ? "✓ " : ""}
                {STATUS_LABELS[s as Status]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes…"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
