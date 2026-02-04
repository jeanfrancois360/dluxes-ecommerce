import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('📦 Creating subscription plans...');

  const subscriptionPlans = [
    {
      tier: 'FREE' as const,
      name: 'Free',
      description: 'Get started with basic listings',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'USD',
      maxActiveListings: 3,
      monthlyCredits: 2,
      listingDurationDays: 30,
      featuredSlotsPerMonth: 0,
      allowedProductTypes: ['SERVICE'],
      features: ['3 Active Listings', '2 Credits/Month', 'Basic Support', 'Standard Visibility'],
      isPopular: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      tier: 'STARTER' as const,
      name: 'Starter',
      description: 'Perfect for growing sellers',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: 'USD',
      maxActiveListings: 15,
      monthlyCredits: 10,
      listingDurationDays: 45,
      featuredSlotsPerMonth: 2,
      allowedProductTypes: ['SERVICE', 'RENTAL', 'VEHICLE'],
      features: ['15 Active Listings', '10 Credits/Month', '2 Featured Slots', 'Priority Support', '45-Day Listings'],
      isPopular: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      tier: 'PROFESSIONAL' as const,
      name: 'Professional',
      description: 'For serious sellers',
      monthlyPrice: 79.99,
      yearlyPrice: 799.99,
      currency: 'USD',
      maxActiveListings: 50,
      monthlyCredits: 30,
      listingDurationDays: 60,
      featuredSlotsPerMonth: 5,
      allowedProductTypes: ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'],
      features: ['50 Active Listings', '30 Credits/Month', '5 Featured Slots', 'Priority Support', '60-Day Listings', 'Analytics Dashboard', 'Real Estate Listings'],
      isPopular: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      tier: 'BUSINESS' as const,
      name: 'Business',
      description: 'Unlimited potential for enterprises',
      monthlyPrice: 199.99,
      yearlyPrice: 1999.99,
      currency: 'USD',
      maxActiveListings: -1, // Unlimited
      monthlyCredits: 100,
      listingDurationDays: 90,
      featuredSlotsPerMonth: 15,
      allowedProductTypes: ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'],
      features: ['Unlimited Listings', '100 Credits/Month', '15 Featured Slots', 'Dedicated Support', '90-Day Listings', 'Advanced Analytics', 'API Access', 'White-Label Options'],
      isPopular: false,
      isActive: true,
      displayOrder: 4,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }
  console.log(`✅ Created ${subscriptionPlans.length} subscription plans`);
}

async function main() {
  try {
    await seedSubscriptionPlans();
    console.log('✅ Subscription plans seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
