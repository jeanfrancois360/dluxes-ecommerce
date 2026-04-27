-- Migration: add_subscription_credit_event
-- Purely additive: CREATE TYPE + CREATE TABLE + CREATE INDEX only.
-- No ALTER TABLE on existing tables. No DROP statements.

-- New enum
CREATE TYPE "SubscriptionCreditEventType" AS ENUM (
  'RENEWAL_RESET',
  'CANCELLATION',
  'CRON_RESET'
);

-- New audit table
CREATE TABLE "subscription_credit_events" (
  "id"                TEXT NOT NULL,
  "subscriptionId"    TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "eventType"         "SubscriptionCreditEventType" NOT NULL,
  "creditsBefore"     INTEGER NOT NULL,
  "creditsAfter"      INTEGER NOT NULL,
  "creditsUsedBefore" INTEGER NOT NULL,
  "creditsUsedAfter"  INTEGER NOT NULL,
  "reason"            TEXT,
  "metadata"          JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_credit_events_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "subscription_credit_events"
  ADD CONSTRAINT "subscription_credit_events_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId")
  REFERENCES "seller_subscriptions"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "subscription_credit_events"
  ADD CONSTRAINT "subscription_credit_events_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "subscription_credit_events_subscriptionId_idx"
  ON "subscription_credit_events"("subscriptionId");

CREATE INDEX "subscription_credit_events_userId_idx"
  ON "subscription_credit_events"("userId");

CREATE INDEX "subscription_credit_events_createdAt_idx"
  ON "subscription_credit_events"("createdAt");
