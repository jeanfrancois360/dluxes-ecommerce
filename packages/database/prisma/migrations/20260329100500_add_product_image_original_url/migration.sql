-- AlterTable (corrected: use camelCase to match Prisma schema)
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;

-- Drop wrong snake_case column if it exists from a previous bad run
ALTER TABLE "product_images" DROP COLUMN IF EXISTS "original_url";
