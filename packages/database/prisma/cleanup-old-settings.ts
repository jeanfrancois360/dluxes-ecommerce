import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldSettings() {
  try {
    console.log('🧹 Cleaning up old settings with dot notation...\n');

    // Old settings to remove (using dot notation)
    const oldKeys = [
      'commission.default_rate',
      'escrow.auto_release_enabled',
      'escrow.enabled',
      'escrow.hold_period_days',
      'escrow.immediate_payout_enabled',
      'payout.auto_schedule_enabled',
      'payout.default_frequency',
      'payout.minimum_amount',
      'audit.log_all_escrow_actions',
      'audit.log_retention_days'
    ];

    console.log('Settings to remove:');
    oldKeys.forEach(key => console.log(`  - ${key}`));

    // Delete old settings
    const result = await prisma.systemSetting.deleteMany({
      where: {
        key: {
          in: oldKeys
        }
      }
    });

    console.log(`\n✅ Deleted ${result.count} old settings`);

    // Verify final count
    const finalCount = await prisma.systemSetting.count();
    console.log(`\n📊 Final count: ${finalCount}/38 ${finalCount === 38 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldSettings();
