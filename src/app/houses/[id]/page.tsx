import { redirect } from "next/navigation";

// The per-house event history page existed in the Prisma/Clerk architecture.
// Markers are now single Firestore documents — there is no separate event log.
// Redirect any old links back to the map.
export default function HouseHistoryPage() {
  redirect("/territory");
}
