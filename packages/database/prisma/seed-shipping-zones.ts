import { PrismaClient, SettingValueType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedShippingZones() {
  console.log('🌱 Seeding default shipping zones...');

  try {
    // Create or update US Domestic Zone
    const usZone = await prisma.shippingZone.upsert({
      where: { code: 'US_DOMESTIC' },
      update: {},
      create: {
        name: 'United States Domestic',
        code: 'US_DOMESTIC',
        description: 'Shipping within the United States (48 contiguous states, Alaska, Hawaii)',
        countries: ['US', 'USA'],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: new Decimal(9.99),
        perKgFee: new Decimal(2.00),
        freeShippingThreshold: new Decimal(200),
        minDeliveryDays: 5,
        maxDeliveryDays: 7,
        isActive: true,
        priority: 10,
      },
    });

    console.log(`✅ Created/updated zone: ${usZone.name} (${usZone.code})`);

    // Create shipping rates for US zone
    const rates = await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: usZone.id,
          name: 'Standard',
          minOrderValue: null,
          maxOrderValue: null,
          rate: new Decimal(9.99),
          perKgRate: new Decimal(2.00),
          minDeliveryDays: 5,
          maxDeliveryDays: 7,
          isActive: true,
        },
        {
          zoneId: usZone.id,
          name: 'Express',
          minOrderValue: null,
          maxOrderValue: null,
          rate: new Decimal(19.99),
          perKgRate: new Decimal(3.00),
          minDeliveryDays: 2,
          maxDeliveryDays: 3,
          isActive: true,
        },
        {
          zoneId: usZone.id,
          name: 'Overnight',
          minOrderValue: null,
          maxOrderValue: null,
          rate: new Decimal(29.99),
          perKgRate: new Decimal(5.00),
          minDeliveryDays: 1,
          maxDeliveryDays: 1,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Created ${rates.count} shipping rates for ${usZone.name}`);

    // Optional: Create International Zone
    const intlZone = await prisma.shippingZone.upsert({
      where: { code: 'INTERNATIONAL' },
      update: {},
      create: {
        name: 'International',
        code: 'INTERNATIONAL',
        description: 'Shipping to countries outside the United States',
        countries: [], // Empty means "all others"
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: new Decimal(24.99),
        perKgFee: new Decimal(5.00),
        freeShippingThreshold: null, // No free shipping for international
        minDeliveryDays: 10,
        maxDeliveryDays: 15,
        isActive: true,
        priority: 1, // Lower priority than US zone
      },
    });

    console.log(`✅ Created/updated zone: ${intlZone.name} (${intlZone.code})`);

    const intlRates = await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: intlZone.id,
          name: 'Standard',
          minOrderValue: null,
          maxOrderValue: null,
          rate: new Decimal(24.99),
          perKgRate: new Decimal(5.00),
          minDeliveryDays: 10,
          maxDeliveryDays: 15,
          isActive: true,
        },
        {
          zoneId: intlZone.id,
          name: 'Express',
          minOrderValue: null,
          maxOrderValue: null,
          rate: new Decimal(44.99),
          perKgRate: new Decimal(8.00),
          minDeliveryDays: 5,
          maxDeliveryDays: 7,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Created ${intlRates.count} shipping rates for ${intlZone.name}`);
    console.log('\n✅ Shipping zones seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - US Domestic Zone: 3 rates (Standard, Express, Overnight)`);
    console.log(`   - International Zone: 2 rates (Standard, Express)`);
  } catch (error) {
    console.error('❌ Error seeding shipping zones:', error);
    throw error;
  }
}

seedShippingZones()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
