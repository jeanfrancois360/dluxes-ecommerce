-- AlterTable: add user preferred reward type to referral_codes
ALTER TABLE "referral_codes" ADD COLUMN "preferredRewardType" "ReferralRewardType";
