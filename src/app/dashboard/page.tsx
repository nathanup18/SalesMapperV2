"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { perm } from "@/lib/permissions";
import { useMarkers } from "@/hooks/useMarkers";
import MiniBarChart from "@/components/analytics/MiniBarChart";
import AppMenu from "@/components/navigation/AppMenu";

export default function DashboardPage() {
  const router = useRouter();
  const { orgId, membership, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!perm(membership, "canViewDashboard")) router.replace("/no-access");
  }, [authLoading, membership, router]);
  const { markers, loading: markersLoading } = useMarkers(orgId);

  const s = useMemo(() => {
    const total = markers.length;
    const sold = markers.filter((m) => m.status === "SOLD").length;
    const notInterested = markers.filter((m) => m.status === "NOT_INTERESTED").length;
    const notHome = markers.filter((m) => m.status === "NOT_HOME").length;

    const conversionRate =
      sold + notInterested > 0
        ? `${((sold / (sold + notInterested)) * 100).toFixed(1)}%`
        : "—";

    const outreachRatio = total > 0 ? `${((sold / total) * 100).toFixed(1)}%` : "—";

    const hourly = Array.from({ length: 24 }, (_, h) => ({
      label: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`,
      count: markers.filter((m) => {
        const d = m.createdAt?.toDate?.();
        return d ? d.getHours() === h : false;
      }).length,
    }));

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const daily = DAY_NAMES.map((day, i) => ({
      label: day,
      count: markers.filter((m) => {
        const d = m.createdAt?.toDate?.();
        return d ? d.getDay() === i : false;
      }).length,
    }));

    const repMap: Record<string, { doors: number; sales: number }> = {};
    for (const m of markers) {
      const key = m.createdByName ?? "Unknown";
      if (!repMap[key]) repMap[key] = { doors: 0, sales: 0 };
      repMap[key].doors++;
      if (m.status === "SOLD") repMap[key].sales++;
    }
    const reps = Object.entries(repMap)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.sales - a.sales);

    return { total, sold, notInterested, notHome, conversionRate, outreachRatio, hourly, daily, reps };
  }, [markers]);

  if (authLoading || markersLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <AppMenu />
      </div>

      {/* Row 1 — 4 equal KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Doors" value={s.total} accent="blue" />
        <KpiCard label="Sales Closed" value={s.sold} accent="green" />
        <KpiCard label="Not Interested" value={s.notInterested} accent="red" />
        <KpiCard label="Not Home" value={s.notHome} accent="yellow" />
      </div>

      {/* Row 2 — Conversion metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <MetricCard
          label="Conversion Rate"
          value={s.conversionRate}
          sub="Sales ÷ (Sales + Not Interested)"
          accent="blue"
        />
        <MetricCard
          label="Outreach Ratio"
          value={s.outreachRatio}
          sub="Sales ÷ Total Doors"
          accent="green"
        />
      </div>

      {/* Charts */}
      <div className="space-y-4 mb-6">
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
          <MiniBarChart data={s.hourly} title="Activity by Hour of Day" />
        </div>
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
          <MiniBarChart data={s.daily} title="Activity by Day of Week" />
        </div>
      </div>

      {/* Rep Leaderboard */}
      {s.reps.length > 0 && (
        <div className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Rep Leaderboard</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Rep</th>
                <th className="px-5 py-3 font-medium text-right">Doors</th>
                <th className="px-5 py-3 font-medium text-right">Sales</th>
                <th className="px-5 py-3 font-medium text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {s.reps.map((r, i) => (
                <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-300 text-xs font-bold">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{r.doors}</td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">{r.sales}</td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {r.doors > 0 ? `${((r.sales / r.doors) * 100).toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Inline layout components ──────────────────────────────────────────────────

const ACCENT = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   label: "text-blue-600/70" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  label: "text-green-600/70" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    label: "text-red-600/70" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", label: "text-yellow-600/70" },
} as const;

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: keyof typeof ACCENT }) {
  const a = ACCENT[accent];
  return (
    <div className={`rounded-xl p-4 ${a.bg}`}>
      <p className={`text-3xl font-bold tabular-nums ${a.text}`}>{value}</p>
      <p className={`text-xs font-semibold mt-1 ${a.label}`}>{label}</p>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: keyof typeof ACCENT }) {
  const a = ACCENT[accent];
  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-4xl font-bold tabular-nums ${a.text}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
  );
}
