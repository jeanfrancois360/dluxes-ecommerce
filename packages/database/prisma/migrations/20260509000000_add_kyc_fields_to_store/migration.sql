-- AddColumn: KYC / Seller Application fields on Store
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "intendedCategories" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "monthlyVolume" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "applicationDocumentUrl" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "applicationDocumentType" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "applicationNotes" TEXT;
