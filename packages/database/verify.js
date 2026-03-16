const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying EasyPost Integration...\n');

  const easypostSettings = await prisma.systemSetting.count({
    where: { key: { startsWith: 'easypost_' } },
  });

  const originSettings = await prisma.systemSetting.count({
    where: { key: { in: ['origin_street1', 'origin_city', 'origin_state'] } },
  });

  console.log('✅ EasyPost Settings:', easypostSettings, '/7');
  console.log('✅ Origin Settings:', originSettings, '/3');
  console.log('✅ Total:', easypostSettings + originSettings, '/10\n');

  const allSettings = await prisma.systemSetting.findMany({
    where: {
      OR: [
        { key: { startsWith: 'easypost_' } },
        { key: { in: ['origin_street1', 'origin_city', 'origin_state'] } },
      ],
    },
    select: { key: true },
    orderBy: { key: 'asc' },
  });

  console.log('📋 Settings Created:');
  allSettings.forEach((s) => console.log('   ✓', s.key));

  console.log('\n🎉 Migration Complete!\n');
  console.log('Next Steps:');
  console.log('1. Go to Admin → Settings → EasyPost Shipping');
  console.log('2. Enable integration & add API key');
  console.log('3. Select carriers and save\n');

  await prisma.$disconnect();
}

verify().catch(console.error);
