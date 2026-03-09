import DoorEventBadge from "./DoorEventBadge";

type DoorEvent = {
  id: string;
  type: string;
  createdByName: string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
};

export default function DoorEventList({ events }: { events: DoorEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4">No visits recorded yet.</p>
    );
  }
  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <DoorEventBadge status={e.status} />
              <span className="font-medium text-sm">{e.createdByName}</span>
              {e.type === "EDIT" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  edit
                </span>
              )}
              {e.type === "ADDRESS_CHANGE" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">
                  address changed
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(e.createdAt).toLocaleString()}
            </span>
          </div>
          {e.notes && <p className="text-sm text-gray-600 mt-1">{e.notes}</p>}
        </div>
      ))}
    </div>
  );
}
