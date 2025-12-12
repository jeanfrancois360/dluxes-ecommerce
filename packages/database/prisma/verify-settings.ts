import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySettings() {
  try {
    console.log('🔍 Verifying database integrity...\n');

    // Count total settings
    const totalCount = await prisma.systemSetting.count();
    console.log(`Total Settings: ${totalCount}/38 ${totalCount === 38 ? '✅' : '❌'}`);

    // Get all settings
    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by category
    const byCategory = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('\n📊 Settings by Category:');
    for (const [category, categorySettings] of Object.entries(byCategory)) {
      console.log(`\n${category.toUpperCase()} (${categorySettings.length} settings):`);
      categorySettings.forEach(s => {
        const locked = !s.isEditable ? '🔒' : '  ';
        const publicFlag = s.isPublic ? '🌐' : '  ';
        console.log(`  ${locked}${publicFlag} ${s.key} (${s.valueType})`);
      });
    }

    // Check for locked settings
    const lockedSettings = settings.filter(s => !s.isEditable);
    console.log(`\n🔒 Locked Settings: ${lockedSettings.length}`);
    lockedSettings.forEach(s => console.log(`  - ${s.key}`));

    // Check for public settings
    const publicSettings = settings.filter(s => s.isPublic);
    console.log(`\n🌐 Public Settings: ${publicSettings.length}`);
    publicSettings.forEach(s => console.log(`  - ${s.key}`));

    // Verify critical settings exist
    const criticalKeys = [
      'escrow_enabled',
      'escrow_default_hold_days',
      'min_payout_amount',
      'global_commission_rate',
      'default_currency',
      'supported_currencies',
      'delivery_confirmation_required',
      '2fa_required_for_admin'
    ];

    console.log('\n🎯 Critical Settings Verification:');
    for (const key of criticalKeys) {
      const exists = settings.find(s => s.key === key);
      console.log(`  ${exists ? '✅' : '❌'} ${key}`);
    }

    console.log('\n✅ Database verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySettings();
