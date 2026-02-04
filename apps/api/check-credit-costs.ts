import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCreditCosts() {
  console.log('📊 Credit Cost Configuration\n');
  console.log('='.repeat(60));

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: 'credit_cost_',
      },
    },
    orderBy: {
      key: 'asc',
    },
  });

  if (settings.length === 0) {
    console.log('❌ No credit cost settings found!');
    console.log('');
    console.log('Credit costs need to be configured in system settings.');
    console.log('Example keys:');
    console.log('  - credit_cost_list_real_estate');
    console.log('  - credit_cost_list_vehicle');
    console.log('  - credit_cost_list_service');
    console.log('  - credit_cost_list_rental');
  } else {
    console.log('✅ Credit Cost Settings:\n');
    settings.forEach((setting) => {
      const action = setting.key.replace('credit_cost_', '').replace(/_/g, ' ').toUpperCase();
      console.log(`${action}:`);
      console.log(`  Cost: ${setting.value} credits`);
      console.log(`  Label: ${setting.label}`);
      console.log(`  Public: ${setting.isPublic ? 'Yes' : 'No'}`);
      console.log('');
    });
  }

  console.log('='.repeat(60));
  console.log('');

  // Check product types
  console.log('📦 Product Types That Require Credits:\n');
  const productTypes = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];
  for (const type of productTypes) {
    const action = `list_${type.toLowerCase()}`;
    const key = `credit_cost_${action}`;
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting) {
      console.log(`✅ ${type}: ${setting.value} credits`);
    } else {
      console.log(`❌ ${type}: Not configured (default: 1 credit)`);
    }
  }

  console.log('');
  console.log('💡 Commission-based products (PHYSICAL, DIGITAL) do NOT require credits');
  console.log('');

  await prisma.$disconnect();
}

checkCreditCosts().catch(console.error);
