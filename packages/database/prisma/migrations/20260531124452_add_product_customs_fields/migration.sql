-- AlterTable
ALTER TABLE "products" ADD COLUMN     "countryOfOrigin" TEXT,
ADD COLUMN     "hsCode" TEXT;

-- AlterTable
ALTER TABLE "referral_payout_records" ALTER COLUMN "updatedAt" DROP DEFAULT;
