#!/usr/bin/env tsx
/**
 * Complete Database Reset Script
 * Deletes ALL user-generated data while preserving system settings
 *
 * Usage:
 *   pnpm tsx scripts/reset-all-data.ts --preview   # Show what will be deleted
 *   pnpm tsx scripts/reset-all-data.ts --execute   # Actually delete everything
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

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

async function previewData() {
  console.log('🔍 Analyzing current database...\n');

  const counts = {
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    payments: await prisma.paymentTransaction.count(),
    reviews: await prisma.review.count(),
    carts: await prisma.cart.count(),
    cartItems: await prisma.cartItem.count(),
    addresses: await prisma.address.count(),
    sessions: await prisma.userSession.count(),
    deliveries: await prisma.delivery.count(),
    commissions: await prisma.commission.count(),
    payouts: await prisma.payout.count(),
    escrow: await prisma.escrowTransaction.count(),
    productImages: await prisma.productImage.count(),
    productVariants: await prisma.productVariant.count(),
    storeFollows: await prisma.storeFollow.count(),
    magicLinks: await prisma.magicLink.count(),
    categories: await prisma.category.count(),
    systemSettings: await prisma.systemSetting.count(),
  };

  const total =
    counts.users +
    counts.stores +
    counts.products +
    counts.orders +
    counts.orderItems +
    counts.payments +
    counts.reviews +
    counts.carts +
    counts.cartItems +
    counts.addresses +
    counts.sessions +
    counts.deliveries +
    counts.commissions +
    counts.payouts +
    counts.escrow +
    counts.productImages +
    counts.productVariants +
    counts.storeFollows +
    counts.magicLinks +
    counts.categories;

  console.log('📊 WHAT WILL BE DELETED:\n');
  console.log('👥 Users & Auth:');
  console.log(`   ✓ ${counts.users} users`);
  console.log(`   ✓ ${counts.sessions} user sessions`);
  console.log(`   ✓ ${counts.addresses} addresses`);
  console.log(`   ✓ ${counts.magicLinks} magic links\n`);

  console.log('🏪 Stores & Products:');
  console.log(`   ✓ ${counts.stores} stores`);
  console.log(`   ✓ ${counts.storeFollows} store follows`);
  console.log(`   ✓ ${counts.products} products`);
  console.log(`   ✓ ${counts.productImages} product images`);
  console.log(`   ✓ ${counts.productVariants} product variants`);
  console.log(`   ✓ ${counts.categories} categories\n`);

  console.log('🛒 Orders & Shopping:');
  console.log(`   ✓ ${counts.orders} orders`);
  console.log(`   ✓ ${counts.orderItems} order items`);
  console.log(`   ✓ ${counts.carts} carts`);
  console.log(`   ✓ ${counts.cartItems} cart items\n`);

  console.log('💰 Payments & Financials:');
  console.log(`   ✓ ${counts.payments} payment transactions`);
  console.log(`   ✓ ${counts.commissions} commissions`);
  console.log(`   ✓ ${counts.payouts} payouts`);
  console.log(`   ✓ ${counts.escrow} escrow transactions\n`);

  console.log('📦 Other:');
  console.log(`   ✓ ${counts.reviews} reviews`);
  console.log(`   ✓ ${counts.deliveries} deliveries\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🗑️  TOTAL RECORDS TO DELETE: ${total}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✅ WHAT WILL BE PRESERVED:\n');
  console.log(`   ⚙️  ${counts.systemSettings} system settings (NEVER deleted)`);
  console.log('   ⚙️  Database schema and structure\n');

  return total;
}

async function deleteAllData() {
  console.log('🗑️  Starting complete database reset...\n');
  console.log('⏳ Deleting all user data in transaction...\n');

  await prisma.$transaction(
    async (tx) => {
      // 1. Delete escrow transactions
      const escrowDeleted = await tx.escrowTransaction.deleteMany({});
      console.log(`   ✓ Deleted ${escrowDeleted.count} escrow transactions`);

      // 2. Delete commissions
      const commissionsDeleted = await tx.commission.deleteMany({});
      console.log(`   ✓ Deleted ${commissionsDeleted.count} commissions`);

      // 3. Delete payouts
      const payoutsDeleted = await tx.payout.deleteMany({});
      console.log(`   ✓ Deleted ${payoutsDeleted.count} payouts`);

      // 4. Delete payment transactions
      const paymentsDeleted = await tx.paymentTransaction.deleteMany({});
      console.log(`   ✓ Deleted ${paymentsDeleted.count} payment transactions`);

      // 5. Delete deliveries
      const deliveriesDeleted = await tx.delivery.deleteMany({});
      console.log(`   ✓ Deleted ${deliveriesDeleted.count} deliveries`);

      // 6. Delete delivery confirmations
      const deliveryConfirmationsDeleted = await tx.deliveryConfirmation.deleteMany({});
      console.log(`   ✓ Deleted ${deliveryConfirmationsDeleted.count} delivery confirmations`);

      // 7. Delete seller shipments
      const shipmentItemsDeleted = await tx.shipmentItem.deleteMany({});
      console.log(`   ✓ Deleted ${shipmentItemsDeleted.count} shipment items`);

      const sellerShipmentsDeleted = await tx.sellerShipment.deleteMany({});
      console.log(`   ✓ Deleted ${sellerShipmentsDeleted.count} seller shipments`);

      // 8. Delete return requests
      const returnRequestsDeleted = await tx.returnRequest.deleteMany({});
      console.log(`   ✓ Deleted ${returnRequestsDeleted.count} return requests`);

      // 9. Delete order timeline
      const orderTimelineDeleted = await tx.orderTimeline.deleteMany({});
      console.log(`   ✓ Deleted ${orderTimelineDeleted.count} order timeline entries`);

      // 10. Delete order items
      const orderItemsDeleted = await tx.orderItem.deleteMany({});
      console.log(`   ✓ Deleted ${orderItemsDeleted.count} order items`);

      // 11. Delete orders
      const ordersDeleted = await tx.order.deleteMany({});
      console.log(`   ✓ Deleted ${ordersDeleted.count} orders`);

      // 12. Delete reviews
      const reviewsDeleted = await tx.review.deleteMany({});
      console.log(`   ✓ Deleted ${reviewsDeleted.count} reviews`);

      // 13. Delete product inquiries
      const inquiriesDeleted = await tx.productInquiry.deleteMany({});
      console.log(`   ✓ Deleted ${inquiriesDeleted.count} product inquiries`);

      // 14. Delete product views
      const viewsDeleted = await tx.productView.deleteMany({});
      console.log(`   ✓ Deleted ${viewsDeleted.count} product views`);

      // 15. Delete product likes
      const likesDeleted = await tx.productLike.deleteMany({});
      console.log(`   ✓ Deleted ${likesDeleted.count} product likes`);

      // 16. Delete product recommendations
      const recommendationsDeleted = await tx.productRecommendation.deleteMany({});
      console.log(`   ✓ Deleted ${recommendationsDeleted.count} product recommendations`);

      // 17. Delete cart items
      const cartItemsDeleted = await tx.cartItem.deleteMany({});
      console.log(`   ✓ Deleted ${cartItemsDeleted.count} cart items`);

      // 18. Delete carts
      const cartsDeleted = await tx.cart.deleteMany({});
      console.log(`   ✓ Deleted ${cartsDeleted.count} carts`);

      // 19. Delete inventory transactions
      const inventoryDeleted = await tx.inventoryTransaction.deleteMany({});
      console.log(`   ✓ Deleted ${inventoryDeleted.count} inventory transactions`);

      // 20. Delete product collections
      const productCollectionsDeleted = await tx.productCollection.deleteMany({});
      console.log(`   ✓ Deleted ${productCollectionsDeleted.count} product collections`);

      // 21. Delete product tags
      const productTagsDeleted = await tx.productTag.deleteMany({});
      console.log(`   ✓ Deleted ${productTagsDeleted.count} product tags`);

      // 22. Delete product images
      const productImagesDeleted = await tx.productImage.deleteMany({});
      console.log(`   ✓ Deleted ${productImagesDeleted.count} product images`);

      // 23. Delete product variants
      const variantsDeleted = await tx.productVariant.deleteMany({});
      console.log(`   ✓ Deleted ${variantsDeleted.count} product variants`);

      // 24. Delete products
      const productsDeleted = await tx.product.deleteMany({});
      console.log(`   ✓ Deleted ${productsDeleted.count} products`);

      // 25. Delete collections
      const collectionsDeleted = await tx.collection.deleteMany({});
      console.log(`   ✓ Deleted ${collectionsDeleted.count} collections`);

      // 26. Delete categories
      const categoriesDeleted = await tx.category.deleteMany({});
      console.log(`   ✓ Deleted ${categoriesDeleted.count} categories`);

      // 27. Delete store follows
      const storeFollowsDeleted = await tx.storeFollow.deleteMany({});
      console.log(`   ✓ Deleted ${storeFollowsDeleted.count} store follows`);

      // 28. Delete seller credit transactions
      const creditTransactionsDeleted = await tx.sellerCreditTransaction.deleteMany({});
      console.log(`   ✓ Deleted ${creditTransactionsDeleted.count} seller credit transactions`);

      // 29. Delete stores
      const storesDeleted = await tx.store.deleteMany({});
      console.log(`   ✓ Deleted ${storesDeleted.count} stores`);

      // 30. Delete addresses
      const addressesDeleted = await tx.address.deleteMany({});
      console.log(`   ✓ Deleted ${addressesDeleted.count} addresses`);

      // 31. Delete user sessions
      const sessionsDeleted = await tx.userSession.deleteMany({});
      console.log(`   ✓ Deleted ${sessionsDeleted.count} user sessions`);

      // 32. Delete magic links
      const magicLinksDeleted = await tx.magicLink.deleteMany({});
      console.log(`   ✓ Deleted ${magicLinksDeleted.count} magic links`);

      // 33. Delete password reset tokens
      const passwordResetsDeleted = await tx.passwordResetToken.deleteMany({});
      console.log(`   ✓ Deleted ${passwordResetsDeleted.count} password reset tokens`);

      // 34. Delete email verification tokens
      const emailVerificationsDeleted = await tx.emailVerificationToken.deleteMany({});
      console.log(`   ✓ Deleted ${emailVerificationsDeleted.count} email verification tokens`);

      // 35. Delete saved payment methods
      const savedPaymentMethodsDeleted = await tx.savedPaymentMethod.deleteMany({});
      console.log(`   ✓ Deleted ${savedPaymentMethodsDeleted.count} saved payment methods`);

      // 36. Delete users
      const usersDeleted = await tx.user.deleteMany({});
      console.log(`   ✓ Deleted ${usersDeleted.count} users`);

      console.log('\n✅ Database reset complete!\n');
    },
    {
      timeout: 60000, // 60 seconds timeout for large deletions
    }
  );
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Complete Database Reset Script                    ║');
  console.log('║     ⚠️  DELETES ALL USER DATA - USE WITH CAUTION          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!mode || mode === '--preview') {
    // Preview mode
    console.log('📋 PREVIEW MODE - No data will be deleted\n');
    const total = await previewData();

    if (total === 0) {
      console.log('✅ Database is already empty!\n');
    } else {
      console.log('ℹ️  To execute deletion, run: pnpm tsx scripts/reset-all-data.ts --execute\n');
    }
  } else if (mode === '--execute') {
    // Execute mode
    console.log('⚠️  EXECUTE MODE - This will DELETE ALL DATA from production!\n');

    const total = await previewData();

    if (total === 0) {
      console.log('✅ Database is already empty. Nothing to delete!\n');
      process.exit(0);
    }

    // Triple confirmation for safety
    const confirmed1 = await confirm(
      `\n⚠️  Are you sure you want to DELETE ALL ${total} records from production?`
    );
    if (!confirmed1) {
      console.log('\n❌ Reset cancelled.\n');
      process.exit(0);
    }

    const confirmed2 = await confirm(
      '\n⚠️  SECOND CONFIRMATION: This will delete ALL users, products, orders, and transactions. Continue?'
    );
    if (!confirmed2) {
      console.log('\n❌ Reset cancelled.\n');
      process.exit(0);
    }

    const confirmed3 = await confirm(
      '\n⚠️  FINAL CONFIRMATION: Type "yes" to proceed with COMPLETE DATABASE RESET'
    );
    if (!confirmed3) {
      console.log('\n❌ Reset cancelled.\n');
      process.exit(0);
    }

    // Execute deletion
    await deleteAllData();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Database has been completely reset!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Run seed script if needed: pnpm prisma db seed');
    console.log('   2. Create your first admin user');
    console.log('   3. Configure system settings');
    console.log('═══════════════════════════════════════════════════════════\n');
  } else {
    console.log('❌ Invalid option. Use:');
    console.log('   --preview   : Show what will be deleted (safe)');
    console.log('   --execute   : Actually delete ALL data (destructive)\n');
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
