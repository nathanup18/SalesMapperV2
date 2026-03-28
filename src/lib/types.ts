import type { Timestamp } from "firebase/firestore";

// ── Status ─────────────────────────────────────────────────────────────────────

export type MarkerStatus = "SOLD" | "NOT_HOME" | "NOT_INTERESTED" | "NOT_VISITED";

// ── Permissions ────────────────────────────────────────────────────────────────
// No roles. Every feature gate checks a specific boolean on the membership doc.

export type Permissions = {
  canViewMap: boolean;
  canPlaceMarkers: boolean;
  canEditMarkers: boolean;
  canViewDashboard: boolean;
  canInviteUsers: boolean;
  canManagePermissions: boolean;
};

// ── Membership ─────────────────────────────────────────────────────────────────
// organizations/{orgId}/members/{userId}

export type MembershipStatus = "active" | "suspended";

export interface Membership {
  userId: string;
  organizationId: string;
  email: string;
  status: MembershipStatus;
  invitedByUserId: string | null;
  joinedAt: Timestamp;
  permissions: Permissions;
}

// ── Invite ─────────────────────────────────────────────────────────────────────
// invites/{token}  — token IS the doc ID, enabling O(1) lookup without indexes

export type InviteStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface Invite {
  id: string;
  email: string;
  organizationId: string;
  invitedByUserId: string;
  status: InviteStatus;
  token: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  permissionsToApply: Permissions;
}

// ── Firestore document shapes ──────────────────────────────────────────────────

/** users/{userId} */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  orgId: string;
  createdAt: Timestamp;
}

/** organizations/{orgId} */
export interface Organization {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: Timestamp;
}

/** organizations/{orgId}/markers/{markerId} */
export interface Marker {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string | null;
  status: MarkerStatus;
  lat: number;
  lng: number;
  address: string | null;
  notes: string | null;
  /** null = active marker. Set to soft-delete. */
  deletedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
