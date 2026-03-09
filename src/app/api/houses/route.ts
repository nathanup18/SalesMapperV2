import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const houses = await prisma.house.findMany({
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(houses);
}
