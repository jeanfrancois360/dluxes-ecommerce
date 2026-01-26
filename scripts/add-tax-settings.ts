/**
 * Script to add new tax settings to existing database
 * SAFE: Only adds settings if they don't exist (ON CONFLICT DO NOTHING)
 */

import { PrismaClient, SettingValueType } from '@nextpik/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding new tax settings...\n');

  try {
    // Add tax_calculation_enabled setting
    const taxCalcEnabled = await prisma.systemSetting.upsert({
      where: { key: 'tax_calculation_enabled' },
      update: {}, // Don't update if exists
      create: {
        key: 'tax_calculation_enabled',
        category: 'tax',
        value: false,
        valueType: SettingValueType.BOOLEAN,
        label: 'Dynamic Tax Calculation Enabled',
        description: 'Enable tax calculation from settings (false = use hardcoded 10%)',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: false,
      },
    });
    console.log('✅ Added setting: tax_calculation_enabled =', taxCalcEnabled.value);

    // Add tax_default_rate setting
    const taxDefaultRate = await prisma.systemSetting.upsert({
      where: { key: 'tax_default_rate' },
      update: {}, // Don't update if exists
      create: {
        key: 'tax_default_rate',
        category: 'tax',
        value: 0.10,
        valueType: SettingValueType.NUMBER,
        label: 'Default Tax Rate',
        description: 'Default tax rate as decimal (e.g., 0.10 = 10%, 0.15 = 15%)',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 0.10,
      },
    });
    console.log('✅ Added setting: tax_default_rate =', taxDefaultRate.value);

    console.log('\n✅ Tax settings added successfully!');
    console.log('\n📋 Current values:');
    console.log('   - tax_calculation_enabled: false (uses hardcoded fallback)');
    console.log('   - tax_default_rate: 0.10 (10%)');
    console.log('\n💡 To enable dynamic tax calculation:');
    console.log('   - Set tax_calculation_enabled = true via admin panel');
    console.log('   - Adjust tax_default_rate as needed (e.g., 0.15 for 15%)');
  } catch (error) {
    console.error('❌ Failed to add tax settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
