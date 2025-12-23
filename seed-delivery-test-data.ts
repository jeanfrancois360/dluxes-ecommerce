import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDeliveryTestData() {
  console.log('🚚 Seeding Delivery Test Data...\n');

  try {
    // 1. Create Delivery Providers
    console.log('📦 Creating Delivery Providers...');

    const fedex = await prisma.deliveryProvider.upsert({
      where: { slug: 'fedex-international' },
      update: {},
      create: {
        name: 'FedEx International',
        slug: 'fedex-international',
        type: 'API_INTEGRATED',
        contactEmail: 'support@fedex.com',
        contactPhone: '+1-800-463-3339',
        website: 'https://www.fedex.com',
        countries: ['US', 'CA', 'GB', 'DE', 'FR', 'RW', 'KE', 'UG'],
        apiEnabled: true,
        apiEndpoint: 'https://apis.fedex.com/track/v1',
        commissionType: 'PERCENTAGE',
        commissionRate: 12.5,
        isActive: true,
        verificationStatus: 'VERIFIED',
      },
    });
    console.log(`✅ Created: ${fedex.name}`);

    const dhl = await prisma.deliveryProvider.upsert({
      where: { slug: 'dhl-express' },
      update: {},
      create: {
        name: 'DHL Express',
        slug: 'dhl-express',
        type: 'API_INTEGRATED',
        contactEmail: 'customer.service@dhl.com',
        contactPhone: '+1-800-225-5345',
        website: 'https://www.dhl.com',
        countries: ['US', 'CA', 'GB', 'DE', 'FR', 'RW', 'KE', 'UG', 'TZ'],
        apiEnabled: true,
        apiEndpoint: 'https://api.dhl.com/track/shipments',
        commissionType: 'PERCENTAGE',
        commissionRate: 10.0,
        isActive: true,
        verificationStatus: 'VERIFIED',
      },
    });
    console.log(`✅ Created: ${dhl.name}`);

    const ups = await prisma.deliveryProvider.upsert({
      where: { slug: 'ups-worldwide' },
      update: {},
      create: {
        name: 'UPS Worldwide',
        slug: 'ups-worldwide',
        type: 'API_INTEGRATED',
        contactEmail: 'support@ups.com',
        contactPhone: '+1-800-742-5877',
        website: 'https://www.ups.com',
        countries: ['US', 'CA', 'GB', 'DE', 'FR'],
        apiEnabled: true,
        apiEndpoint: 'https://onlinetools.ups.com/track/v1/details',
        commissionType: 'PERCENTAGE',
        commissionRate: 11.0,
        isActive: true,
        verificationStatus: 'VERIFIED',
      },
    });
    console.log(`✅ Created: ${ups.name}`);

    const localCourier = await prisma.deliveryProvider.upsert({
      where: { slug: 'nextpik-express' },
      update: {},
      create: {
        name: 'NextPik Express',
        slug: 'nextpik-express',
        type: 'PARTNER',
        contactEmail: 'dispatch@nextpik.com',
        contactPhone: '+250-788-123-456',
        website: 'https://nextpik.com/delivery',
        countries: ['RW', 'KE', 'UG', 'TZ', 'BI'],
        apiEnabled: false,
        commissionType: 'FIXED',
        commissionRate: 5.0,
        isActive: true,
        verificationStatus: 'VERIFIED',
      },
    });
    console.log(`✅ Created: ${localCourier.name}\n`);

    // 2. Create Delivery Partner User
    console.log('👤 Creating Delivery Partner User...');
    const hashedPassword = await bcrypt.hash('DeliveryTest@123', 10);

    const deliveryPartner = await prisma.user.upsert({
      where: { email: 'delivery-partner@test.com' },
      update: {},
      create: {
        email: 'delivery-partner@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Delivery',
        role: 'DELIVERY_PARTNER',
        phone: '+250788123456',
        emailVerified: true,
        isActive: true,
        deliveryProviderId: localCourier.id,
      },
    });
    console.log(`✅ Created Delivery Partner: ${deliveryPartner.email}\n`);

    // 3. Find an existing order to add delivery tracking
    console.log('📋 Finding existing orders...');
    const existingOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'],
        },
        delivery: null, // Orders without delivery yet
      },
      take: 3,
      include: {
        user: true,
        shippingAddress: true,
      },
    });

    if (existingOrders.length === 0) {
      console.log('⚠️  No suitable orders found. Creating a test order...');

      // Find a test buyer
      const buyer = await prisma.user.findFirst({
        where: {
          role: 'BUYER',
        },
      });

      if (!buyer) {
        console.log('❌ No buyer found. Please run the main seed first.');
        return;
      }

      // Find or create buyer's address
      let address = await prisma.address.findFirst({
        where: { userId: buyer.id },
      });

      if (!address) {
        console.log('⚠️  Creating address for buyer...');
        address = await prisma.address.create({
          data: {
            userId: buyer.id,
            firstName: buyer.firstName || 'John',
            lastName: buyer.lastName || 'Doe',
            address1: '123 Main Street',
            city: 'Kigali',
            province: 'Kigali City',
            postalCode: '00000',
            country: 'Rwanda',
            phone: buyer.phone || '+250788123456',
            isDefault: true,
          },
        });
        console.log(`✅ Created address for ${buyer.email}\n`);
      }

      // Create a test order
      const product = await prisma.product.findFirst();
      if (!product) {
        console.log('❌ No products found.');
        return;
      }

      const testOrder = await prisma.order.create({
        data: {
          orderNumber: `TEST-DEL-${Date.now()}`,
          userId: buyer.id,
          subtotal: product.price,
          shipping: 15.00,
          tax: 0,
          total: Number(product.price) + 15.00,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'CREDIT_CARD',
          shippingAddressId: address.id,
          items: {
            create: {
              productId: product.id,
              name: product.name,
              sku: product.sku,
              quantity: 1,
              price: product.price,
              total: product.price,
              image: product.heroImage,
            },
          },
          timeline: {
            create: [
              {
                status: 'PENDING',
                title: 'Order Placed',
                description: 'Your order has been received.',
                icon: 'shopping-bag',
              },
              {
                status: 'CONFIRMED',
                title: 'Order Confirmed',
                description: 'Your order has been confirmed.',
                icon: 'check-circle',
              },
            ],
          },
        },
        include: {
          shippingAddress: true,
        },
      });

      existingOrders.push(testOrder as any);
      console.log(`✅ Created test order: ${testOrder.orderNumber}\n`);
    }

    // 4. Create Delivery Records
    console.log('🚚 Creating Delivery Records...\n');
    const providers = [fedex, dhl, ups, localCourier];
    const deliveryStatuses = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    for (let i = 0; i < existingOrders.length; i++) {
      const order = existingOrders[i];
      const provider = providers[i % providers.length];
      const status = deliveryStatuses[i % deliveryStatuses.length];

      // Generate tracking number
      const trackingNumber = `${provider.slug.split('-')[0].toUpperCase()}${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Expected delivery date (3-7 days from now)
      const expectedDays = 3 + Math.floor(Math.random() * 5);
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + expectedDays);

      // Create delivery record
      const delivery = await prisma.delivery.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          deliveryPartnerId: status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' ? deliveryPartner.id : null,
          trackingNumber,
          trackingUrl: provider.website ? `${provider.website}/track/${trackingNumber}` : null,
          currentStatus: status as any,
          expectedDeliveryDate,
          deliveredAt: status === 'DELIVERED' ? new Date() : null,
          pickupAddress: {
            name: 'NextPik Warehouse',
            addressLine1: 'KG 123 St',
            city: 'Kigali',
            country: 'Rwanda',
            postalCode: '00000',
          },
          deliveryAddress: {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            address1: order.shippingAddress.address1,
            address2: order.shippingAddress.address2,
            city: order.shippingAddress.city,
            province: order.shippingAddress.province,
            country: order.shippingAddress.country,
            postalCode: order.shippingAddress.postalCode,
          },
          deliveryFee: order.shipping,
          partnerCommission: Number(provider.commissionRate),
          platformFee: 2.50,
          pickedUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          inTransitAt: status !== 'PENDING_PICKUP' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null, // 1 day ago
          outForDeliveryAt: status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' ? new Date() : null,
        },
      });

      console.log(`✅ Order ${order.orderNumber}:`);
      console.log(`   Provider: ${provider.name}`);
      console.log(`   Tracking: ${trackingNumber}`);
      console.log(`   Status: ${status}`);
      console.log(`   Expected: ${expectedDeliveryDate.toLocaleDateString()}\n`);

      // Update order status if delivered
      if (status === 'DELIVERED') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'DELIVERED' },
        });

        // Add delivery confirmation
        await prisma.deliveryConfirmation.create({
          data: {
            orderId: order.id,
            confirmedBy: order.userId,
            confirmationType: 'COURIER_CONFIRMED',
            actualDeliveryDate: new Date(),
            confirmedAt: new Date(),
            notes: 'Package delivered successfully',
          },
        });
      }
    }

    console.log('\n✅ Delivery test data seeded successfully!\n');
    console.log('='.repeat(60));
    console.log('📝 TEST CREDENTIALS');
    console.log('='.repeat(60));
    console.log('\n🚚 DELIVERY PARTNER ACCOUNT:');
    console.log('   Email: delivery-partner@test.com');
    console.log('   Password: DeliveryTest@123');
    console.log('   Role: DELIVERY_PARTNER');
    console.log('   Provider: NextPik Express');
    console.log('\n📦 DELIVERY PROVIDERS:');
    console.log(`   1. ${fedex.name} - ${fedex.slug}`);
    console.log(`   2. ${dhl.name} - ${dhl.slug}`);
    console.log(`   3. ${ups.name} - ${ups.slug}`);
    console.log(`   4. ${localCourier.name} - ${localCourier.slug}`);
    console.log('\n🔗 TRACKING LINKS:');
    for (const order of existingOrders.slice(0, 3)) {
      const delivery = await prisma.delivery.findUnique({
        where: { orderId: order.id },
        include: { provider: true },
      });
      if (delivery) {
        console.log(`   Order ${order.orderNumber}:`);
        console.log(`   → /track/${delivery.trackingNumber}`);
        console.log(`   → /account/orders/${order.id}`);
      }
    }
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error seeding delivery data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDeliveryTestData()
  .then(() => {
    console.log('✅ Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
