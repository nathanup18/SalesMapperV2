import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedInUser, AuthError } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let acting;
  try {
    acting = await getSignedInUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }

  const { id } = await params;

  // Verify the house belongs to the acting org before returning its events
  const house = await prisma.house.findUnique({ where: { id }, select: { userId: true } });
  if (!house) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (house.userId !== acting.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.doorEvent.findMany({
    where: { houseId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let acting;
  try {
    acting = await getSignedInUser();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }

  const { id: houseId } = await params;
  const { status, notes, type } = await req.json();

  const createdByName = acting.user.name ?? acting.user.email;

  // Verify the house belongs to the acting user
  const house = await prisma.house.findUnique({ where: { id: houseId }, select: { userId: true } });
  if (!house) return NextResponse.json({ error: "House not found" }, { status: 404 });
  if (house.userId !== acting.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.doorEvent.create({
    data: {
      houseId,
      userId: acting.user.id,
      type: type ?? "EDIT",
      status,
      notes: notes?.trim() || null,
      createdByName,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
