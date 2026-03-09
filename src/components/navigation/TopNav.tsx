"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  const active = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="h-12 border-b bg-white flex items-center px-4 shrink-0 z-[2000] relative">
      {/* Brand */}
      <Link
        href="/territory"
        className="font-bold text-blue-600 text-sm tracking-tight"
      >
        SalesMapper
      </Link>

      {/* Right-side nav */}
      <div className="ml-auto flex items-center gap-1">
        <NavLink href="/territory" active={active("/territory")}>
          Map
        </NavLink>
        <NavLink href="/dashboard" active={active("/dashboard")}>
          Dashboard
        </NavLink>
        <Link
          href="/settings"
          title="Settings"
          className={`ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-base transition-colors ${
            active("/settings")
              ? "bg-gray-100 text-gray-900"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          ⚙
        </Link>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}
