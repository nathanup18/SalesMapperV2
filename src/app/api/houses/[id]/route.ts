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
  const house = await prisma.house.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!house) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (house.userId !== acting.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(house);
}

export async function PATCH(
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

  const { id } = await params;
  const { address } = await req.json();

  const current = await prisma.house.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (current.userId !== acting.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update address text only — marker coordinates stay at the original clicked location.
  const house = await prisma.house.update({
    where: { id },
    data: { address: address ?? current.address },
  });

  // Append an ADDRESS_CHANGE event for the audit trail
  if (address && address !== current.address) {
    const createdByName = acting.user.name ?? acting.user.email;
    const latest = await prisma.doorEvent.findFirst({
      where: { houseId: id },
      orderBy: { createdAt: "desc" },
    });
    await prisma.doorEvent.create({
      data: {
        houseId: id,
        userId: acting.user.id,
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
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (house.userId !== acting.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.house.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
