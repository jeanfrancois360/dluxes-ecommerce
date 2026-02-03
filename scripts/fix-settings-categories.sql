-- Fix System Settings Categories and Duplicates
-- This script standardizes category names and removes duplicates
-- Run Date: 2026-01-18

-- ============================================================================
-- STEP 1: Standardize Category Names to UPPERCASE
-- ============================================================================

-- Update lowercase 'payment' to 'PAYMENT'
UPDATE system_settings
SET category = 'PAYMENT'
WHERE category = 'payment';

-- Update lowercase 'commission' to 'COMMISSION'
UPDATE system_settings
SET category = 'COMMISSION'
WHERE category = 'commission';

-- Update lowercase 'payout' to 'PAYOUT'
UPDATE system_settings
SET category = 'PAYOUT'
WHERE category = 'payout';

-- Update lowercase 'security' to 'SECURITY'
UPDATE system_settings
SET category = 'SECURITY'
WHERE category = 'security';

-- Update lowercase categories to UPPERCASE for all
UPDATE system_settings
SET category = UPPER(category)
WHERE category != UPPER(category);

-- ============================================================================
-- STEP 2: Remove Duplicate/Incorrect Settings
-- ============================================================================

-- Remove escrow_default_hold_days (incorrect name, correct is escrow_hold_period_days)
DELETE FROM system_settings
WHERE key = 'escrow_default_hold_days';

-- Remove PayPal settings that should be in .env
DELETE FROM system_settings
WHERE key IN ('paypal_client_id', 'paypal_client_secret');

-- Remove Stripe keys that should be in .env (if they exist)
DELETE FROM system_settings
WHERE key IN (
  'stripe_publishable_key',
  'stripe_secret_key',
  'stripe_webhook_secret',
  'stripe_webhook_url'
);

-- ============================================================================
-- STEP 3: Verify No Duplicates Remain
-- ============================================================================

-- Check for any remaining category case inconsistencies
SELECT DISTINCT category, COUNT(*) as count
FROM system_settings
WHERE category != UPPER(category)
GROUP BY category;

-- Should return 0 rows

-- ============================================================================
-- STEP 4: Summary Report
-- ============================================================================

-- Show settings by category after cleanup
SELECT
  category,
  COUNT(*) as total_settings,
  COUNT(CASE WHEN "isPublic" = true THEN 1 END) as public_count,
  COUNT(CASE WHEN "isEditable" = true THEN 1 END) as editable_count
FROM system_settings
GROUP BY category
ORDER BY category;

-- Show all payment-related settings
SELECT key, category, "valueType", "isEditable"
FROM system_settings
WHERE category IN ('PAYMENT', 'PAYOUT', 'COMMISSION')
ORDER BY category, key;
