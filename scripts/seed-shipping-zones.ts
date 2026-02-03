import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedShippingZones() {
  console.log('🚚 Seeding shipping zones...\n');

  try {
    // 1. United States Domestic
    const usZone = await prisma.shippingZone.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        name: 'United States',
        code: 'US',
        description: 'Domestic shipping within the United States',
        countries: ['US', 'USA', 'United States'],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 9.99,
        perKgFee: 2.50,
        freeShippingThreshold: 75.00,
        minDeliveryDays: 3,
        maxDeliveryDays: 7,
        priority: 100,
        isActive: true,
      },
    });

    // Create rates for US zone
    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: usZone.id,
          name: 'Standard Shipping',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 9.99,
          perKgRate: 2.50,
          minDeliveryDays: 5,
          maxDeliveryDays: 7,
          isActive: true,
        },
        {
          zoneId: usZone.id,
          name: 'Express Shipping',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 24.99,
          perKgRate: 3.00,
          minDeliveryDays: 2,
          maxDeliveryDays: 3,
          isActive: true,
        },
        {
          zoneId: usZone.id,
          name: 'Overnight',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 49.99,
          perKgRate: 5.00,
          minDeliveryDays: 1,
          maxDeliveryDays: 1,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ US zone created with 3 rates');

    // 2. Canada
    const caZone = await prisma.shippingZone.upsert({
      where: { code: 'CA' },
      update: {},
      create: {
        name: 'Canada',
        code: 'CA',
        description: 'Shipping to Canada',
        countries: ['CA', 'Canada'],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 19.99,
        perKgFee: 3.50,
        freeShippingThreshold: 150.00,
        minDeliveryDays: 5,
        maxDeliveryDays: 10,
        priority: 90,
        isActive: true,
      },
    });

    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: caZone.id,
          name: 'Standard Shipping',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 19.99,
          perKgRate: 3.50,
          minDeliveryDays: 7,
          maxDeliveryDays: 10,
          isActive: true,
        },
        {
          zoneId: caZone.id,
          name: 'Express Shipping',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 39.99,
          perKgRate: 5.00,
          minDeliveryDays: 3,
          maxDeliveryDays: 5,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Canada zone created with 2 rates');

    // 3. Europe
    const euZone = await prisma.shippingZone.upsert({
      where: { code: 'EU' },
      update: {},
      create: {
        name: 'Europe',
        code: 'EU',
        description: 'Shipping to European countries',
        countries: [
          'GB', 'UK', 'United Kingdom',
          'FR', 'France',
          'DE', 'Germany',
          'IT', 'Italy',
          'ES', 'Spain',
          'NL', 'Netherlands',
          'BE', 'Belgium',
          'AT', 'Austria',
          'CH', 'Switzerland',
          'SE', 'Sweden',
          'NO', 'Norway',
          'DK', 'Denmark',
          'FI', 'Finland',
          'IE', 'Ireland',
          'PT', 'Portugal',
          'PL', 'Poland',
        ],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 29.99,
        perKgFee: 5.00,
        freeShippingThreshold: 200.00,
        minDeliveryDays: 7,
        maxDeliveryDays: 14,
        priority: 80,
        isActive: true,
      },
    });

    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: euZone.id,
          name: 'Standard International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 29.99,
          perKgRate: 5.00,
          minDeliveryDays: 10,
          maxDeliveryDays: 14,
          isActive: true,
        },
        {
          zoneId: euZone.id,
          name: 'Express International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 59.99,
          perKgRate: 7.50,
          minDeliveryDays: 5,
          maxDeliveryDays: 7,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Europe zone created with 2 rates');

    // 4. Asia Pacific
    const apZone = await prisma.shippingZone.upsert({
      where: { code: 'APAC' },
      update: {},
      create: {
        name: 'Asia Pacific',
        code: 'APAC',
        description: 'Shipping to Asia and Pacific countries',
        countries: [
          'AU', 'Australia',
          'NZ', 'New Zealand',
          'JP', 'Japan',
          'KR', 'South Korea',
          'SG', 'Singapore',
          'HK', 'Hong Kong',
          'CN', 'China',
          'TW', 'Taiwan',
          'TH', 'Thailand',
          'MY', 'Malaysia',
          'PH', 'Philippines',
          'IN', 'India',
          'ID', 'Indonesia',
          'VN', 'Vietnam',
        ],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 34.99,
        perKgFee: 6.00,
        freeShippingThreshold: 250.00,
        minDeliveryDays: 10,
        maxDeliveryDays: 21,
        priority: 70,
        isActive: true,
      },
    });

    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: apZone.id,
          name: 'Standard International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 34.99,
          perKgRate: 6.00,
          minDeliveryDays: 14,
          maxDeliveryDays: 21,
          isActive: true,
        },
        {
          zoneId: apZone.id,
          name: 'Express International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 69.99,
          perKgRate: 9.00,
          minDeliveryDays: 7,
          maxDeliveryDays: 10,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Asia Pacific zone created with 2 rates');

    // 5. Africa (including Rwanda)
    const afriZone = await prisma.shippingZone.upsert({
      where: { code: 'AFRICA' },
      update: {},
      create: {
        name: 'Africa',
        code: 'AFRICA',
        description: 'Shipping to African countries',
        countries: [
          'RW', 'Rwanda',
          'KE', 'Kenya',
          'UG', 'Uganda',
          'TZ', 'Tanzania',
          'ZA', 'South Africa',
          'NG', 'Nigeria',
          'EG', 'Egypt',
          'MA', 'Morocco',
          'GH', 'Ghana',
          'ET', 'Ethiopia',
        ],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 39.99,
        perKgFee: 7.00,
        freeShippingThreshold: 300.00,
        minDeliveryDays: 14,
        maxDeliveryDays: 28,
        priority: 60,
        isActive: true,
      },
    });

    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: afriZone.id,
          name: 'Standard International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 39.99,
          perKgRate: 7.00,
          minDeliveryDays: 21,
          maxDeliveryDays: 28,
          isActive: true,
        },
        {
          zoneId: afriZone.id,
          name: 'Express International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 79.99,
          perKgRate: 10.00,
          minDeliveryDays: 10,
          maxDeliveryDays: 14,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Africa zone created with 2 rates');

    // 6. Latin America
    const latamZone = await prisma.shippingZone.upsert({
      where: { code: 'LATAM' },
      update: {},
      create: {
        name: 'Latin America',
        code: 'LATAM',
        description: 'Shipping to Latin American countries',
        countries: [
          'MX', 'Mexico',
          'BR', 'Brazil',
          'AR', 'Argentina',
          'CL', 'Chile',
          'CO', 'Colombia',
          'PE', 'Peru',
          'VE', 'Venezuela',
          'CR', 'Costa Rica',
          'PA', 'Panama',
        ],
        states: [],
        cities: [],
        postalCodes: [],
        baseFee: 29.99,
        perKgFee: 5.50,
        freeShippingThreshold: 200.00,
        minDeliveryDays: 10,
        maxDeliveryDays: 21,
        priority: 65,
        isActive: true,
      },
    });

    await prisma.shippingRate.createMany({
      data: [
        {
          zoneId: latamZone.id,
          name: 'Standard International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 29.99,
          perKgRate: 5.50,
          minDeliveryDays: 14,
          maxDeliveryDays: 21,
          isActive: true,
        },
        {
          zoneId: latamZone.id,
          name: 'Express International',
          minOrderValue: null,
          maxOrderValue: null,
          rate: 59.99,
          perKgRate: 8.00,
          minDeliveryDays: 7,
          maxDeliveryDays: 10,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Latin America zone created with 2 rates');

    console.log('\n✅ Successfully seeded 6 shipping zones with rates!');
    console.log('\nShipping Zones Created:');
    console.log('1. United States (US) - 3 rates');
    console.log('2. Canada (CA) - 2 rates');
    console.log('3. Europe (EU) - 2 rates');
    console.log('4. Asia Pacific (APAC) - 2 rates');
    console.log('5. Africa (AFRICA) - 2 rates');
    console.log('6. Latin America (LATAM) - 2 rates');
    console.log('\nTotal: 6 zones, 13 rates\n');

  } catch (error) {
    console.error('❌ Error seeding shipping zones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedShippingZones()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedShippingZones };
