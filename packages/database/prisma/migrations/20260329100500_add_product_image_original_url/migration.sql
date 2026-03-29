-- AlterTable
ALTER TABLE "product_images" ADD COLUMN "original_url" TEXT;

-- Comment
COMMENT ON COLUMN "product_images"."original_url" IS 'Original Gelato S3 URL before re-upload to Supabase';
