import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extended Category Seed Data with all category types
 * Includes: GENERAL, REAL_ESTATE, VEHICLE, SERVICE, RENTAL, DIGITAL
 */
export async function seedExtendedCategories() {
  console.log('🌱 Seeding extended categories...');

  const categories = [
    // ===== GENERAL Categories (Existing luxury items) =====
    {
      name: 'Watches',
      slug: 'watches',
      description: 'Luxury timepieces and watches from premium brands',
      categoryType: CategoryType.GENERAL,
      icon: 'Watch',
      showInNavbar: true,
      showInTopBar: true,
      showOnHomepage: true,
      isFeatured: true,
      priority: 10,
      typeSettings: {
        requiredFields: ['brand', 'model', 'movement'],
        customAttributes: {
          movement: ['Automatic', 'Quartz', 'Manual'],
          caseMaterial: ['Stainless Steel', 'Gold', 'Titanium', 'Ceramic'],
          waterResistance: ['30m', '50m', '100m', '200m', '300m'],
        },
      },
    },
    {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Fine jewelry and precious accessories',
      categoryType: CategoryType.GENERAL,
      icon: 'Gem',
      showInNavbar: true,
      showInTopBar: true,
      showOnHomepage: true,
      isFeatured: true,
      priority: 9,
      typeSettings: {
        requiredFields: ['material', 'gemstone'],
        customAttributes: {
          material: ['Gold', 'Platinum', 'Silver', 'White Gold', 'Rose Gold'],
          gemstone: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'None'],
          caratWeight: true,
        },
      },
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Luxury fashion and designer clothing',
      categoryType: CategoryType.GENERAL,
      icon: 'Shirt',
      showInNavbar: true,
      showInTopBar: true,
      priority: 8,
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Premium accessories and lifestyle products',
      categoryType: CategoryType.GENERAL,
      icon: 'ShoppingBag',
      showInNavbar: true,
      showInTopBar: true,
      priority: 7,
    },

    // ===== REAL_ESTATE Categories =====
    {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Luxury properties, houses, apartments, and land',
      categoryType: CategoryType.REAL_ESTATE,
      icon: 'Home',
      showInNavbar: true,
      showInTopBar: true,
      showOnHomepage: true,
      isFeatured: true,
      priority: 10,
      typeSettings: {
        requiredFields: ['propertyType', 'bedrooms', 'bathrooms', 'squareFeet', 'location'],
        customAttributes: {
          propertyType: ['House', 'Apartment', 'Condo', 'Villa', 'Penthouse', 'Land', 'Commercial'],
          listingType: ['For Sale', 'For Rent', 'For Lease'],
          amenities: ['Pool', 'Gym', 'Parking', 'Garden', 'Security', 'Concierge'],
          yearBuilt: true,
          lotSize: true,
        },
        validations: {
          priceRange: { min: 50000, max: 100000000 },
          requireLocation: true,
          requireImages: { min: 5, max: 50 },
        },
      },
    },
    {
      name: 'Residential',
      slug: 'real-estate-residential',
      description: 'Luxury homes, apartments, and condos',
      categoryType: CategoryType.REAL_ESTATE,
      parentSlug: 'real-estate',
      icon: 'Building',
      showInSidebar: true,
      typeSettings: {
        requiredFields: ['bedrooms', 'bathrooms', 'squareFeet'],
      },
    },
    {
      name: 'Commercial',
      slug: 'real-estate-commercial',
      description: 'Commercial properties and office spaces',
      categoryType: CategoryType.REAL_ESTATE,
      parentSlug: 'real-estate',
      icon: 'Building2',
      showInSidebar: true,
      typeSettings: {
        requiredFields: ['squareFeet', 'zoning'],
      },
    },
    {
      name: 'Land',
      slug: 'real-estate-land',
      description: 'Land plots and development opportunities',
      categoryType: CategoryType.REAL_ESTATE,
      parentSlug: 'real-estate',
      icon: 'Map',
      showInSidebar: true,
    },

    // ===== VEHICLE Categories =====
    {
      name: 'Vehicles',
      slug: 'vehicles',
      description: 'Luxury cars, motorcycles, boats, and more',
      categoryType: CategoryType.VEHICLE,
      icon: 'Car',
      showInNavbar: true,
      showInTopBar: true,
      showOnHomepage: true,
      isFeatured: true,
      priority: 9,
      typeSettings: {
        requiredFields: ['make', 'model', 'year', 'mileage', 'condition'],
        customAttributes: {
          condition: ['New', 'Used', 'Certified Pre-Owned'],
          fuelType: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
          transmission: ['Automatic', 'Manual'],
          driveType: ['FWD', 'RWD', 'AWD', '4WD'],
          bodyStyle: ['Sedan', 'SUV', 'Coupe', 'Convertible', 'Truck'],
        },
        validations: {
          yearRange: { min: 1900, max: new Date().getFullYear() + 1 },
          requireVIN: true,
          requireCarfax: false,
        },
      },
    },
    {
      name: 'Luxury Cars',
      slug: 'vehicles-cars',
      description: 'Premium and luxury automobiles',
      categoryType: CategoryType.VEHICLE,
      parentSlug: 'vehicles',
      icon: 'Car',
      showInSidebar: true,
    },
    {
      name: 'Motorcycles',
      slug: 'vehicles-motorcycles',
      description: 'Luxury motorcycles and bikes',
      categoryType: CategoryType.VEHICLE,
      parentSlug: 'vehicles',
      icon: 'Bike',
      showInSidebar: true,
    },
    {
      name: 'Boats & Yachts',
      slug: 'vehicles-boats',
      description: 'Luxury boats, yachts, and watercraft',
      categoryType: CategoryType.VEHICLE,
      parentSlug: 'vehicles',
      icon: 'Ship',
      showInSidebar: true,
      typeSettings: {
        customAttributes: {
          boatType: ['Yacht', 'Sailboat', 'Speedboat', 'Catamaran'],
          length: true,
          engineType: ['Inboard', 'Outboard', 'Jet'],
        },
      },
    },

    // ===== SERVICE Categories =====
    {
      name: 'Services',
      slug: 'services',
      description: 'Premium services and consultations',
      categoryType: CategoryType.SERVICE,
      icon: 'Briefcase',
      showInNavbar: true,
      showInTopBar: true,
      priority: 6,
      typeSettings: {
        requiredFields: ['serviceType', 'duration', 'availability'],
        customAttributes: {
          serviceType: ['Consultation', 'Maintenance', 'Repair', 'Installation', 'Training'],
          duration: ['Hourly', 'Daily', 'Project-based'],
          availability: ['Weekdays', 'Weekends', '24/7'],
        },
      },
    },
    {
      name: 'Consulting',
      slug: 'services-consulting',
      description: 'Professional consulting services',
      categoryType: CategoryType.SERVICE,
      parentSlug: 'services',
      showInSidebar: true,
    },
    {
      name: 'Maintenance',
      slug: 'services-maintenance',
      description: 'Premium maintenance and care services',
      categoryType: CategoryType.SERVICE,
      parentSlug: 'services',
      showInSidebar: true,
    },

    // ===== RENTAL Categories =====
    {
      name: 'Rentals',
      slug: 'rentals',
      description: 'Luxury rentals and booking services',
      categoryType: CategoryType.RENTAL,
      icon: 'Calendar',
      showInNavbar: true,
      showInTopBar: true,
      priority: 7,
      typeSettings: {
        requiredFields: ['rentalType', 'availability', 'minRentalPeriod'],
        customAttributes: {
          rentalType: ['Daily', 'Weekly', 'Monthly', 'Seasonal'],
          bookingPolicy: ['Instant', 'Request', 'Inquiry'],
          cancellationPolicy: ['Flexible', 'Moderate', 'Strict'],
        },
        validations: {
          requireCalendar: true,
          requireDeposit: true,
        },
      },
    },
    {
      name: 'Vacation Homes',
      slug: 'rentals-vacation-homes',
      description: 'Luxury vacation home rentals',
      categoryType: CategoryType.RENTAL,
      parentSlug: 'rentals',
      showInSidebar: true,
    },
    {
      name: 'Equipment',
      slug: 'rentals-equipment',
      description: 'Luxury equipment and gear rentals',
      categoryType: CategoryType.RENTAL,
      parentSlug: 'rentals',
      showInSidebar: true,
    },

    // ===== DIGITAL Categories =====
    {
      name: 'Digital Products',
      slug: 'digital',
      description: 'Digital products, courses, and software',
      categoryType: CategoryType.DIGITAL,
      icon: 'Download',
      showInNavbar: true,
      showInTopBar: true,
      priority: 5,
      typeSettings: {
        requiredFields: ['downloadType', 'fileFormat', 'license'],
        customAttributes: {
          downloadType: ['Instant', 'Email'],
          fileFormat: ['PDF', 'Video', 'Audio', 'Software', 'eBook'],
          license: ['Single User', 'Multi User', 'Commercial', 'Personal'],
        },
        validations: {
          requireDownloadLink: true,
          maxFileSize: 5000, // MB
        },
      },
    },
    {
      name: 'Software',
      slug: 'digital-software',
      description: 'Premium software and applications',
      categoryType: CategoryType.DIGITAL,
      parentSlug: 'digital',
      showInSidebar: true,
    },
    {
      name: 'Courses',
      slug: 'digital-courses',
      description: 'Online courses and training materials',
      categoryType: CategoryType.DIGITAL,
      parentSlug: 'digital',
      showInSidebar: true,
    },
  ];

  // Create categories with parent relationships
  for (const category of categories) {
    const { parentSlug, ...categoryData } = category as any;

    // If parent is specified, find it first
    let parentId: string | undefined;
    if (parentSlug) {
      const parent = await prisma.category.findUnique({
        where: { slug: parentSlug },
      });
      if (parent) {
        parentId = parent.id;
      }
    }

    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        ...categoryData,
        ...(parentId && { parentId }),
      },
      create: {
        ...categoryData,
        ...(parentId && { parentId }),
      },
    });

    console.log(`  ✓ ${category.name} (${category.categoryType})`);
  }

  console.log('✅ Extended categories seeded successfully!\n');
}

// Run directly if called
if (require.main === module) {
  seedExtendedCategories()
    .then(() => {
      console.log('✅ Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
