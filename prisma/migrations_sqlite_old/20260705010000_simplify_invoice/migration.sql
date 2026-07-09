-- Remove paymentType/codAmount from lpos and quantity from lpo_items (SQLite table rebuild)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_lpos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "deliveryLocation" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lpos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_lpos" ("id","billNumber","customerName","deliveryLocation","deliveryDate","notes","status","createdById","createdAt","updatedAt")
SELECT "id","billNumber","customerName","deliveryLocation","deliveryDate","notes","status","createdById","createdAt","updatedAt" FROM "lpos";
DROP TABLE "lpos";
ALTER TABLE "new_lpos" RENAME TO "lpos";

CREATE TABLE "new_lpo_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lpoId" INTEGER NOT NULL,
    "itemCode" TEXT NOT NULL,
    CONSTRAINT "lpo_items_lpoId_fkey" FOREIGN KEY ("lpoId") REFERENCES "lpos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lpo_items" ("id","lpoId","itemCode")
SELECT "id","lpoId","itemCode" FROM "lpo_items";
DROP TABLE "lpo_items";
ALTER TABLE "new_lpo_items" RENAME TO "lpo_items";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
