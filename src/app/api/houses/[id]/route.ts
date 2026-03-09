import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const house = await prisma.house.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!house) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(house);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { address, createdByName } = await req.json();

  const current = await prisma.house.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update address text only — marker coordinates stay at the original clicked location.
  const house = await prisma.house.update({
    where: { id },
    data: { address: address ?? current.address },
  });

  // Append an ADDRESS_CHANGE event for the audit trail
  if (address && address !== current.address && createdByName) {
    const latest = await prisma.doorEvent.findFirst({
      where: { houseId: id },
      orderBy: { createdAt: "desc" },
    });
    await prisma.doorEvent.create({
      data: {
        houseId: id,
        type: "ADDRESS_CHANGE",
        status: latest?.status ?? "NOT_VISITED",
        notes: `Address updated: "${current.address ?? "unknown"}" → "${address}"`,
        createdByName,
      },
    });
  }

  return NextResponse.json(house);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Hard delete — DoorEvents are removed via onDelete: Cascade in the schema.
  // The marker and its full history disappear from the map immediately.
  await prisma.house.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
