-- Currency Locking Migration
-- This migration adds fields to support currency locking in carts and commission currency conversion

-- ============================================
-- 1. CART TABLE - Add Currency Locking Fields
-- ============================================

-- Add exchange rate field (rate when currency was locked)
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(10,6) DEFAULT 1 NOT NULL;

-- Add timestamp when rate was locked
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "rateLockedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;

COMMENT ON COLUMN "carts"."exchangeRate" IS 'Exchange rate when cart currency was locked (1 USD = X cart currency)';
COMMENT ON COLUMN "carts"."rateLockedAt" IS 'Timestamp when exchange rate was captured and frozen for this cart';


-- ============================================
-- 2. CART_ITEMS TABLE - Add Price Locking Fields
-- ============================================

-- Add price at time of adding to cart
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "priceAtAdd" DECIMAL(10,2);

-- Add currency at time of adding to cart
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "currencyAtAdd" VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Backfill existing cart items with current price
UPDATE "cart_items" SET "priceAtAdd" = "price" WHERE "priceAtAdd" IS NULL;

-- Make priceAtAdd non-nullable after backfill
ALTER TABLE "cart_items" ALTER COLUMN "priceAtAdd" SET NOT NULL;

COMMENT ON COLUMN "cart_items"."priceAtAdd" IS 'Price when item was added to cart (in cart locked currency) - IMMUTABLE';
COMMENT ON COLUMN "cart_items"."currencyAtAdd" IS 'Currency when item was added (must match cart.currency) - IMMUTABLE';


-- ============================================
-- 3. COMMISSIONS TABLE - Add Payout Currency Conversion Fields
-- ============================================

-- Add payout amount in seller's preferred currency
ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "payoutAmount" DECIMAL(10,2);

-- Add seller's payout currency
ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "payoutCurrency" VARCHAR(3);

-- Add conversion rate used
ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "conversionRate" DECIMAL(10,6);

-- Add source of exchange rate
ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "rateSource" VARCHAR(50);

-- Add timestamp when rate was captured
ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "rateTimestamp" TIMESTAMP(3);

COMMENT ON COLUMN "commissions"."payoutAmount" IS 'Commission amount in seller preferred payout currency';
COMMENT ON COLUMN "commissions"."payoutCurrency" IS 'Seller preferred payout currency from store.payoutCurrency';
COMMENT ON COLUMN "commissions"."conversionRate" IS 'Exchange rate: orderCurrency → payoutCurrency';
COMMENT ON COLUMN "commissions"."rateSource" IS 'Source of exchange rate: STRIPE, ECB, MANUAL';
COMMENT ON COLUMN "commissions"."rateTimestamp" IS 'When conversion rate was captured';


-- ============================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Index on cart currency for filtering
CREATE INDEX IF NOT EXISTS "carts_currency_idx" ON "carts"("currency");

-- Index on cart rate locked timestamp
CREATE INDEX IF NOT EXISTS "carts_rateLockedAt_idx" ON "carts"("rateLockedAt");

-- Index on cart item currency
CREATE INDEX IF NOT EXISTS "cart_items_currencyAtAdd_idx" ON "cart_items"("currencyAtAdd");

-- Index on commission payout currency
CREATE INDEX IF NOT EXISTS "commissions_payoutCurrency_idx" ON "commissions"("payoutCurrency");

-- Index on commission rate source
CREATE INDEX IF NOT EXISTS "commissions_rateSource_idx" ON "commissions"("rateSource");


-- ============================================
-- 5. DATA INTEGRITY COMMENTS
-- ============================================

COMMENT ON TABLE "carts" IS 'Shopping carts with currency locking - once items added, currency is frozen';
COMMENT ON TABLE "cart_items" IS 'Cart items with immutable prices captured at add-time';
COMMENT ON TABLE "commissions" IS 'Commissions with multi-currency support for seller payouts';
