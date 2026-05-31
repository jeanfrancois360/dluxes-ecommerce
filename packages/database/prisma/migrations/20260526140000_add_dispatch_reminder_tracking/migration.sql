-- Add dispatch reminder tracking to orders
-- Prevents the hourly cron from re-sending reminder emails for the same order

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "dispatchReminderSentAt" TIMESTAMP(3);
