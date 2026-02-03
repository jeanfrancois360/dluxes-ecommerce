-- This migration has been applied via prisma db push
-- Tables created: subscription_plans, seller_subscriptions, credit_balances, credit_transactions, credit_packages
-- Enums created: SubscriptionTier, BillingCycle, SubscriptionStatus, CreditTransactionType
-- Relations added to User model

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "CreditTransactionType" AS ENUM ('ALLOCATION', 'PURCHASE', 'DEBIT', 'REFUND', 'BONUS', 'EXPIRATION', 'ADJUSTMENT');

-- Tables already exist via db push
-- Migration marked as applied
