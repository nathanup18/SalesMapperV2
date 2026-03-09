"use client";

import { useState, useEffect } from "react";
import {
  getCurrentUser,
  saveCurrentUser,
  type CurrentUser,
  type Role,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/lib/current-user";
import { canManageTeam, canAccessAdmin } from "@/lib/permissions";
import AppMenu from "@/components/navigation/AppMenu";

const ROLES: Role[] = ["REP", "MANAGER", "ADMIN"];

// Mock team members — replace with real API data when auth is added
const MOCK_TEAM = [
  { name: "Alice Johnson", role: "REP" as Role, email: "alice@example.com" },
  { name: "Bob Martinez", role: "MANAGER" as Role, email: "bob@example.com" },
  { name: "Carol Smith", role: "REP" as Role, email: "carol@example.com" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<CurrentUser>({
    name: "",
    email: "",
    phone: "",
    role: "REP",
  });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoaded(true);
  }, []);

  const handleSave = () => {
    saveCurrentUser(user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!loaded) return null;

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
            hint="Used for event attribution on the map"
          >
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder="Your name"
              className={inputCls}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── Role ────────────────────────────────────────────────────────── */}
      <Section title="Role">
        <p className="text-xs text-gray-400 mb-3">
          Select your role to control which features are visible.
          {canAccessAdmin(user.role) && (
            <span className="ml-1 text-blue-500">
              Admins can change team member roles from the Team section.
            </span>
          )}
        </p>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setUser({ ...user, role: r })}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                user.role === r
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{ROLE_LABELS[r]}</span>
                {user.role === r && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{ROLE_DESCRIPTIONS[r]}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Feature visibility preview ──────────────────────────────────── */}
      <Section title="What you can see">
        <div className="space-y-2">
          <PermRow label="Place markers on the map" allowed />
          <PermRow label="View event history" allowed />
          <PermRow label="Edit markers and notes" allowed />
          <PermRow label="View all reps' activity" allowed={canManageTeam(user.role)} />
          <PermRow label="Manage team members" allowed={canManageTeam(user.role)} />
          <PermRow label="Adjust permissions" allowed={canAccessAdmin(user.role)} />
          <PermRow label="Admin controls" allowed={canAccessAdmin(user.role)} />
        </div>
      </Section>

      {/* ── Team ─────────────────────────────────────────────────── */}
      {canManageTeam(user.role) && (
        <Section title="Team">
          <p className="text-xs text-gray-400 mb-3">
            {canAccessAdmin(user.role)
              ? "As Admin, you can manage team members and their roles."
              : "As Manager, you can view team members. Admins can edit roles."}
          </p>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden">
            {MOCK_TEAM.map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[member.role]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-300 mt-3">
            Mock data — connect to auth/database when team management is implemented.
          </p>
        </Section>
      )}

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

function PermRow({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          allowed
            ? "bg-green-50 text-green-700"
            : "bg-gray-50 text-gray-400"
        }`}
      >
        {allowed ? "Allowed" : "Not available"}
      </span>
    </div>
  );
}
