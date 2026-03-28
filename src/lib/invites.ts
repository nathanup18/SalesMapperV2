import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Invite, Permissions, Membership } from "./types";

// ── Create ─────────────────────────────────────────────────────────────────────

/**
 * Creates an invite document at invites/{token}.
 * The token IS the doc ID, so redemption is a single O(1) read — no indexes needed.
 * Returns the token (used to build the invite URL).
 *
 * Caller must have canInviteUsers permission (enforced in Security Rules).
 */
export async function createInvite(params: {
  email: string;
  orgId: string;
  permissionsToApply: Permissions;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = crypto.randomUUID();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  );

  await setDoc(doc(db, "invites", token), {
    email: params.email.toLowerCase().trim(),
    organizationId: params.orgId,
    invitedByUserId: user.uid,
    status: "pending",
    token,
    expiresAt,
    createdAt: serverTimestamp(),
    permissionsToApply: params.permissionsToApply,
  });

  return token;
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, "invites", token));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invite;
}

// ── Redeem ─────────────────────────────────────────────────────────────────────

/**
 * Redeems an invite for the currently signed-in user.
 *
 * Enforces:
 *   - Invite exists and is pending
 *   - Invite has not expired
 *   - Signed-in user's email matches invite.email exactly (case-insensitive)
 *
 * On success:
 *   - Creates organizations/{orgId}/members/{uid} with permissionsToApply
 *   - Creates/updates users/{uid} with orgId (triggers AuthContext onSnapshot)
 *   - Marks invite as accepted
 */
export async function redeemInvite(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (!user.email) throw new Error("User account has no email address");

  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("Invite not found — it may have been cancelled");
  if (invite.status === "accepted") throw new Error("This invite has already been used");
  if (invite.status !== "pending") throw new Error("This invite is no longer valid");
  if (invite.expiresAt.toDate() < new Date()) throw new Error("This invite has expired");

  const userEmail = user.email.toLowerCase().trim();
  const inviteEmail = invite.email.toLowerCase().trim();
  if (userEmail !== inviteEmail) {
    throw new Error(
      `This invite was sent to ${invite.email}. You are signed in as ${user.email}. ` +
      `Please sign in with the correct account.`
    );
  }

  const orgId = invite.organizationId;

  // 1. Create membership doc
  const memberData: Omit<Membership, "joinedAt"> & { joinedAt: ReturnType<typeof serverTimestamp> } = {
    userId: user.uid,
    organizationId: orgId,
    email: userEmail,
    status: "active",
    invitedByUserId: invite.invitedByUserId,
    joinedAt: serverTimestamp() as unknown as Membership["joinedAt"],
    permissions: invite.permissionsToApply,
  };
  await setDoc(doc(db, "organizations", orgId, "members", user.uid), memberData);

  // 2. Write users/{uid} to link auth account → org
  //    merge: true so we don't overwrite displayName if already set
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: userEmail,
      displayName: user.displayName ?? null,
      orgId,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Mark invite as accepted
  await updateDoc(doc(db, "invites", token), { status: "accepted" });
}
