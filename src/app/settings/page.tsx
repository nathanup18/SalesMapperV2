"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppMenu from "@/components/navigation/AppMenu";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return null;

  const displayName = user?.displayName ?? "";
  const displayEmail = user?.email ?? "";

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <AppMenu />
      </div>

      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Section title="Account">
        <div className="space-y-4">
          <Field
            label="Name"
            hint="Managed by your account — used for event attribution on the map"
          >
            <input
              type="text"
              value={displayName}
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
            />
          </Field>

          <Field label="Email" hint="Managed by your account">
            <input
              type="email"
              value={displayEmail}
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
            />
          </Field>
        </div>
      </Section>

      {/* ── Save ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved ✓</span>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
