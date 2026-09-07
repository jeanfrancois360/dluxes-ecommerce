-- AlterTable
ALTER TABLE "affiliate_products" ADD COLUMN IF NOT EXISTS "merchantCategory" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_products_merchantCategory_idx" ON "affiliate_products"("merchantCategory");
