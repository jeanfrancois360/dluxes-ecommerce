-- Migration applied manually. Adding SQL to reconcile Prisma migration history.
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;
