import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedInUserId } from "@/lib/server-auth";
import DoorEventList from "@/components/events/DoorEventList";
import HouseMiniMap from "@/components/map/HouseMiniMap";
import DoorEventBadge from "@/components/events/DoorEventBadge";

export default async function HouseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [house, userId] = await Promise.all([
    prisma.house.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: "desc" } } },
    }),
    getSignedInUserId(),
  ]);
  if (!house) notFound();
  // Treat ownership mismatch as not found — don't reveal that the house exists
  if (!userId || house.userId !== userId) notFound();

  const latest = house.events[0];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/territory"
        className="text-blue-600 text-sm hover:underline"
      >
        ← Back to Map
      </Link>

      <div className="mt-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {house.address ?? "Unknown Address"}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {house.latitude.toFixed(5)}, {house.longitude.toFixed(5)}
            </p>
          </div>
          {latest && <DoorEventBadge status={latest.status} />}
        </div>
      </div>

      {/* Mini map */}
      <div className="h-48 rounded-lg overflow-hidden border mb-6">
        <HouseMiniMap lat={house.latitude} lng={house.longitude} />
      </div>

      {/* Event history */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Visit History</h2>
        <span className="text-sm text-gray-400">
          {house.events.length} visit{house.events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DoorEventList events={house.events} />
    </div>
  );
}
