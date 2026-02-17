import { PrismaClient, SettingValueType } from '@prisma/client';

const prisma = new PrismaClient();

async function addFreeShippingSettings() {
  console.log('Checking for free shipping settings...');

  try {
    // Check if free_shipping_enabled exists
    const enabledSetting = await prisma.systemSetting.findUnique({
      where: { key: 'free_shipping_enabled' },
    });

    if (!enabledSetting) {
      console.log('Creating free_shipping_enabled setting...');
      await prisma.systemSetting.create({
        data: {
          key: 'free_shipping_enabled',
          category: 'shipping',
          value: true,
          valueType: SettingValueType.BOOLEAN,
          label: 'Enable Free Shipping',
          description: 'Offer free shipping when order total exceeds threshold',
          isPublic: true,
          isEditable: true,
          requiresRestart: false,
          defaultValue: true,
          lastUpdatedBy: 'system',
        },
      });
      console.log('✅ Created free_shipping_enabled');
    } else {
      console.log('✓ free_shipping_enabled already exists');
    }

    // Check if free_shipping_threshold exists
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'free_shipping_threshold' },
    });

    if (!thresholdSetting) {
      console.log('Creating free_shipping_threshold setting...');
      await prisma.systemSetting.create({
        data: {
          key: 'free_shipping_threshold',
          category: 'shipping',
          value: 100,
          valueType: SettingValueType.NUMBER,
          label: 'Free Shipping Threshold',
          description: 'Minimum order total to qualify for free shipping (USD)',
          isPublic: true,
          isEditable: true,
          requiresRestart: false,
          defaultValue: 100,
          lastUpdatedBy: 'system',
        },
      });
      console.log('✅ Created free_shipping_threshold');
    } else {
      console.log('✓ free_shipping_threshold already exists');
    }

    console.log('\n✅ All free shipping settings are present!');
  } catch (error) {
    console.error('Error adding free shipping settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addFreeShippingSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
