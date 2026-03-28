import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Firebase auth is handled client-side — no server middleware needed.
// This file satisfies Next.js by exporting a pass-through function.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

// Empty matcher — middleware runs on no routes.
export const config = { matcher: [] };
