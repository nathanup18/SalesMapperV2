import type { Permissions, Membership } from "./types";

// ── Preset permission sets ─────────────────────────────────────────────────────

/** Full access — assigned to the bootstrapped org owner. */
export const ADMIN_PERMISSIONS: Permissions = {
  canViewMap: true,
  canPlaceMarkers: true,
  canEditMarkers: true,
  canViewDashboard: true,
  canInviteUsers: true,
  canManagePermissions: true,
};

/** Baseline for a newly invited field rep. */
export const DEFAULT_MEMBER_PERMISSIONS: Permissions = {
  canViewMap: true,
  canPlaceMarkers: true,
  canEditMarkers: false,
  canViewDashboard: false,
  canInviteUsers: false,
  canManagePermissions: false,
};

// ── Gate helper ────────────────────────────────────────────────────────────────

/**
 * Returns true if the membership exists, is active, and has the given permission.
 *
 * Usage:
 *   if (perm(membership, "canPlaceMarkers")) { ... }
 */
export function perm(
  membership: Membership | null | undefined,
  key: keyof Permissions
): boolean {
  if (!membership || membership.status !== "active") return false;
  return membership.permissions[key] === true;
}
