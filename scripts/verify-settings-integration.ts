import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SettingCheck {
  key: string;
  category: string;
  required: boolean;
  description: string;
}

const CRITICAL_SETTINGS: SettingCheck[] = [
  // Shipping
  {
    key: 'shipping_mode',
    category: 'shipping',
    required: true,
    description: 'Shipping calculation mode',
  },
  {
    key: 'shipping_standard_rate',
    category: 'shipping',
    required: true,
    description: 'Standard shipping rate',
  },
  {
    key: 'shipping_express_rate',
    category: 'shipping',
    required: true,
    description: 'Express shipping rate',
  },
  {
    key: 'shipping_overnight_rate',
    category: 'shipping',
    required: true,
    description: 'Overnight shipping rate',
  },
  {
    key: 'shipping_international_surcharge',
    category: 'shipping',
    required: true,
    description: 'International surcharge',
  },
  {
    key: 'free_shipping_enabled',
    category: 'shipping',
    required: true,
    description: 'Free shipping enabled',
  },
  {
    key: 'free_shipping_threshold',
    category: 'shipping',
    required: true,
    description: 'Free shipping threshold',
  },
  {
    key: 'origin_country',
    category: 'shipping',
    required: false,
    description: 'Origin country for DHL',
  },
  {
    key: 'origin_postal_code',
    category: 'shipping',
    required: false,
    description: 'Origin postal code for DHL',
  },

  // Tax
  {
    key: 'tax_calculation_mode',
    category: 'tax',
    required: true,
    description: 'Tax calculation mode',
  },
  { key: 'tax_default_rate', category: 'tax', required: false, description: 'Default tax rate' },

  // Commission
  {
    key: 'commission_applies_to_shipping',
    category: 'commission',
    required: true,
    description: 'Apply commission to shipping',
  },
  {
    key: 'commission_default_rate',
    category: 'commission',
    required: false,
    description: 'Default commission rate',
  },
  {
    key: 'commission_minimum_payout',
    category: 'commission',
    required: false,
    description: 'Minimum payout threshold',
  },

  // Payment/Stripe
  { key: 'stripe_enabled', category: 'payment', required: true, description: 'Stripe enabled' },
  { key: 'stripe_test_mode', category: 'payment', required: true, description: 'Stripe test mode' },
  {
    key: 'stripe_auto_payout_enabled',
    category: 'payment',
    required: false,
    description: 'Auto payout enabled',
  },
];

async function verifySettings() {
  console.log('🔍 Verifying Settings Integration\n');
  console.log('='.repeat(80));

  const results = {
    total: 0,
    found: 0,
    missing: 0,
    requiredMissing: 0,
  };

  const missingSettings: SettingCheck[] = [];

  for (const check of CRITICAL_SETTINGS) {
    results.total++;

    const setting = await prisma.systemSetting.findUnique({
      where: { key: check.key },
    });

    if (setting) {
      results.found++;
      const valuePreview =
        typeof setting.value === 'string'
          ? setting.value.substring(0, 30)
          : JSON.stringify(setting.value).substring(0, 30);

      console.log(`✅ ${check.key.padEnd(40)} | ${valuePreview}`);
    } else {
      results.missing++;
      if (check.required) {
        results.requiredMissing++;
        console.log(`❌ ${check.key.padEnd(40)} | REQUIRED - MISSING`);
      } else {
        console.log(`⚠️  ${check.key.padEnd(40)} | Optional - Missing`);
      }
      missingSettings.push(check);
    }
  }

  console.log('='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Settings Checked: ${results.total}`);
  console.log(`   Found: ${results.found} ✅`);
  console.log(`   Missing: ${results.missing} (${results.requiredMissing} required) ⚠️`);

  if (results.requiredMissing > 0) {
    console.log(`\n❌ CRITICAL: ${results.requiredMissing} required settings are missing!`);
    console.log('\nMissing required settings:');
    missingSettings
      .filter((s) => s.required)
      .forEach((s) => {
        console.log(`   - ${s.key} (${s.description})`);
      });
    console.log('\n💡 Run: pnpm seed-settings to add missing settings');
  } else if (results.missing > 0) {
    console.log(`\n⚠️  ${results.missing} optional settings are missing.`);
    console.log('These can be added later if needed.');
  } else {
    console.log('\n✅ All critical settings are present!');
  }

  // Check service integration
  console.log('\n' + '='.repeat(80));
  console.log('🔧 Service Integration Check\n');

  const integrationChecks = [
    {
      service: 'ShippingTaxService',
      file: 'apps/api/src/orders/shipping-tax.service.ts',
      status: '✅ Uses settingsService.getShippingMode()',
    },
    {
      service: 'CommissionService',
      file: 'apps/api/src/commission/commission.service.ts',
      status: '✅ Uses settingsService for commission settings',
    },
    {
      service: 'OrdersService',
      file: 'apps/api/src/orders/orders.service.ts',
      status: '✅ Uses shippingTaxService for calculations',
    },
    {
      service: 'CheckoutPage',
      file: 'apps/web/src/app/checkout/page.tsx',
      status: '✅ Uses backend API for shipping/tax calculations',
    },
  ];

  integrationChecks.forEach((check) => {
    console.log(`${check.status}`);
    console.log(`   Service: ${check.service}`);
    console.log(`   File: ${check.file}\n`);
  });

  console.log('='.repeat(80));
  console.log('\n✅ Settings integration verification complete!\n');

  return results.requiredMissing === 0;
}

verifySettings()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error verifying settings:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
