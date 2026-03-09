/*
  Warnings:

  - You are about to drop the column `assignedRep` on the `houses` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `houses` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `houses` table. All the data in the column will be lost.
  - Made the column `latitude` on table `houses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `houses` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "door_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "houseId" TEXT NOT NULL,
    "repName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "door_events_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "houses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_houses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_houses" ("address", "createdAt", "id", "latitude", "longitude", "updatedAt") SELECT "address", "createdAt", "id", "latitude", "longitude", "updatedAt" FROM "houses";
DROP TABLE "houses";
ALTER TABLE "new_houses" RENAME TO "houses";
CREATE INDEX "houses_latitude_longitude_idx" ON "houses"("latitude", "longitude");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "door_events_houseId_idx" ON "door_events"("houseId");

-- CreateIndex
CREATE INDEX "door_events_status_idx" ON "door_events"("status");

-- CreateIndex
CREATE INDEX "door_events_createdAt_idx" ON "door_events"("createdAt");
