import { PrismaClient, SettingValueType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed default system settings for Luxury E-commerce Platform
 */

const defaultSettings = [
  // GENERAL / SYSTEM SETTINGS
  {
    key: 'site_name',
    category: 'general',
    value: 'Luxury E-commerce',
    valueType: SettingValueType.STRING,
    label: 'Site Name',
    description: 'The name of your e-commerce platform',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'Luxury E-commerce',
  },
  {
    key: 'site_tagline',
    category: 'general',
    value: 'Where Elegance Meets Excellence',
    valueType: SettingValueType.STRING,
    label: 'Site Tagline',
    description: 'A short tagline for your brand',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'Where Elegance Meets Excellence',
  },
  {
    key: 'contact_email',
    category: 'general',
    value: 'support@luxury.com',
    valueType: SettingValueType.STRING,
    label: 'Contact Email',
    description: 'Primary contact email address',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'support@luxury.com',
  },
  {
    key: 'timezone',
    category: 'general',
    value: 'America/New_York',
    valueType: SettingValueType.STRING,
    label: 'Timezone',
    description: 'Default timezone for the platform',
    isPublic: false,
    isEditable: true,
    requiresRestart: true,
    defaultValue: 'America/New_York',
  },
  {
    key: 'maintenance_mode',
    category: 'general',
    value: false,
    valueType: SettingValueType.BOOLEAN,
    label: 'Maintenance Mode',
    description: 'Enable maintenance mode (disables all transactions)',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: false,
  },
  
  // PAYMENT & ESCROW SETTINGS
  {
    key: 'escrow_enabled',
    category: 'payment',
    value: true,
    valueType: SettingValueType.BOOLEAN,
    label: 'Escrow Enabled',
    description: 'Enable escrow system (REQUIRED for production)',
    isPublic: true,
    isEditable: false,
    requiresRestart: false,
    defaultValue: true,
  },
  {
    key: 'escrow_default_hold_days',
    category: 'payment',
    value: 7,
    valueType: SettingValueType.NUMBER,
    label: 'Default Escrow Hold Days',
    description: 'Number of days to hold funds after delivery confirmation',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 7,
  },
  {
    key: 'min_payout_amount',
    category: 'payment',
    value: 50,
    valueType: SettingValueType.NUMBER,
    label: 'Minimum Payout Amount',
    description: 'Minimum balance required for seller payout (USD)',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 50,
  },
  {
    key: 'payout_schedule',
    category: 'payment',
    value: 'weekly',
    valueType: SettingValueType.STRING,
    label: 'Payout Schedule',
    description: 'How often payouts are processed',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'weekly',
  },
  
  // COMMISSION SETTINGS
  {
    key: 'global_commission_rate',
    category: 'commission',
    value: 15,
    valueType: SettingValueType.NUMBER,
    label: 'Global Commission Rate (%)',
    description: 'Default platform commission rate (percentage)',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 15,
  },
  {
    key: 'commission_type',
    category: 'commission',
    value: 'PERCENTAGE',
    valueType: SettingValueType.STRING,
    label: 'Commission Type',
    description: 'How commission is calculated',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'PERCENTAGE',
  },
  
  // CURRENCY SETTINGS
  {
    key: 'default_currency',
    category: 'currency',
    value: 'USD',
    valueType: SettingValueType.STRING,
    label: 'Default Currency',
    description: 'Primary currency for the platform',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'USD',
  },
  {
    key: 'supported_currencies',
    category: 'currency',
    value: ['USD', 'EUR', 'GBP', 'RWF'],
    valueType: SettingValueType.ARRAY,
    label: 'Supported Currencies',
    description: 'All currencies supported by the platform',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: ['USD', 'EUR', 'GBP', 'RWF'],
  },
  {
    key: 'currency_auto_sync',
    category: 'currency',
    value: true,
    valueType: SettingValueType.BOOLEAN,
    label: 'Auto-Sync Exchange Rates',
    description: 'Automatically update exchange rates',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: true,
  },
  
  // DELIVERY SETTINGS
  {
    key: 'delivery_confirmation_required',
    category: 'delivery',
    value: true,
    valueType: SettingValueType.BOOLEAN,
    label: 'Delivery Confirmation Required',
    description: 'Require delivery confirmation to release escrow',
    isPublic: false,
    isEditable: false,
    requiresRestart: false,
    defaultValue: true,
  },
  {
    key: 'free_shipping_threshold',
    category: 'delivery',
    value: 200,
    valueType: SettingValueType.NUMBER,
    label: 'Free Shipping Threshold (USD)',
    description: 'Order total above which shipping is free',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 200,
  },
  
  // SECURITY SETTINGS
  {
    key: '2fa_required_for_admin',
    category: 'security',
    value: true,
    valueType: SettingValueType.BOOLEAN,
    label: 'Require 2FA for Admin',
    description: 'Enforce two-factor authentication for admin',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: true,
  },
  {
    key: 'password_min_length',
    category: 'security',
    value: 8,
    valueType: SettingValueType.NUMBER,
    label: 'Minimum Password Length',
    description: 'Minimum characters required for passwords',
    isPublic: true,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 8,
  },
];

async function seedSettings() {
  console.log('🌱 Seeding system settings...');

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        label: setting.label,
        description: setting.description,
        isPublic: setting.isPublic,
      },
      create: setting,
    });
    console.log(`  ✓ ${setting.key}`);
  }

  console.log(`✅ Seeded ${defaultSettings.length} system settings`);
}

seedSettings()
  .catch((e) => {
    console.error('❌ Error seeding settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
