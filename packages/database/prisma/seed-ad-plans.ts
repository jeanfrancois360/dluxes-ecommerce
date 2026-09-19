import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Functional placements (integrated on the storefront):
 *
 * HOMEPAGE_FEATURED      — Homepage, after featured products (banner 1200×240, 5:1)
 * PRODUCTS_INLINE        — Homepage, after new arrivals (banner 1200×240, 5:1)
 * PRODUCTS_BANNER        — Products page, top banner (banner 1200×240, 5:1)
 * PRODUCT_DETAIL_SIDEBAR — Product detail page, sidebar (square 300×300, 1:1)
 * CHECKOUT_UPSELL        — Checkout page, upsell card (square 200×200, 1:1)
 * SEARCH_RESULTS         — Search results, sponsored card (square 200×200, 1:1)
 *
 * NOT functional (no storefront integration):
 *   HOMEPAGE_HERO (reserved for NextPik internal)
 *   HOMEPAGE_SIDEBAR, PRODUCTS_SIDEBAR, CATEGORY_BANNER
 */

async function main() {
  console.log('🌱 Seeding Advertisement Plans...\n');

  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Get started with 1 ad on the products page. Great for testing.',
      maxActiveAds: 1,
      maxImpressions: 10000,
      priorityBoost: 1,
      allowedPlacements: ['PRODUCTS_BANNER'],
      price: 19,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: 1,
    },
    {
      name: 'Growth',
      slug: 'growth',
      description: 'Reach more shoppers with homepage and products page placements.',
      maxActiveAds: 3,
      maxImpressions: 50000,
      priorityBoost: 2,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'PRODUCTS_INLINE',
        'PRODUCTS_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
      ],
      price: 49,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 0,
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Maximum visibility across homepage, products, search, and checkout.',
      maxActiveAds: 10,
      maxImpressions: 200000,
      priorityBoost: 3,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'PRODUCTS_INLINE',
        'PRODUCTS_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'CHECKOUT_UPSELL',
        'SEARCH_RESULTS',
      ],
      price: 99,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: 3,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited ads across all placements. Priority support included.',
      maxActiveAds: -1,
      maxImpressions: null,
      priorityBoost: 5,
      allowedPlacements: [
        'HOMEPAGE_FEATURED',
        'PRODUCTS_INLINE',
        'PRODUCTS_BANNER',
        'PRODUCT_DETAIL_SIDEBAR',
        'CHECKOUT_UPSELL',
        'SEARCH_RESULTS',
      ],
      price: 249,
      currency: 'USD',
      billingPeriod: 'MONTHLY' as const,
      trialDays: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: 4,
    },
  ];

  // Deactivate old plans that only have non-functional placements
  const oldSlugs = ['free', 'basic', 'premium', 'professional', 'business', 'my-plan'];
  for (const slug of oldSlugs) {
    try {
      await prisma.advertisementPlan.update({
        where: { slug },
        data: { isActive: false },
      });
      console.log(`⚪ Deactivated old plan: ${slug}`);
    } catch {
      // Plan doesn't exist, skip
    }
  }

  // Upsert the new clean plans
  for (const planData of plans) {
    const plan = await prisma.advertisementPlan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
    console.log(
      `✅ Upserted plan: ${plan.name} ($${plan.price}/mo) — ${(planData.allowedPlacements as string[]).length} placements`
    );
  }

  console.log('\n✨ Advertisement Plans seeded successfully!');
  console.log('ℹ️  All plans use only functional placements (integrated on the storefront).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
