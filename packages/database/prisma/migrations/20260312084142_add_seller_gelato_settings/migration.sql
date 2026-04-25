-- CreateEnum
CREATE TYPE "GelatoPodStatus" AS ENUM ('PENDING', 'SUBMITTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "SellerGelatoSettings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "gelatoApiKey" TEXT,
    "gelatoStoreId" TEXT,
    "gelatoWebhookSecret" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastTestAt" TIMESTAMP(3),
    "gelatoAccountName" TEXT,
    "gelatoAccountEmail" TEXT,
    "webhookUrl" TEXT,
    "webhookId" TEXT,
    "connectionError" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerGelatoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gelato_pod_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT,
    "usedPlatformAccount" BOOLEAN NOT NULL DEFAULT false,
    "gelatoOrderId" TEXT NOT NULL,
    "gelatoOrderReference" TEXT,
    "status" "GelatoPodStatus" NOT NULL DEFAULT 'PENDING',
    "productionStatus" TEXT,
    "shippingStatus" TEXT,
    "failureReason" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "carrier" TEXT,
    "shippingMethod" TEXT,
    "productionCostCents" INTEGER,
    "shippingCostCents" INTEGER,
    "totalCostCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "submittedAt" TIMESTAMP(3),
    "producedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gelato_pod_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gelato_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "podOrderId" TEXT,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gelato_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerGelatoSettings_sellerId_key" ON "SellerGelatoSettings"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerGelatoSettings_storeId_key" ON "SellerGelatoSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "gelato_pod_orders_gelatoOrderId_key" ON "gelato_pod_orders"("gelatoOrderId");

-- CreateIndex
CREATE INDEX "gelato_pod_orders_orderId_idx" ON "gelato_pod_orders"("orderId");

-- CreateIndex
CREATE INDEX "gelato_pod_orders_orderItemId_idx" ON "gelato_pod_orders"("orderItemId");

-- CreateIndex
CREATE INDEX "gelato_pod_orders_gelatoOrderId_idx" ON "gelato_pod_orders"("gelatoOrderId");

-- CreateIndex
CREATE INDEX "gelato_pod_orders_status_idx" ON "gelato_pod_orders"("status");

-- CreateIndex
CREATE INDEX "gelato_pod_orders_createdAt_idx" ON "gelato_pod_orders"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "gelato_webhook_events_eventId_key" ON "gelato_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "gelato_webhook_events_eventType_idx" ON "gelato_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "gelato_webhook_events_podOrderId_idx" ON "gelato_webhook_events"("podOrderId");

-- CreateIndex
CREATE INDEX "gelato_webhook_events_status_idx" ON "gelato_webhook_events"("status");

-- CreateIndex
CREATE INDEX "gelato_webhook_events_createdAt_idx" ON "gelato_webhook_events"("createdAt");

-- AddForeignKey
ALTER TABLE "SellerGelatoSettings" ADD CONSTRAINT "SellerGelatoSettings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerGelatoSettings" ADD CONSTRAINT "SellerGelatoSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gelato_pod_orders" ADD CONSTRAINT "gelato_pod_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gelato_pod_orders" ADD CONSTRAINT "gelato_pod_orders_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gelato_pod_orders" ADD CONSTRAINT "gelato_pod_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gelato_webhook_events" ADD CONSTRAINT "gelato_webhook_events_podOrderId_fkey" FOREIGN KEY ("podOrderId") REFERENCES "gelato_pod_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
