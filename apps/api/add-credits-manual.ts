#!/usr/bin/env ts-node
/**
 * Manual Credit Addition Script (Testing Only)
 *
 * Usage: pnpm ts-node apps/api/add-credits-manual.ts <userId> <credits>
 * Example: pnpm ts-node apps/api/add-credits-manual.ts cmkjlvfma001hi5m7xyz 50
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCreditsManual() {
  const [, , userId, creditsStr] = process.argv;

  if (!userId || !creditsStr) {
    console.error('❌ Usage: pnpm ts-node apps/api/add-credits-manual.ts <userId> <credits>');
    console.error('Example: pnpm ts-node apps/api/add-credits-manual.ts cmkjlvfma001hi5m7xyz 50');
    process.exit(1);
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error('❌ Credits must be a positive number');
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user: ${userId}...`);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!user) {
    console.error(`❌ User not found: ${userId}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

  // Get or create credit balance
  let balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: {
        userId,
        availableCredits: 0,
        lifetimeCredits: 0,
        purchasedCredits: 0,
      },
    });
    console.log('📝 Created new credit balance');
  }

  console.log(`\n📊 Current Balance: ${balance.availableCredits} credits`);
  console.log(`💳 Adding: ${credits} credits (manual test)`);

  // Add credits
  const newBalance = balance.availableCredits + credits;

  await prisma.$transaction(async (tx) => {
    await tx.creditBalance.update({
      where: { id: balance.id },
      data: {
        availableCredits: newBalance,
        lifetimeCredits: { increment: credits },
        purchasedCredits: { increment: credits },
      },
    });

    await tx.creditTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'PURCHASE',
        amount: credits,
        balanceBefore: balance.availableCredits,
        balanceAfter: newBalance,
        action: 'manual_addition',
        description: `Manual credit addition for testing - ${credits} credits added`,
        performedBy: 'manual_script',
      },
    });
  });

  console.log(`✅ Credits added successfully!`);
  console.log(`\n📈 New Balance: ${newBalance} credits`);
  console.log(`\n🎉 Done! User can now list products with their credits.\n`);

  await prisma.$disconnect();
}

addCreditsManual().catch((error) => {
  console.error('❌ Error:', error.message);
  prisma.$disconnect();
  process.exit(1);
});
