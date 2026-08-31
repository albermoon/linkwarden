-- AlterTable
ALTER TABLE "User" ALTER COLUMN "aiTaggingMethod" SET DEFAULT 'GENERATE';

-- Enable auto-tagging for existing users who still had the old default
UPDATE "User" SET "aiTaggingMethod" = 'GENERATE' WHERE "aiTaggingMethod" = 'DISABLED';
