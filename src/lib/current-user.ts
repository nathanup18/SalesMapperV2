/**
 * Client-side role display constants.
 * Role is sourced from the server (Membership.role via /api/me) — these are
 * labels and descriptions for rendering only, not for permission enforcement.
 */

export type Role = "ADMIN" | "MANAGER" | "REP";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  REP: "Rep / User",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full access — manage team, view all data, adjust permissions",
  MANAGER: "Manage reps, view team activity, limited admin controls",
  REP: "Log door events, view own activity",
};
