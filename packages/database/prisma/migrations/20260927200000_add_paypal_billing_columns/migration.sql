-- Add PayPal billing columns to subscription_plans
ALTER TABLE "subscription_plans" ADD COLUMN "paypalProductId" TEXT;
ALTER TABLE "subscription_plans" ADD COLUMN "paypalPlanIdMonthly" TEXT;
ALTER TABLE "subscription_plans" ADD COLUMN "paypalPlanIdYearly" TEXT;

-- Add PayPal billing columns to advertisement_plans
ALTER TABLE "advertisement_plans" ADD COLUMN "paypalProductId" TEXT;
ALTER TABLE "advertisement_plans" ADD COLUMN "paypalPlanId" TEXT;

-- Add PayPal subscription ID to seller_subscriptions
ALTER TABLE "seller_subscriptions" ADD COLUMN "paypalSubscriptionId" TEXT;
