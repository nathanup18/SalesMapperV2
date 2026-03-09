import type { Role } from "./current-user";

/** Managers and Admins can view all reps' activity and manage the team. */
export function canManageTeam(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Only Admins can access admin-only controls (permissions, billing, etc.). */
export function canAccessAdmin(role: Role): boolean {
  return role === "ADMIN";
}

/** Managers and Admins can view activity across all reps. */
export function canViewAllReps(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Only Admins can change other users' roles. */
export function canEditRoles(role: Role): boolean {
  return role === "ADMIN";
}
