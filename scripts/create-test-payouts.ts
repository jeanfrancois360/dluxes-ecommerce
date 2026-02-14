/**
 * Create Test Payouts Script
 *
 * This script creates test data for the payout system:
 * 1. Creates test orders
 * 2. Creates commissions
 * 3. Creates escrow transactions
 * 4. Triggers payout generation
 *
 * Usage: npx ts-node scripts/create-test-payouts.ts
 */

import {
  PrismaClient,
  OrderStatus,
  CommissionStatus,
  EscrowStatus,
  PayoutStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function createTestPayouts() {
  console.log('🚀 Creating test payout data...\n');

  try {
    // 1. Find or create a test seller
    console.log('📍 Step 1: Finding test seller...');
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      include: { stores: true },
    });

    if (!seller || !seller.stores[0]) {
      console.error('❌ No seller found. Please create a seller account first.');
      process.exit(1);
    }

    const store = seller.stores[0];
    console.log(`✅ Found seller: ${seller.email} (Store: ${store.name})\n`);

    // 2. Find or create a test buyer
    console.log('📍 Step 2: Finding test buyer...');
    let buyer = await prisma.user.findFirst({
      where: { role: 'BUYER' },
    });

    if (!buyer) {
      console.log('Creating test buyer...');
      buyer = await prisma.user.create({
        data: {
          email: `testbuyer${Date.now()}@test.com`,
          firstName: 'Test',
          lastName: 'Buyer',
          role: 'BUYER',
          emailVerified: true,
        },
      });
    }
    console.log(`✅ Buyer: ${buyer.email}\n`);

    // 3. Find a product
    console.log('📍 Step 3: Finding test product...');
    const product = await prisma.product.findFirst({
      where: { storeId: store.id },
    });

    if (!product) {
      console.error('❌ No product found. Please create a product first.');
      process.exit(1);
    }
    console.log(`✅ Product: ${product.name}\n`);

    // 4. Create shipping address
    console.log('📍 Step 4: Creating shipping address...');
    const shippingAddress = await prisma.address.create({
      data: {
        userId: buyer.id,
        firstName: 'Test',
        lastName: 'Buyer',
        address1: '123 Test St',
        city: 'Brussels',
        province: 'Brussels',
        postalCode: '1000',
        country: 'Belgium',
        phone: '+32123456789',
        isDefault: true,
      },
    });
    console.log(`✅ Shipping address created\n`);

    // 5. Create test order
    console.log('📍 Step 5: Creating test order...');
    const orderNumber = `TEST-${Date.now()}`;
    const productPrice = Number(product.price);
    const quantity = 2;
    const subtotal = productPrice * quantity;
    const tax = subtotal * 0.21; // 21% VAT
    const shipping = 9.99;
    const total = subtotal + tax + shipping;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: buyer.id,
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        shipping: new Decimal(shipping),
        total: new Decimal(total),
        currency: 'USD',
        status: OrderStatus.DELIVERED, // Mark as delivered immediately
        shippingAddressId: shippingAddress.id,
        billingAddressId: shippingAddress.id,
        items: {
          create: [
            {
              productId: product.id,
              quantity,
              price: new Decimal(productPrice),
              total: new Decimal(subtotal),
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
    console.log(`✅ Order created: ${order.orderNumber} ($${total.toFixed(2)})\n`);

    // 6. Create commission
    console.log('📍 Step 6: Creating commission...');
    const platformCommissionRate = 0.1; // 10%
    const commissionAmount = subtotal * platformCommissionRate;
    const sellerAmount = subtotal - commissionAmount;

    const commission = await prisma.commission.create({
      data: {
        orderId: order.id,
        sellerId: seller.id,
        orderAmount: new Decimal(subtotal),
        commissionRate: new Decimal(platformCommissionRate),
        commissionAmount: new Decimal(commissionAmount),
        sellerAmount: new Decimal(sellerAmount),
        currency: 'USD',
        status: CommissionStatus.CONFIRMED,
        paidOut: false,
      },
    });
    console.log(
      `✅ Commission: $${commissionAmount.toFixed(2)} (Seller gets: $${sellerAmount.toFixed(2)})\n`
    );

    // 7. Create escrow transaction
    console.log('📍 Step 7: Creating escrow transaction...');
    const escrow = await prisma.escrowTransaction.create({
      data: {
        orderId: order.id,
        sellerId: seller.id,
        amount: new Decimal(sellerAmount),
        sellerAmount: new Decimal(sellerAmount),
        platformFee: new Decimal(commissionAmount),
        currency: 'USD',
        status: EscrowStatus.RELEASED, // Released immediately for testing
        holdUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (already past hold period)
        releasedAt: new Date(),
      },
    });
    console.log(`✅ Escrow released: $${sellerAmount.toFixed(2)}\n`);

    // 8. Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`Seller: ${seller.email}`);
    console.log(`Store: ${store.name}`);
    console.log(`Order: ${order.orderNumber}`);
    console.log(`Order Total: $${total.toFixed(2)}`);
    console.log(`Commission: $${commissionAmount.toFixed(2)}`);
    console.log(`Seller Amount: $${sellerAmount.toFixed(2)}`);
    console.log(`Status: ✅ Ready for payout`);
    console.log('═══════════════════════════════════════\n');

    console.log('📍 Next Steps:');
    console.log('1. Go to Admin Portal → Payouts');
    console.log('2. Click "PROCESS ALL PAYOUTS"');
    console.log('3. You should see a new payout for this seller\n');

    console.log(`💰 Expected Payout Amount: $${sellerAmount.toFixed(2)}\n`);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestPayouts()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
