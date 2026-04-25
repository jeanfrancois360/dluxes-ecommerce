const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const easypostSettings = [
  {
    key: 'easypost_enabled',
    value: false,
    valueType: 'BOOLEAN',
    category: 'delivery',
    label: 'Enable EasyPost Shipping',
    description: 'Enable EasyPost multi-carrier shipping integration',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: false,
  },
  {
    key: 'easypost_api_key',
    value: '',
    valueType: 'STRING',
    category: 'delivery',
    label: 'EasyPost API Key',
    description: 'EasyPost API Key (use test key for development)',
    isPublic: false,
    isEditable: true,
    requiresRestart: true,
    defaultValue: '',
  },
  {
    key: 'easypost_test_mode',
    value: true,
    valueType: 'BOOLEAN',
    category: 'delivery',
    label: 'EasyPost Test Mode',
    description: 'Use EasyPost test environment',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: true,
  },
  {
    key: 'easypost_webhook_secret',
    value: '',
    valueType: 'STRING',
    category: 'delivery',
    label: 'EasyPost Webhook Secret',
    description: 'EasyPost webhook HMAC secret for signature verification',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: '',
  },
  {
    key: 'easypost_default_label_format',
    value: 'PDF',
    valueType: 'STRING',
    category: 'delivery',
    label: 'Default Label Format',
    description: 'Default label format (PNG, PDF, ZPL, EPL2)',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'PDF',
    validationRule: JSON.stringify({ enum: ['PNG', 'PDF', 'ZPL', 'EPL2'] }),
  },
  {
    key: 'easypost_address_verification',
    value: true,
    valueType: 'BOOLEAN',
    category: 'delivery',
    label: 'Address Verification',
    description: 'Enable address verification for shipping',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: true,
  },
  {
    key: 'easypost_default_carriers',
    value: ['USPS', 'UPS', 'FedEx'],
    valueType: 'ARRAY',
    category: 'delivery',
    label: 'Default Carriers',
    description: 'Default carriers to show rates for',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: ['USPS', 'UPS', 'FedEx'],
  },
  {
    key: 'origin_street1',
    value: '123 Main Street',
    valueType: 'STRING',
    category: 'shipping',
    label: 'Origin Street Address',
    description: 'Street address of your warehouse/shipping location',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: '123 Main Street',
  },
  {
    key: 'origin_city',
    value: 'New York',
    valueType: 'STRING',
    category: 'shipping',
    label: 'Origin City',
    description: 'City of your warehouse/shipping location',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'New York',
  },
  {
    key: 'origin_state',
    value: 'NY',
    valueType: 'STRING',
    category: 'shipping',
    label: 'Origin State/Province',
    description: 'State or province code of your warehouse/shipping location',
    isPublic: false,
    isEditable: true,
    requiresRestart: false,
    defaultValue: 'NY',
  },
];

async function seedEasyPostSettings() {
  console.log('🌱 Seeding EasyPost settings...\n');

  for (const setting of easypostSettings) {
    try {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
      console.log(`✅ ${setting.key}`);
    } catch (error) {
      console.log(`⚠️  ${setting.key} (${error.message})`);
    }
  }

  console.log('\n✅ EasyPost settings seeded successfully!');

  // Verify
  const count = await prisma.systemSetting.count({
    where: {
      OR: [
        { key: { startsWith: 'easypost_' } },
        { key: { in: ['origin_street1', 'origin_city', 'origin_state'] } },
      ],
    },
  });

  console.log(`📊 Total settings in database: ${count}/10`);
}

seedEasyPostSettings()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
