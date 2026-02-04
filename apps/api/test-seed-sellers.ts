import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function generateSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function seedTestSellers() {
  console.log('🌱 Seeding test seller applications...\n');

  const testSellers = [
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      storeName: "Smith's Luxury Store",
      storeDescription: 'Premium luxury goods and accessories',
      phone: '+1-555-0101',
      status: 'PENDING' as const,
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      storeName: 'Johnson Fashion House',
      storeDescription: 'High-end fashion and designer wear',
      phone: '+1-555-0102',
      status: 'PENDING' as const,
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      storeName: 'Chen Electronics',
      storeDescription: 'Premium electronics and gadgets',
      phone: '+1-555-0103',
      status: 'ACTIVE' as const,
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@example.com',
      storeName: 'Davis Home Decor',
      storeDescription: 'Luxury home furnishings and decor',
      phone: '+1-555-0104',
      status: 'ACTIVE' as const,
    },
    {
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'robert.wilson@example.com',
      storeName: "Wilson's Watch Collection",
      storeDescription: 'Luxury watches and timepieces',
      phone: '+1-555-0105',
      status: 'SUSPENDED' as const,
    },
    {
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@example.com',
      storeName: 'Anderson Beauty',
      storeDescription: 'Premium beauty and cosmetics',
      phone: '+1-555-0106',
      status: 'REJECTED' as const,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const seller of testSellers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: seller.email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipped: ${seller.email} (already exists)`);
        skipped++;
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: seller.email,
          firstName: seller.firstName,
          lastName: seller.lastName,
          password: hashedPassword,
          role: seller.status === 'ACTIVE' ? 'SELLER' : 'BUYER',
          emailVerified: true,
          isActive: true,
          // Set approval fields for non-pending
          ...(seller.status === 'ACTIVE' && {
            sellerApprovedAt: new Date(),
            sellerApprovedBy: 'seed-script',
          }),
          ...(seller.status === 'REJECTED' && {
            sellerRejectedAt: new Date(),
            sellerRejectedBy: 'seed-script',
            sellerRejectionNote: 'Test rejection - does not meet requirements',
          }),
          ...(seller.status === 'SUSPENDED' && {
            sellerSuspendedAt: new Date(),
            sellerSuspendedBy: 'seed-script',
            sellerSuspensionNote: 'Test suspension - policy violation',
            sellerApprovedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            sellerApprovedBy: 'seed-script',
          }),
        },
      });

      // Create user preferences
      await prisma.userPreferences.create({
        data: { userId: user.id },
      });

      // Create store
      const slug = await generateSlug(seller.storeName);
      const store = await prisma.store.create({
        data: {
          userId: user.id,
          name: seller.storeName,
          slug,
          description: seller.storeDescription,
          email: seller.email,
          phone: seller.phone,
          status: seller.status,
          verified: seller.status === 'ACTIVE' || seller.status === 'SUSPENDED',
          verifiedAt:
            seller.status === 'ACTIVE' || seller.status === 'SUSPENDED'
              ? new Date()
              : null,
          creditsBalance:
            seller.status === 'ACTIVE'
              ? Math.floor(Math.random() * 10) + 1 // 1-10 months
              : 0,
          creditsExpiresAt:
            seller.status === 'ACTIVE'
              ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months from now
              : null,
        },
      });

      console.log(
        `✅ Created: ${seller.storeName} (${seller.status}) - ${seller.email}`,
      );
      created++;
    } catch (error) {
      console.error(`❌ Failed to create ${seller.email}:`, error);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Created: ${created} sellers`);
  console.log(`⏭️  Skipped: ${skipped} sellers (already exist)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTest Credentials:');
  console.log('Email: john.smith@example.com');
  console.log('Password: password123');
  console.log('\nYou can use any of the seeded emails with password: password123\n');
}

seedTestSellers()
  .catch((e) => {
    console.error('❌ Error seeding test sellers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
