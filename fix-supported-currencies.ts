import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSupportedCurrencies() {
  try {
    console.log('🔧 Updating supported_currencies setting...\n');

    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];

    const updated = await prisma.systemSetting.update({
      where: { key: 'supported_currencies' },
      data: { value: supportedCurrencies }
    });

    console.log(`✅ Updated supported_currencies: ${JSON.stringify(updated.value)}`);

    // Activate JPY as well
    const jpy = await prisma.currencyRate.updateMany({
      where: { currencyCode: 'JPY' },
      data: { isActive: true }
    });

    if (jpy.count > 0) {
      console.log(`✅ Activated JPY`);
    }

    console.log('\n📊 Active currencies:');
    const activeCurrencies = await prisma.currencyRate.findMany({
      where: { isActive: true },
      orderBy: { currencyCode: 'asc' }
    });

    activeCurrencies.forEach(curr => {
      console.log(`✅ ${curr.currencyCode} - ${curr.currencyName} (${curr.symbol})`);
    });

    console.log('\n✅ All supported currencies are now active!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSupportedCurrencies();
