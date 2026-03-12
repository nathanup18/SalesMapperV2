import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import "./globals.css";
import { syncUser } from "@/lib/users";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalesMapper",
  description: "Door-to-door sales territory tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync the app-side User record on every authenticated render.
  // syncUser() is an idempotent upsert — safe to call on every page load.
  const clerkUser = await currentUser();
  if (clerkUser) {
    try {
      await syncUser(clerkUser);
    } catch (err) {
      console.error("[syncUser] Database not available:", err);
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden`}
        >
          <main className="h-full overflow-auto">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
