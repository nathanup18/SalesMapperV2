"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function AppMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = user?.fullName || user?.firstName || "Account";
  const displayEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        title="Menu"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="3.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="2" y="11" width="12" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
            )}
          </div>

          {/* Nav links */}
          <nav className="py-1">
            <MenuLink href="/territory" onClick={() => setOpen(false)}>
              Map
            </MenuLink>
            <MenuLink href="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            <MenuLink href="/settings" onClick={() => setOpen(false)}>
              Settings &amp; Account
            </MenuLink>
          </nav>

          {/* Sign out */}
          <div className="border-t border-gray-100 py-1">
            <SignOutButton redirectUrl="/sign-in">
              <button className="w-full text-left block px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {children}
    </Link>
  );
}
