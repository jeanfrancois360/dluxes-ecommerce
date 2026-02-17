import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdvertisementPlans() {
  console.log('📢 Seeding advertisement plans...');

  const advertisementPlans = [
    {
      id: 'ad_plan_free',
      name: 'Free',
      slug: 'free',
      description: 'Basic advertising for new sellers',
      maxActiveAds: 1,
      maxImpressions: 1000,
      priorityBoost: 0,
      allowedPlacements: ['PRODUCTS_SIDEBAR'],
      price: 0,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: 0,
    },
    {
      id: 'ad_plan_basic',
      name: 'Basic',
      slug: 'basic',
      description: 'Essential advertising features for growing sellers',
      maxActiveAds: 3,
      maxImpressions: 10000,
      priorityBoost: 1,
      allowedPlacements: ['PRODUCTS_SIDEBAR', 'PRODUCTS_INLINE', 'CATEGORY_BANNER'],
      price: 29,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 7,
      isActive: true,
      isFeatured: false,
      displayOrder: 1,
    },
    {
      id: 'ad_plan_premium',
      name: 'Premium',
      slug: 'premium',
      description: 'Advanced advertising with premium placements',
      maxActiveAds: 10,
      maxImpressions: 50000,
      priorityBoost: 5,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'HOMEPAGE_SIDEBAR',
        'PRODUCTS_BANNER',
        'PRODUCTS_SIDEBAR',
        'PRODUCTS_INLINE',
        'CATEGORY_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'SEARCH_RESULTS',
      ],
      price: 99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 7,
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
    },
    {
      id: 'ad_plan_enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited advertising with all premium features',
      maxActiveAds: -1, // Unlimited
      maxImpressions: null, // Unlimited
      priorityBoost: 10,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'HOMEPAGE_SIDEBAR',
        'PRODUCTS_BANNER',
        'PRODUCTS_SIDEBAR',
        'PRODUCTS_INLINE',
        'CATEGORY_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'CHECKOUT_UPSELL',
        'SEARCH_RESULTS',
      ],
      price: 299,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 14,
      isActive: true,
      isFeatured: false,
      displayOrder: 3,
    },
  ];

  for (const plan of advertisementPlans) {
    await prisma.advertisementPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ ${plan.name} plan`);
  }

  console.log(`\n✅ Created ${advertisementPlans.length} advertisement plans`);
}

seedAdvertisementPlans()
  .catch((e) => {
    console.error('❌ Error seeding advertisement plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
