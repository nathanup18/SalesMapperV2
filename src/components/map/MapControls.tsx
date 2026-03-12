import { PLACEABLE_STATUSES, STATUS_LABELS, STATUS_HEX, type Status } from "@/lib/statuses";

type Props = {
  isPlacing: boolean;
  placingLoading: boolean;
  selectedStatus: Status;
  onStartPlacing: () => void;
  onSelectStatus: (s: Status) => void;
  onCancelPlacing: () => void;
};

/**
 * Bottom-right floating controls overlay.
 * Provider-agnostic: this is a plain React component positioned over
 * the map container via absolute positioning in MapCore.
 */
export default function MapControls({
  isPlacing,
  placingLoading,
  selectedStatus,
  onStartPlacing,
  onSelectStatus,
  onCancelPlacing,
}: Props) {
  return (
    <div className="absolute bottom-8 right-4 z-[1000] flex flex-col items-end gap-3">
      {/* Placement mode card — visible when placing */}
      {isPlacing && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-44">
          {/* Mode banner */}
          <div
            className="px-3 py-2 flex items-center justify-between"
            style={{ background: STATUS_HEX[selectedStatus] }}
          >
            <span className="text-white text-xs font-semibold leading-tight">
              {placingLoading ? "Placing…" : `Placing: ${STATUS_LABELS[selectedStatus]}`}
            </span>
            <button
              onClick={onCancelPlacing}
              className="text-white/80 hover:text-white text-base leading-none ml-2 font-bold"
              title="Cancel placement"
            >
              ✕
            </button>
          </div>

          {/* Status picker */}
          <div className="p-2 flex flex-col gap-1">
            {PLACEABLE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onSelectStatus(s)}
                className="text-left px-2 py-1.5 rounded text-xs font-medium text-white transition-all"
                style={{
                  background: STATUS_HEX[s],
                  opacity: selectedStatus === s ? 1 : 0.35,
                  outline: selectedStatus === s ? "2px solid rgba(0,0,0,0.2)" : "none",
                  outlineOffset: "1px",
                }}
              >
                {selectedStatus === s ? "● " : "○ "}
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="px-2 pb-2">
            <p className="text-[10px] text-gray-400 text-center">
              Tap map to place
            </p>
          </div>
        </div>
      )}

      {/* Floating action button — only when not placing */}
      {!isPlacing && (
        <button
          onClick={onStartPlacing}
          title="Start placing markers"
          className="w-14 h-14 rounded-full bg-blue-600 text-white text-3xl shadow-xl hover:bg-blue-700 active:scale-95 flex items-center justify-center transition-transform"
        >
          +
        </button>
      )}
    </div>
  );
}
