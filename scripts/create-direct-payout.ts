/**
 * Create Direct Test Payout (Quick Version)
 *
 * This script directly creates a payout record in the database
 * for testing the UI without going through the full order flow.
 *
 * Usage: npx ts-node scripts/create-direct-payout.ts
 */

import { PrismaClient, PayoutStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function createDirectPayout() {
  console.log('🚀 Creating direct test payout...\n');

  try {
    // Find a seller
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      include: { stores: true },
    });

    if (!seller || !seller.stores[0]) {
      console.error('❌ No seller found. Please create a seller account first.');
      process.exit(1);
    }

    const store = seller.stores[0];

    // Create payout directly
    const amount = 150.5; // $150.50
    const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const periodEnd = new Date();

    const payout = await prisma.payout.create({
      data: {
        sellerId: seller.id,
        storeId: store.id,
        amount: new Decimal(amount),
        currency: 'USD',
        status: PayoutStatus.PENDING,
        paymentMethod: 'BANK_TRANSFER',
        periodStart,
        periodEnd,
        scheduledAt: new Date(),
        commissionCount: 5, // Fake: 5 orders
        notes: 'Test payout created via script',
      },
      include: {
        seller: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('═══════════════════════════════════════');
    console.log('✅ TEST PAYOUT CREATED!');
    console.log('═══════════════════════════════════════');
    console.log(`Payout ID: ${payout.id}`);
    console.log(`Seller: ${payout.seller.firstName} ${payout.seller.lastName}`);
    console.log(`Email: ${payout.seller.email}`);
    console.log(`Store: ${payout.store.name}`);
    console.log(`Amount: $${amount.toFixed(2)}`);
    console.log(`Status: ${payout.status}`);
    console.log(`Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📍 Next Steps:');
    console.log('1. Go to Admin Portal → Payouts');
    console.log('2. You should see this payout in the list');
    console.log('3. You can mark it as completed or failed\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
createDirectPayout()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
