-- Migration: Add Self-Pickup Support
-- Date: 2026-03-20
-- Description: Add pickup fields to Store and Order models, add new OrderStatus enum values

-- Add pickup fields to Store model
ALTER TABLE "stores" ADD COLUMN "pickupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN "pickupAddress" TEXT;
ALTER TABLE "stores" ADD COLUMN "pickupInstructions" TEXT;
ALTER TABLE "stores" ADD COLUMN "pickupHours" JSONB;
ALTER TABLE "stores" ADD COLUMN "pickupRadius" INTEGER;
ALTER TABLE "stores" ADD COLUMN "pickupFee" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "stores" ADD COLUMN "pickupEstimatedMinutes" INTEGER DEFAULT 30;

-- Add pickup fields to Order model
ALTER TABLE "orders" ADD COLUMN "isPickup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "pickupStoreId" TEXT;
ALTER TABLE "orders" ADD COLUMN "pickupScheduledAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "pickupCompletedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "pickupCode" TEXT;
ALTER TABLE "orders" ADD COLUMN "pickupInstructions" TEXT;

-- Add foreign key constraint for pickup store
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupStoreId_fkey"
  FOREIGN KEY ("pickupStoreId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add new OrderStatus enum values
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PICKUP_EXPIRED';

-- Update shippingProvider comment (informational only, no schema change)
COMMENT ON COLUMN "orders"."shippingProvider" IS 'EASYPOST, DHL, GELATO, MANUAL, SELF_PICKUP';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "stores_pickupEnabled_idx" ON "stores"("pickupEnabled");
CREATE INDEX IF NOT EXISTS "orders_isPickup_idx" ON "orders"("isPickup");
CREATE INDEX IF NOT EXISTS "orders_pickupStoreId_idx" ON "orders"("pickupStoreId");
CREATE INDEX IF NOT EXISTS "orders_pickupCode_idx" ON "orders"("pickupCode");
