#!/usr/bin/env tsx
/**
 * Analyze ALL data in production database
 * Shows complete inventory of what exists
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeAllData() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Production Database Full Analysis                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Count all data
  const userCount = await prisma.user.count();
  const storeCount = await prisma.store.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();
  const paymentCount = await prisma.paymentTransaction.count();
  const reviewCount = await prisma.review.count();
  const cartCount = await prisma.cart.count();
  const cartItemCount = await prisma.cartItem.count();
  const addressCount = await prisma.address.count();
  const sessionCount = await prisma.userSession.count();
  const deliveryCount = await prisma.delivery.count();
  const commissionCount = await prisma.commission.count();
  const payoutCount = await prisma.payout.count();
  const escrowCount = await prisma.escrowTransaction.count();
  const categoryCount = await prisma.category.count();
  const settingsCount = await prisma.systemSetting.count();

  console.log('📊 COMPLETE DATABASE INVENTORY:\n');
  console.log('👥 USERS & AUTHENTICATION:');
  console.log(`   - Users: ${userCount}`);
  console.log(`   - User Sessions: ${sessionCount}`);
  console.log(`   - Addresses: ${addressCount}\n`);

  console.log('🏪 STORES & PRODUCTS:');
  console.log(`   - Stores: ${storeCount}`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Categories: ${categoryCount}\n`);

  console.log('🛒 ORDERS & SHOPPING:');
  console.log(`   - Orders: ${orderCount}`);
  console.log(`   - Order Items: ${orderItemCount}`);
  console.log(`   - Carts: ${cartCount}`);
  console.log(`   - Cart Items: ${cartItemCount}\n`);

  console.log('💰 PAYMENTS & FINANCIALS:');
  console.log(`   - Payment Transactions: ${paymentCount}`);
  console.log(`   - Commissions: ${commissionCount}`);
  console.log(`   - Payouts: ${payoutCount}`);
  console.log(`   - Escrow Transactions: ${escrowCount}\n`);

  console.log('📦 OTHER:');
  console.log(`   - Reviews: ${reviewCount}`);
  console.log(`   - Deliveries: ${deliveryCount}\n`);

  console.log('⚙️  SYSTEM:');
  console.log(`   - System Settings: ${settingsCount} (NEVER deleted)\n`);

  // Show sample users
  console.log('👥 ALL USERS:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (users.length === 0) {
    console.log('   (none)\n');
  } else {
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.role}) - Created: ${user.createdAt.toISOString()}`);
    });
    console.log();
  }

  // Show sample products
  console.log('📦 ALL PRODUCTS:');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (products.length === 0) {
    console.log('   (none)\n');
  } else {
    products.forEach((product) => {
      console.log(
        `   - ${product.name} ($${product.price}) - ${product.status} - Created: ${product.createdAt.toISOString()}`
      );
    });
    if (productCount > 20) {
      console.log(`   ... and ${productCount - 20} more\n`);
    } else {
      console.log();
    }
  }

  // Show all orders
  console.log('🛒 ALL ORDERS:');
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) {
    console.log('   (none)\n');
  } else {
    orders.forEach((order) => {
      console.log(
        `   - Order #${order.orderNumber} - $${order.total} - ${order.status} / ${order.paymentStatus} - User: ${order.user.email} - Created: ${order.createdAt.toISOString()}`
      );
    });
    console.log();
  }

  // Calculate total user-generated data (excluding system settings)
  const totalUserData =
    userCount +
    storeCount +
    productCount +
    orderCount +
    orderItemCount +
    paymentCount +
    reviewCount +
    cartCount +
    cartItemCount +
    addressCount +
    sessionCount +
    deliveryCount +
    commissionCount +
    payoutCount +
    escrowCount;

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📈 TOTAL USER-GENERATED RECORDS: ${totalUserData}`);
  console.log(`⚙️  SYSTEM SETTINGS (preserved): ${settingsCount}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

analyzeAllData().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
