-- Add warning tracking fields to stores
-- Prevents daily low-credit and grace-period emails from firing every day

ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "lowCreditWarningSentAt" TIMESTAMP(3);
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "gracePeriodWarningSentAt" TIMESTAMP(3);
