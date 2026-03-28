"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getInviteByToken, redeemInvite } from "@/lib/invites";
import type { Invite } from "@/lib/types";

type PageState =
  | { phase: "loading" }
  | { phase: "not-found" }
  | { phase: "expired" }
  | { phase: "already-used" }
  | { phase: "wrong-email"; inviteEmail: string }
  | { phase: "ready"; invite: Invite }
  | { phase: "success" };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>({ phase: "loading" });
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Load invite once auth is known
  useEffect(() => {
    if (authLoading) return;
    if (!token) { setPageState({ phase: "not-found" }); return; }

    getInviteByToken(token).then((invite) => {
      if (!invite) {
        setPageState({ phase: "not-found" });
        return;
      }
      if (invite.status === "accepted") {
        setPageState({ phase: "already-used" });
        return;
      }
      if (invite.status !== "pending" || invite.expiresAt.toDate() < new Date()) {
        setPageState({ phase: "expired" });
        return;
      }
      // If signed in, check email match
      if (user && user.email?.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
        setPageState({ phase: "wrong-email", inviteEmail: invite.email });
        return;
      }
      setPageState({ phase: "ready", invite });
    });
  }, [token, authLoading, user]);

  const handleAccept = async () => {
    if (pageState.phase !== "ready") return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      await redeemInvite(token);
      setPageState({ phase: "success" });
      // AuthContext onSnapshot will pick up the new membership doc automatically.
      // Give it a moment then redirect.
      setTimeout(() => router.replace("/territory"), 1500);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setRedeeming(false);
    }
  };

  if (authLoading || pageState.phase === "loading") {
    return <Shell><p className="text-gray-400 text-sm">Loading…</p></Shell>;
  }

  if (pageState.phase === "not-found") {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Invite not found</h1>
        <p className="text-sm text-gray-500">
          This link is invalid or has been cancelled.
        </p>
      </Shell>
    );
  }

  if (pageState.phase === "expired") {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Invite expired</h1>
        <p className="text-sm text-gray-500">
          Ask your team admin to send a new invite.
        </p>
      </Shell>
    );
  }

  if (pageState.phase === "already-used") {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Already accepted</h1>
        <p className="text-sm text-gray-500 mb-4">
          This invite has already been used.
        </p>
        <Link href="/territory" className="text-sm text-blue-600 hover:underline">
          Go to app →
        </Link>
      </Shell>
    );
  }

  if (pageState.phase === "wrong-email") {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Wrong account</h1>
        <p className="text-sm text-gray-500 mb-1">
          This invite was sent to{" "}
          <span className="font-medium text-gray-700">{pageState.inviteEmail}</span>.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You&apos;re signed in as{" "}
          <span className="font-medium text-gray-700">{user?.email}</span>.
          Please sign in with the correct account.
        </p>
        <Link href="/sign-in" className="text-sm text-blue-600 hover:underline">
          Sign in with a different account →
        </Link>
      </Shell>
    );
  }

  if (pageState.phase === "success") {
    return (
      <Shell>
        <div className="text-3xl mb-3">✓</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">You&apos;re in!</h1>
        <p className="text-sm text-gray-500">Redirecting to the app…</p>
      </Shell>
    );
  }

  // phase === "ready"
  const { invite } = pageState;

  if (!user) {
    // Not signed in — direct to sign-up/sign-in with return URL
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 mb-1">You&apos;re invited</h1>
        <p className="text-sm text-gray-500 mb-6">
          This invite was sent to{" "}
          <span className="font-medium text-gray-700">{invite.email}</span>.
          Create an account or sign in to accept it.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={`/sign-up?return=${returnUrl}`}
            className="block text-center bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create account
          </Link>
          <Link
            href={`/sign-in?return=${returnUrl}`}
            className="block text-center border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold text-gray-900 mb-1">You&apos;re invited</h1>
      <p className="text-sm text-gray-500 mb-6">
        Accept this invite to join the team.
      </p>

      {redeemError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {redeemError}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={redeeming}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {redeeming ? "Accepting…" : "Accept invite"}
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        {children}
      </div>
    </div>
  );
}
