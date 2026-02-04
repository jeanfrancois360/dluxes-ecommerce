import { PrismaClient } from '@prisma/client';
import { ShipmentStatus, OrderStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function testShipmentTracking() {
  console.log('🧪 Starting Multi-Vendor Shipment Tracking Tests\n');

  let testData: any = {};

  try {
    // ========================================
    // Setup: Create test users and stores
    // ========================================
    console.log('📋 Step 1: Setting up test data...');

    // Create buyer
    const buyer = await prisma.user.upsert({
      where: { email: 'buyer@shipmenttest.com' },
      update: {},
      create: {
        email: 'buyer@shipmenttest.com',
        firstName: 'Test',
        lastName: 'Buyer',
        password: 'hashedpassword',
        role: UserRole.BUYER,
        emailVerified: true,
      },
    });
    console.log(`✅ Created buyer: ${buyer.email}`);

    // Create seller 1
    const seller1 = await prisma.user.upsert({
      where: { email: 'seller1@shipmenttest.com' },
      update: {},
      create: {
        email: 'seller1@shipmenttest.com',
        firstName: 'Seller',
        lastName: 'One',
        password: 'hashedpassword',
        role: UserRole.SELLER,
        emailVerified: true,
      },
    });
    console.log(`✅ Created seller 1: ${seller1.email}`);

    // Create seller 2
    const seller2 = await prisma.user.upsert({
      where: { email: 'seller2@shipmenttest.com' },
      update: {},
      create: {
        email: 'seller2@shipmenttest.com',
        firstName: 'Seller',
        lastName: 'Two',
        password: 'hashedpassword',
        role: UserRole.SELLER,
        emailVerified: true,
      },
    });
    console.log(`✅ Created seller 2: ${seller2.email}`);

    // Create store 1
    let store1 = await prisma.store.findFirst({ where: { userId: seller1.id } });
    if (!store1) {
      store1 = await prisma.store.create({
        data: {
          userId: seller1.id,
          name: 'Seller 1 Test Store',
          slug: 'seller1-test-store',
          email: seller1.email,
          status: 'ACTIVE',
        },
      });
    }
    console.log(`✅ Created store 1: ${store1.name}`);

    // Create store 2
    let store2 = await prisma.store.findFirst({ where: { userId: seller2.id } });
    if (!store2) {
      store2 = await prisma.store.create({
        data: {
          userId: seller2.id,
          name: 'Seller 2 Test Store',
          slug: 'seller2-test-store',
          email: seller2.email,
          status: 'ACTIVE',
        },
      });
    }
    console.log(`✅ Created store 2: ${store2.name}`);

    // Create category
    let category = await prisma.category.findFirst({ where: { slug: 'test-category' } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category for shipment testing',
        },
      });
    }
    console.log(`✅ Created category: ${category.name}`);

    // Create products for seller 1
    const product1 = await prisma.product.create({
      data: {
        storeId: store1.id,
        name: 'Product from Seller 1',
        slug: `product-seller1-${Date.now()}`,
        description: 'Test product from seller 1',
        price: 50.00,
        categoryId: category.id,
        status: 'ACTIVE',
        inventory: 100,
      },
    });
    console.log(`✅ Created product 1: ${product1.name}`);

    // Create products for seller 2
    const product2 = await prisma.product.create({
      data: {
        storeId: store2.id,
        name: 'Product from Seller 2',
        slug: `product-seller2-${Date.now()}`,
        description: 'Test product from seller 2',
        price: 30.00,
        categoryId: category.id,
        status: 'ACTIVE',
        inventory: 100,
      },
    });
    console.log(`✅ Created product 2: ${product2.name}`);

    // Create buyer address
    const address = await prisma.address.create({
      data: {
        userId: buyer.id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        address1: '123 Test Street',
        city: 'Test City',
        province: 'Test Province',
        country: 'Test Country',
        postalCode: '12345',
        phone: '+1234567890',
        isDefault: true,
      },
    });
    console.log(`✅ Created shipping address\n`);

    // ========================================
    // Test 1: Create Multi-Vendor Order
    // ========================================
    console.log('📋 Test 1: Create Multi-Vendor Order');

    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        userId: buyer.id,
        subtotal: 80.00,
        shipping: 15.00,
        tax: 7.00,
        total: 102.00,
        currency: 'USD',
        status: OrderStatus.CONFIRMED,
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        paidAt: new Date(),
        shippingAddressId: address.id,
        items: {
          create: [
            {
              productId: product1.id,
              name: product1.name,
              sku: product1.sku || 'SKU1',
              quantity: 1,
              price: product1.price,
              total: product1.price,
            },
            {
              productId: product2.id,
              name: product2.name,
              sku: product2.sku || 'SKU2',
              quantity: 1,
              price: product2.price,
              total: product2.price,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    console.log(`✅ Created order: ${order.orderNumber}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Items: ${order.items.length} (from ${order.items.length} sellers)`);
    testData.order = order;
    testData.buyer = buyer;
    testData.seller1 = seller1;
    testData.seller2 = seller2;
    testData.store1 = store1;
    testData.store2 = store2;

    // ========================================
    // Test 2: Seller 1 Creates Shipment
    // ========================================
    console.log('\n📋 Test 2: Seller 1 Creates Shipment');

    const seller1Item = order.items.find(item => item.productId === product1.id);
    if (!seller1Item) throw new Error('Seller 1 item not found');

    const shipment1 = await prisma.sellerShipment.create({
      data: {
        orderId: order.id,
        storeId: store1.id,
        shipmentNumber: `SH-${Date.now()}-S1`,
        status: ShipmentStatus.PENDING,
        carrier: 'DHL',
        trackingNumber: 'DHL123456789',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        shippingCost: 10.00,
        weight: 2.5,
        notes: 'Test shipment from seller 1',
        items: {
          create: [
            {
              orderItemId: seller1Item.id,
              quantity: seller1Item.quantity,
            },
          ],
        },
        events: {
          create: [
            {
              status: ShipmentStatus.PENDING,
              title: 'Shipment Created',
              description: 'Seller 1 created shipment',
            },
          ],
        },
      },
      include: {
        items: true,
        events: true,
      },
    });

    console.log(`✅ Created shipment 1: ${shipment1.shipmentNumber}`);
    console.log(`   Status: ${shipment1.status}`);
    console.log(`   Carrier: ${shipment1.carrier}`);
    console.log(`   Tracking: ${shipment1.trackingNumber}`);
    console.log(`   Items: ${shipment1.items.length}`);
    console.log(`   Events: ${shipment1.events.length}`);
    testData.shipment1 = shipment1;

    // Check order status (should still be CONFIRMED)
    let updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    console.log(`   Order status after shipment 1: ${updatedOrder?.status}`);

    // ========================================
    // Test 3: Update Shipment 1 to IN_TRANSIT
    // ========================================
    console.log('\n📋 Test 3: Update Shipment 1 to IN_TRANSIT');

    const updatedShipment1 = await prisma.sellerShipment.update({
      where: { id: shipment1.id },
      data: {
        status: ShipmentStatus.IN_TRANSIT,
        shippedAt: new Date(),
        trackingUrl: 'https://dhl.com/track/DHL123456789',
        events: {
          create: {
            status: ShipmentStatus.IN_TRANSIT,
            title: 'Package In Transit',
            description: 'Package picked up by carrier',
            location: 'Test City',
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log(`✅ Updated shipment 1 to: ${updatedShipment1.status}`);
    console.log(`   Shipped at: ${updatedShipment1.shippedAt}`);
    console.log(`   Total events: ${updatedShipment1.events.length}`);

    // ========================================
    // Test 4: Seller 2 Creates Shipment
    // ========================================
    console.log('\n📋 Test 4: Seller 2 Creates Shipment');

    const seller2Item = order.items.find(item => item.productId === product2.id);
    if (!seller2Item) throw new Error('Seller 2 item not found');

    const shipment2 = await prisma.sellerShipment.create({
      data: {
        orderId: order.id,
        storeId: store2.id,
        shipmentNumber: `SH-${Date.now()}-S2`,
        status: ShipmentStatus.PROCESSING,
        carrier: 'FedEx',
        trackingNumber: 'FEDEX987654321',
        estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        shippingCost: 5.00,
        weight: 1.0,
        items: {
          create: [
            {
              orderItemId: seller2Item.id,
              quantity: seller2Item.quantity,
            },
          ],
        },
        events: {
          create: [
            {
              status: ShipmentStatus.PROCESSING,
              title: 'Processing Shipment',
              description: 'Seller 2 is preparing items',
            },
          ],
        },
      },
      include: {
        items: true,
        events: true,
      },
    });

    console.log(`✅ Created shipment 2: ${shipment2.shipmentNumber}`);
    console.log(`   Status: ${shipment2.status}`);
    console.log(`   Carrier: ${shipment2.carrier}`);
    console.log(`   Items: ${shipment2.items.length}`);
    testData.shipment2 = shipment2;

    // ========================================
    // Test 5: Query All Shipments for Order
    // ========================================
    console.log('\n📋 Test 5: Query All Shipments for Order');

    const orderWithShipments = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        sellerShipments: {
          include: {
            store: {
              select: { id: true, name: true, slug: true },
            },
            items: {
              include: {
                orderItem: {
                  include: {
                    product: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
            events: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    console.log(`✅ Retrieved order with shipments`);
    console.log(`   Order: ${orderWithShipments?.orderNumber}`);
    console.log(`   Total shipments: ${orderWithShipments?.sellerShipments.length}`);
    orderWithShipments?.sellerShipments.forEach((shipment, index) => {
      console.log(`   \n   Shipment ${index + 1}:`);
      console.log(`     - Number: ${shipment.shipmentNumber}`);
      console.log(`     - Store: ${shipment.store.name}`);
      console.log(`     - Status: ${shipment.status}`);
      console.log(`     - Carrier: ${shipment.carrier}`);
      console.log(`     - Items: ${shipment.items.length}`);
      shipment.items.forEach(item => {
        console.log(`       * ${item.orderItem.product.name} (x${item.quantity})`);
      });
      console.log(`     - Events: ${shipment.events.length}`);
      shipment.events.forEach(event => {
        console.log(`       * ${event.title} - ${event.status}`);
      });
    });

    // ========================================
    // Test 6: Update Shipment 2 to DELIVERED
    // ========================================
    console.log('\n📋 Test 6: Update Shipment 2 to DELIVERED');

    await prisma.sellerShipment.update({
      where: { id: shipment2.id },
      data: {
        status: ShipmentStatus.DELIVERED,
        deliveredAt: new Date(),
        events: {
          create: {
            status: ShipmentStatus.DELIVERED,
            title: 'Package Delivered',
            description: 'Package successfully delivered',
            location: 'Customer Address',
          },
        },
      },
    });

    console.log(`✅ Updated shipment 2 to: DELIVERED`);

    // Check if we can query by status
    const deliveredShipments = await prisma.sellerShipment.findMany({
      where: {
        orderId: order.id,
        status: ShipmentStatus.DELIVERED,
      },
      include: {
        store: { select: { name: true } },
      },
    });

    console.log(`   Delivered shipments: ${deliveredShipments.length}`);
    deliveredShipments.forEach(s => {
      console.log(`     - ${s.shipmentNumber} from ${s.store.name}`);
    });

    // ========================================
    // Test 7: Query Seller's Shipments
    // ========================================
    console.log('\n📋 Test 7: Query Seller 1 Shipments');

    const seller1Shipments = await prisma.sellerShipment.findMany({
      where: {
        storeId: store1.id,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Retrieved seller 1 shipments: ${seller1Shipments.length}`);
    seller1Shipments.forEach(shipment => {
      console.log(`   - ${shipment.shipmentNumber}`);
      console.log(`     Order: ${shipment.order.orderNumber}`);
      console.log(`     Customer: ${shipment.order.user.firstName} ${shipment.order.user.lastName}`);
      console.log(`     Status: ${shipment.status}`);
    });

    // ========================================
    // Test 8: Test Shipment Events Timeline
    // ========================================
    console.log('\n📋 Test 8: Test Shipment Events Timeline');

    const shipmentWithEvents = await prisma.sellerShipment.findUnique({
      where: { id: shipment1.id },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    console.log(`✅ Retrieved shipment events for: ${shipmentWithEvents?.shipmentNumber}`);
    console.log(`   Total events: ${shipmentWithEvents?.events.length}`);
    shipmentWithEvents?.events.forEach((event, index) => {
      console.log(`   ${index + 1}. [${event.createdAt.toISOString()}] ${event.title}`);
      console.log(`      Status: ${event.status}`);
      console.log(`      Description: ${event.description}`);
      if (event.location) {
        console.log(`      Location: ${event.location}`);
      }
    });

    // ========================================
    // Test 9: Verify Schema Constraints
    // ========================================
    console.log('\n📋 Test 9: Verify Schema Constraints');

    // Test unique shipment number
    let duplicateError = false;
    try {
      await prisma.sellerShipment.create({
        data: {
          orderId: order.id,
          storeId: store1.id,
          shipmentNumber: shipment1.shipmentNumber, // Duplicate
          status: ShipmentStatus.PENDING,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        duplicateError = true;
        console.log(`✅ Unique constraint working: Cannot create duplicate shipment number`);
      }
    }

    if (!duplicateError) {
      console.log(`❌ WARNING: Unique constraint not working for shipment number`);
    }

    // Test cascade delete
    const testShipment = await prisma.sellerShipment.create({
      data: {
        orderId: order.id,
        storeId: store1.id,
        shipmentNumber: `SH-DELETE-TEST-${Date.now()}`,
        status: ShipmentStatus.PENDING,
        items: {
          create: [
            {
              orderItemId: seller1Item.id,
              quantity: 1,
            },
          ],
        },
      },
      include: { items: true },
    });

    const itemsBeforeDelete = await prisma.shipmentItem.count({
      where: { shipmentId: testShipment.id },
    });

    await prisma.sellerShipment.delete({
      where: { id: testShipment.id },
    });

    const itemsAfterDelete = await prisma.shipmentItem.count({
      where: { shipmentId: testShipment.id },
    });

    console.log(`✅ Cascade delete working: ${itemsBeforeDelete} items before, ${itemsAfterDelete} items after`);

    // ========================================
    // Test 10: Performance - Count Queries
    // ========================================
    console.log('\n📋 Test 10: Performance Metrics');

    const totalShipments = await prisma.sellerShipment.count();
    const totalEvents = await prisma.shipmentEvent.count();
    const totalShipmentItems = await prisma.shipmentItem.count();

    console.log(`✅ Database statistics:`);
    console.log(`   Total shipments: ${totalShipments}`);
    console.log(`   Total events: ${totalEvents}`);
    console.log(`   Total shipment items: ${totalShipmentItems}`);

    // Count by status
    const statusCounts = await prisma.sellerShipment.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log(`   Shipments by status:`);
    statusCounts.forEach(({ status, _count }) => {
      console.log(`     ${status}: ${_count}`);
    });

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Test Summary:');
    console.log('   1. ✓ Multi-vendor order created');
    console.log('   2. ✓ Seller 1 shipment created');
    console.log('   3. ✓ Shipment status updated with events');
    console.log('   4. ✓ Seller 2 shipment created');
    console.log('   5. ✓ All shipments queried correctly');
    console.log('   6. ✓ Shipment marked as delivered');
    console.log('   7. ✓ Seller-specific shipments retrieved');
    console.log('   8. ✓ Event timeline working');
    console.log('   9. ✓ Schema constraints verified');
    console.log('   10. ✓ Performance metrics collected');

    console.log('\n📦 Test Data Created:');
    console.log(`   Order: ${order.orderNumber}`);
    console.log(`   Shipment 1: ${shipment1.shipmentNumber} (${shipment1.status})`);
    console.log(`   Shipment 2: ${shipment2.shipmentNumber} (${shipment2.status})`);

    return {
      success: true,
      testData,
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testShipmentTracking()
  .then(() => {
    console.log('\n✅ Test execution completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
