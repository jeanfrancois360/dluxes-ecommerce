-- Migration: add_affiliate_feed_sync
-- Adds Awin product-feed support to the affiliate module:
--   1. AffiliateFulfillmentSource enum
--   2. Feed metadata columns on affiliate_products
--   3. createdById made nullable (feed-imported products have no creating user)
--   4. Compound unique on (advertiserId, merchantProductId) for upsert dedup
--   5. awinClickRef on affiliate_click_logs (SubID attribution bridge)
--   6. awin_feed_syncs audit table

-- 1. New enum
CREATE TYPE "AffiliateFulfillmentSource" AS ENUM ('MANUAL', 'FEED');

-- 2. Feed metadata columns on affiliate_products
ALTER TABLE "affiliate_products"
  ADD COLUMN "fulfillmentSource" "AffiliateFulfillmentSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "merchantProductId" TEXT,
  ADD COLUMN "feedId"            TEXT,
  ADD COLUMN "brandName"         TEXT,
  ADD COLUMN "inStock"           BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastFeedSync"      TIMESTAMP(3);

-- 3. Make createdById nullable (feed-imported products have no human creator)
ALTER TABLE "affiliate_products" ALTER COLUMN "createdById" DROP NOT NULL;

-- 4. Compound unique index for feed upsert dedup.
--    NULLs are distinct in PostgreSQL UNIQUE — MANUAL rows (merchantProductId=NULL) never conflict.
CREATE UNIQUE INDEX "affiliate_products_advertiserId_merchantProductId_key"
  ON "affiliate_products"("advertiserId", "merchantProductId");

-- Supporting indexes
CREATE INDEX "affiliate_products_fulfillmentSource_idx" ON "affiliate_products"("fulfillmentSource");
CREATE INDEX "affiliate_products_merchantProductId_idx"  ON "affiliate_products"("merchantProductId");

-- 5. SubID attribution column on affiliate_click_logs
ALTER TABLE "affiliate_click_logs" ADD COLUMN "awinClickRef" TEXT;
CREATE INDEX "affiliate_click_logs_awinClickRef_idx" ON "affiliate_click_logs"("awinClickRef");

-- 6. Feed sync audit table
CREATE TABLE "awin_feed_syncs" (
  "id"               TEXT         NOT NULL,
  "advertiserId"     TEXT,
  "awinMerchantId"   TEXT,
  "feedId"           TEXT,
  "productsUpserted" INTEGER      NOT NULL DEFAULT 0,
  "productsSkipped"  INTEGER      NOT NULL DEFAULT 0,
  "errors"           INTEGER      NOT NULL DEFAULT 0,
  "status"           TEXT         NOT NULL,
  "errorDetail"      TEXT,
  "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"      TIMESTAMP(3),
  CONSTRAINT "awin_feed_syncs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "awin_feed_syncs_advertiserId_idx" ON "awin_feed_syncs"("advertiserId");
CREATE INDEX "awin_feed_syncs_startedAt_idx"    ON "awin_feed_syncs"("startedAt");
