-- Phase C.2 — Affiliate Data Layer
-- Adds 3 enums + 5 models for the Awin affiliate integration.
-- Generated via: prisma migrate diff --from-schema-datasource --to-schema-datamodel (affiliate delta only)
-- Applied manually due to migration chain drift (pre-existing db push tables).
-- Date: 2026-05-20

-- CreateEnum
CREATE TYPE "AffiliateAdvertiserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED');

-- CreateEnum
CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'PAID');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('ORIGINAL', 'MACHINE_TRANSLATED', 'HUMAN_REVIEWED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "affiliate_advertisers" (
    "id" TEXT NOT NULL,
    "awinMerchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "approvalStatus" "AffiliateAdvertiserStatus" NOT NULL DEFAULT 'PENDING',
    "defaultCommissionRate" DOUBLE PRECISION,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "affiliate_advertisers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "awinDeepLink" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "galleryUrls" TEXT[],
    "displayPrice" DOUBLE PRECISION,
    "displayCurrency" TEXT DEFAULT 'EUR',
    "originalPrice" DOUBLE PRECISION,
    "productCategoryIds" TEXT[],
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "affiliate_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_product_translations" (
    "id" TEXT NOT NULL,
    "affiliateProductId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "translationStatus" "TranslationStatus" NOT NULL DEFAULT 'ORIGINAL',
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_click_logs" (
    "id" TEXT NOT NULL,
    "affiliateProductId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_click_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_commissions" (
    "id" TEXT NOT NULL,
    "affiliateProductId" TEXT,
    "advertiserId" TEXT,
    "awinTransactionId" TEXT NOT NULL,
    "awinClickRef" TEXT,
    "saleAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "AffiliateCommissionStatus" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "validationDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "rawPayload" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_advertisers_awinMerchantId_key" ON "affiliate_advertisers"("awinMerchantId");

-- CreateIndex
CREATE INDEX "affiliate_advertisers_approvalStatus_idx" ON "affiliate_advertisers"("approvalStatus");

-- CreateIndex
CREATE INDEX "affiliate_advertisers_isActive_idx" ON "affiliate_advertisers"("isActive");

-- CreateIndex
CREATE INDEX "affiliate_advertisers_deletedAt_idx" ON "affiliate_advertisers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_products_slug_key" ON "affiliate_products"("slug");

-- CreateIndex
CREATE INDEX "affiliate_products_advertiserId_idx" ON "affiliate_products"("advertiserId");

-- CreateIndex
CREATE INDEX "affiliate_products_isActive_isFeatured_idx" ON "affiliate_products"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "affiliate_products_isActive_displayOrder_idx" ON "affiliate_products"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "affiliate_products_slug_idx" ON "affiliate_products"("slug");

-- CreateIndex
CREATE INDEX "affiliate_products_deletedAt_idx" ON "affiliate_products"("deletedAt");

-- CreateIndex
CREATE INDEX "affiliate_product_translations_translationStatus_idx" ON "affiliate_product_translations"("translationStatus");

-- CreateIndex
CREATE INDEX "affiliate_product_translations_locale_idx" ON "affiliate_product_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_product_translations_affiliateProductId_locale_key" ON "affiliate_product_translations"("affiliateProductId", "locale");

-- CreateIndex
CREATE INDEX "affiliate_click_logs_affiliateProductId_createdAt_idx" ON "affiliate_click_logs"("affiliateProductId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_click_logs_advertiserId_createdAt_idx" ON "affiliate_click_logs"("advertiserId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_click_logs_userId_createdAt_idx" ON "affiliate_click_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_click_logs_createdAt_idx" ON "affiliate_click_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_commissions_awinTransactionId_key" ON "affiliate_commissions"("awinTransactionId");

-- CreateIndex
CREATE INDEX "affiliate_commissions_status_transactionDate_idx" ON "affiliate_commissions"("status", "transactionDate");

-- CreateIndex
CREATE INDEX "affiliate_commissions_advertiserId_transactionDate_idx" ON "affiliate_commissions"("advertiserId", "transactionDate");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliateProductId_idx" ON "affiliate_commissions"("affiliateProductId");

-- AddForeignKey
ALTER TABLE "affiliate_products" ADD CONSTRAINT "affiliate_products_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "affiliate_advertisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_products" ADD CONSTRAINT "affiliate_products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_product_translations" ADD CONSTRAINT "affiliate_product_translations_affiliateProductId_fkey" FOREIGN KEY ("affiliateProductId") REFERENCES "affiliate_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_product_translations" ADD CONSTRAINT "affiliate_product_translations_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_click_logs" ADD CONSTRAINT "affiliate_click_logs_affiliateProductId_fkey" FOREIGN KEY ("affiliateProductId") REFERENCES "affiliate_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_click_logs" ADD CONSTRAINT "affiliate_click_logs_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "affiliate_advertisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_click_logs" ADD CONSTRAINT "affiliate_click_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliateProductId_fkey" FOREIGN KEY ("affiliateProductId") REFERENCES "affiliate_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "affiliate_advertisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
