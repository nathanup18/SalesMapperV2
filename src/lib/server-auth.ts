/**
 * Server-side auth helper for API routes and server components.
 *
 * getActingUser() always throws AuthError — never a raw exception.
 * Routes can safely do:
 *
 *   try {
 *     const { user, membership, organization } = await getActingUser();
 *   } catch (err) {
 *     if (err instanceof AuthError) {
 *       return NextResponse.json({ error: err.message }, { status: err.statusCode });
 *     }
 *     throw err;
 *   }
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ── Role helpers ──────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "MANAGER" | "REP";

const ROLE_RANK: Record<Role, number> = { REP: 0, MANAGER: 1, ADMIN: 2 };

/**
 * Returns true if the acting user's membership role meets or exceeds minRole.
 * Use this in route handlers for server-side permission enforcement.
 *
 *   if (!hasMinRole(acting, "MANAGER")) {
 *     return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
 *   }
 */
export function hasMinRole(
  acting: { membership: { role: string } },
  minRole: Role
): boolean {
  return (ROLE_RANK[acting.membership.role as Role] ?? -1) >= ROLE_RANK[minRole];
}

// ─────────────────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: 401 | 403 | 500
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Resolves the acting user, membership, and organization for the current request.
 *
 * On first use (no membership exists), automatically bootstraps:
 *   User row → Organization ("My Team") → Membership (ADMIN)
 *   Also claims any existing houses with null organizationId.
 *
 * Only throws AuthError — all internal DB errors are caught and wrapped.
 */
export async function getActingUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new AuthError("Unauthorized", 401);

  try {
    let membership = await prisma.membership.findFirst({
      where: { user: { clerkId } },
      include: { user: true, organization: true },
    });

    if (!membership) {
      console.log(`[server-auth] No membership for clerkId ${clerkId.slice(0, 8)}… — bootstrapping`);
      membership = await bootstrapUserAndOrg(clerkId);
    }

    if (!membership) {
      throw new AuthError(
        "Account setup incomplete — could not create organization. Please try refreshing.",
        403
      );
    }

    return {
      clerkId,
      user: membership.user,
      membership,
      organization: membership.organization,
    };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    console.error("[server-auth] getActingUser DB error:", err);
    throw new AuthError(
      "Database error during authentication — check server logs",
      500
    );
  }
}

/**
 * Creates User → Organization → Membership for a new Clerk user.
 * Also reclaims any houses with null organizationId into the org.
 */
async function bootstrapUserAndOrg(clerkId: string) {
  // 1. Ensure app-side User exists
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    const clerkProfile = await currentUser();
    if (!clerkProfile) return null;

    const email =
      clerkProfile.emailAddresses[0]?.emailAddress ?? `user-${clerkId}@placeholder`;
    const nameParts = [clerkProfile.firstName, clerkProfile.lastName].filter(Boolean);
    const name = nameParts.join(" ") || null;

    user = await prisma.user.create({ data: { clerkId, email, name } });
    console.log(`[server-auth] Created User: ${user.id}`);
  }

  // 2. Find existing org or create a new one
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "My Team" },
    });
    console.log(`[server-auth] Created Organization: ${org.id}`);

    // Claim any houses that were placed before org tracking was added
    const claimed = await prisma.house.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id },
    });
    if (claimed.count > 0) {
      console.log(`[server-auth] Claimed ${claimed.count} orphaned houses → org ${org.id}`);
    }
  }

  // 3. Find or create membership — upsert not available in Neon HTTP mode.
  let membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    include: { user: true, organization: true },
  });
  if (!membership) {
    membership = await prisma.membership.create({
      data: { userId: user.id, organizationId: org.id, role: "ADMIN" },
      include: { user: true, organization: true },
    });
  }
  console.log(`[server-auth] Membership ensured: user=${user.id.slice(0, 8)}… org=${org.id.slice(0, 8)}…`);

  return membership;
}

/**
 * Lightweight variant — returns org ID or null on any failure.
 * Safe to use in server components where graceful fallback is needed.
 */
export async function getActingOrgId(): Promise<string | null> {
  try {
    const { organization } = await getActingUser();
    return organization.id;
  } catch {
    return null;
  }
}

// ── Simplified single-user auth (active flow) ─────────────────────────────────

/**
 * Resolves only the app-side User for the current Clerk session.
 * Does NOT require Organization or Membership to exist.
 * This is the primary auth helper for all current routes.
 *
 * Only throws AuthError — never a raw exception.
 */
export async function getSignedInUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new AuthError("Unauthorized", 401);

  try {
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      const clerkProfile = await currentUser();
      if (!clerkProfile) throw new AuthError("Could not load Clerk profile", 500);

      const email =
        clerkProfile.emailAddresses[0]?.emailAddress ?? `user-${clerkId}@placeholder`;
      const nameParts = [clerkProfile.firstName, clerkProfile.lastName].filter(Boolean);
      const name = nameParts.join(" ") || null;

      user = await prisma.user.create({ data: { clerkId, email, name } });
      console.log(`[server-auth] Created User: ${user.id}`);
    }
    return { clerkId, user };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    console.error("[server-auth] getSignedInUser error:", err);
    throw new AuthError("Database error during authentication — check server logs", 500);
  }
}

/**
 * Lightweight variant — returns the app-side user ID or null on any failure.
 * Safe to use in server components where graceful fallback is needed.
 */
export async function getSignedInUserId(): Promise<string | null> {
  try {
    const { user } = await getSignedInUser();
    return user.id;
  } catch {
    return null;
  }
}
