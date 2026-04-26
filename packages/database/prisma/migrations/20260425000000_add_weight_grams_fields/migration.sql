-- Add standardized weight fields (integer grams) to five models.
-- All columns are nullable — existing rows unaffected.
-- Old weight fields (Decimal kg / String) are kept for transition.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "weightGramsSnapshot" INTEGER;

-- AlterTable
ALTER TABLE "seller_shipments" ADD COLUMN "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN "packageWeightGrams" INTEGER;
