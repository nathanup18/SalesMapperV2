"use client";

import { PLACEABLE_STATUSES, STATUS_LABELS, STATUS_HEX, type Status } from "@/lib/statuses";

export type FilterState = {
  status: Status | "ALL";
  rep: string | "ALL";
  date: "ALL" | "TODAY" | "WEEK";
};

type Props = {
  filters: FilterState;
  allReps: string[];
  onChange: (f: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export default function MarkerFilters({ filters, allReps, onChange, isOpen, onToggle }: Props) {
  const hasActive =
    filters.status !== "ALL" || filters.rep !== "ALL" || filters.date !== "ALL";

  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        className={`h-9 px-3 text-xs border rounded-lg shadow-sm font-medium ${
          hasActive
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
      >
        Filter{hasActive ? " •" : ""}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-60 z-[1100]">
          {/* Status */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ ...filters, status: "ALL" })}
                className={`text-xs px-2 py-1 rounded-full border font-medium ${
                  filters.status === "ALL"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                All
              </button>
              {PLACEABLE_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...filters, status: s })}
                  className="text-xs px-2 py-1 rounded-full font-medium text-white border-2"
                  style={{
                    background: STATUS_HEX[s],
                    borderColor: filters.status === s ? "rgba(0,0,0,0.3)" : "transparent",
                    opacity: filters.status === s ? 1 : 0.55,
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Date</p>
            <div className="flex gap-1.5">
              {(["ALL", "TODAY", "WEEK"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onChange({ ...filters, date: d })}
                  className={`text-xs px-2 py-1 rounded border font-medium ${
                    filters.date === d
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {d === "ALL" ? "All" : d === "TODAY" ? "Today" : "Week"}
                </button>
              ))}
            </div>
          </div>

          {/* Rep */}
          {allReps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Rep</p>
              <select
                value={filters.rep}
                onChange={(e) => onChange({ ...filters, rep: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              >
                <option value="ALL">All reps</option>
                {allReps.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {hasActive && (
            <button
              onClick={() => onChange({ status: "ALL", rep: "ALL", date: "ALL" })}
              className="w-full text-xs text-gray-400 hover:text-gray-600 pt-1"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
