/**
 * App-side user utilities.
 *
 * Keeps our own User record in sync with the Clerk identity.
 * Call syncUser() on every authenticated layout render — it is idempotent
 * (upsert) so repeated calls are safe.
 */

import { prisma } from "./prisma";

type ClerkUserShape = {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  phoneNumbers?: { phoneNumber: string }[];
};

/** Upsert the app-side User record from Clerk identity data. */
export async function syncUser(clerkUser: ClerkUserShape) {
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
  const name = nameParts.length > 0 ? nameParts.join(" ") : null;
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null;

  // Neon HTTP adapter does not support transactions, so upsert is not available.
  // Use findUnique + create/update instead.
  const existing = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (existing) {
    return prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: { email, name, phone },
    });
  }
  return prisma.user.create({
    data: { clerkId: clerkUser.id, email, name, phone },
  });
}

/** Look up the app-side User by Clerk ID. Returns null if not found. */
export async function getAppUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } });
}

/** Look up the app-side User by Clerk ID, throw if not found. */
export async function requireAppUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error(`App user not found for clerkId: ${clerkId}`);
  return user;
}
