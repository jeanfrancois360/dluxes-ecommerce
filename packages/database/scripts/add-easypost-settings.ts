import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding EasyPost settings to database...');

  // Get admin user for lastUpdatedBy
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!admin) {
    throw new Error('No admin user found. Please run full seed first.');
  }

  const easypostSettings = [
    {
      key: 'easypost_enabled',
      category: 'shipping',
      value: true,
      valueType: 'BOOLEAN',
      label: 'Enable EasyPost Multi-Carrier Shipping',
      description:
        'Enable EasyPost as the primary shipping provider. When enabled, EasyPost will be the first provider checked in the shipping cascade (EasyPost → DHL → Zones → Manual). Configure API key in .env: EASYPOST_API_KEY',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true,
      lastUpdatedBy: admin.id,
    },
    {
      key: 'easypost_test_mode',
      category: 'shipping',
      value: true,
      valueType: 'BOOLEAN',
      label: 'EasyPost Test Mode',
      description:
        'Use EasyPost in test mode. Test mode is FREE and does not charge for label purchases. Set to false in production (requires production API key starting with EZAK).',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true,
      lastUpdatedBy: admin.id,
    },
    {
      key: 'easypost_default_label_format',
      category: 'shipping',
      value: 'PDF',
      valueType: 'STRING',
      label: 'Default Label Format',
      description:
        'Default format for shipping labels. Options: PDF (recommended for desktop printing), PNG (image format), ZPL (Zebra thermal printers), EPL2 (older thermal printers).',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: 'PDF',
      lastUpdatedBy: admin.id,
    },
    {
      key: 'easypost_default_carriers',
      category: 'shipping',
      value: ['USPS', 'UPS', 'FedEx'],
      valueType: 'ARRAY',
      label: 'Default Carriers',
      description:
        'Preferred carriers for rate comparison. EasyPost will prioritize these carriers when fetching shipping rates. Available: USPS, UPS, FedEx, DHL, Canada Post, Australia Post, and 100+ more.',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: ['USPS', 'UPS', 'FedEx'],
      lastUpdatedBy: admin.id,
    },
    {
      key: 'easypost_address_verification',
      category: 'shipping',
      value: true,
      valueType: 'BOOLEAN',
      label: 'Enable Address Verification',
      description:
        'Automatically verify and correct shipping addresses using EasyPost address validation API. Helps prevent delivery failures due to incorrect addresses.',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true,
      lastUpdatedBy: admin.id,
    },
  ];

  for (const setting of easypostSettings) {
    const result = await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't update if already exists
      create: setting as any,
    });
    console.log(`✅ Upserted setting: ${setting.key}`);
  }

  console.log('');
  console.log('🎉 EasyPost settings added successfully!');
  console.log('');
  console.log('You can now configure EasyPost in the admin settings UI.');
}

main()
  .catch((e) => {
    console.error('❌ Failed to add EasyPost settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
