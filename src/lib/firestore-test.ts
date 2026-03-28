/**
 * TEMPORARY — delete this file once Firestore connectivity is confirmed.
 *
 * Call testFirestoreConnectivity() from the browser console or a dev-only
 * component to verify Firestore can be reached from localhost.
 *
 * Usage (browser console):
 *   import("/src/lib/firestore-test.ts").then(m => m.testFirestoreConnectivity())
 *
 * Or import and call it once from a component on mount.
 */

import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function testFirestoreConnectivity(): Promise<void> {
  const testRef = doc(db, "_connectivity_test", `test_${Date.now()}`);

  try {
    // Write
    await setDoc(testRef, { ok: true, ts: serverTimestamp() });
    console.log("[firestore-test] write OK");

    // Read back
    const snap = await getDoc(testRef);
    if (snap.exists() && snap.data().ok === true) {
      console.log("[firestore-test] read OK — Firestore is reachable");
    } else {
      console.error("[firestore-test] read returned unexpected data:", snap.data());
    }

    // Clean up
    await deleteDoc(testRef);
    console.log("[firestore-test] cleanup OK");
  } catch (err) {
    console.error("[firestore-test] FAILED:", err);
    throw err;
  }
}
