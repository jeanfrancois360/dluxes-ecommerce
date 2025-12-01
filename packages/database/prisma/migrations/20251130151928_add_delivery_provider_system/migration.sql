-- CreateEnum
CREATE TYPE "DeliveryProviderType" AS ENUM ('API_INTEGRATED', 'MANUAL', 'PARTNER');

-- CreateEnum
CREATE TYPE "ProviderVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING_PICKUP', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DELIVERY_PARTNER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deliveryProviderId" TEXT;

-- CreateTable
CREATE TABLE "delivery_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DeliveryProviderType" NOT NULL DEFAULT 'PARTNER',
    "description" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "website" TEXT,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "apiEndpoint" TEXT,
    "webhookUrl" TEXT,
    "countries" TEXT[],
    "commissionType" "CommissionRuleType" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" "ProviderVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "logo" TEXT,
    "coverImage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerId" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3),
    "deliveryPartnerId" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "currentStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "pickupAddress" JSONB NOT NULL,
    "deliveryAddress" JSONB NOT NULL,
    "pickupScheduledAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "outForDeliveryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "expectedDeliveryDate" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "confirmationType" "DeliveryConfirmationType",
    "proofOfDelivery" JSONB,
    "hasIssue" BOOLEAN NOT NULL DEFAULT false,
    "issueDescription" TEXT,
    "issueReportedAt" TIMESTAMP(3),
    "issueResolvedAt" TIMESTAMP(3),
    "issueResolvedBy" TEXT,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "partnerCommission" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "customerRating" INTEGER,
    "customerFeedback" TEXT,
    "specialInstructions" TEXT,
    "internalNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_provider_payouts" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "deliveryCount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paymentDetails" JSONB,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_provider_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_providers_slug_key" ON "delivery_providers"("slug");

-- CreateIndex
CREATE INDEX "delivery_providers_slug_idx" ON "delivery_providers"("slug");

-- CreateIndex
CREATE INDEX "delivery_providers_isActive_idx" ON "delivery_providers"("isActive");

-- CreateIndex
CREATE INDEX "delivery_providers_verificationStatus_idx" ON "delivery_providers"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_trackingNumber_key" ON "deliveries"("trackingNumber");

-- CreateIndex
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_providerId_idx" ON "deliveries"("providerId");

-- CreateIndex
CREATE INDEX "deliveries_deliveryPartnerId_idx" ON "deliveries"("deliveryPartnerId");

-- CreateIndex
CREATE INDEX "deliveries_currentStatus_idx" ON "deliveries"("currentStatus");

-- CreateIndex
CREATE INDEX "deliveries_trackingNumber_idx" ON "deliveries"("trackingNumber");

-- CreateIndex
CREATE INDEX "deliveries_expectedDeliveryDate_idx" ON "deliveries"("expectedDeliveryDate");

-- CreateIndex
CREATE INDEX "delivery_provider_payouts_providerId_idx" ON "delivery_provider_payouts"("providerId");

-- CreateIndex
CREATE INDEX "delivery_provider_payouts_status_idx" ON "delivery_provider_payouts"("status");

-- CreateIndex
CREATE INDEX "delivery_provider_payouts_periodStart_idx" ON "delivery_provider_payouts"("periodStart");

-- CreateIndex
CREATE INDEX "delivery_provider_payouts_periodEnd_idx" ON "delivery_provider_payouts"("periodEnd");

-- CreateIndex
CREATE INDEX "users_deliveryProviderId_idx" ON "users"("deliveryProviderId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deliveryProviderId_fkey" FOREIGN KEY ("deliveryProviderId") REFERENCES "delivery_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "delivery_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_provider_payouts" ADD CONSTRAINT "delivery_provider_payouts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "delivery_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
