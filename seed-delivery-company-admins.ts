/**
 * Seed Script: Delivery Company Admins & Drivers
 *
 * Creates test users for delivery company portal testing:
 * - Company admins (DELIVERY_PROVIDER_ADMIN)
 * - Drivers (DELIVERY_PARTNER)
 *
 * Run: npx tsx seed-delivery-company-admins.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting delivery company admin seed...\n');

  // Get all delivery providers
  const providers = await prisma.deliveryProvider.findMany();

  if (providers.length === 0) {
    console.log('❌ No delivery providers found. Please seed providers first.');
    return;
  }

  console.log(`✅ Found ${providers.length} delivery providers\n`);

  // Create admins and drivers for each provider
  for (const provider of providers) {
    console.log(`\n📦 Setting up ${provider.name}...\n`);

    // Create company admin
    const adminEmail = `admin@${provider.slug}.com`;
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: provider.name,
          lastName: 'Manager',
          role: 'DELIVERY_PROVIDER_ADMIN',
          deliveryProviderId: provider.id,
          emailVerified: true,
          isActive: true,
        },
      });

      console.log(`  ✅ Created admin: ${adminEmail}`);
      console.log(`     Password: Password123!`);
    } else {
      console.log(`  ⏭️  Admin already exists: ${adminEmail}`);
    }

    // Create 3 drivers for each company
    const driverNames = [
      { firstName: 'Mike', lastName: 'Driver' },
      { firstName: 'Sarah', lastName: 'Delivery' },
      { firstName: 'John', lastName: 'Courier' },
    ];

    for (const driver of driverNames) {
      const driverEmail = `${driver.firstName.toLowerCase()}@${provider.slug}.com`;
      const existingDriver = await prisma.user.findUnique({
        where: { email: driverEmail },
      });

      if (!existingDriver) {
        const hashedPassword = await bcrypt.hash('Password123!', 10);

        await prisma.user.create({
          data: {
            email: driverEmail,
            password: hashedPassword,
            firstName: driver.firstName,
            lastName: driver.lastName,
            role: 'DELIVERY_PARTNER',
            deliveryProviderId: provider.id,
            emailVerified: true,
            isActive: true,
            phone: `+25078812345${Math.floor(Math.random() * 10)}`,
          },
        });

        console.log(`  ✅ Created driver: ${driverEmail}`);
      } else {
        console.log(`  ⏭️  Driver already exists: ${driverEmail}`);
      }
    }
  }

  console.log('\n\n🎉 Seed completed successfully!\n');
  console.log('📋 Test Credentials Summary:\n');
  console.log('=' .repeat(60));

  for (const provider of providers) {
    console.log(`\n${provider.name}:`);
    console.log(`  Admin: admin@${provider.slug}.com / Password123!`);
    console.log(`  Drivers:`);
    console.log(`    - mike@${provider.slug}.com / Password123!`);
    console.log(`    - sarah@${provider.slug}.com / Password123!`);
    console.log(`    - john@${provider.slug}.com / Password123!`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('1. Login as admin to access /delivery-company/dashboard');
  console.log('2. Assign deliveries to the company via admin panel');
  console.log('3. Use company admin to assign deliveries to drivers');
  console.log('4. Test status updates and proof upload\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
