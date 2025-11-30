-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOMEPAGE_HERO', 'HOMEPAGE_FEATURED', 'HOMEPAGE_SIDEBAR', 'PRODUCTS_BANNER', 'PRODUCTS_INLINE', 'PRODUCTS_SIDEBAR', 'CATEGORY_BANNER', 'PRODUCT_DETAIL_SIDEBAR', 'CHECKOUT_UPSELL', 'SEARCH_RESULTS');

-- CreateEnum
CREATE TYPE "AdPricingModel" AS ENUM ('CPM', 'CPC', 'DAILY', 'WEEKLY', 'MONTHLY', 'FIXED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AdPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('IMPRESSION', 'VIEWABLE', 'CLICK', 'CONVERSION');

-- CreateEnum
CREATE TYPE "AdPlanType" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AdSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showInFooter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showInNavbar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInSidebar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInTopBar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DECIMAL(10,6);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "videoUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    "linkText" TEXT,
    "placement" "AdPlacement" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "targetAudience" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "pricingModel" "AdPricingModel" NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalBudget" DECIMAL(10,2),
    "remainingBudget" DECIMAL(10,2),
    "status" "AdStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paymentStatus" "AdPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "borderColor" TEXT DEFAULT '#CBB57B',
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "customCss" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_analytics" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "eventType" "AdEventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "page" TEXT NOT NULL,
    "position" INTEGER,
    "viewportTime" INTEGER,
    "deviceType" TEXT,
    "browser" TEXT,
    "ipAddress" TEXT,
    "location" JSONB,
    "conversionValue" DECIMAL(10,2),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_subscriptions" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "planType" "AdPlanType" NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "status" "AdSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "stripeSubscriptionId" TEXT,
    "lastPaymentAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencyName" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rate" DECIMAL(10,6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "decimalDigits" INTEGER NOT NULL DEFAULT 2,
    "position" TEXT NOT NULL DEFAULT 'before',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advertisements_advertiserId_idx" ON "advertisements"("advertiserId");

-- CreateIndex
CREATE INDEX "advertisements_placement_idx" ON "advertisements"("placement");

-- CreateIndex
CREATE INDEX "advertisements_status_idx" ON "advertisements"("status");

-- CreateIndex
CREATE INDEX "advertisements_startDate_endDate_idx" ON "advertisements"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "advertisements_categoryId_idx" ON "advertisements"("categoryId");

-- CreateIndex
CREATE INDEX "ad_analytics_advertisementId_idx" ON "ad_analytics"("advertisementId");

-- CreateIndex
CREATE INDEX "ad_analytics_eventType_idx" ON "ad_analytics"("eventType");

-- CreateIndex
CREATE INDEX "ad_analytics_createdAt_idx" ON "ad_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "ad_analytics_userId_idx" ON "ad_analytics"("userId");

-- CreateIndex
CREATE INDEX "ad_subscriptions_advertiserId_idx" ON "ad_subscriptions"("advertiserId");

-- CreateIndex
CREATE INDEX "ad_subscriptions_status_idx" ON "ad_subscriptions"("status");

-- CreateIndex
CREATE INDEX "ad_subscriptions_placement_idx" ON "ad_subscriptions"("placement");

-- CreateIndex
CREATE INDEX "ad_subscriptions_endDate_idx" ON "ad_subscriptions"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "currency_rates_currencyCode_key" ON "currency_rates"("currencyCode");

-- CreateIndex
CREATE INDEX "currency_rates_currencyCode_idx" ON "currency_rates"("currencyCode");

-- CreateIndex
CREATE INDEX "currency_rates_isActive_idx" ON "currency_rates"("isActive");

-- CreateIndex
CREATE INDEX "categories_isFeatured_idx" ON "categories"("isFeatured");

-- CreateIndex
CREATE INDEX "categories_priority_idx" ON "categories"("priority");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_likeCount_idx" ON "products"("likeCount");

-- CreateIndex
CREATE INDEX "products_compareAtPrice_idx" ON "products"("compareAtPrice");

-- CreateIndex
CREATE INDEX "products_status_featured_displayOrder_idx" ON "products"("status", "featured", "displayOrder");

-- CreateIndex
CREATE INDEX "products_status_categoryId_price_idx" ON "products"("status", "categoryId", "price");

-- CreateIndex
CREATE INDEX "products_status_viewCount_likeCount_idx" ON "products"("status", "viewCount", "likeCount");

-- CreateIndex
CREATE INDEX "products_status_compareAtPrice_idx" ON "products"("status", "compareAtPrice");

-- CreateIndex
CREATE INDEX "products_status_createdAt_idx" ON "products"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_analytics" ADD CONSTRAINT "ad_analytics_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
