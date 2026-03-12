import { NextResponse } from "next/server";
import { getSignedInUser, AuthError } from "@/lib/server-auth";

/**
 * GET /api/me
 * Returns the current user's profile.
 */
export async function GET() {
  try {
    const { user } = await getSignedInUser();
    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[GET /api/me] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
