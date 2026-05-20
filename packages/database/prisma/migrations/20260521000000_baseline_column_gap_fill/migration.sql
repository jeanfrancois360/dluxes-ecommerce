-- Phase A.1.6 — Baseline Column Gap-Fill
-- Repairs migration chain replayability: fills column-level drift between the
-- chain-replay database (built from migrations 1-27) and the live database
-- (which had hundreds of columns added via `db push` with no migration files).
--
-- Generation method:
--   prisma migrate diff --from-url nextpik_a16_replay --to-url nextpik_ecommerce
--   Transformed via Python for idempotency (ADD COLUMN IF NOT EXISTS, DO $$ blocks, etc.)
--   Tested: migrate deploy on nextpik_a16_test → apply this file → pg_dump diff vs live = 0 structural diffs
--
-- Scope:
--   4  CREATE TYPE (idempotent DO blocks)
--  10  ALTER TYPE ADD VALUE IF NOT EXISTS
-- 162  ADD COLUMN IF NOT EXISTS (across 8 tables)
--   9  ALTER COLUMN (nullability/type, idempotent DO blocks, across 5 tables)
--   6  DROP INDEX IF EXISTS  (ghost indexes absent from live DB)
--   1  DROP TABLE IF EXISTS  ("SellerGelatoSettings" PascalCase ghost)
--   2  DROP CONSTRAINT IF EXISTS (FKs on above ghost table)
--   6  CREATE INDEX IF NOT EXISTS
--
-- Applied: 2026-05-21
-- Part of: Phase A.1.x migration chain repair sequence

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'AuthProvider' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'MAGIC_LINK');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'DeliveryServiceType' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "DeliveryServiceType" AS ENUM ('LOCAL', 'INTERNATIONAL', 'EXPRESS', 'STANDARD');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'FulfillmentType' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "FulfillmentType" AS ENUM ('SELF_FULFILLED', 'GELATO_POD');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'PayoutMethod' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'STRIPE_CONNECT', 'PAYPAL', 'WISE', 'MANUAL');
  END IF;
END $$;

-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE IF NOT EXISTS 'EXCEPTION';

-- AlterEnum
ALTER TYPE "GelatoPodStatus" ADD VALUE IF NOT EXISTS 'PRODUCED';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_SHIPPED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "PaymentTransactionStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_ACTION';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE IF NOT EXISTS 'CAPTURED';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "PaymentTransactionStatus" ADD VALUE IF NOT EXISTS 'LOST_DISPUTE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DELIVERY_PROVIDER_ADMIN';

-- DropForeignKey
ALTER TABLE "SellerGelatoSettings" DROP CONSTRAINT IF EXISTS "SellerGelatoSettings_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "SellerGelatoSettings" DROP CONSTRAINT IF EXISTS "SellerGelatoSettings_storeId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "cart_items_currencyAtAdd_idx";

-- DropIndex
DROP INDEX IF EXISTS "carts_currency_idx";

-- DropIndex
DROP INDEX IF EXISTS "carts_rateLockedAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "commissions_payoutCurrency_idx";

-- DropIndex
DROP INDEX IF EXISTS "commissions_rateSource_idx";

-- DropIndex
DROP INDEX IF EXISTS "seller_commission_overrides_sellerId_key";

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'addresses'
  ) THEN
    ALTER TABLE "addresses" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "province" DROP NOT NULL,
ALTER COLUMN "postalCode" DROP NOT NULL;
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cart_items'
  ) THEN
    ALTER TABLE "cart_items" ALTER COLUMN "currencyAtAdd" SET DATA TYPE TEXT;
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commissions'
  ) THEN
    ALTER TABLE "commissions" ALTER COLUMN "transactionId" DROP NOT NULL,
ALTER COLUMN "payoutCurrency" SET DATA TYPE TEXT,
ALTER COLUMN "rateSource" SET DATA TYPE TEXT;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "buyerConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "buyerConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "carrier" TEXT DEFAULT 'DHL',
ADD COLUMN IF NOT EXISTS "currentLocation" JSONB,
ADD COLUMN IF NOT EXISTS "dhlEstimatedDelivery" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dhlLastSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dhlServiceType" TEXT,
ADD COLUMN IF NOT EXISTS "dhlTrackingData" JSONB,
ADD COLUMN IF NOT EXISTS "packageDimensions" TEXT,
ADD COLUMN IF NOT EXISTS "packageWeight" TEXT,
ADD COLUMN IF NOT EXISTS "payoutReleased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "payoutReleasedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "payoutReleasedBy" TEXT,
ADD COLUMN IF NOT EXISTS "proofOfDeliveryUrl" TEXT,
ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "delivery_providers" ADD COLUMN IF NOT EXISTS "serviceType" "DeliveryServiceType" NOT NULL DEFAULT 'LOCAL';

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
  ) THEN
    ALTER TABLE "escrow_transactions" ALTER COLUMN "paymentTransactionId" DROP NOT NULL;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "baseCost" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "bathrooms" DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER,
ADD COLUMN IF NOT EXISTS "designFileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "digitalDownloadLimit" INTEGER,
ADD COLUMN IF NOT EXISTS "digitalFileFormat" TEXT,
ADD COLUMN IF NOT EXISTS "digitalFileName" TEXT,
ADD COLUMN IF NOT EXISTS "digitalFileSize" BIGINT,
ADD COLUMN IF NOT EXISTS "digitalFileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "digitalInstructions" TEXT,
ADD COLUMN IF NOT EXISTS "digitalLicenseType" TEXT,
ADD COLUMN IF NOT EXISTS "digitalPreviewUrl" TEXT,
ADD COLUMN IF NOT EXISTS "digitalRequirements" TEXT,
ADD COLUMN IF NOT EXISTS "digitalSupportEmail" TEXT,
ADD COLUMN IF NOT EXISTS "digitalUpdatePolicy" TEXT,
ADD COLUMN IF NOT EXISTS "digitalVersion" TEXT,
ADD COLUMN IF NOT EXISTS "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'SELF_FULFILLED',
ADD COLUMN IF NOT EXISTS "gelatoProductUid" TEXT,
ADD COLUMN IF NOT EXISTS "gelatoTemplateId" TEXT,
ADD COLUMN IF NOT EXISTS "lotSize" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "markupPercentage" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "parkingSpaces" INTEGER,
ADD COLUMN IF NOT EXISTS "printAreas" JSONB,
ADD COLUMN IF NOT EXISTS "propertyAddress" TEXT,
ADD COLUMN IF NOT EXISTS "propertyCity" TEXT,
ADD COLUMN IF NOT EXISTS "propertyCountry" TEXT,
ADD COLUMN IF NOT EXISTS "propertyLatitude" DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS "propertyLongitude" DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS "propertyState" TEXT,
ADD COLUMN IF NOT EXISTS "propertyType" TEXT,
ADD COLUMN IF NOT EXISTS "propertyZipCode" TEXT,
ADD COLUMN IF NOT EXISTS "rentalAgeRequirement" INTEGER,
ADD COLUMN IF NOT EXISTS "rentalAvailability" TEXT,
ADD COLUMN IF NOT EXISTS "rentalConditions" TEXT,
ADD COLUMN IF NOT EXISTS "rentalDeliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rentalDeliveryFee" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalExcludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "rentalIdRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "rentalIncludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "rentalInsuranceOptions" TEXT,
ADD COLUMN IF NOT EXISTS "rentalInsuranceRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rentalLateReturnFee" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalMaxPeriod" INTEGER,
ADD COLUMN IF NOT EXISTS "rentalMinPeriod" INTEGER,
ADD COLUMN IF NOT EXISTS "rentalNotes" TEXT,
ADD COLUMN IF NOT EXISTS "rentalPeriodType" TEXT,
ADD COLUMN IF NOT EXISTS "rentalPickupLocation" TEXT,
ADD COLUMN IF NOT EXISTS "rentalPriceDaily" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalPriceHourly" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalPriceMonthly" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalPriceWeekly" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "rentalSecurityDeposit" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "serviceArea" TEXT,
ADD COLUMN IF NOT EXISTS "serviceAvailability" TEXT,
ADD COLUMN IF NOT EXISTS "serviceBookingLeadTime" INTEGER,
ADD COLUMN IF NOT EXISTS "serviceBookingRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "serviceCancellationPolicy" TEXT,
ADD COLUMN IF NOT EXISTS "serviceDuration" INTEGER,
ADD COLUMN IF NOT EXISTS "serviceDurationUnit" TEXT,
ADD COLUMN IF NOT EXISTS "serviceExcludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "serviceIncludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "serviceLocation" TEXT,
ADD COLUMN IF NOT EXISTS "serviceMaxClients" INTEGER,
ADD COLUMN IF NOT EXISTS "serviceProviderBio" TEXT,
ADD COLUMN IF NOT EXISTS "serviceProviderCredentials" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "serviceProviderImage" TEXT,
ADD COLUMN IF NOT EXISTS "serviceProviderName" TEXT,
ADD COLUMN IF NOT EXISTS "serviceRequirements" TEXT,
ADD COLUMN IF NOT EXISTS "serviceType" TEXT,
ADD COLUMN IF NOT EXISTS "sku" TEXT,
ADD COLUMN IF NOT EXISTS "squareFeet" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "vehicleBodyType" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleCondition" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleDrivetrain" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleEngine" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleExteriorColor" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "vehicleFuelType" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleHistory" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleInteriorColor" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleMake" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleMileage" INTEGER,
ADD COLUMN IF NOT EXISTS "vehicleModel" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleTestDriveAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "vehicleTransmission" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleVIN" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleWarranty" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleYear" INTEGER,
ADD COLUMN IF NOT EXISTS "virtualTourUrl" TEXT,
ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'seller_commission_overrides'
  ) THEN
    ALTER TABLE "seller_commission_overrides" ALTER COLUMN "sellerId" DROP NOT NULL;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "bankBranchName" TEXT,
ADD COLUMN IF NOT EXISTS "bankCountry" TEXT,
ADD COLUMN IF NOT EXISTS "bankIban" TEXT,
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "bankRoutingNumber" TEXT,
ADD COLUMN IF NOT EXISTS "bankSwiftCode" TEXT,
ADD COLUMN IF NOT EXISTS "creditsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "creditsExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "creditsGraceEndsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "creditsLastDeducted" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "payoutAutomatic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "payoutCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "payoutDayOfMonth" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "payoutDayOfWeek" INTEGER,
ADD COLUMN IF NOT EXISTS "payoutEmail" TEXT,
ADD COLUMN IF NOT EXISTS "payoutFrequency" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS "payoutMethod" TEXT DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS "payoutMinAmount" DECIMAL(10,2) NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS "vacationAutoReply" TEXT,
ADD COLUMN IF NOT EXISTS "vacationEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "vacationHideProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "vacationMessage" TEXT,
ADD COLUMN IF NOT EXISTS "vacationMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "vacationStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailBackInStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOrderConfirmation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOrderDelivered" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOrderShipped" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailPaymentReceipt" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailPriceDrops" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "emailPromotions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "emailRefundProcessed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailReviewReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "pushBackInStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "pushOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "pushPriceDrops" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "pushPromotions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "pushSecurityAlerts" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN IF NOT EXISTS "backupCodes" JSONB,
ADD COLUMN IF NOT EXISTS "emailOTPEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "googleId" TEXT,
ADD COLUMN IF NOT EXISTS "sellerApprovedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sellerApprovedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sellerRejectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sellerRejectedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sellerRejectionNote" TEXT,
ADD COLUMN IF NOT EXISTS "sellerSuspendedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sellerSuspendedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sellerSuspensionNote" TEXT,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- DropTable
DROP TABLE IF EXISTS "SellerGelatoSettings";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deliveries_dhlLastSyncedAt_idx" ON "deliveries"("dhlLastSyncedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku" ASC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "seller_commission_overrides_categoryId_idx" ON "seller_commission_overrides"("categoryId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "seller_commission_overrides_sellerId_categoryId_key" ON "seller_commission_overrides"("sellerId" ASC, "categoryId" ASC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_sessions_fingerprint_idx" ON "user_sessions"("fingerprint" ASC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId" ASC);
