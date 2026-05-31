-- Migration: add_2fa_enforcement_and_trusted_devices
-- Phase 1 of mandatory 2FA enforcement (v2.12.0)
-- Adds grace period tracking fields on users + trusted_devices table

-- -------------------------------------------------------------------------
-- 1. New columns on "users"
-- -------------------------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "twoFactorGracePeriodStartsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "twoFactorEnforcedAt" TIMESTAMP(3);

-- -------------------------------------------------------------------------
-- 2. "trusted_devices" table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "trusted_devices" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "tokenHash"   TEXT NOT NULL,
  "userAgent"   TEXT,
  "ipAddress"   TEXT,
  "lastUsedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "revokedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

-- Foreign key to users
ALTER TABLE "trusted_devices"
  ADD CONSTRAINT "trusted_devices_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "trusted_devices_userId_idx"    ON "trusted_devices"("userId");
CREATE INDEX IF NOT EXISTS "trusted_devices_tokenHash_idx" ON "trusted_devices"("tokenHash");
CREATE INDEX IF NOT EXISTS "trusted_devices_expiresAt_idx" ON "trusted_devices"("expiresAt");
