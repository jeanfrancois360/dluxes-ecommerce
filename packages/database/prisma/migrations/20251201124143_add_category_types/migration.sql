-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('GENERAL', 'REAL_ESTATE', 'VEHICLE', 'SERVICE', 'RENTAL', 'DIGITAL');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "categoryType" "CategoryType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "typeSettings" JSONB;

-- CreateIndex
CREATE INDEX "categories_categoryType_idx" ON "categories"("categoryType");

-- CreateIndex
CREATE INDEX "categories_categoryType_isActive_idx" ON "categories"("categoryType", "isActive");
