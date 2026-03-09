import { STATUS_LABELS, STATUS_BADGE, type Status } from "@/lib/statuses";

export default function DoorEventBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as Status] ?? status;
  const cls = STATUS_BADGE[status as Status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
