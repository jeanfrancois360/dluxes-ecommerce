import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NOTE: HOMEPAGE_HERO is reserved for NextPik internal use only.
// It must NOT be included in any seller advertisement plan.

async function main() {
  console.log('🌱 Seeding Advertisement Plans...\n');

  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses getting started with advertising',
      maxActiveAds: 1,
      maxImpressions: 10000,
      priorityBoost: 1,
      allowedPlacements: ['HOMEPAGE_SIDEBAR', 'PRODUCTS_SIDEBAR'],
      price: 29.99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 7,
      isActive: true,
      isFeatured: false,
      displayOrder: 1,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'Ideal for growing businesses that need more visibility',
      maxActiveAds: 5,
      maxImpressions: 50000,
      priorityBoost: 2,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'HOMEPAGE_SIDEBAR',
        'PRODUCTS_BANNER',
        'PRODUCTS_SIDEBAR',
        'CATEGORY_BANNER',
      ],
      price: 99.99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 14,
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'For established businesses with high advertising needs',
      maxActiveAds: 15,
      maxImpressions: 150000,
      priorityBoost: 3,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'HOMEPAGE_SIDEBAR',
        'PRODUCTS_BANNER',
        'PRODUCTS_INLINE',
        'PRODUCTS_SIDEBAR',
        'CATEGORY_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'SEARCH_RESULTS',
      ],
      price: 299.99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 14,
      isActive: true,
      isFeatured: false,
      displayOrder: 3,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Ultimate advertising power with unlimited reach',
      maxActiveAds: -1,
      maxImpressions: null,
      priorityBoost: 5,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'HOMEPAGE_SIDEBAR',
        'PRODUCTS_BANNER',
        'PRODUCTS_INLINE',
        'PRODUCTS_SIDEBAR',
        'CATEGORY_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'CHECKOUT_UPSELL',
        'SEARCH_RESULTS',
      ],
      price: 999.99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 30,
      isActive: true,
      isFeatured: false,
      displayOrder: 4,
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.advertisementPlan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
    console.log(`✅ Upserted plan: ${plan.name} (${plan.slug})`);
  }

  console.log('\n✨ Advertisement Plans seeded successfully!');
  console.log('ℹ️  HOMEPAGE_HERO is reserved for NextPik internal use only.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
