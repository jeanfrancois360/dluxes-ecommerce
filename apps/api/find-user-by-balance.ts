import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUserByBalance() {
  console.log('Finding users with credit balances...\n');

  const balances = await prisma.creditBalance.findMany({
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
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (balances.length === 0) {
    console.log('❌ No credit balances found');
  } else {
    console.log('✅ Found credit balances:\n');
    balances.forEach((balance, index) => {
      console.log(`${index + 1}. User: ${balance.user.firstName} ${balance.user.lastName}`);
      console.log(`   Email: ${balance.user.email}`);
      console.log(`   User ID: ${balance.user.id}`);
      console.log(`   Balance ID: ${balance.id}`);
      console.log(`   Available: ${balance.availableCredits}`);
      console.log(`   Lifetime: ${balance.lifetimeCredits}`);
      console.log(`   Purchased: ${balance.purchasedCredits}`);
      console.log(`   Role: ${balance.user.role}`);
      console.log(`   Last Updated: ${balance.updatedAt.toLocaleString()}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

findUserByBalance().catch(console.error);
