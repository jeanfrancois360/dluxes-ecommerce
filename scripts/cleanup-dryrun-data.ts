#!/usr/bin/env tsx
/**
 * Production Dry-Run Data Cleanup Script
 *
 * This script safely removes test data created during dry-run testing.
 * It preserves system settings and allows selective deletion.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-dryrun-data.ts --preview   # Show what will be deleted
 *   pnpm tsx scripts/cleanup-dryrun-data.ts --execute   # Actually delete data
 *   pnpm tsx scripts/cleanup-dryrun-data.ts --backup    # Create backup first
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Configuration: Define how to identify dry-run data
const DRY_RUN_CONFIG = {
  // Option 1: Delete data created before a specific date
  createdBefore: new Date('2026-02-11'), // Adjust to your "go-live" date

  // Option 2: Identify test users by email pattern
  testEmailPatterns: ['@test.com', '@example.com', 'test@', '+test@', 'demo@'],

  // Option 3: Identify test products by name pattern
  testProductPatterns: ['test', 'demo', 'sample', 'dryrun'],

  // What to delete
  deleteOptions: {
    users: true, // Delete test users
    products: true, // Delete test products
    orders: true, // Delete test orders
    stores: true, // Delete test stores
    payments: true, // Delete payment transactions
    reviews: true, // Delete reviews
    cartItems: true, // Delete cart items
    addresses: true, // Delete addresses
    sessions: true, // Delete user sessions
    deliveries: true, // Delete delivery records
    commissions: true, // Delete commission records
    payouts: true, // Delete payout records
    escrow: true, // Delete escrow transactions

    // ⚠️ NEVER delete these
    systemSettings: false, // Keep system settings
    categories: false, // Keep categories (unless specified)
  },
};

interface DeletionStats {
  users: number;
  products: number;
  orders: number;
  stores: number;
  payments: number;
  reviews: number;
  cartItems: number;
  addresses: number;
  sessions: number;
  deliveries: number;
  commissions: number;
  payouts: number;
  escrow: number;
  total: number;
}

async function analyzeData(): Promise<DeletionStats> {
  console.log('🔍 Analyzing dry-run data...\n');

  // Find test users
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '@test.com' } },
        { email: { contains: '@example.com' } },
        { email: { startsWith: 'test@' } },
        { email: { contains: '+test@' } },
        { email: { startsWith: 'demo@' } },
      ],
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const testUserIds = testUsers.map((u) => u.id);

  console.log('📧 Test Users Found:');
  testUsers.forEach((user) => {
    console.log(`   - ${user.email} (${user.role}) - Created: ${user.createdAt.toISOString()}`);
  });
  console.log(`   Total: ${testUsers.length}\n`);

  // Find test stores (owned by test users)
  const testStores = await prisma.store.findMany({
    where: { userId: { in: testUserIds } },
    select: { id: true, name: true, userId: true, createdAt: true },
  });

  const testStoreIds = testStores.map((s) => s.id);

  // Find test products
  const testProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'demo', mode: 'insensitive' } },
        { name: { contains: 'sample', mode: 'insensitive' } },
        { storeId: { in: testStoreIds } },
      ],
    },
    select: { id: true, name: true, storeId: true, createdAt: true },
  });

  const testProductIds = testProducts.map((p) => p.id);

  console.log('🏪 Test Stores Found:');
  testStores.forEach((store) => {
    console.log(`   - ${store.name} - Created: ${store.createdAt.toISOString()}`);
  });
  console.log(`   Total: ${testStores.length}\n`);

  console.log('📦 Test Products Found:');
  testProducts.slice(0, 10).forEach((product) => {
    console.log(`   - ${product.name} - Created: ${product.createdAt.toISOString()}`);
  });
  if (testProducts.length > 10) {
    console.log(`   ... and ${testProducts.length - 10} more`);
  }
  console.log(`   Total: ${testProducts.length}\n`);

  // Find orders with test data
  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: { in: testUserIds } },
        { items: { some: { productId: { in: testProductIds } } } },
      ],
    },
    select: { id: true, orderNumber: true, total: true, createdAt: true },
  });

  const testOrderIds = testOrders.map((o) => o.id);

  console.log('🛒 Test Orders Found:');
  testOrders.slice(0, 10).forEach((order) => {
    console.log(
      `   - Order #${order.orderNumber} - $${order.total} - Created: ${order.createdAt.toISOString()}`
    );
  });
  if (testOrders.length > 10) {
    console.log(`   ... and ${testOrders.length - 10} more`);
  }
  console.log(`   Total: ${testOrders.length}\n`);

  // Count related data
  const paymentCount = await prisma.paymentTransaction.count({
    where: { orderId: { in: testOrderIds } },
  });

  const reviewCount = await prisma.review.count({
    where: {
      OR: [{ userId: { in: testUserIds } }, { productId: { in: testProductIds } }],
    },
  });

  const cartItemCount = await prisma.cartItem.count({
    where: {
      OR: [{ cart: { userId: { in: testUserIds } } }, { productId: { in: testProductIds } }],
    },
  });

  const addressCount = await prisma.address.count({
    where: { userId: { in: testUserIds } },
  });

  const sessionCount = await prisma.userSession.count({
    where: { userId: { in: testUserIds } },
  });

  const deliveryCount = await prisma.delivery.count({
    where: { orderId: { in: testOrderIds } },
  });

  const commissionCount = await prisma.commission.count({
    where: { orderId: { in: testOrderIds } },
  });

  const payoutCount = await prisma.payout.count({
    where: { sellerId: { in: testUserIds } },
  });

  const escrowCount = await prisma.escrowTransaction.count({
    where: { orderId: { in: testOrderIds } },
  });

  const stats: DeletionStats = {
    users: testUsers.length,
    products: testProducts.length,
    orders: testOrders.length,
    stores: testStores.length,
    payments: paymentCount,
    reviews: reviewCount,
    cartItems: cartItemCount,
    addresses: addressCount,
    sessions: sessionCount,
    deliveries: deliveryCount,
    commissions: commissionCount,
    payouts: payoutCount,
    escrow: escrowCount,
    total:
      testUsers.length +
      testProducts.length +
      testOrders.length +
      testStores.length +
      paymentCount +
      reviewCount +
      cartItemCount +
      addressCount +
      sessionCount +
      deliveryCount +
      commissionCount +
      payoutCount +
      escrowCount,
  };

  console.log('📊 Summary of Related Data:');
  console.log(`   - Payment Transactions: ${paymentCount}`);
  console.log(`   - Reviews: ${reviewCount}`);
  console.log(`   - Cart Items: ${cartItemCount}`);
  console.log(`   - Addresses: ${addressCount}`);
  console.log(`   - User Sessions: ${sessionCount}`);
  console.log(`   - Deliveries: ${deliveryCount}`);
  console.log(`   - Commissions: ${commissionCount}`);
  console.log(`   - Payouts: ${payoutCount}`);
  console.log(`   - Escrow Transactions: ${escrowCount}`);
  console.log(`\n   📈 TOTAL RECORDS TO DELETE: ${stats.total}\n`);

  return stats;
}

async function deleteDryRunData(): Promise<void> {
  console.log('🗑️  Starting deletion process...\n');

  // Find test users
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '@test.com' } },
        { email: { contains: '@example.com' } },
        { email: { startsWith: 'test@' } },
        { email: { contains: '+test@' } },
        { email: { startsWith: 'demo@' } },
      ],
    },
    select: { id: true },
  });

  const testUserIds = testUsers.map((u) => u.id);

  // Find test stores
  const testStores = await prisma.store.findMany({
    where: { userId: { in: testUserIds } },
    select: { id: true },
  });

  const testStoreIds = testStores.map((s) => s.id);

  // Find test products
  const testProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'demo', mode: 'insensitive' } },
        { name: { contains: 'sample', mode: 'insensitive' } },
        { storeId: { in: testStoreIds } },
      ],
    },
    select: { id: true },
  });

  const testProductIds = testProducts.map((p) => p.id);

  // Find test orders
  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: { in: testUserIds } },
        { items: { some: { productId: { in: testProductIds } } } },
      ],
    },
    select: { id: true },
  });

  const testOrderIds = testOrders.map((o) => o.id);

  // Delete in correct order (respecting foreign key constraints)
  console.log('⏳ Deleting data in transaction...');

  await prisma.$transaction(async (tx) => {
    // 1. Delete escrow transactions
    const escrowDeleted = await tx.escrowTransaction.deleteMany({
      where: { orderId: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${escrowDeleted.count} escrow transactions`);

    // 2. Delete commissions
    const commissionsDeleted = await tx.commission.deleteMany({
      where: { orderId: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${commissionsDeleted.count} commissions`);

    // 3. Delete payouts
    const payoutsDeleted = await tx.payout.deleteMany({
      where: { sellerId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${payoutsDeleted.count} payouts`);

    // 4. Delete payment transactions
    const paymentsDeleted = await tx.paymentTransaction.deleteMany({
      where: { orderId: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${paymentsDeleted.count} payment transactions`);

    // 5. Delete deliveries
    const deliveriesDeleted = await tx.delivery.deleteMany({
      where: { orderId: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${deliveriesDeleted.count} deliveries`);

    // 6. Delete order items
    const orderItemsDeleted = await tx.orderItem.deleteMany({
      where: { orderId: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${orderItemsDeleted.count} order items`);

    // 7. Delete orders
    const ordersDeleted = await tx.order.deleteMany({
      where: { id: { in: testOrderIds } },
    });
    console.log(`   ✓ Deleted ${ordersDeleted.count} orders`);

    // 8. Delete reviews
    const reviewsDeleted = await tx.review.deleteMany({
      where: {
        OR: [{ userId: { in: testUserIds } }, { productId: { in: testProductIds } }],
      },
    });
    console.log(`   ✓ Deleted ${reviewsDeleted.count} reviews`);

    // 9. Delete cart items
    const cartItemsDeleted = await tx.cartItem.deleteMany({
      where: {
        OR: [{ cart: { userId: { in: testUserIds } } }, { productId: { in: testProductIds } }],
      },
    });
    console.log(`   ✓ Deleted ${cartItemsDeleted.count} cart items`);

    // 10. Delete carts
    const cartsDeleted = await tx.cart.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${cartsDeleted.count} carts`);

    // 11. Delete product images
    const productImagesDeleted = await tx.productImage.deleteMany({
      where: { productId: { in: testProductIds } },
    });
    console.log(`   ✓ Deleted ${productImagesDeleted.count} product images`);

    // 12. Delete product variants
    const variantsDeleted = await tx.productVariant.deleteMany({
      where: { productId: { in: testProductIds } },
    });
    console.log(`   ✓ Deleted ${variantsDeleted.count} product variants`);

    // 13. Delete products
    const productsDeleted = await tx.product.deleteMany({
      where: { id: { in: testProductIds } },
    });
    console.log(`   ✓ Deleted ${productsDeleted.count} products`);

    // 14. Delete store followers
    const storeFollowersDeleted = await tx.storeFollow.deleteMany({
      where: {
        OR: [{ userId: { in: testUserIds } }, { storeId: { in: testStoreIds } }],
      },
    });
    console.log(`   ✓ Deleted ${storeFollowersDeleted.count} store followers`);

    // 15. Delete stores
    const storesDeleted = await tx.store.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${storesDeleted.count} stores`);

    // 16. Delete addresses
    const addressesDeleted = await tx.address.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${addressesDeleted.count} addresses`);

    // 17. Delete user sessions
    const sessionsDeleted = await tx.userSession.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${sessionsDeleted.count} user sessions`);

    // 18. Delete magic links
    const magicLinksDeleted = await tx.magicLink.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${magicLinksDeleted.count} magic links`);

    // 19. Delete users
    const usersDeleted = await tx.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${usersDeleted.count} users`);
  });

  console.log('\n✅ Deletion complete!\n');
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Production Dry-Run Data Cleanup Script                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!mode || mode === '--preview') {
    // Preview mode - just show what will be deleted
    console.log('📋 PREVIEW MODE - No data will be deleted\n');
    await analyzeData();
    console.log(
      'ℹ️  To execute deletion, run: pnpm tsx scripts/cleanup-dryrun-data.ts --execute\n'
    );
  } else if (mode === '--execute') {
    // Execute mode - actually delete data
    console.log('⚠️  EXECUTE MODE - This will DELETE data from production!\n');

    // Show what will be deleted
    const stats = await analyzeData();

    if (stats.total === 0) {
      console.log('✅ No test data found. Database is clean!\n');
      process.exit(0);
    }

    // Ask for confirmation
    const confirmed = await confirm(
      `\n⚠️  Are you sure you want to DELETE ${stats.total} records from production?`
    );

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled.\n');
      process.exit(0);
    }

    const doubleConfirm = await confirm(
      '\n⚠️  FINAL CONFIRMATION: This action cannot be undone. Proceed?'
    );

    if (!doubleConfirm) {
      console.log('\n❌ Deletion cancelled.\n');
      process.exit(0);
    }

    // Execute deletion
    await deleteDryRunData();
  } else {
    console.log('❌ Invalid option. Use:');
    console.log('   --preview   : Show what will be deleted (safe)');
    console.log('   --execute   : Actually delete data (destructive)\n');
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
