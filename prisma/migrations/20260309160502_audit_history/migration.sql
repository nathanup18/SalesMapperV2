/*
  Warnings:

  - You are about to drop the column `repName` on the `door_events` table. All the data in the column will be lost.
  - Added the required column `createdByName` to the `door_events` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_door_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "houseId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CREATE',
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "door_events_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "houses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_door_events" ("createdAt", "houseId", "id", "notes", "status") SELECT "createdAt", "houseId", "id", "notes", "status" FROM "door_events";
DROP TABLE "door_events";
ALTER TABLE "new_door_events" RENAME TO "door_events";
CREATE INDEX "door_events_houseId_idx" ON "door_events"("houseId");
CREATE INDEX "door_events_status_idx" ON "door_events"("status");
CREATE INDEX "door_events_createdAt_idx" ON "door_events"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
