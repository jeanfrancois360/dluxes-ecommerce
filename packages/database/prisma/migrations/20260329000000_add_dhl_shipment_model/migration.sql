-- CreateTable
CREATE TABLE "dhl_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT,
    "storeId" TEXT,
    "shipmentId" TEXT,
    "trackingNumber" TEXT,
    "dispatchConfirmationNumber" TEXT,
    "productCode" TEXT,
    "productName" TEXT,
    "labelUrl" TEXT,
    "labelFormat" TEXT,
    "labelContent" TEXT,
    "waybillUrl" TEXT,
    "trackingUrl" TEXT,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "totalTransitDays" INTEGER,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "rawResponse" JSONB,
    "purchasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dhl_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dhl_shipments_orderId_idx" ON "dhl_shipments"("orderId");

-- CreateIndex
CREATE INDEX "dhl_shipments_sellerId_idx" ON "dhl_shipments"("sellerId");

-- CreateIndex
CREATE INDEX "dhl_shipments_trackingNumber_idx" ON "dhl_shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "dhl_shipments_shipmentId_idx" ON "dhl_shipments"("shipmentId");

-- CreateIndex
CREATE INDEX "dhl_shipments_status_idx" ON "dhl_shipments"("status");

-- AddForeignKey
ALTER TABLE "dhl_shipments" ADD CONSTRAINT "dhl_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
