-- Add images array to hot_deals table
ALTER TABLE "hot_deals" ADD COLUMN IF NOT EXISTS "images" JSONB NOT NULL DEFAULT '[]'::jsonb;
