-- Seed missing commission system_settings rows on production
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- Usage: psql $DATABASE_URL -f seed-commission-settings.sql

DO $$
DECLARE
  admin_id TEXT;
BEGIN
  -- Get the superadmin/admin user id
  SELECT id INTO admin_id FROM users
  WHERE role IN ('SUPER_ADMIN', 'ADMIN')
  ORDER BY "createdAt" ASC
  LIMIT 1;

  IF admin_id IS NULL THEN
    admin_id := 'system';
  END IF;

  INSERT INTO system_settings
    (id, key, category, value, "valueType", label, description,
     "isPublic", "isEditable", "requiresRestart", "defaultValue",
     "lastUpdatedBy", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text,
     'global_commission_rate', 'commission', '10'::jsonb, 'NUMBER',
     'Global Commission Rate (%)', 'Default platform commission rate (percentage)',
     false, true, false, '10'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_type', 'commission', '"percentage"'::jsonb, 'STRING',
     'Commission Type', 'How commission is calculated (percentage / fixed / tiered)',
     false, true, false, '"percentage"'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_applies_to_shipping', 'commission', 'false'::jsonb, 'BOOLEAN',
     'Apply Commission to Shipping', 'Include shipping costs in commission calculation',
     false, true, false, 'false'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_min_amount', 'commission', '0.5'::jsonb, 'NUMBER',
     'Minimum Commission Amount (USD)', 'Minimum commission charged per transaction',
     false, true, false, '0.5'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_max_amount', 'commission', '0'::jsonb, 'NUMBER',
     'Maximum Commission Amount (USD)', 'Maximum commission cap (0 = no maximum)',
     false, true, false, '0'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_fixed_fee', 'commission', '0.3'::jsonb, 'NUMBER',
     'Fixed Commission Fee (USD)', 'Fixed fee added to every transaction',
     false, true, false, '0.3'::jsonb, admin_id, NOW(), NOW()),

    (gen_random_uuid()::text,
     'commission_default_rate', 'commission', '10'::jsonb, 'NUMBER',
     'Default Platform Commission (%)', 'Default commission percentage per transaction',
     true, true, false, '10'::jsonb, admin_id, NOW(), NOW())

  ON CONFLICT (key) DO NOTHING;

  RAISE NOTICE 'Commission settings seeded (skipped any that already existed).';
END $$;

-- Verify
SELECT key, value::text, "valueType", "isEditable"
FROM system_settings
WHERE category = 'commission'
ORDER BY key;
