import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUSES } from "@/lib/statuses";
import { reverseGeocode } from "@/lib/geocoding";

export async function POST(req: Request) {
  const body = await req.json();
  const { latitude, longitude, createdByName, status, notes } = body;

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!createdByName?.trim()) {
    return NextResponse.json({ error: "createdByName required" }, { status: 400 });
  }

  // Placement mode ALWAYS creates a new House + event.
  // We never attach to an existing house — that would silently mutate its visible state.
  // The only way to change an existing marker is via the explicit Edit flow.
  const geo = await reverseGeocode(latitude, longitude);
  const house = await prisma.house.create({
    data: {
      latitude,   // keep exact click position — do NOT snap to geocoded centroid
      longitude,
      address: geo?.address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    },
  });

  const event = await prisma.doorEvent.create({
    data: {
      houseId: house.id,
      type: "CREATE",
      createdByName: createdByName.trim(),
      status,
      notes: notes?.trim() || null,
    },
    include: { house: true },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function GET() {
  const events = await prisma.doorEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { house: { select: { address: true } } },
  });
  return NextResponse.json(events);
}
