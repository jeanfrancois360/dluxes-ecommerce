-- AlterTable: Add paypalOrderId column to payment_transactions for indexed PayPal order lookup.
-- Replaces the O(n) full-table scan that filtered paypalOrderId from JSON metadata in memory.

ALTER TABLE "payment_transactions" ADD COLUMN "paypalOrderId" TEXT;

-- Create unique index (PayPal order IDs are globally unique)
CREATE UNIQUE INDEX "payment_transactions_paypalOrderId_key" ON "payment_transactions"("paypalOrderId");

-- Create regular index for fast lookups
CREATE INDEX "payment_transactions_paypalOrderId_idx" ON "payment_transactions"("paypalOrderId");

-- Backfill existing PayPal transactions: extract paypalOrderId from metadata JSON
UPDATE "payment_transactions"
SET "paypalOrderId" = metadata->>'paypalOrderId'
WHERE "paymentMethod" = 'PAYPAL'
  AND metadata IS NOT NULL
  AND metadata->>'paypalOrderId' IS NOT NULL
  AND "paypalOrderId" IS NULL;
