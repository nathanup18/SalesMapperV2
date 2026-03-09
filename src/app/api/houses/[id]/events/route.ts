import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { id: houseId } = await params;
  const { status, notes, createdByName, type } = await req.json();

  if (!createdByName?.trim()) {
    return NextResponse.json({ error: "createdByName required" }, { status: 400 });
  }

  const event = await prisma.doorEvent.create({
    data: {
      houseId,
      type: type ?? "EDIT",
      status,
      notes: notes?.trim() || null,
      createdByName: createdByName.trim(),
    },
  });

  return NextResponse.json(event, { status: 201 });
}
