-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_VISITED',
    "notes" TEXT,
    "assignedRep" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
