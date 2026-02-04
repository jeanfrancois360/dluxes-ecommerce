import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentTransactions() {
  console.log('Checking Recent Credit Transactions...\n');

  // Get the most recent transactions
  const transactions = await prisma.creditTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      balance: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (transactions.length === 0) {
    console.log('❌ No transactions found');
  } else {
    console.log('✅ Recent transactions:\n');
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   User: ${tx.balance.user.firstName} ${tx.balance.user.lastName} (${tx.balance.user.email})`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Amount: ${tx.amount > 0 ? '+' : ''}${tx.amount}`);
      console.log(`   Balance: ${tx.balanceBefore} → ${tx.balanceAfter}`);
      console.log(`   Action: ${tx.action || 'N/A'}`);
      console.log(`   Description: ${tx.description || 'N/A'}`);
      if (tx.packageId) {
        console.log(`   Package ID: ${tx.packageId}`);
      }
      console.log(`   Created: ${tx.createdAt.toLocaleString()}`);
      console.log('');
    });
  }

  // Check for purchase transactions specifically
  const purchases = await prisma.creditTransaction.findMany({
    where: {
      type: 'PURCHASE',
      action: 'purchase_package',
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\n📦 Recent Package Purchases:\n');
  if (purchases.length === 0) {
    console.log('❌ No package purchases found');
  } else {
    purchases.forEach((tx, index) => {
      console.log(`${index + 1}. Amount: ${tx.amount} credits`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Package ID: ${tx.packageId}`);
      console.log(`   Created: ${tx.createdAt.toLocaleString()}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkRecentTransactions().catch(console.error);
