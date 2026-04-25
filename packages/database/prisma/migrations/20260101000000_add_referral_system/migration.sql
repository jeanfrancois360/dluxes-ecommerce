-- Migration: Add Referral System (v2.11.0)
-- Created: 2026-03-29
-- Description: Adds complete referral system with support for BUYER and SELLER referrals

-- ============================================================================
-- STEP 1: Add referral fields to User table
-- ============================================================================

ALTER TABLE "users" ADD COLUMN "referredById" TEXT;
ALTER TABLE "users" ADD COLUMN "storeCredit" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "totalReferrals" INTEGER NOT NULL DEFAULT 0;

-- Add foreign key constraint for referredById
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for referredById for query performance
CREATE INDEX "users_referredById_idx" ON "users"("referredById");

-- ============================================================================
-- STEP 2: Add referrerId field to Order table
-- ============================================================================

ALTER TABLE "orders" ADD COLUMN "referrerId" TEXT;

-- ============================================================================
-- STEP 3: Create ReferralStatus enum
-- ============================================================================

CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'PAID', 'EXPIRED', 'CANCELLED');

-- ============================================================================
-- STEP 4: Create referral_codes table
-- ============================================================================

CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");
CREATE INDEX "referral_codes_code_idx" ON "referral_codes"("code");
CREATE INDEX "referral_codes_userId_idx" ON "referral_codes"("userId");
CREATE INDEX "referral_codes_isActive_idx" ON "referral_codes"("isActive");

-- Add foreign key constraint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- STEP 5: Create referrals table
-- ============================================================================

CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "referredUserRole" "UserRole" NOT NULL,
    "rewardAmount" DECIMAL(10,2) NOT NULL,
    "rewardCurrency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "storeId" TEXT,
    "qualifiedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for orderId (one referral per order)
CREATE UNIQUE INDEX "referrals_orderId_key" ON "referrals"("orderId");

-- Create indexes for query performance
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX "referrals_referredId_idx" ON "referrals"("referredId");
CREATE INDEX "referrals_status_idx" ON "referrals"("status");
CREATE INDEX "referrals_orderId_idx" ON "referrals"("orderId");
CREATE INDEX "referrals_storeId_idx" ON "referrals"("storeId");
CREATE INDEX "referrals_createdAt_idx" ON "referrals"("createdAt");

-- Add foreign key constraints
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_fkey"
  FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- To apply this migration:
-- 1. Backup your database first: pg_dump nextpik_ecommerce > backup.sql
-- 2. Run: psql -d nextpik_ecommerce -f add_referral_system.sql
-- 3. Or execute via Prisma: pnpm prisma db execute --file add_referral_system.sql

-- To rollback (if needed):
-- DROP TABLE IF EXISTS "referrals" CASCADE;
-- DROP TABLE IF EXISTS "referral_codes" CASCADE;
-- DROP TYPE IF EXISTS "ReferralStatus";
-- ALTER TABLE "orders" DROP COLUMN IF EXISTS "referrerId";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "totalReferrals";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "storeCredit";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "referredById";
