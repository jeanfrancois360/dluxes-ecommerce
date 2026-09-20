-- AlterTable: Add maxAdDurationDays to advertisement_plans
ALTER TABLE "advertisement_plans" ADD COLUMN IF NOT EXISTS "maxAdDurationDays" INTEGER NOT NULL DEFAULT 30;
