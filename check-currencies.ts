import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrencies() {
  try {
    console.log('🔍 Checking currencies in database...\n');

    const currencies = await prisma.currencyRate.findMany({
      orderBy: { currencyCode: 'asc' }
    });

    console.log(`Total currencies in database: ${currencies.length}\n`);

    currencies.forEach(curr => {
      console.log(`${curr.isActive ? '✅' : '❌'} ${curr.currencyCode} - ${curr.currencyName}`);
      console.log(`   Symbol: ${curr.symbol}, Rate: ${curr.rate}`);
    });

    console.log('\n📋 System Settings:');
    const supportedSetting = await prisma.systemSetting.findUnique({
      where: { key: 'supported_currencies' }
    });

    if (supportedSetting) {
      console.log(`   Supported currencies: ${JSON.stringify(supportedSetting.value)}`);
    }

    console.log('\n💡 Missing currencies:');
    const supportedCurrencies = supportedSetting?.value as string[] || [];
    const existingCodes = currencies.map(c => c.currencyCode);
    const missing = supportedCurrencies.filter(code => !existingCodes.includes(code));

    if (missing.length > 0) {
      console.log(`   ❌ These currencies need to be added to CurrencyRate table:`);
      missing.forEach(code => console.log(`      - ${code}`));
    } else {
      console.log(`   ✅ All supported currencies exist in database`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrencies();
