import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateCurrencies() {
  try {
    console.log('🔧 Activating supported currencies...\n');

    // Get supported currencies from settings
    const supportedSetting = await prisma.systemSetting.findUnique({
      where: { key: 'supported_currencies' }
    });

    const supportedCurrencies = supportedSetting?.value as string[] || ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];

    console.log(`Supported currencies: ${supportedCurrencies.join(', ')}\n`);

    // Activate all supported currencies
    for (const currencyCode of supportedCurrencies) {
      const result = await prisma.currencyRate.updateMany({
        where: { currencyCode },
        data: { isActive: true }
      });

      if (result.count > 0) {
        console.log(`✅ Activated: ${currencyCode}`);
      } else {
        console.log(`⚠️  Not found: ${currencyCode}`);
      }
    }

    // Optionally deactivate currencies not in supported list
    const deactivated = await prisma.currencyRate.updateMany({
      where: {
        currencyCode: { notIn: supportedCurrencies }
      },
      data: { isActive: false }
    });

    if (deactivated.count > 0) {
      console.log(`\n❌ Deactivated ${deactivated.count} unsupported currencies`);
    }

    console.log('\n📊 Final currency status:');
    const allCurrencies = await prisma.currencyRate.findMany({
      orderBy: { currencyCode: 'asc' }
    });

    allCurrencies.forEach(curr => {
      console.log(`${curr.isActive ? '✅' : '❌'} ${curr.currencyCode} - ${curr.currencyName}`);
    });

    console.log('\n✅ Currency activation complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateCurrencies();
