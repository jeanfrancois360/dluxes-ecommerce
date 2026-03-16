-- Add shipping provider columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingProvider" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingProviderData" JSONB;
