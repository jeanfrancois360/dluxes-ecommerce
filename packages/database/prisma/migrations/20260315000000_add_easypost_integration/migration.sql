-- CreateEnum for EasyPost Shipment Status
CREATE TYPE "EasyPostShipmentStatus" AS ENUM ('PENDING', 'RATED', 'PURCHASED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_TO_SENDER', 'FAILURE', 'CANCELLED', 'UNKNOWN');

-- CreateEnum for EasyPost Refund Status
CREATE TYPE "EasyPostRefundStatus" AS ENUM ('SUBMITTED', 'REFUNDED', 'REJECTED');

-- CreateTable: EasyPost Shipments
CREATE TABLE "easypost_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT,
    "easypostShipmentId" TEXT NOT NULL,
    "easypostRateId" TEXT,
    "easypostTrackerId" TEXT,
    "easypostInsuranceId" TEXT,
    "carrier" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "retailRate" DOUBLE PRECISION,
    "listRate" DOUBLE PRECISION,
    "labelUrl" TEXT,
    "labelFormat" TEXT NOT NULL DEFAULT 'PNG',
    "labelSize" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "deliveryDays" INTEGER,
    "status" "EasyPostShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "refundStatus" "EasyPostRefundStatus",
    "fromAddress" JSONB NOT NULL,
    "toAddress" JSONB NOT NULL,
    "parcel" JSONB NOT NULL,
    "customsInfo" JSONB,
    "insuredAmount" DOUBLE PRECISION,
    "insuranceFee" DOUBLE PRECISION,
    "options" JSONB,
    "postageFee" DOUBLE PRECISION,
    "purchasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "easypost_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EasyPost Tracking Events
CREATE TABLE "easypost_tracking_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusDetail" TEXT,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zip" TEXT,
    "eventDatetime" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "carrierCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "easypost_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EasyPost Webhook Logs
CREATE TABLE "easypost_webhook_logs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "easypost_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "easypost_shipments_easypostShipmentId_key" ON "easypost_shipments"("easypostShipmentId");

-- CreateIndex
CREATE INDEX "easypost_shipments_orderId_idx" ON "easypost_shipments"("orderId");

-- CreateIndex
CREATE INDEX "easypost_shipments_sellerId_idx" ON "easypost_shipments"("sellerId");

-- CreateIndex
CREATE INDEX "easypost_shipments_trackingNumber_idx" ON "easypost_shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "easypost_shipments_easypostShipmentId_idx" ON "easypost_shipments"("easypostShipmentId");

-- CreateIndex
CREATE INDEX "easypost_shipments_status_idx" ON "easypost_shipments"("status");

-- CreateIndex
CREATE INDEX "easypost_tracking_events_shipmentId_idx" ON "easypost_tracking_events"("shipmentId");

-- CreateIndex
CREATE INDEX "easypost_tracking_events_eventDatetime_idx" ON "easypost_tracking_events"("eventDatetime");

-- CreateIndex
CREATE UNIQUE INDEX "easypost_webhook_logs_eventId_key" ON "easypost_webhook_logs"("eventId");

-- CreateIndex
CREATE INDEX "easypost_webhook_logs_eventId_idx" ON "easypost_webhook_logs"("eventId");

-- CreateIndex
CREATE INDEX "easypost_webhook_logs_eventType_idx" ON "easypost_webhook_logs"("eventType");

-- CreateIndex
CREATE INDEX "easypost_webhook_logs_createdAt_idx" ON "easypost_webhook_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "easypost_shipments" ADD CONSTRAINT "easypost_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "easypost_tracking_events" ADD CONSTRAINT "easypost_tracking_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "easypost_shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
