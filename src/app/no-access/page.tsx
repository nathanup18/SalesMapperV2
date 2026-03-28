"use client";

import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function NoAccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Access Required
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your account doesn&apos;t have access to this app yet.
          {user?.email && (
            <>
              {" "}You&apos;re signed in as{" "}
              <span className="font-medium text-gray-700">{user.email}</span>.
            </>
          )}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Ask your team admin to send you an invite link.
        </p>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-500 hover:text-red-700 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
