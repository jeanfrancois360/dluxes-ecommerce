-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'PENDING_RELEASE', 'RELEASED', 'REFUNDED', 'DISPUTED', 'PARTIALLY_RELEASED');

-- CreateEnum
CREATE TYPE "DeliveryConfirmationType" AS ENUM ('BUYER_CONFIRMED', 'AUTO_CONFIRMED', 'ADMIN_CONFIRMED', 'COURIER_CONFIRMED');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ROLLBACK');

-- CreateEnum
CREATE TYPE "PayoutFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "PlanBillingPeriod" AS ENUM ('FREE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentTransactionId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "sellerAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "deliveryConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "deliveryConfirmedAt" TIMESTAMP(3),
    "deliveryConfirmedBy" TEXT,
    "holdPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "autoReleaseAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_split_allocations" (
    "id" TEXT NOT NULL,
    "escrowTransactionId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "sellerAmount" DECIMAL(10,2) NOT NULL,
    "orderItemId" TEXT,
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_split_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_commission_overrides" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "commissionType" "CommissionRuleType" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxOrderValue" DECIMAL(10,2),
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_commission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "countries" TEXT[],
    "states" TEXT[],
    "cities" TEXT[],
    "postalCodes" TEXT[],
    "baseFee" DECIMAL(10,2) NOT NULL,
    "perKgFee" DECIMAL(10,2),
    "freeShippingThreshold" DECIMAL(10,2),
    "minDeliveryDays" INTEGER NOT NULL DEFAULT 3,
    "maxDeliveryDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxOrderValue" DECIMAL(10,2),
    "rate" DECIMAL(10,2) NOT NULL,
    "perKgRate" DECIMAL(10,2),
    "minDeliveryDays" INTEGER NOT NULL DEFAULT 3,
    "maxDeliveryDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "valueType" "SettingValueType" NOT NULL DEFAULT 'STRING',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "validationRule" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "requiresRestart" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" JSONB,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_audit_logs" (
    "id" TEXT NOT NULL,
    "settingId" TEXT,
    "settingKey" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByEmail" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" "AuditAction" NOT NULL DEFAULT 'UPDATE',
    "reason" TEXT,
    "metadata" JSONB,
    "canRollback" BOOLEAN NOT NULL DEFAULT true,
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_schedule_config" (
    "id" TEXT NOT NULL,
    "frequency" "PayoutFrequency" NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "minPayoutAmount" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "holdPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyBeforeDays" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "lastProcessedAt" TIMESTAMP(3),
    "nextProcessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_schedule_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_confirmations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "confirmedBy" TEXT NOT NULL,
    "confirmationType" "DeliveryConfirmationType" NOT NULL,
    "signature" TEXT,
    "photos" TEXT[],
    "notes" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "deliveryAddress" TEXT,
    "scheduledDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisement_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "maxActiveAds" INTEGER NOT NULL DEFAULT 1,
    "maxImpressions" INTEGER,
    "priorityBoost" INTEGER NOT NULL DEFAULT 0,
    "allowedPlacements" JSONB NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingPeriod" "PlanBillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_plan_subscriptions" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "stripeSubscriptionId" TEXT,
    "lastPaymentAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "adsCreated" INTEGER NOT NULL DEFAULT 0,
    "impressionsUsed" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_plan_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_orderId_key" ON "escrow_transactions"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_paymentTransactionId_key" ON "escrow_transactions"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "escrow_transactions_orderId_idx" ON "escrow_transactions"("orderId");

-- CreateIndex
CREATE INDEX "escrow_transactions_sellerId_idx" ON "escrow_transactions"("sellerId");

-- CreateIndex
CREATE INDEX "escrow_transactions_storeId_idx" ON "escrow_transactions"("storeId");

-- CreateIndex
CREATE INDEX "escrow_transactions_status_idx" ON "escrow_transactions"("status");

-- CreateIndex
CREATE INDEX "escrow_transactions_autoReleaseAt_idx" ON "escrow_transactions"("autoReleaseAt");

-- CreateIndex
CREATE INDEX "escrow_transactions_deliveryConfirmed_idx" ON "escrow_transactions"("deliveryConfirmed");

-- CreateIndex
CREATE INDEX "escrow_split_allocations_escrowTransactionId_idx" ON "escrow_split_allocations"("escrowTransactionId");

-- CreateIndex
CREATE INDEX "escrow_split_allocations_sellerId_idx" ON "escrow_split_allocations"("sellerId");

-- CreateIndex
CREATE INDEX "escrow_split_allocations_storeId_idx" ON "escrow_split_allocations"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_commission_overrides_sellerId_key" ON "seller_commission_overrides"("sellerId");

-- CreateIndex
CREATE INDEX "seller_commission_overrides_sellerId_idx" ON "seller_commission_overrides"("sellerId");

-- CreateIndex
CREATE INDEX "seller_commission_overrides_isActive_idx" ON "seller_commission_overrides"("isActive");

-- CreateIndex
CREATE INDEX "seller_commission_overrides_priority_idx" ON "seller_commission_overrides"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_zones_code_key" ON "shipping_zones"("code");

-- CreateIndex
CREATE INDEX "shipping_zones_code_idx" ON "shipping_zones"("code");

-- CreateIndex
CREATE INDEX "shipping_zones_isActive_idx" ON "shipping_zones"("isActive");

-- CreateIndex
CREATE INDEX "shipping_zones_priority_idx" ON "shipping_zones"("priority");

-- CreateIndex
CREATE INDEX "shipping_rates_zoneId_idx" ON "shipping_rates"("zoneId");

-- CreateIndex
CREATE INDEX "shipping_rates_isActive_idx" ON "shipping_rates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_isPublic_idx" ON "system_settings"("isPublic");

-- CreateIndex
CREATE INDEX "settings_audit_logs_settingId_idx" ON "settings_audit_logs"("settingId");

-- CreateIndex
CREATE INDEX "settings_audit_logs_settingKey_idx" ON "settings_audit_logs"("settingKey");

-- CreateIndex
CREATE INDEX "settings_audit_logs_changedBy_idx" ON "settings_audit_logs"("changedBy");

-- CreateIndex
CREATE INDEX "settings_audit_logs_createdAt_idx" ON "settings_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_confirmations_orderId_key" ON "delivery_confirmations"("orderId");

-- CreateIndex
CREATE INDEX "delivery_confirmations_orderId_idx" ON "delivery_confirmations"("orderId");

-- CreateIndex
CREATE INDEX "delivery_confirmations_confirmedBy_idx" ON "delivery_confirmations"("confirmedBy");

-- CreateIndex
CREATE INDEX "delivery_confirmations_actualDeliveryDate_idx" ON "delivery_confirmations"("actualDeliveryDate");

-- CreateIndex
CREATE UNIQUE INDEX "advertisement_plans_slug_key" ON "advertisement_plans"("slug");

-- CreateIndex
CREATE INDEX "advertisement_plans_slug_idx" ON "advertisement_plans"("slug");

-- CreateIndex
CREATE INDEX "advertisement_plans_isActive_idx" ON "advertisement_plans"("isActive");

-- CreateIndex
CREATE INDEX "advertisement_plans_displayOrder_idx" ON "advertisement_plans"("displayOrder");

-- CreateIndex
CREATE INDEX "seller_plan_subscriptions_sellerId_idx" ON "seller_plan_subscriptions"("sellerId");

-- CreateIndex
CREATE INDEX "seller_plan_subscriptions_planId_idx" ON "seller_plan_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "seller_plan_subscriptions_status_idx" ON "seller_plan_subscriptions"("status");

-- CreateIndex
CREATE INDEX "seller_plan_subscriptions_currentPeriodEnd_idx" ON "seller_plan_subscriptions"("currentPeriodEnd");

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_split_allocations" ADD CONSTRAINT "escrow_split_allocations_escrowTransactionId_fkey" FOREIGN KEY ("escrowTransactionId") REFERENCES "escrow_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_split_allocations" ADD CONSTRAINT "escrow_split_allocations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_split_allocations" ADD CONSTRAINT "escrow_split_allocations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_commission_overrides" ADD CONSTRAINT "seller_commission_overrides_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_commission_overrides" ADD CONSTRAINT "seller_commission_overrides_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_audit_logs" ADD CONSTRAINT "settings_audit_logs_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "system_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_confirmations" ADD CONSTRAINT "delivery_confirmations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_plan_subscriptions" ADD CONSTRAINT "seller_plan_subscriptions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_plan_subscriptions" ADD CONSTRAINT "seller_plan_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "advertisement_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
