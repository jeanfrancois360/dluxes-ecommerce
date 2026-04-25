-- Migration Script: Set EasyPost as Default Primary Shipping Provider
-- Run this on existing databases to enable EasyPost by default
-- Date: 2026-03-20

-- Enable EasyPost by default (if not already manually configured)
UPDATE "SystemSetting"
SET
  value = true,
  "defaultValue" = true,
  description = 'Enable EasyPost multi-carrier shipping integration (DEFAULT: Primary shipping provider)'
WHERE
  key = 'easypost_enabled'
  AND value = false;  -- Only update if currently disabled

-- Update primary provider to EasyPost
UPDATE "SystemSetting"
SET
  value = 'EasyPost',
  "defaultValue" = 'EasyPost',
  description = 'Primary shipping carrier for deliveries (EasyPost: multi-carrier, DHL: DHL Express only)',
  "isEditable" = true
WHERE
  key = 'shipping_primary_provider';

-- Verify the changes
SELECT key, value, "defaultValue", description
FROM "SystemSetting"
WHERE key IN ('easypost_enabled', 'shipping_primary_provider', 'shipping_mode')
ORDER BY key;
