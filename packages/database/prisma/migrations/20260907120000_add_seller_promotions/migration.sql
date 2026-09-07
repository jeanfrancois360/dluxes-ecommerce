-- Add PROMOTION to SellerCreditTransactionType enum
ALTER TYPE "SellerCreditTransactionType" ADD VALUE IF NOT EXISTS 'PROMOTION';

-- Seller Promotions table
CREATE TABLE IF NOT EXISTS "seller_promotions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "creditsAmount" INTEGER NOT NULL DEFAULT 1,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seller_promotions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "seller_promotions_isActive_idx" ON "seller_promotions"("isActive");
CREATE INDEX IF NOT EXISTS "seller_promotions_validFrom_validTo_idx" ON "seller_promotions"("validFrom", "validTo");

-- Seller Promotion Applications table (tracks which stores received which promotion)
CREATE TABLE IF NOT EXISTS "seller_promotion_applications" (
  "id" TEXT NOT NULL,
  "promotionId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transactionId" TEXT,
  CONSTRAINT "seller_promotion_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "seller_promotion_applications_promotionId_storeId_key" UNIQUE ("promotionId", "storeId"),
  CONSTRAINT "seller_promotion_applications_promotionId_fkey"
    FOREIGN KEY ("promotionId") REFERENCES "seller_promotions"("id") ON DELETE CASCADE,
  CONSTRAINT "seller_promotion_applications_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "seller_promotion_applications_storeId_idx" ON "seller_promotion_applications"("storeId");
CREATE INDEX IF NOT EXISTS "seller_promotion_applications_promotionId_idx" ON "seller_promotion_applications"("promotionId");
