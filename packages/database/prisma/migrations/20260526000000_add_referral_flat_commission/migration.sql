-- Migration: add_referral_flat_commission
-- Adds ReferralRewardType enum, rewardType column on referrals,
-- and ReferralPayoutRecord model for flat cash payouts.

-- 1. Create enums
CREATE TYPE "ReferralRewardType" AS ENUM ('STORE_CREDIT', 'COUPON', 'FLAT_COMMISSION');
CREATE TYPE "ReferralPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- 2. Add rewardType to referrals (default STORE_CREDIT preserves existing behaviour)
ALTER TABLE "referrals" ADD COLUMN "rewardType" "ReferralRewardType" NOT NULL DEFAULT 'STORE_CREDIT';
CREATE INDEX "referrals_rewardType_idx" ON "referrals"("rewardType");

-- 3. Create referral_payout_records table
CREATE TABLE "referral_payout_records" (
    "id"               TEXT NOT NULL,
    "referralId"       TEXT NOT NULL,
    "referrerId"       TEXT NOT NULL,
    "amount"           DECIMAL(10,2) NOT NULL,
    "currency"         TEXT NOT NULL DEFAULT 'USD',
    "status"           "ReferralPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod"    TEXT,
    "paymentReference" TEXT,
    "notes"            TEXT,
    "paidAt"           TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_payout_records_pkey" PRIMARY KEY ("id")
);

-- 4. Unique constraint (one payout per referral)
CREATE UNIQUE INDEX "referral_payout_records_referralId_key" ON "referral_payout_records"("referralId");

-- 5. Indexes
CREATE INDEX "referral_payout_records_referrerId_idx" ON "referral_payout_records"("referrerId");
CREATE INDEX "referral_payout_records_status_idx"     ON "referral_payout_records"("status");
CREATE INDEX "referral_payout_records_createdAt_idx"  ON "referral_payout_records"("createdAt");

-- 6. Foreign keys
ALTER TABLE "referral_payout_records"
    ADD CONSTRAINT "referral_payout_records_referralId_fkey"
    FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_payout_records"
    ADD CONSTRAINT "referral_payout_records_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
