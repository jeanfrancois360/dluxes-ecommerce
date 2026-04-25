import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const missingSettings = [
    {
      key: 'referral_enabled',
      value: true,
      valueType: 'BOOLEAN' as const,
      category: 'referral',
      label: 'Referral Program Enabled',
      description: 'Enable or disable the referral program',
      isPublic: true,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_buyer_reward',
      value: 10.0,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Buyer Referral Reward',
      description: 'Store credit amount rewarded to the referred buyer on first purchase',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_seller_reward',
      value: 50.0,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Seller Referral Reward',
      description: 'Store credit amount rewarded to the referring seller',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_min_order_value',
      value: 25.0,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Minimum Order Value for Referral',
      description: 'Minimum order amount required to trigger referral reward',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_buyer_expiration_days',
      value: 90,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Buyer Reward Expiration (Days)',
      description: 'Number of days before buyer referral reward expires',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_seller_expiration_days',
      value: 180,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Seller Reward Expiration (Days)',
      description: 'Number of days before seller referral reward expires',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_code_length',
      value: 8,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Referral Code Length',
      description: 'Length of generated referral codes',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_code_prefix',
      value: '',
      valueType: 'STRING' as const,
      category: 'referral',
      label: 'Referral Code Prefix',
      description: 'Optional prefix for referral codes (e.g. "NPK-")',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_max_usage_per_code',
      value: 0,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Max Usage Per Code',
      description: 'Maximum times a referral code can be used (0 = unlimited)',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_reward_currency',
      value: 'USD',
      valueType: 'STRING' as const,
      category: 'referral',
      label: 'Referral Reward Currency',
      description: 'Currency used for referral rewards',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_auto_generate_code',
      value: true,
      valueType: 'BOOLEAN' as const,
      category: 'referral',
      label: 'Auto-Generate Referral Code',
      description: 'Automatically generate a referral code for new sellers',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_min_payout_amount',
      value: 5.0,
      valueType: 'NUMBER' as const,
      category: 'referral',
      label: 'Minimum Payout Amount',
      description: 'Minimum referral balance required to trigger a payout',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
    },
    {
      key: 'referral_show_leaderboard',
      value: true,
      valueType: 'BOOLEAN' as const,
      category: 'referral',
      label: 'Show Referral Leaderboard',
      description: 'Display a public referral leaderboard',
      isPublic: true,
      isEditable: true,
      requiresRestart: false,
    },
  ];

  for (const setting of missingSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`✅ Seeded: ${setting.key}`);
  }

  console.log('\nDone. All referral settings seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
