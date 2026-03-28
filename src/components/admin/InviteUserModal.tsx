"use client";

import { useState } from "react";
import { createInvite } from "@/lib/invites";
import { DEFAULT_MEMBER_PERMISSIONS } from "@/lib/permissions";
import type { Permissions } from "@/lib/types";

type Props = {
  orgId: string;
  onClose: () => void;
};

const PERMISSION_LABELS: { key: keyof Permissions; label: string; description: string }[] = [
  { key: "canViewMap",          label: "View Map",          description: "See the territory map and all markers" },
  { key: "canPlaceMarkers",     label: "Place Markers",     description: "Tap to record new door contacts" },
  { key: "canEditMarkers",      label: "Edit Markers",      description: "Change status, notes, or address on existing markers" },
  { key: "canViewDashboard",    label: "View Dashboard",    description: "Access analytics and rep leaderboard" },
  { key: "canInviteUsers",      label: "Invite Users",      description: "Send invite links to new teammates" },
  { key: "canManagePermissions", label: "Manage Permissions", description: "Edit other members' permissions" },
];

export default function InviteUserModal({ orgId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({ ...DEFAULT_MEMBER_PERMISSIONS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggle = (key: keyof Permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const token = await createInvite({ email: trimmed, orgId, permissionsToApply: permissions });
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Invite Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {inviteLink ? (
          /* ── Success state: show copyable link ── */
          <div>
            <p className="text-sm text-green-700 font-medium mb-3">
              Invite created! Share this link:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600 break-all font-mono">{inviteLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors mb-2"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
              Done
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-2">Permissions</p>
              <div className="space-y-2">
                {PERMISSION_LABELS.map(({ key, label, description }) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        onChange={() => toggle(key)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 leading-none mb-0.5">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating…" : "Create invite link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
