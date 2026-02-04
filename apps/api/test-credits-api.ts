import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCreditsAPI() {
  const userId = 'cmkjixzk10017i5n13ntkvmpd'; // Your user ID

  console.log('Testing Credits API for user:', userId, '\n');

  // Get balance directly from database
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    console.log('❌ No balance found');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Database shows:');
  console.log(`   Available Credits: ${balance.availableCredits}`);
  console.log(`   Lifetime Credits: ${balance.lifetimeCredits}`);
  console.log(`   Purchased Credits: ${balance.purchasedCredits}`);
  console.log(`   Lifetime Used: ${balance.lifetimeUsed}`);
  console.log('');

  // Get transactions
  const transactions = await prisma.creditTransaction.findMany({
    where: { balanceId: balance.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('📝 Recent transactions:');
  transactions.forEach((tx, i) => {
    console.log(`${i + 1}. ${tx.type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} credits`);
    console.log(`   ${tx.description}`);
    console.log(`   Balance: ${tx.balanceBefore} → ${tx.balanceAfter}`);
    console.log('');
  });

  console.log('🔍 API Response Test:');
  console.log('The API should return this data when you call /credits/balance');
  console.log('');
  console.log('If your frontend shows different values, try:');
  console.log('1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('2. Clear browser cache');
  console.log('3. Open in incognito/private window');
  console.log('');

  await prisma.$disconnect();
}

testCreditsAPI().catch(console.error);
