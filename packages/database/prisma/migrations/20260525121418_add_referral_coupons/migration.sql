-- CreateEnum
CREATE TYPE "ReferralCouponStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "couponCode" TEXT;

-- CreateTable
CREATE TABLE "referral_coupons" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ReferralCouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_coupons_referralId_key" ON "referral_coupons"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_coupons_code_key" ON "referral_coupons"("code");

-- CreateIndex
CREATE INDEX "referral_coupons_referrerId_idx" ON "referral_coupons"("referrerId");

-- CreateIndex
CREATE INDEX "referral_coupons_code_idx" ON "referral_coupons"("code");

-- CreateIndex
CREATE INDEX "referral_coupons_status_idx" ON "referral_coupons"("status");

-- AddForeignKey
ALTER TABLE "referral_coupons" ADD CONSTRAINT "referral_coupons_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_coupons" ADD CONSTRAINT "referral_coupons_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
