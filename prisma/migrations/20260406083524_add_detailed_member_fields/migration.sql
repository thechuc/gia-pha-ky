-- AlterTable
ALTER TABLE "Event" ADD COLUMN "media" TEXT;

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN "alias" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "honorific" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "title" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "files" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "description", "familyId", "id", "memberId", "mimeType", "name", "size", "type", "uploadedBy", "url", "version") SELECT "createdAt", "description", "familyId", "id", "memberId", "mimeType", "name", "size", "type", "uploadedBy", "url", "version" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
