import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUIRED_SETTINGS = [
  {
    key: 'escrow_enabled',
    category: 'payment',
    label: 'Escrow System',
    severity: 'critical',
  },
  {
    key: 'escrow_default_hold_days',
    category: 'payment',
    label: 'Escrow Hold Period',
    severity: 'critical',
  },
  {
    key: 'min_payout_amount',
    category: 'payment',
    label: 'Minimum Payout Amount',
    severity: 'warning',
  },
  {
    key: 'global_commission_rate',
    category: 'commission',
    label: 'Global Commission Rate',
    severity: 'critical',
  },
];

async function testValidator() {
  try {
    console.log('🧪 Testing Settings Validator\n');

    // Get all settings from database
    const settings = await prisma.systemSetting.findMany();

    console.log('1. Database Status:');
    console.log(`   Total settings in DB: ${settings.length}`);
    console.log('');

    // Check each required setting
    console.log('2. Critical Settings Validation:');
    const missing: any[] = [];

    for (const required of REQUIRED_SETTINGS) {
      const found = settings.find(s => s.key === required.key);
      if (found) {
        console.log(`   ✅ ${required.label} (${required.key}): ${JSON.stringify(found.value)}`);
      } else {
        console.log(`   ❌ ${required.label} (${required.key}): MISSING`);
        missing.push(required);
      }
    }
    console.log('');

    // Validation result
    console.log('3. Validation Result:');
    if (missing.length === 0) {
      console.log('   ✅ All critical settings configured');
      console.log('   ✅ Validator check: PASS');
      console.log('   ✅ Platform ready for operations');
    } else {
      console.log(`   ❌ Missing ${missing.length} critical settings:`);
      missing.forEach(m => console.log(`      - ${m.label} (${m.key})`));
      console.log('   ❌ Validator check: FAIL');
    }
    console.log('');

    // Check for old dot notation (regression test)
    console.log('4. Regression Test (Old Dot Notation):');
    const oldKeys = [
      'escrow.enabled',
      'escrow.hold_period_days',
      'payout.minimum_amount',
      'commission.default_rate',
    ];

    const oldSettingsFound = settings.filter(s => oldKeys.includes(s.key));
    if (oldSettingsFound.length === 0) {
      console.log('   ✅ No old dot notation settings found');
      console.log('   ✅ Migration complete');
    } else {
      console.log(`   ❌ Found ${oldSettingsFound.length} old settings:`);
      oldSettingsFound.forEach(s => console.log(`      - ${s.key}`));
    }
    console.log('');

    console.log('✅ Validator test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testValidator();
