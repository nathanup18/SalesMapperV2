"use client";

export type FollowUpItem = {
  id: string;
  address: string | null;
  lat: number;
  lng: number;
  rep: string;
  lastVisit: string;
};

type Props = {
  items: FollowUpItem[];
  onFlyTo: (lat: number, lng: number) => void;
  onClose: () => void;
};

export default function FollowUpList({ items, onFlyTo, onClose }: Props) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1500] bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <h3 className="font-semibold text-sm">Follow-Up Queue</h3>
          <p className="text-xs text-gray-400">
            Not Home — {items.length} location{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No follow-ups needed.</p>
      ) : (
        <div className="overflow-y-auto flex-1 divide-y">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onFlyTo(item.lat, item.lng)}
              className="w-full text-left px-4 py-3 hover:bg-yellow-50 active:bg-yellow-100"
            >
              <p className="text-sm font-medium leading-tight truncate">
                {item.address ?? "Unknown address"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.rep} · {new Date(item.lastVisit).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
