import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedInUser, AuthError } from "@/lib/server-auth";
import { STATUSES } from "@/lib/statuses";
import { reverseGeocode } from "@/lib/geocoding";

export async function POST(req: Request) {
  let acting;
  try {
    acting = await getSignedInUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }

  const body = await req.json();
  const { latitude, longitude, status, notes } = body;

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const createdByName = acting.user.name ?? acting.user.email;

  try {
    const geo = await reverseGeocode(latitude, longitude);
    const address = geo?.address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    // Step 1: create the house row.
    const house = await prisma.house.create({
      data: { latitude, longitude, address, userId: acting.user.id },
    });

    // Step 2: create the event row. If this fails, delete the house so it
    // doesn't become an orphan (no events → always renders as gray NOT_VISITED).
    let event;
    try {
      event = await prisma.doorEvent.create({
        data: {
          houseId: house.id,
          userId: acting.user.id,
          type: "CREATE",
          createdByName,
          status,
          notes: notes?.trim() || null,
        },
        include: { house: true },
      });
    } catch (eventErr) {
      await prisma.house.delete({ where: { id: house.id } }).catch(() => {});
      throw eventErr;
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events] DB error:", err);
    return NextResponse.json({ error: "Failed to save marker — please try again." }, { status: 500 });
  }
}

export async function GET() {
  let acting;
  try {
    acting = await getSignedInUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }

  try {
    const events = await prisma.doorEvent.findMany({
      where: { house: { userId: acting.user.id } },
      orderBy: { createdAt: "desc" },
      include: { house: { select: { address: true } } },
    });
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/events] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
