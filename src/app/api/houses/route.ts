import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedInUser, AuthError } from "@/lib/server-auth";

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
    const houses = await prisma.house.findMany({
      where: { userId: acting.user.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(houses);
  } catch (err) {
    console.error("[GET /api/houses] DB error:", err);
    return NextResponse.json({ error: "Database error — tables may not exist yet" }, { status: 500 });
  }
}
