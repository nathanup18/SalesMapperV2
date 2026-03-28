import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import { ADMIN_PERMISSIONS } from "./permissions";

/**
 * Called on Google sign-in (and the very first sign-up via email).
 *
 * Creates three documents in sequence:
 *   1. organizations/{orgId}
 *   2. organizations/{orgId}/members/{uid}  ← with full ADMIN_PERMISSIONS
 *   3. users/{uid}
 *
 * Idempotent — if users/{uid} already exists, returns the stored orgId
 * without creating anything new.
 */
export async function bootstrapUserOrg(user: User): Promise<string> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // Already set up — return existing orgId
  if (userSnap.exists()) {
    return userSnap.data().orgId as string;
  }

  // New user: create a personal org
  const orgRef = doc(collection(db, "organizations"));
  const orgId = orgRef.id;

  const orgName = user.displayName
    ? `${user.displayName}'s Team`
    : user.email
    ? `${user.email.split("@")[0]}'s Team`
    : "My Team";

  await setDoc(orgRef, {
    name: orgName,
    createdByUserId: user.uid,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "organizations", orgId, "members", user.uid), {
    userId: user.uid,
    organizationId: orgId,
    email: user.email ?? "",
    status: "active",
    invitedByUserId: null,
    joinedAt: serverTimestamp(),
    permissions: ADMIN_PERMISSIONS,
  });

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? null,
    orgId,
    createdAt: serverTimestamp(),
  });

  return orgId;
}
