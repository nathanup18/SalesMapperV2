import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { bootstrapUserOrg } from "./organization";

/**
 * Sign up with email and password.
 *
 * Creates the Firebase Auth account and sets the display name.
 * Does NOT create Firestore documents — the user must redeem an invite
 * (see src/lib/invites.ts) to gain membership and app access.
 *
 * Exception: if bootstrapUserOrg is called explicitly (e.g. first-run admin),
 * that user will get full access. Normal teammates must use the invite flow.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  // Intentionally NOT calling bootstrapUserOrg — new users must redeem an invite
  return cred;
}

/**
 * Sign in with email and password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google popup.
 * Calls bootstrapUserOrg — idempotent for existing users, creates org + full
 * admin membership for the very first sign-in (i.e. the app owner).
 */
export async function googleSignIn(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await bootstrapUserOrg(cred.user);
  return cred;
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}
