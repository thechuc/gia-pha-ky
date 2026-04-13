-- AlterTable
ALTER TABLE "Document" ADD COLUMN "description" TEXT;
ALTER TABLE "Document" ADD COLUMN "type" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "era" TEXT;
ALTER TABLE "Event" ADD COLUMN "icon" TEXT;

-- AlterTable
ALTER TABLE "Family" ADD COLUMN "motto" TEXT;
ALTER TABLE "Family" ADD COLUMN "origin" TEXT;
