#!/usr/bin/env tsx
/**
 * Clean Orders Script
 *
 * Deletes all orders and related data from the database for testing purposes
 */

import { PrismaClient } from '@nextpik/database';

const prisma = new PrismaClient();

async function cleanOrders() {
  try {
    console.log('🧹 Cleaning orders from database...\n');

    // Use raw SQL to handle cascading deletes and foreign key constraints
    console.log('📦 Deleting order items...');
    await prisma.$executeRaw`DELETE FROM "order_items"`;
    console.log(`   ✓ Deleted order items`);

    console.log('🚚 Deleting delivery confirmations...');
    await prisma.$executeRaw`DELETE FROM "delivery_confirmations"`;
    console.log(`   ✓ Deleted delivery confirmations`);

    console.log('🚚 Deleting deliveries...');
    await prisma.$executeRaw`DELETE FROM "deliveries"`;
    console.log(`   ✓ Deleted deliveries`);

    console.log('💼 Deleting commission records...');
    await prisma.$executeRaw`DELETE FROM "commissions"`;
    console.log(`   ✓ Deleted commissions`);

    console.log('💰 Deleting escrow split allocations...');
    await prisma.$executeRaw`DELETE FROM "escrow_split_allocations"`;
    console.log(`   ✓ Deleted escrow split allocations`);

    console.log('⚖️  Deleting disputes...');
    await prisma.$executeRaw`DELETE FROM "disputes"`;
    console.log(`   ✓ Deleted disputes`);

    console.log('💰 Deleting escrow transactions...');
    await prisma.$executeRaw`DELETE FROM "escrow_transactions"`;
    console.log(`   ✓ Deleted escrow transactions`);

    console.log('💳 Deleting payment transactions...');
    await prisma.$executeRaw`DELETE FROM "payment_transactions"`;
    console.log(`   ✓ Deleted payment transactions`);

    console.log('📋 Deleting orders...');
    await prisma.$executeRaw`DELETE FROM "orders"`;
    console.log(`   ✓ Deleted orders`);

    console.log('\n✅ All orders cleaned successfully!\n');
  } catch (error) {
    console.error('❌ Error cleaning orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrders()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
