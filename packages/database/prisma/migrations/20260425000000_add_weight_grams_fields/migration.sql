-- Add standardized weight fields (integer grams) to five models.
-- All columns are nullable — existing rows unaffected.
-- Old weight fields (Decimal kg / String) are kept for backward compatibility.
--
-- NOTE: Migration file recreated from branch fix/weight-standardization (commit 7968d13).
-- SQL was applied directly to the dev DB; _prisma_migrations row registered via
-- `prisma migrate resolve --applied` on 2026-04-25 (applied_steps_count=0).
-- IF NOT EXISTS guards added since the _prisma_migrations row already exists and
-- Prisma will not re-execute this on the current DB. Safe for fresh DB restores too.

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "weightGramsSnapshot" INTEGER;

-- AlterTable
ALTER TABLE "seller_shipments" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "packageWeightGrams" INTEGER;
