import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('');

  // Hash passwords for test accounts
  const testPassword = await bcrypt.hash('Password123!', 10); // Standard test password for all users

  // Create Root Super Admin user (legacy)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nextpik.com' },
    update: {},
    create: {
      email: 'admin@nextpik.com',
      firstName: 'Root',
      lastName: 'Admin',
      password: testPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });

  console.log('✅ Created root super admin user:', superAdmin.email);

  // ========================================
  // CREATE COMPREHENSIVE TEST ACCOUNTS
  // ========================================
  console.log('');
  console.log('👥 Creating comprehensive test users...');

  // ========================================
  // SUPER_ADMIN (1 user)
  // ========================================
  const superadmin1 = await prisma.user.upsert({
    where: { email: 'superadmin@nextpik.com' },
    update: {},
    create: {
      email: 'superadmin@nextpik.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: testPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000001',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SUPER_ADMIN:', superadmin1.email);

  // ========================================
  // ADMIN (2 users)
  // ========================================
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@nextpik.com' },
    update: {},
    create: {
      email: 'admin1@nextpik.com',
      firstName: 'Admin',
      lastName: 'One',
      password: testPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000002',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created ADMIN:', admin1.email);

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@nextpik.com' },
    update: {},
    create: {
      email: 'admin2@nextpik.com',
      firstName: 'Admin',
      lastName: 'Two',
      password: testPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      phone: '+250788000003',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created ADMIN:', admin2.email);

  // ========================================
  // BUYER (3 users)
  // ========================================
  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@nextpik.com' },
    update: {},
    create: {
      email: 'buyer1@nextpik.com',
      firstName: 'Buyer',
      lastName: 'One',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000010',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer1.email);

  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@nextpik.com' },
    update: {},
    create: {
      email: 'buyer2@nextpik.com',
      firstName: 'Buyer',
      lastName: 'Two',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000011',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'EUR',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer2.email);

  const buyer3 = await prisma.user.upsert({
    where: { email: 'buyer3@nextpik.com' },
    update: {},
    create: {
      email: 'buyer3@nextpik.com',
      firstName: 'Buyer',
      lastName: 'Three',
      password: testPassword,
      role: 'BUYER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000012',
      preferences: {
        create: {
          newsletter: false,
          notifications: true,
          currency: 'RWF',
          language: 'en',
          theme: 'light',
          layoutMode: 'compact',
        },
      },
    },
  });
  console.log('✅ Created BUYER:', buyer3.email);

  // ========================================
  // SELLER (3 users with Stores)
  // ========================================
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@nextpik.com' },
    update: {},
    create: {
      email: 'seller1@nextpik.com',
      firstName: 'Seller',
      lastName: 'One',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000020',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SELLER:', seller1.email);

  const seller1Store = await prisma.store.upsert({
    where: { userId: seller1.id },
    update: {},
    create: {
      name: 'Luxury Timepieces',
      slug: 'luxury-timepieces',
      description: 'Premium watches and timepieces from around the world',
      userId: seller1.id,
      status: 'ACTIVE',
      email: 'seller1@nextpik.com',
      phone: '+250788000020',
      country: 'Rwanda',
      city: 'Kigali',
    },
  });
  console.log('   └─ Created Store:', seller1Store.name);

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@nextpik.com' },
    update: {},
    create: {
      email: 'seller2@nextpik.com',
      firstName: 'Seller',
      lastName: 'Two',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000021',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'USD',
          language: 'en',
          theme: 'light',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SELLER:', seller2.email);

  const seller2Store = await prisma.store.upsert({
    where: { userId: seller2.id },
    update: {},
    create: {
      name: 'Elegant Jewelry Co',
      slug: 'elegant-jewelry-co',
      description: 'Fine jewelry and precious gems',
      userId: seller2.id,
      status: 'ACTIVE',
      email: 'seller2@nextpik.com',
      phone: '+250788000021',
      country: 'Rwanda',
      city: 'Kigali',
    },
  });
  console.log('   └─ Created Store:', seller2Store.name);

  const seller3 = await prisma.user.upsert({
    where: { email: 'seller3@nextpik.com' },
    update: {},
    create: {
      email: 'seller3@nextpik.com',
      firstName: 'Seller',
      lastName: 'Three',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000022',
      preferences: {
        create: {
          newsletter: true,
          notifications: true,
          currency: 'EUR',
          language: 'en',
          theme: 'dark',
          layoutMode: 'elegant',
        },
      },
    },
  });
  console.log('✅ Created SELLER:', seller3.email);

  const seller3Store = await prisma.store.upsert({
    where: { userId: seller3.id },
    update: {},
    create: {
      name: 'Fashion Forward',
      slug: 'fashion-forward',
      description: 'Luxury fashion and designer clothing',
      userId: seller3.id,
      status: 'ACTIVE',
      email: 'seller3@nextpik.com',
      phone: '+250788000022',
      country: 'Rwanda',
      city: 'Kigali',
    },
  });
  console.log('   └─ Created Store:', seller3Store.name);

  // Store the first seller's store for product seeding later
  const testSellerStore = seller1Store;

  // ========================================
  // CREATE CURRENCY RATES
  // ========================================
  console.log('');
  console.log('💱 Creating currency exchange rates...');

  const currencies = [
    {
      currencyCode: 'USD',
      currencyName: 'US Dollar',
      symbol: '$',
      rate: 1.000000, // Base currency
      decimalDigits: 2,
      position: 'before',
      isActive: true,
    },
    {
      currencyCode: 'EUR',
      currencyName: 'Euro',
      symbol: '€',
      rate: 0.920000, // 1 USD = 0.92 EUR
      decimalDigits: 2,
      position: 'before',
      isActive: true,
    },
    {
      currencyCode: 'GBP',
      currencyName: 'British Pound',
      symbol: '£',
      rate: 0.790000, // 1 USD = 0.79 GBP
      decimalDigits: 2,
      position: 'before',
      isActive: true,
    },
    {
      currencyCode: 'RWF',
      currencyName: 'Rwandan Franc',
      symbol: 'Fr',
      rate: 1350.000000, // 1 USD = 1350 RWF
      decimalDigits: 0,
      position: 'after',
      isActive: true,
    },
    {
      currencyCode: 'JPY',
      currencyName: 'Japanese Yen',
      symbol: '¥',
      rate: 150.000000, // 1 USD = 150 JPY
      decimalDigits: 0,
      position: 'before',
      isActive: true,
    },
    {
      currencyCode: 'CHF',
      currencyName: 'Swiss Franc',
      symbol: 'CHF',
      rate: 0.880000, // 1 USD = 0.88 CHF
      decimalDigits: 2,
      position: 'after',
      isActive: true,
    },
    {
      currencyCode: 'CAD',
      currencyName: 'Canadian Dollar',
      symbol: 'C$',
      rate: 1.360000, // 1 USD = 1.36 CAD
      decimalDigits: 2,
      position: 'before',
      isActive: true,
    },
    {
      currencyCode: 'AUD',
      currencyName: 'Australian Dollar',
      symbol: 'A$',
      rate: 1.530000, // 1 USD = 1.53 AUD
      decimalDigits: 2,
      position: 'before',
      isActive: true,
    },
  ];

  for (const currency of currencies) {
    await prisma.currencyRate.upsert({
      where: { currencyCode: currency.currencyCode },
      update: {
        rate: currency.rate,
        lastUpdated: new Date(),
      },
      create: currency,
    });
    console.log(`✅ Created currency: ${currency.currencyCode} (${currency.currencyName})`);
  }

  // Create Categories
  const watchesCategory = await prisma.category.upsert({
    where: { slug: 'watches' },
    update: {},
    create: {
      name: 'Watches',
      slug: 'watches',
      description: 'Luxury timepieces and watches from the finest brands',
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
      icon: 'Watch',
      displayOrder: 1,
      isActive: true,
    },
  });

  const jewelryCategory = await prisma.category.upsert({
    where: { slug: 'jewelry' },
    update: {},
    create: {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Exquisite jewelry and precious gems',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
      icon: 'Gem',
      displayOrder: 2,
      isActive: true,
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Premium accessories and leather goods',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
      icon: 'ShoppingBag',
      displayOrder: 3,
      isActive: true,
    },
  });

  const fashionCategory = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Luxury fashion and designer clothing',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
      icon: 'Shirt',
      displayOrder: 4,
      isActive: true,
    },
  });

  console.log('✅ Created categories');

  console.log('');
  console.log('📦 Creating luxury products...');

  // Create sample products (6+ per category)
  const products = await Promise.all([
    // ========================================
    // WATCHES CATEGORY (8 products)
    // ========================================
    prisma.product.create({
      data: {
        name: 'Chronograph Master Collection',
        slug: 'chronograph-master-collection',
        description:
          'A masterpiece of Swiss engineering, this timepiece combines precision with timeless elegance. Features automatic movement, sapphire crystal, and water resistance up to 100m. The intricate chronograph mechanism showcases horological excellence.',
        shortDescription: 'Swiss-made luxury chronograph with automatic movement',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 12500.0,
        compareAtPrice: 15000.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 5,
        heroImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
        badges: ['Featured', 'Sale'],
        colors: ['Silver', 'Gold', 'Rose Gold'],
        sizes: ['40mm', '42mm'],
        materials: ['Stainless Steel', 'Sapphire Crystal'],
        rating: 4.8,
        reviewCount: 24,
        viewCount: 450,
        likeCount: 89,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
              alt: 'Chronograph Master Collection',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'luxury' }, { name: 'swiss-made' }, { name: 'automatic' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Royal Pilot Heritage',
        slug: 'royal-pilot-heritage',
        description:
          'Inspired by aviation heritage, this pilot watch features a distinctive oversized crown, luminous markers, and exceptional readability. Built for adventurers who demand precision and style.',
        shortDescription: 'Aviation-inspired luxury timepiece',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 9800.0,
        compareAtPrice: 11500.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 8,
        heroImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
        badges: ['New Arrival'],
        colors: ['Black', 'Blue', 'Bronze'],
        sizes: ['42mm', '44mm'],
        materials: ['Titanium', 'Ceramic'],
        rating: 4.7,
        reviewCount: 31,
        viewCount: 520,
        likeCount: 102,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
              alt: 'Royal Pilot Heritage',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'pilot' }, { name: 'aviation' }, { name: 'heritage' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Elegance Dress Watch',
        slug: 'elegance-dress-watch',
        description:
          'Ultra-thin dress watch with minimalist design. Perfect for formal occasions, featuring a hand-finished dial, alligator leather strap, and elegant Roman numerals.',
        shortDescription: 'Ultra-thin dress watch with minimalist design',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 6500.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 12,
        heroImage: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa',
        badges: ['Best Seller'],
        colors: ['White', 'Black', 'Champagne'],
        sizes: ['38mm', '40mm'],
        materials: ['White Gold', 'Alligator Leather'],
        rating: 4.9,
        reviewCount: 45,
        viewCount: 680,
        likeCount: 145,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa',
              alt: 'Elegance Dress Watch',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'dress' }, { name: 'formal' }, { name: 'minimalist' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Diver Professional 300M',
        slug: 'diver-professional-300m',
        description:
          'Professional diving watch with 300m water resistance, helium escape valve, and unidirectional rotating bezel. Built to withstand the most demanding underwater conditions.',
        shortDescription: 'Professional dive watch with 300m resistance',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 8900.0,
        compareAtPrice: 10200.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 6,
        heroImage: 'https://images.unsplash.com/photo-1639006570490-79c0c53f1080',
        badges: ['Sale'],
        colors: ['Black', 'Blue', 'Green'],
        sizes: ['42mm', '44mm'],
        materials: ['Stainless Steel', 'Ceramic Bezel'],
        rating: 4.8,
        reviewCount: 28,
        viewCount: 390,
        likeCount: 76,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1639006570490-79c0c53f1080',
              alt: 'Diver Professional 300M',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'dive' }, { name: 'professional' }, { name: 'waterproof' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Moonphase Complication',
        slug: 'moonphase-complication',
        description:
          'Sophisticated moonphase watch with perpetual calendar. This masterpiece displays the lunar cycle with poetic precision, complemented by date, day, and month indicators.',
        shortDescription: 'Moonphase watch with perpetual calendar',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 18500.0,
        compareAtPrice: 22000.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 3,
        heroImage: 'https://images.unsplash.com/photo-1587836374441-4cfbdf08a17d',
        badges: ['Limited Edition', 'Featured'],
        colors: ['Rose Gold', 'White Gold'],
        sizes: ['40mm'],
        materials: ['18k Gold', 'Sapphire Crystal'],
        rating: 5.0,
        reviewCount: 12,
        viewCount: 290,
        likeCount: 98,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1587836374441-4cfbdf08a17d',
              alt: 'Moonphase Complication',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'moonphase' }, { name: 'complication' }, { name: 'calendar' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Skeleton Automatic Reserve',
        slug: 'skeleton-automatic-reserve',
        description:
          'Architectural masterpiece with skeletonized dial revealing the intricate automatic movement. Features 72-hour power reserve and exhibition case back.',
        shortDescription: 'Skeletonized automatic with power reserve',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 14200.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 4,
        heroImage: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3',
        badges: ['New'],
        colors: ['Black', 'Silver'],
        sizes: ['42mm', '44mm'],
        materials: ['Titanium', 'Sapphire'],
        rating: 4.7,
        reviewCount: 19,
        viewCount: 340,
        likeCount: 71,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3',
              alt: 'Skeleton Automatic Reserve',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'skeleton' }, { name: 'automatic' }, { name: 'exhibition' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'GMT World Timer',
        slug: 'gmt-world-timer',
        description:
          'Perfect for the global traveler. Features dual time zones, 24-hour GMT hand, and world cities ring. Track time across continents with elegance and precision.',
        shortDescription: 'Dual timezone GMT watch for travelers',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 11800.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 7,
        heroImage: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8',
        badges: ['Travel'],
        colors: ['Blue', 'Black', 'Pepsi'],
        sizes: ['40mm', '42mm'],
        materials: ['Stainless Steel', 'Ceramic'],
        rating: 4.6,
        reviewCount: 35,
        viewCount: 420,
        likeCount: 88,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8',
              alt: 'GMT World Timer',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'gmt' }, { name: 'travel' }, { name: 'dual-timezone' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Racing Chronograph Carbon',
        slug: 'racing-chronograph-carbon',
        description:
          'Inspired by motorsports, this carbon fiber chronograph delivers exceptional performance. Features tachymeter scale, carbon composite case, and racing strap.',
        shortDescription: 'Motorsport-inspired carbon chronograph',
        categoryId: watchesCategory.id,
        storeId: testSellerStore.id,
        price: 10500.0,
        compareAtPrice: 12800.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 9,
        heroImage: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7',
        badges: ['Sport', 'Sale'],
        colors: ['Black', 'Red', 'Blue'],
        sizes: ['44mm', '46mm'],
        materials: ['Carbon Fiber', 'Titanium'],
        rating: 4.7,
        reviewCount: 27,
        viewCount: 510,
        likeCount: 94,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7',
              alt: 'Racing Chronograph Carbon',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'racing' }, { name: 'sport' }, { name: 'carbon' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Diamond Pendant Necklace',
        slug: 'diamond-pendant-necklace',
        description:
          'Exquisite 18k white gold necklace featuring a stunning 2-carat diamond pendant. Certified conflict-free diamond with excellent cut and clarity.',
        shortDescription: '18k white gold with 2ct diamond',
        categoryId: jewelryCategory.id,
        price: 8750.0,
        compareAtPrice: 10500.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 3,
        heroImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
        badges: ['New', 'Limited Edition'],
        colors: ['White Gold', 'Yellow Gold', 'Rose Gold'],
        materials: ['18k Gold', 'Diamond'],
        rating: 4.9,
        reviewCount: 18,
        viewCount: 320,
        likeCount: 67,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
              alt: 'Diamond Pendant Necklace',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'diamonds' }, { name: '18k-gold' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Italian Leather Handbag',
        slug: 'italian-leather-handbag',
        description:
          'Handcrafted from the finest Italian leather, this handbag is the epitome of sophistication. Features gold-plated hardware and signature interior lining.',
        shortDescription: 'Handcrafted Italian leather',
        categoryId: accessoriesCategory.id,
        price: 2850.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 12,
        heroImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
        badges: ['Bestseller'],
        colors: ['Black', 'Brown', 'Navy', 'Burgundy'],
        materials: ['Italian Leather', 'Gold-Plated Hardware'],
        rating: 4.7,
        reviewCount: 42,
        viewCount: 680,
        likeCount: 123,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
              alt: 'Italian Leather Handbag',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'leather' }, { name: 'italian' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cashmere Sweater',
        slug: 'cashmere-sweater',
        description:
          '100% pure cashmere sweater from the finest Mongolian goats. Ultra-soft, lightweight, and incredibly warm.',
        shortDescription: '100% pure Mongolian cashmere',
        categoryId: fashionCategory.id,
        price: 895.0,
        compareAtPrice: 1200.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 25,
        heroImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105',
        badges: ['Sale'],
        colors: ['Charcoal', 'Camel', 'Navy', 'Ivory'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        materials: ['100% Cashmere'],
        rating: 4.6,
        reviewCount: 31,
        viewCount: 290,
        likeCount: 56,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105',
              alt: 'Cashmere Sweater',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'cashmere' }, { name: 'knitwear' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Designer Sunglasses',
        slug: 'designer-sunglasses',
        description:
          'Iconic aviator sunglasses with polarized lenses and titanium frame. UV400 protection with anti-reflective coating.',
        shortDescription: 'Polarized titanium aviators',
        categoryId: accessoriesCategory.id,
        price: 495.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 40,
        heroImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083',
        badges: ['New'],
        colors: ['Gold', 'Silver', 'Black'],
        materials: ['Titanium', 'Polarized Glass'],
        rating: 4.5,
        reviewCount: 15,
        viewCount: 185,
        likeCount: 34,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083',
              alt: 'Designer Sunglasses',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'sunglasses' }, { name: 'eyewear' }],
        },
      },
    }),

    // Additional Jewelry Products
    prisma.product.create({
      data: {
        name: 'Emerald Drop Earrings',
        slug: 'emerald-drop-earrings',
        description:
          'Stunning Colombian emerald drop earrings set in platinum. Each earring features a 1.5-carat emerald surrounded by brilliant-cut diamonds. Handcrafted by master jewelers with a secure screw-back closure.',
        shortDescription: 'Platinum earrings with Colombian emeralds',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 15500.0,
        compareAtPrice: 18000.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 2,
        heroImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
        badges: ['Limited Edition', 'Sale'],
        colors: ['Platinum', 'White Gold'],
        materials: ['Platinum', 'Emerald', 'Diamond'],
        rating: 5.0,
        reviewCount: 12,
        viewCount: 280,
        likeCount: 92,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
              alt: 'Emerald Drop Earrings',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'emerald' }, { name: 'platinum' }, { name: 'earrings' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Diamond Tennis Bracelet',
        slug: 'diamond-tennis-bracelet',
        description:
          'Classic tennis bracelet featuring 50 round brilliant diamonds totaling 10 carats. Set in 18k white gold with a secure clasp. Perfect for any occasion, from casual to formal.',
        shortDescription: '10ct diamond tennis bracelet in 18k white gold',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 22500.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 4,
        heroImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
        badges: ['Bestseller', 'Featured'],
        colors: ['White Gold', 'Yellow Gold', 'Platinum'],
        materials: ['18k Gold', 'Diamond'],
        rating: 4.9,
        reviewCount: 28,
        viewCount: 520,
        likeCount: 145,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
              alt: 'Diamond Tennis Bracelet',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'diamonds' }, { name: 'bracelet' }, { name: 'luxury' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sapphire Cocktail Ring',
        slug: 'sapphire-cocktail-ring',
        description:
          'Bold statement ring featuring a 5-carat Ceylon sapphire center stone surrounded by a halo of white diamonds. Crafted in 18k yellow gold with intricate filigree details on the band.',
        shortDescription: '5ct Ceylon sapphire with diamond halo',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 12800.0,
        compareAtPrice: 15000.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 6,
        heroImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
        badges: ['Sale', 'New'],
        colors: ['Yellow Gold', 'White Gold', 'Rose Gold'],
        sizes: ['5', '6', '7', '8', '9'],
        materials: ['18k Gold', 'Sapphire', 'Diamond'],
        rating: 4.8,
        reviewCount: 19,
        viewCount: 340,
        likeCount: 78,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
              alt: 'Sapphire Cocktail Ring',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'sapphire' }, { name: 'ring' }, { name: 'cocktail' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pearl Strand Necklace',
        slug: 'pearl-strand-necklace',
        description:
          'Timeless South Sea pearl necklace with 18-inch strand of perfectly matched 10-11mm pearls. Features a 14k white gold clasp adorned with diamonds. Comes with authentication certificate.',
        shortDescription: 'South Sea pearl necklace with diamond clasp',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 9500.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 5,
        heroImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
        badges: ['Classic', 'Certified'],
        colors: ['White', 'Golden', 'Black'],
        materials: ['South Sea Pearl', '14k Gold', 'Diamond'],
        rating: 4.7,
        reviewCount: 22,
        viewCount: 410,
        likeCount: 95,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
              alt: 'Pearl Strand Necklace',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'pearls' }, { name: 'necklace' }, { name: 'classic' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ruby Stud Earrings',
        slug: 'ruby-stud-earrings',
        description:
          'Elegant Burmese ruby stud earrings showcasing two perfectly matched 2-carat rubies. Set in platinum with secure push-back closures. Pigeon blood red color with exceptional clarity.',
        shortDescription: 'Burmese ruby studs in platinum',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 18500.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 3,
        heroImage: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638',
        badges: ['Limited Edition', 'Premium'],
        colors: ['Platinum', 'White Gold'],
        materials: ['Platinum', 'Ruby'],
        rating: 4.9,
        reviewCount: 14,
        viewCount: 295,
        likeCount: 88,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638',
              alt: 'Ruby Stud Earrings',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'ruby' }, { name: 'earrings' }, { name: 'premium' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gold Chain Bracelet',
        slug: 'gold-chain-bracelet',
        description:
          'Luxurious 18k yellow gold curb chain bracelet with substantial weight and presence. Features a secure lobster clasp. Unisex design suitable for stacking or wearing alone.',
        shortDescription: '18k gold curb chain bracelet',
        categoryId: jewelryCategory.id,
        storeId: testSellerStore.id,
        price: 4500.0,
        compareAtPrice: 5200.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 10,
        heroImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
        badges: ['Bestseller'],
        colors: ['Yellow Gold', 'White Gold', 'Rose Gold'],
        materials: ['18k Gold'],
        rating: 4.6,
        reviewCount: 35,
        viewCount: 580,
        likeCount: 112,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
              alt: 'Gold Chain Bracelet',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'jewelry' }, { name: 'gold' }, { name: 'bracelet' }, { name: 'unisex' }],
        },
      },
    }),

    // Additional Accessories Products
    prisma.product.create({
      data: {
        name: 'Silk Scarf Collection',
        slug: 'silk-scarf-collection',
        description:
          'Exquisite hand-painted silk scarf featuring an original artistic design. Made from 100% mulberry silk with hand-rolled edges. Perfect accessory to elevate any outfit.',
        shortDescription: 'Hand-painted 100% mulberry silk scarf',
        categoryId: accessoriesCategory.id,
        storeId: testSellerStore.id,
        price: 395.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 20,
        heroImage: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26',
        badges: ['New Arrival', 'Artisan'],
        colors: ['Multi-Color', 'Navy', 'Burgundy', 'Forest Green'],
        materials: ['100% Silk'],
        rating: 4.8,
        reviewCount: 26,
        viewCount: 340,
        likeCount: 67,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26',
              alt: 'Silk Scarf Collection',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'silk' }, { name: 'scarf' }, { name: 'artisan' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Premium Leather Belt',
        slug: 'premium-leather-belt',
        description:
          'Full-grain Italian leather belt with brushed nickel buckle. Handcrafted with attention to detail and reinforced stitching. Available in classic colors to complement any wardrobe.',
        shortDescription: 'Italian leather belt with nickel buckle',
        categoryId: accessoriesCategory.id,
        storeId: testSellerStore.id,
        price: 285.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 35,
        heroImage: 'https://images.unsplash.com/photo-1624222247344-550fb60583bb',
        badges: ['Bestseller'],
        colors: ['Black', 'Brown', 'Cognac'],
        sizes: ['30', '32', '34', '36', '38', '40'],
        materials: ['Italian Leather', 'Nickel'],
        rating: 4.5,
        reviewCount: 48,
        viewCount: 620,
        likeCount: 89,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1624222247344-550fb60583bb',
              alt: 'Premium Leather Belt',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'leather' }, { name: 'belt' }, { name: 'menswear' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Designer Wallet',
        slug: 'designer-wallet',
        description:
          'Minimalist bi-fold wallet crafted from premium Saffiano leather. Features RFID protection, multiple card slots, and a bill compartment. Sleek design fits comfortably in any pocket.',
        shortDescription: 'Saffiano leather wallet with RFID protection',
        categoryId: accessoriesCategory.id,
        storeId: testSellerStore.id,
        price: 425.0,
        compareAtPrice: 550.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 28,
        heroImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93',
        badges: ['Sale', 'RFID'],
        colors: ['Black', 'Navy', 'Brown'],
        materials: ['Saffiano Leather', 'RFID Shield'],
        rating: 4.7,
        reviewCount: 52,
        viewCount: 780,
        likeCount: 134,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1627123424574-724758594e93',
              alt: 'Designer Wallet',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'wallet' }, { name: 'leather' }, { name: 'rfid' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Platinum Cufflinks Set',
        slug: 'platinum-cufflinks-set',
        description:
          'Sophisticated cufflinks crafted from solid platinum with subtle diamond accents. Presented in a luxury gift box. Perfect for formal occasions or as a distinguished gift.',
        shortDescription: 'Platinum cufflinks with diamond accents',
        categoryId: accessoriesCategory.id,
        storeId: testSellerStore.id,
        price: 1850.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 15,
        heroImage: 'https://images.unsplash.com/photo-1603561596112-0a132b757442',
        badges: ['Premium', 'Gift Ready'],
        colors: ['Platinum'],
        materials: ['Platinum', 'Diamond'],
        rating: 4.9,
        reviewCount: 17,
        viewCount: 210,
        likeCount: 56,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442',
              alt: 'Platinum Cufflinks Set',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'cufflinks' }, { name: 'platinum' }, { name: 'formal' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Leather Travel Duffle',
        slug: 'leather-travel-duffle',
        description:
          'Spacious weekend duffle bag handcrafted from full-grain leather. Features brass hardware, adjustable shoulder strap, and multiple interior pockets. Ages beautifully with use.',
        shortDescription: 'Full-grain leather weekend duffle',
        categoryId: accessoriesCategory.id,
        storeId: testSellerStore.id,
        price: 1650.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 8,
        heroImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
        badges: ['Bestseller', 'Premium'],
        colors: ['Brown', 'Black', 'Tan'],
        materials: ['Full-Grain Leather', 'Brass Hardware'],
        rating: 4.8,
        reviewCount: 31,
        viewCount: 495,
        likeCount: 98,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
              alt: 'Leather Travel Duffle',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'accessories' }, { name: 'leather' }, { name: 'duffle' }, { name: 'travel' }],
        },
      },
    }),

    // Additional Fashion Products
    prisma.product.create({
      data: {
        name: 'Tailored Blazer',
        slug: 'tailored-blazer',
        description:
          'Impeccably tailored single-breasted blazer crafted from Italian wool. Features peak lapels, working cuff buttons, and a slim modern fit. Fully lined with interior pockets.',
        shortDescription: 'Italian wool tailored blazer',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 1450.0,
        compareAtPrice: 1800.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 18,
        heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
        badges: ['Sale', 'Tailored'],
        colors: ['Navy', 'Charcoal', 'Black'],
        sizes: ['36', '38', '40', '42', '44', '46'],
        materials: ['Italian Wool', 'Viscose Lining'],
        rating: 4.7,
        reviewCount: 29,
        viewCount: 520,
        likeCount: 87,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
              alt: 'Tailored Blazer',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'blazer' }, { name: 'tailored' }, { name: 'menswear' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Silk Evening Dress',
        slug: 'silk-evening-dress',
        description:
          'Stunning floor-length evening gown in luxurious silk charmeuse. Features an elegant A-line silhouette, cowl neckline, and invisible side zipper. Perfect for galas and special occasions.',
        shortDescription: 'Silk charmeuse evening gown',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 2850.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 12,
        heroImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae',
        badges: ['Evening', 'Premium'],
        colors: ['Midnight Blue', 'Emerald', 'Burgundy', 'Black'],
        sizes: ['0', '2', '4', '6', '8', '10', '12'],
        materials: ['100% Silk Charmeuse'],
        rating: 4.9,
        reviewCount: 16,
        viewCount: 380,
        likeCount: 124,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae',
              alt: 'Silk Evening Dress',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'dress' }, { name: 'evening' }, { name: 'silk' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Designer Silk Blouse',
        slug: 'designer-silk-blouse',
        description:
          'Timeless silk blouse with French cuffs and mother-of-pearl buttons. Made from premium mulberry silk with a relaxed fit. Versatile piece suitable for business or evening wear.',
        shortDescription: 'Premium mulberry silk blouse',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 685.0,
        compareAtPrice: 850.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 22,
        heroImage: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e',
        badges: ['Sale', 'Versatile'],
        colors: ['Ivory', 'Blush', 'Navy', 'Black'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        materials: ['100% Mulberry Silk'],
        rating: 4.6,
        reviewCount: 38,
        viewCount: 460,
        likeCount: 72,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e',
              alt: 'Designer Silk Blouse',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'blouse' }, { name: 'silk' }, { name: 'versatile' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Premium Denim Jeans',
        slug: 'premium-denim-jeans',
        description:
          'Japanese selvedge denim jeans with a modern slim fit. Crafted on vintage shuttle looms for superior quality. Features leather patch, copper rivets, and meticulous construction.',
        shortDescription: 'Japanese selvedge denim slim fit',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 385.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 40,
        heroImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
        badges: ['Bestseller', 'Japanese Denim'],
        colors: ['Indigo', 'Black', 'Light Wash'],
        sizes: ['28', '29', '30', '31', '32', '33', '34', '36'],
        materials: ['Japanese Selvedge Denim', 'Leather', 'Copper'],
        rating: 4.8,
        reviewCount: 67,
        viewCount: 890,
        likeCount: 156,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
              alt: 'Premium Denim Jeans',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'jeans' }, { name: 'denim' }, { name: 'japanese' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Merino Wool Coat',
        slug: 'merino-wool-coat',
        description:
          'Elegant double-breasted coat made from 100% Australian merino wool. Features a luxurious belted waist, notch collar, and satin lining. Timeless design for any wardrobe.',
        shortDescription: '100% merino wool double-breasted coat',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 1850.0,
        status: 'ACTIVE',
        featured: true,
        inventory: 14,
        heroImage: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3',
        badges: ['Premium', 'Timeless'],
        colors: ['Camel', 'Navy', 'Black', 'Grey'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        materials: ['100% Merino Wool', 'Satin Lining'],
        rating: 4.9,
        reviewCount: 23,
        viewCount: 410,
        likeCount: 102,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3',
              alt: 'Merino Wool Coat',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'coat' }, { name: 'wool' }, { name: 'outerwear' }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cashmere Turtleneck',
        slug: 'cashmere-turtleneck',
        description:
          '2-ply cashmere turtleneck sweater from Italian yarn. Ultra-soft with a refined ribbed texture. Perfect layering piece that combines comfort with sophistication.',
        shortDescription: 'Italian 2-ply cashmere turtleneck',
        categoryId: fashionCategory.id,
        storeId: testSellerStore.id,
        price: 695.0,
        compareAtPrice: 850.0,
        status: 'ACTIVE',
        featured: false,
        inventory: 30,
        heroImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27',
        badges: ['Sale', 'Italian'],
        colors: ['Black', 'Navy', 'Camel', 'Grey', 'Cream'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        materials: ['100% Italian Cashmere'],
        rating: 4.7,
        reviewCount: 44,
        viewCount: 580,
        likeCount: 93,
        images: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27',
              alt: 'Cashmere Turtleneck',
              width: 1200,
              height: 1200,
              isPrimary: true,
              displayOrder: 1,
            },
          ],
        },
        tags: {
          create: [{ name: 'fashion' }, { name: 'cashmere' }, { name: 'turtleneck' }, { name: 'knitwear' }],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} sample products`);

  // ============================================================================
  // SYSTEM SETTINGS - Escrow & Payout Configuration
  // ============================================================================
  console.log('⚙️  Seeding system settings...');

  const settings = await Promise.all([
    // Escrow Settings
    prisma.systemSetting.upsert({
      where: { key: 'escrow_enabled' },
      update: {},
      create: {
        key: 'escrow_enabled',
        category: 'payment',
        value: true,
        valueType: 'BOOLEAN',
        label: 'Enable Escrow (Default Payment Model)',
        description: 'When enabled, all payments go through escrow and funds are held until delivery confirmation. This is the core payment mechanism and should remain enabled for marketplace security.',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: true,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'escrow_immediate_payout_enabled' },
      update: {},
      create: {
        key: 'escrow_immediate_payout_enabled',
        category: 'payment',
        value: false,
        valueType: 'BOOLEAN',
        label: 'Enable Immediate Payouts (Testing/Trusted Sellers)',
        description: 'When enabled, allows immediate payouts bypassing escrow for trusted sellers. Should be DISABLED in production. Only enable for testing or specific trusted seller accounts.',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: false,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'escrow_hold_period_days' },
      update: {},
      create: {
        key: 'escrow_hold_period_days',
        category: 'payment',
        value: 7,
        valueType: 'NUMBER',
        label: 'Escrow Hold Period (Days)',
        description: 'Number of days to hold funds in escrow after delivery confirmation before auto-releasing to seller. Recommended: 3-7 days for buyer protection.',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 7,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'escrow_auto_release_enabled' },
      update: {},
      create: {
        key: 'escrow_auto_release_enabled',
        category: 'payment',
        value: true,
        valueType: 'BOOLEAN',
        label: 'Enable Auto-Release of Escrow',
        description: 'Automatically release funds to seller after hold period expires. If disabled, requires manual admin approval for every payout.',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: true,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    // Payout Settings
    prisma.systemSetting.upsert({
      where: { key: 'payout_minimum_amount' },
      update: {},
      create: {
        key: 'payout_minimum_amount',
        category: 'payout',
        value: 50.00,
        valueType: 'NUMBER',
        label: 'Minimum Payout Amount (USD)',
        description: 'Minimum accumulated earnings required before triggering a payout to seller. Prevents small transaction fees.',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 50.00,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'payout_default_frequency' },
      update: {},
      create: {
        key: 'payout_default_frequency',
        category: 'payout',
        value: 'WEEKLY',
        valueType: 'STRING',
        label: 'Default Payout Frequency',
        description: 'Default frequency for automated seller payouts: DAILY, WEEKLY, BIWEEKLY, or MONTHLY. Sellers can customize their preference.',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 'WEEKLY',
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'payout_auto_schedule_enabled' },
      update: {},
      create: {
        key: 'payout_auto_schedule_enabled',
        category: 'payout',
        value: true,
        valueType: 'BOOLEAN',
        label: 'Enable Automated Payout Scheduler',
        description: 'Automatically process payouts based on seller frequency preferences and minimum thresholds. If disabled, all payouts require manual processing.',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: true,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    // Audit & Logging
    prisma.systemSetting.upsert({
      where: { key: 'audit_log_all_escrow_actions' },
      update: {},
      create: {
        key: 'audit_log_all_escrow_actions',
        category: 'security',
        value: true,
        valueType: 'BOOLEAN',
        label: 'Log All Escrow Actions',
        description: 'Maintain full audit trail of all escrow releases, refunds, and modifications. Required for financial compliance and dispute resolution.',
        isPublic: false,
        isEditable: false,
        requiresRestart: false,
        defaultValue: true,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'audit_log_retention_days' },
      update: {},
      create: {
        key: 'audit_log_retention_days',
        category: 'security',
        value: 2555, // 7 years
        valueType: 'NUMBER',
        label: 'Audit Log Retention (Days)',
        description: 'Number of days to retain audit logs. Financial regulations typically require 7 years (2555 days) for transaction records.',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 2555,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    // Commission & Fee Settings
    prisma.systemSetting.upsert({
      where: { key: 'commission_default_rate' },
      update: {},
      create: {
        key: 'commission_default_rate',
        category: 'commission',
        value: 10.0,
        valueType: 'NUMBER',
        label: 'Default Platform Commission (%)',
        description: 'Default commission percentage charged on each transaction. Can be overridden per category or seller.',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 10.0,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'global_commission_rate' },
      update: {},
      create: {
        key: 'global_commission_rate',
        category: 'commission',
        value: 15,
        valueType: 'NUMBER',
        label: 'Global Commission Rate (%)',
        description: 'Default platform commission rate (percentage)',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 15,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'commission_type' },
      update: {},
      create: {
        key: 'commission_type',
        category: 'commission',
        value: 'PERCENTAGE',
        valueType: 'STRING',
        label: 'Commission Type',
        description: 'How commission is calculated',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 'PERCENTAGE',
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'commission_applies_to_shipping' },
      update: {},
      create: {
        key: 'commission_applies_to_shipping',
        category: 'commission',
        value: false,
        valueType: 'BOOLEAN',
        label: 'Apply Commission to Shipping',
        description: 'Include shipping costs in commission calculation',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: false,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'commission_min_amount' },
      update: {},
      create: {
        key: 'commission_min_amount',
        category: 'commission',
        value: 0.50,
        valueType: 'NUMBER',
        label: 'Minimum Commission Amount (USD)',
        description: 'Minimum commission charged per transaction regardless of rate',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 0.50,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'commission_max_amount' },
      update: {},
      create: {
        key: 'commission_max_amount',
        category: 'commission',
        value: 0,
        valueType: 'NUMBER',
        label: 'Maximum Commission Amount (USD)',
        description: 'Maximum commission cap per transaction (0 = no maximum)',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 0,
        lastUpdatedBy: superAdmin.id,
      },
    }),

    prisma.systemSetting.upsert({
      where: { key: 'commission_fixed_fee' },
      update: {},
      create: {
        key: 'commission_fixed_fee',
        category: 'commission',
        value: 0.30,
        valueType: 'NUMBER',
        label: 'Fixed Commission Fee (USD)',
        description: 'Fixed fee added to every transaction (similar to Stripe fee)',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 0.30,
        lastUpdatedBy: superAdmin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${settings.length} system settings`);

  // ============================================================================
  // SUBSCRIPTION SYSTEM SETTINGS
  // ============================================================================
  console.log('📋 Creating subscription system settings...');

  const subscriptionSettings = [
    // General
    {
      key: 'subscription_system_enabled',
      value: true,
      valueType: 'BOOLEAN',
      category: 'subscription',
      label: 'Enable Subscription System',
      description: 'Enable/disable the subscription system for inquiry-based products',
      isPublic: false,
      isEditable: true,
    },
    {
      key: 'subscription_product_types',
      value: ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'],
      valueType: 'ARRAY',
      category: 'subscription',
      label: 'Subscription Product Types',
      description: 'Product types that require subscription (inquiry-based)',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'commission_product_types',
      value: ['PHYSICAL', 'DIGITAL'],
      valueType: 'ARRAY',
      category: 'subscription',
      label: 'Commission Product Types',
      description: 'Product types that use commission model (cart-based)',
      isPublic: true,
      isEditable: true,
    },

    // Credit Costs
    {
      key: 'credit_cost_list_service',
      value: 2,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: List Service',
      description: 'Credits required to list a SERVICE product',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_list_rental',
      value: 2,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: List Rental',
      description: 'Credits required to list a RENTAL product',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_list_vehicle',
      value: 5,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: List Vehicle',
      description: 'Credits required to list a VEHICLE product',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_list_real_estate',
      value: 10,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: List Real Estate',
      description: 'Credits required to list a REAL_ESTATE product',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_feature_7_days',
      value: 3,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: Feature 7 Days',
      description: 'Credits to feature a listing for 7 days',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_feature_30_days',
      value: 10,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: Feature 30 Days',
      description: 'Credits to feature a listing for 30 days',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_boost_to_top',
      value: 2,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: Boost to Top',
      description: 'Credits to boost listing to top of search',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'credit_cost_renew_listing',
      value: 1,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Credit Cost: Renew Listing',
      description: 'Credits to renew an expired listing',
      isPublic: true,
      isEditable: true,
    },

    // Credit Expiration
    {
      key: 'subscription_credits_expiry_days',
      value: 90,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'Subscription Credits Expiry (Days)',
      description: 'Days until subscription credits expire (0 = never)',
      isPublic: false,
      isEditable: true,
    },
    {
      key: 'purchased_credits_expire',
      value: false,
      valueType: 'BOOLEAN',
      category: 'subscription',
      label: 'Purchased Credits Expire',
      description: 'Whether purchased credits expire',
      isPublic: false,
      isEditable: true,
    },

    // Minimum Tier Requirements
    {
      key: 'min_tier_service',
      value: 'FREE',
      valueType: 'STRING',
      category: 'subscription',
      label: 'Minimum Tier: Service',
      description: 'Minimum subscription tier to list SERVICE products',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'min_tier_rental',
      value: 'STARTER',
      valueType: 'STRING',
      category: 'subscription',
      label: 'Minimum Tier: Rental',
      description: 'Minimum subscription tier to list RENTAL products',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'min_tier_vehicle',
      value: 'STARTER',
      valueType: 'STRING',
      category: 'subscription',
      label: 'Minimum Tier: Vehicle',
      description: 'Minimum subscription tier to list VEHICLE products',
      isPublic: true,
      isEditable: true,
    },
    {
      key: 'min_tier_real_estate',
      value: 'PROFESSIONAL',
      valueType: 'STRING',
      category: 'subscription',
      label: 'Minimum Tier: Real Estate',
      description: 'Minimum subscription tier to list REAL_ESTATE products',
      isPublic: true,
      isEditable: true,
    },

    // Bonuses
    {
      key: 'new_seller_bonus_credits',
      value: 5,
      valueType: 'NUMBER',
      category: 'subscription',
      label: 'New Seller Bonus Credits',
      description: 'Bonus credits for new sellers (0 = disabled)',
      isPublic: false,
      isEditable: true,
    },
  ];

  for (const setting of subscriptionSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Created ${subscriptionSettings.length} subscription settings`);

  // ============================================================================
  // SUBSCRIPTION PLANS
  // ============================================================================
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

  // ============================================================================
  // CREDIT PACKAGES
  // ============================================================================
  console.log('💳 Creating credit packages...');

  const creditPackages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for trying out premium features',
      credits: 10,
      price: 9.99,
      currency: 'USD',
      savingsPercent: 0,
      savingsLabel: null,
      isPopular: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Value Bundle',
      description: 'Great value for regular sellers',
      credits: 25,
      price: 19.99,
      currency: 'USD',
      savingsPercent: 20,
      savingsLabel: 'Save 20%',
      isPopular: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Pro Pack',
      description: 'Most popular choice',
      credits: 50,
      price: 34.99,
      currency: 'USD',
      savingsPercent: 30,
      savingsLabel: 'Best Value',
      isPopular: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Business Bundle',
      description: 'For high-volume sellers',
      credits: 100,
      price: 59.99,
      currency: 'USD',
      savingsPercent: 40,
      savingsLabel: 'Save 40%',
      isPopular: false,
      isActive: true,
      displayOrder: 4,
    },
    {
      name: 'Enterprise Pack',
      description: 'Maximum credits at the best rate',
      credits: 250,
      price: 124.99,
      currency: 'USD',
      savingsPercent: 50,
      savingsLabel: 'Save 50%',
      isPopular: false,
      isActive: true,
      displayOrder: 5,
    },
  ];

  for (const pkg of creditPackages) {
    await prisma.creditPackage.upsert({
      where: { id: `pkg_${pkg.credits}` },
      update: pkg,
      create: {
        id: `pkg_${pkg.credits}`,
        ...pkg,
      },
    });
  }
  console.log(`✅ Created ${creditPackages.length} credit packages`);

  // ============================================================================
  // ADVERTISEMENT PLANS
  // ============================================================================
  console.log('📢 Creating advertisement plans...');

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
        'HOMEPAGE_HERO',
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
  }
  console.log(`✅ Created ${advertisementPlans.length} advertisement plans`);

  // ============================================================================
  // DELIVERY PROVIDERS & PARTNERS
  // ============================================================================
  console.log('');
  console.log('🚚 Seeding delivery providers...');

  // Create Delivery Providers
  const fedex = await prisma.deliveryProvider.upsert({
    where: { slug: 'fedex' },
    update: {},
    create: {
      name: 'FedEx',
      slug: 'fedex',
      type: 'API_INTEGRATED',
      serviceType: 'INTERNATIONAL',
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
      serviceType: 'INTERNATIONAL',
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
      serviceType: 'INTERNATIONAL',
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
    where: { slug: 'nextpik-express' },
    update: {},
    create: {
      name: 'NextPik Express',
      slug: 'nextpik-express',
      type: 'PARTNER',
      serviceType: 'LOCAL',
      description: 'Premium local delivery service for luxury goods - Serving Rwanda, Uganda, and Kenya',
      contactEmail: 'contact@nextpikexpress.com',
      contactPhone: '+250-788-123-456',
      website: 'https://nextpikexpress.com',
      apiEnabled: false,
      countries: ['RW', 'UG', 'KE'],
      commissionType: 'PERCENTAGE',
      commissionRate: 10.0,
      isActive: true,
      verificationStatus: 'VERIFIED',
      logo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55',
    },
  });

  console.log('✅ Created 4 delivery providers (FedEx, UPS, DHL, NextPik Express)');

  // ========================================
  // DELIVERY_PARTNER (2 users)
  // ========================================
  console.log('');
  console.log('🚚 Creating delivery partner test users...');

  const deliverypartner1 = await prisma.user.upsert({
    where: { email: 'deliverypartner1@nextpik.com' },
    update: {},
    create: {
      email: 'deliverypartner1@nextpik.com',
      firstName: 'Delivery',
      lastName: 'Partner One',
      password: testPassword,
      role: 'DELIVERY_PARTNER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000030',
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
  console.log('✅ Created DELIVERY_PARTNER:', deliverypartner1.email);
  console.log('   └─ Provider: NextPik Express');

  const deliverypartner2 = await prisma.user.upsert({
    where: { email: 'deliverypartner2@nextpik.com' },
    update: {},
    create: {
      email: 'deliverypartner2@nextpik.com',
      firstName: 'Delivery',
      lastName: 'Partner Two',
      password: testPassword,
      role: 'DELIVERY_PARTNER',
      emailVerified: true,
      isActive: true,
      phone: '+250788000031',
      deliveryProviderId: fedex.id,
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
  console.log('✅ Created DELIVERY_PARTNER:', deliverypartner2.email);
  console.log('   └─ Provider: FedEx');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 TEST ACCOUNT CREDENTIALS (Password: Password123!)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔵 SUPER_ADMIN (1 user):');
  console.log('   superadmin@nextpik.com');
  console.log('');
  console.log('🟢 ADMIN (2 users):');
  console.log('   admin1@nextpik.com');
  console.log('   admin2@nextpik.com');
  console.log('');
  console.log('🟡 BUYER (3 users):');
  console.log('   buyer1@nextpik.com');
  console.log('   buyer2@nextpik.com');
  console.log('   buyer3@nextpik.com');
  console.log('');
  console.log('🟣 SELLER (3 users with Stores):');
  console.log('   seller1@nextpik.com → Luxury Timepieces');
  console.log('   seller2@nextpik.com → Elegant Jewelry Co');
  console.log('   seller3@nextpik.com → Fashion Forward');
  console.log('');
  console.log('🚚 DELIVERY_PARTNER (2 users):');
  console.log('   deliverypartner1@nextpik.com → NextPik Express');
  console.log('   deliverypartner2@nextpik.com → FedEx');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔑 All passwords: Password123!');
  console.log('🔗 Login URL: http://localhost:3000/auth/login');
  console.log('📄 Full test users list: See TEST_USERS.md');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
