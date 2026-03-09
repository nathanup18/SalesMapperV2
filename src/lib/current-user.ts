/**
 * Current user context — stored in localStorage for MVP.
 * Replace with real auth session when authentication is added.
 */

export type Role = "ADMIN" | "MANAGER" | "REP";

export interface CurrentUser {
  name: string;
  email: string;
  phone: string;
  role: Role;
}

const STORAGE_KEY = "sm_user";

const DEFAULT_USER: CurrentUser = {
  name: "",
  email: "",
  phone: "",
  role: "REP",
};

export function getCurrentUser(): CurrentUser {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_USER, ...JSON.parse(stored) };
  } catch {
    // ignore parse errors
  }
  // Migrate from old sm_repName key
  const legacyName = localStorage.getItem("sm_repName") ?? "";
  return { ...DEFAULT_USER, name: legacyName };
}

export function saveCurrentUser(user: CurrentUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Keep sm_repName in sync — MapCore reads it for event attribution
  localStorage.setItem("sm_repName", user.name);
}

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
