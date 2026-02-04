import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function identifyLoggedInUser() {
  console.log('🔍 Identifying logged-in user by transaction date...\n');

  // The transaction history shows "Jan 4, 2026 11:00 AM"
  // Let's find users with transactions on that date

  const startDate = new Date('2026-01-04T10:00:00');
  const endDate = new Date('2026-01-04T12:00:00');

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      type: 'BONUS',
      description: { contains: 'Welcome bonus' },
    },
    include: {
      balance: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (transactions.length === 0) {
    console.log('❌ No welcome bonus transactions found on Jan 4, 2026');
  } else {
    console.log(`✅ Found ${transactions.length} user(s) who received welcome bonus on Jan 4:\n`);

    for (const tx of transactions) {
      const user = tx.balance.user;
      const balance = await prisma.creditBalance.findUnique({
        where: { userId: user.id },
      });

      console.log(`User: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`User ID: ${user.id}`);
      console.log(`Role: ${user.role}`);
      console.log(`Transaction Date: ${tx.createdAt.toLocaleString()}`);
      console.log(`Current Balance: ${balance?.availableCredits || 0}`);
      console.log(`Lifetime Credits: ${balance?.lifetimeCredits || 0}`);
      console.log(`Purchased: ${balance?.purchasedCredits || 0}`);
      console.log('');

      if (balance && balance.availableCredits === 5 && balance.lifetimeCredits === 5) {
        console.log('⚠️  THIS IS LIKELY THE USER CURRENTLY LOGGED IN');
        console.log('    (Balance matches screenshot: 5 available, 5 lifetime, 0 purchased)');
        console.log('');
        console.log('📝 To add 50 credits to this user, run:');
        console.log(`    npx ts-node add-credits-manual.ts ${user.id} 50`);
        console.log('');
      }
    }
  }

  await prisma.$disconnect();
}

identifyLoggedInUser().catch(console.error);
