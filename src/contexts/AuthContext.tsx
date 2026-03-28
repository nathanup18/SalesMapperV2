"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";
import type { Membership } from "@/lib/types";

// ── Shape ──────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  orgId: string | null;
  /** null = no membership (blocked from app) */
  membership: Membership | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  orgId: null,
  membership: null,
  loading: true,
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    orgId: null,
    membership: null,
    loading: true,
  });

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubMemberDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous per-user listeners whenever auth state changes
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (unsubMemberDoc) { unsubMemberDoc(); unsubMemberDoc = null; }

      if (!user) {
        setState({ user: null, orgId: null, membership: null, loading: false });
        return;
      }

      setState((prev) => ({ ...prev, user, loading: true }));

      // Layer 1: watch users/{uid} for orgId
      // Uses onSnapshot (not getDoc) to survive the post-signup race:
      // onAuthStateChanged fires before bootstrapUserOrg/redeemInvite writes
      // users/{uid}. The listener fires again as soon as the doc appears.
      unsubUserDoc = onSnapshot(
        doc(db, "users", user.uid),
        (userSnap) => {
          const orgId = userSnap.exists()
            ? (userSnap.data().orgId as string)
            : null;

          if (!orgId) {
            // User has no org yet (direct signup, invite not yet redeemed)
            if (unsubMemberDoc) { unsubMemberDoc(); unsubMemberDoc = null; }
            setState({ user, orgId: null, membership: null, loading: false });
            return;
          }

          // Layer 2: watch organizations/{orgId}/members/{uid} for membership
          if (unsubMemberDoc) { unsubMemberDoc(); unsubMemberDoc = null; }
          unsubMemberDoc = onSnapshot(
            doc(db, "organizations", orgId, "members", user.uid),
            (memberSnap) => {
              let membership: Membership | null = null;
              if (memberSnap.exists()) {
                const data = memberSnap.data();
                membership = {
                  ...(data as Membership),
                  // Migration shim: bootstrapped admin docs written before Phase 1
                  // may not have a permissions field. Grant full access in memory.
                  permissions: data.permissions ?? ADMIN_PERMISSIONS,
                };
              }
              console.log("[AuthContext] membership resolved:", {
                uid: user.uid,
                orgId,
                status: membership?.status ?? "none",
              });
              setState({ user, orgId, membership, loading: false });
            },
            (err) => {
              console.error("[AuthContext] member doc error:", err);
              setState({ user, orgId, membership: null, loading: false });
            }
          );
        },
        (err) => {
          console.error("[AuthContext] user doc error:", err);
          setState({ user, orgId: null, membership: null, loading: false });
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubMemberDoc) unsubMemberDoc();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
