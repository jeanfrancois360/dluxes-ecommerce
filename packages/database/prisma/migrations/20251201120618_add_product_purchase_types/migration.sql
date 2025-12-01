-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('INSTANT', 'INQUIRY');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'REAL_ESTATE', 'VEHICLE', 'SERVICE', 'RENTAL', 'DIGITAL');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "contactRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'PHYSICAL',
ADD COLUMN     "purchaseType" "PurchaseType" NOT NULL DEFAULT 'INSTANT';

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");

-- CreateIndex
CREATE INDEX "products_purchaseType_idx" ON "products"("purchaseType");

-- CreateIndex
CREATE INDEX "products_productType_purchaseType_idx" ON "products"("productType", "purchaseType");

-- CreateIndex
CREATE INDEX "products_status_productType_purchaseType_idx" ON "products"("status", "productType", "purchaseType");
