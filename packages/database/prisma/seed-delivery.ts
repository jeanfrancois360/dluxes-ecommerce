import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚚 Seeding delivery providers...');
  console.log('');

  const testPassword = await bcrypt.hash('Test@123', 10);

  // Create Delivery Providers
  const fedex = await prisma.deliveryProvider.upsert({
    where: { slug: 'fedex' },
    update: {},
    create: {
      name: 'FedEx',
      slug: 'fedex',
      type: 'API_INTEGRATED',
      description: 'Leading international courier delivery services',
      contactEmail: 'support@fedex.com',
      contactPhone: '+1-800-463-3339',
      website: 'https://www.fedex.com',
      apiEnabled: true,
      apiEndpoint: 'https://apis.fedex.com',
      countries: ['US', 'CA', 'UK', 'FR', 'DE', 'JP', 'AU', 'RW'],
      commissionType: 'PERCENTAGE',
      commissionRate: 8.0,
      isActive: true,
      verificationStatus: 'VERIFIED',
      logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
    },
  });

  const ups = await prisma.deliveryProvider.upsert({
    where: { slug: 'ups' },
    update: {},
    create: {
      name: 'UPS',
      slug: 'ups',
      type: 'API_INTEGRATED',
      description: 'United Parcel Service - Global shipping and logistics',
      contactEmail: 'support@ups.com',
      contactPhone: '+1-800-742-5877',
      website: 'https://www.ups.com',
      apiEnabled: true,
      apiEndpoint: 'https://onlinetools.ups.com',
      countries: ['US', 'CA', 'UK', 'FR', 'DE', 'JP', 'AU'],
      commissionType: 'PERCENTAGE',
      commissionRate: 7.5,
      isActive: true,
      verificationStatus: 'VERIFIED',
      logo: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088',
    },
  });

  const dhl = await prisma.deliveryProvider.upsert({
    where: { slug: 'dhl' },
    update: {},
    create: {
      name: 'DHL Express',
      slug: 'dhl',
      type: 'API_INTEGRATED',
      description: 'DHL Express - International shipping and courier services',
      contactEmail: 'support@dhl.com',
      contactPhone: '+1-800-225-5345',
      website: 'https://www.dhl.com',
      apiEnabled: true,
      apiEndpoint: 'https://api.dhl.com',
      countries: ['US', 'CA', 'UK', 'FR', 'DE', 'JP', 'AU', 'RW', 'KE', 'UG'],
      commissionType: 'PERCENTAGE',
      commissionRate: 9.0,
      isActive: true,
      verificationStatus: 'VERIFIED',
      logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec',
    },
  });

  const localCourier = await prisma.deliveryProvider.upsert({
    where: { slug: 'luxury-express' },
    update: {},
    create: {
      name: 'Luxury Express',
      slug: 'luxury-express',
      type: 'PARTNER',
      description: 'Premium local delivery service for luxury goods - Serving Rwanda, Uganda, and Kenya',
      contactEmail: 'contact@luxuryexpress.com',
      contactPhone: '+250-788-123-456',
      website: 'https://luxuryexpress.com',
      apiEnabled: false,
      countries: ['RW', 'UG', 'KE'],
      commissionType: 'PERCENTAGE',
      commissionRate: 10.0,
      isActive: true,
      verificationStatus: 'VERIFIED',
      logo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55',
    },
  });

  console.log('✅ Created/Updated delivery providers:');
  console.log(`   - ${fedex.name}`);
  console.log(`   - ${ups.name}`);
  console.log(`   - ${dhl.name}`);
  console.log(`   - ${localCourier.name}`);

  // Create Delivery Partner Test Accounts
  console.log('');
  console.log('👷 Creating delivery partner accounts...');

  const partner1 = await prisma.user.upsert({
    where: { email: 'partner1@test.com' },
    update: {},
    create: {
      email: 'partner1@test.com',
      firstName: 'John',
      lastName: 'Courier',
      password: testPassword,
      role: 'DELIVERY_PARTNER',
      emailVerified: true,
      phone: '+250-788-111-111',
      deliveryProviderId: localCourier.id,
      preferences: {
        create: {
          newsletter: false,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'compact',
        },
      },
    },
  });

  const partner2 = await prisma.user.upsert({
    where: { email: 'partner2@test.com' },
    update: {},
    create: {
      email: 'partner2@test.com',
      firstName: 'Sarah',
      lastName: 'Delivery',
      password: testPassword,
      role: 'DELIVERY_PARTNER',
      emailVerified: true,
      phone: '+250-788-222-222',
      deliveryProviderId: localCourier.id,
      preferences: {
        create: {
          newsletter: false,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'compact',
        },
      },
    },
  });

  const partner3 = await prisma.user.upsert({
    where: { email: 'partner3@test.com' },
    update: {},
    create: {
      email: 'partner3@test.com',
      firstName: 'Mike',
      lastName: 'Express',
      password: testPassword,
      role: 'DELIVERY_PARTNER',
      emailVerified: true,
      phone: '+250-788-333-333',
      deliveryProviderId: fedex.id,
      preferences: {
        create: {
          newsletter: false,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'compact',
        },
      },
    },
  });

  console.log('✅ Created/Updated delivery partner accounts:');
  console.log(`   - ${partner1.email} → ${localCourier.name}`);
  console.log(`   - ${partner2.email} → ${localCourier.name}`);
  console.log(`   - ${partner3.email} → ${fedex.name}`);

  console.log('');
  console.log('🎉 Delivery provider seeding completed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 DELIVERY PARTNER TEST CREDENTIALS (Password: Test@123)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Delivery Partner Accounts:');
  console.log('   Email:     partner1@test.com (Luxury Express)');
  console.log('   Email:     partner2@test.com (Luxury Express)');
  console.log('   Email:     partner3@test.com (FedEx)');
  console.log('   Password:  Test@123');
  console.log('   Dashboard: http://localhost:3000/delivery-partner/dashboard');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Delivery seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
