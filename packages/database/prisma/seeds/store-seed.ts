import { PrismaClient, ProductType, PurchaseType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Comprehensive Store Seed Data
 * Creates a fully populated store with diverse products for testing
 */
async function seedComprehensiveStore() {
  console.log('');
  console.log('='.repeat(70));
  console.log('  LUXURY TIMEPIECES CO - Complete Store Seed');
  console.log('='.repeat(70));
  console.log('');

  const testPassword = await bcrypt.hash('Password123!', 10);

  // ============================================================================
  // STEP 1: Create or Get Seller Account
  // ============================================================================
  console.log('1. Creating seller account...');

  const seller = await prisma.user.upsert({
    where: { email: 'seller1@nextpik.com' },
    update: {},
    create: {
      email: 'seller1@nextpik.com',
      firstName: 'James',
      lastName: 'Richardson',
      password: testPassword,
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
      phone: '+1 (555) 123-4567',
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
  console.log(`   ✓ Seller: ${seller.email}`);

  // ============================================================================
  // STEP 2: Create Comprehensive Store
  // ============================================================================
  console.log('2. Creating comprehensive store...');

  // First delete existing store for this seller if it exists (to update)
  await prisma.store.deleteMany({
    where: { userId: seller.id },
  });

  const store = await prisma.store.create({
    data: {
      userId: seller.id,
      name: 'Luxury Timepieces Co',
      slug: 'luxury-timepieces-co',
      description: 'Premium watches and accessories from world-renowned brands. Established in 2020, we specialize in authentic luxury timepieces with certified authenticity. Every piece in our collection undergoes rigorous verification by our team of expert horologists.',
      logo: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=1200&h=400&fit=crop',
      email: 'seller1@nextpik.com',
      phone: '+1 (555) 123-4567',
      website: 'https://luxurytimepieces.example.com',

      // Location
      address1: '500 Madison Avenue',
      address2: 'Suite 2500',
      city: 'New York',
      province: 'NY',
      country: 'United States',
      postalCode: '10022',

      // Business Info
      taxId: 'US-TAX-123456789',

      // Status & Verification
      status: 'ACTIVE',
      isActive: true,
      verified: true,
      verifiedAt: new Date(),

      // Metrics (will be updated by reviews/products)
      rating: 4.8,
      reviewCount: 124,
      totalSales: 458,
      totalOrders: 312,
      totalProducts: 0, // Will be updated

      // Policies
      returnPolicy: `30-Day Return Policy

We want you to be completely satisfied with your purchase. If for any reason you're not happy with your order, you may return it within 30 days of delivery for a full refund.

**Conditions:**
- Items must be unworn and in original packaging
- All tags and certificates must be included
- Original receipt or proof of purchase required
- Watches must not have been sized or adjusted

**Process:**
1. Contact our support team to initiate a return
2. Receive a prepaid shipping label
3. Ship the item back in its original packaging
4. Refund processed within 5-7 business days

**Exceptions:**
- Custom-ordered items are non-returnable
- Items showing signs of wear are not eligible
- Damaged or altered items cannot be returned`,

      shippingPolicy: `Free Shipping on Orders Over $500

**Domestic Shipping (USA):**
- Standard (5-7 business days): $25 or FREE over $500
- Express (2-3 business days): $45
- Overnight: $75

**International Shipping:**
- Standard (10-15 business days): $75
- Express (5-7 business days): $150
- All international orders are fully insured

**Packaging:**
- All watches shipped in luxury presentation boxes
- Discreet packaging with no external branding
- Signature required for all deliveries
- Full insurance on all shipments

**Tracking:**
- Tracking number provided within 24 hours of shipment
- Real-time updates via email and SMS`,

      termsConditions: `Terms & Conditions

**Authenticity Guarantee:**
All products sold by Luxury Timepieces Co are 100% authentic and come with certificates of authenticity. We source directly from authorized dealers and private collectors.

**Product Images:**
While we strive to display accurate colors and details, slight variations may occur due to monitor settings. All product specifications are accurate as provided by manufacturers.

**Pricing:**
All prices are in USD unless otherwise specified. Prices are subject to change without notice. We reserve the right to correct pricing errors.

**Privacy:**
Your personal information is protected and never shared with third parties. We use industry-standard encryption for all transactions.

**Warranty:**
All watches come with manufacturer's warranty when applicable. Extended warranty options available at checkout.

**Disputes:**
Any disputes will be resolved through arbitration in New York, NY under the rules of the American Arbitration Association.`,

      // Payout settings
      payoutMethod: 'stripe_connect',
      payoutCurrency: 'USD',
      payoutMinAmount: 100,
      payoutFrequency: 'weekly',
      payoutAutomatic: true,

      // SEO
      metaTitle: 'Luxury Timepieces Co | Premium Watches & Accessories',
      metaDescription: 'Shop authentic luxury watches from Rolex, Omega, Patek Philippe, and more. Free shipping on orders over $500. 30-day returns. Certified authenticity.',

      currency: 'USD',
      timezone: 'America/New_York',
    },
  });
  console.log(`   ✓ Store: ${store.name} (${store.slug})`);

  // ============================================================================
  // STEP 3: Ensure Categories Exist
  // ============================================================================
  console.log('3. Setting up categories...');

  const watchesCategory = await prisma.category.upsert({
    where: { slug: 'watches' },
    update: {},
    create: {
      name: 'Watches',
      slug: 'watches',
      description: 'Luxury timepieces and watches from premium brands',
      icon: 'Watch',
      isActive: true,
      displayOrder: 1,
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Premium accessories and leather goods',
      icon: 'ShoppingBag',
      isActive: true,
      displayOrder: 2,
    },
  });

  const realEstateCategory = await prisma.category.upsert({
    where: { slug: 'real-estate' },
    update: {},
    create: {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Luxury properties and real estate',
      icon: 'Home',
      isActive: true,
      displayOrder: 3,
      categoryType: 'REAL_ESTATE',
    },
  });

  const vehiclesCategory = await prisma.category.upsert({
    where: { slug: 'vehicles' },
    update: {},
    create: {
      name: 'Vehicles',
      slug: 'vehicles',
      description: 'Luxury vehicles and automobiles',
      icon: 'Car',
      isActive: true,
      displayOrder: 4,
      categoryType: 'VEHICLE',
    },
  });

  const digitalCategory = await prisma.category.upsert({
    where: { slug: 'digital' },
    update: {},
    create: {
      name: 'Digital Products',
      slug: 'digital',
      description: 'Digital products and downloadables',
      icon: 'Download',
      isActive: true,
      displayOrder: 5,
      categoryType: 'DIGITAL',
    },
  });

  const servicesCategory = await prisma.category.upsert({
    where: { slug: 'services' },
    update: {},
    create: {
      name: 'Services',
      slug: 'services',
      description: 'Professional services',
      icon: 'Briefcase',
      isActive: true,
      displayOrder: 6,
      categoryType: 'SERVICE',
    },
  });

  console.log('   ✓ Categories ready');

  // ============================================================================
  // STEP 4: Create Products
  // ============================================================================
  console.log('4. Creating products...');

  // Delete existing products for this store to avoid duplicates
  await prisma.product.deleteMany({
    where: { storeId: store.id },
  });

  // ----- PHYSICAL Products: Luxury Watches (6 items) -----
  console.log('   Creating luxury watches...');

  const rolexSubmariner = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'Rolex Submariner Date',
      slug: 'rolex-submariner-date',
      sku: 'LTC-ROLEX-SUB-001',
      description: `The Rolex Submariner Date is the quintessential diving watch, first introduced in 1953. This iconic timepiece features the legendary Oyster case, a unidirectional rotatable bezel, and a date display with Cyclops lens. Water-resistant to 300 meters (1,000 feet), it combines luxury with functionality.

**Specifications:**
- Model: Submariner Date 126610LN
- Case Size: 41mm
- Movement: Calibre 3235, Self-winding
- Power Reserve: Approximately 70 hours
- Water Resistance: 300 meters / 1,000 feet
- Crystal: Scratch-resistant sapphire
- Bracelet: Oyster, flat three-piece links

**What's Included:**
- Rolex Submariner watch
- Original box and papers
- Certificate of authenticity
- 5-year international warranty`,
      shortDescription: 'Iconic diving watch with 41mm Oystersteel case and Cerachrom bezel',
      price: 12500.00,
      compareAtPrice: 14500.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 3,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1623998021446-45cd9b269c95?w=800&h=800&fit=crop',
      badges: ['Bestseller', 'Certified'],
      colors: ['Black Dial', 'Blue Dial', 'Green Dial'],
      sizes: ['41mm'],
      materials: ['Oystersteel', 'Ceramic Bezel', 'Sapphire Crystal'],
      rating: 4.9,
      reviewCount: 45,
      viewCount: 1250,
      likeCount: 324,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1623998021446-45cd9b269c95?w=800&h=800&fit=crop', alt: 'Rolex Submariner Front', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
          { url: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=800&h=800&fit=crop', alt: 'Rolex Submariner Side', width: 800, height: 800, isPrimary: false, displayOrder: 2 },
        ],
      },
      tags: { create: [{ name: 'rolex' }, { name: 'submariner' }, { name: 'diving-watch' }, { name: 'luxury' }] },
    },
  });

  const omegaSeamaster = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'Omega Seamaster Diver 300M',
      slug: 'omega-seamaster-diver-300m',
      sku: 'LTC-OMEGA-SEA-001',
      description: `The Omega Seamaster Diver 300M is the watch that James Bond wears. This masterpiece of Swiss watchmaking features a ceramic dial and bezel, Master Chronometer certified movement, and the iconic wave pattern design.

**Specifications:**
- Model: Seamaster Diver 300M Co-Axial Master Chronometer
- Case Size: 42mm
- Movement: Omega Co-Axial Master Chronometer Calibre 8800
- Power Reserve: 55 hours
- Water Resistance: 300 meters / 1,000 feet
- Crystal: Domed scratch-resistant sapphire
- Bracelet: Stainless steel with diver extension

**What's Included:**
- Omega Seamaster watch
- Original box and papers
- Certificate of authenticity
- 5-year international warranty`,
      shortDescription: 'The iconic James Bond watch with Master Chronometer certification',
      price: 6800.00,
      compareAtPrice: 7500.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 5,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1587836374441-4cfbdf08a17d?w=800&h=800&fit=crop',
      badges: ['New Arrival', 'Bond Edition'],
      colors: ['Blue', 'Black', 'White'],
      sizes: ['42mm'],
      materials: ['Stainless Steel', 'Ceramic', 'Sapphire Crystal'],
      rating: 4.8,
      reviewCount: 38,
      viewCount: 980,
      likeCount: 256,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1587836374441-4cfbdf08a17d?w=800&h=800&fit=crop', alt: 'Omega Seamaster', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'omega' }, { name: 'seamaster' }, { name: 'diving-watch' }, { name: 'james-bond' }] },
    },
  });

  const tagHeuerCarrera = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'TAG Heuer Carrera Chronograph',
      slug: 'tag-heuer-carrera-chronograph',
      sku: 'LTC-TAG-CAR-001',
      description: `The TAG Heuer Carrera is a legendary racing chronograph inspired by the Carrera Panamericana road race. This modern interpretation features a refined design with exceptional chronograph functionality.

**Specifications:**
- Model: Carrera Calibre Heuer 02
- Case Size: 44mm
- Movement: Heuer 02 Automatic
- Power Reserve: 80 hours
- Water Resistance: 100 meters
- Crystal: Sapphire with anti-reflective treatment

**What's Included:**
- TAG Heuer Carrera watch
- Original box and documentation
- 2-year international warranty`,
      shortDescription: 'Racing chronograph with Heuer 02 automatic movement',
      price: 4200.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 8,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&h=800&fit=crop',
      badges: ['Racing Heritage'],
      colors: ['Black', 'Blue', 'Silver'],
      sizes: ['44mm'],
      materials: ['Stainless Steel', 'Sapphire Crystal'],
      rating: 4.7,
      reviewCount: 22,
      viewCount: 650,
      likeCount: 145,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&h=800&fit=crop', alt: 'TAG Heuer Carrera', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'tag-heuer' }, { name: 'carrera' }, { name: 'chronograph' }, { name: 'racing' }] },
    },
  });

  const cartierSantos = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'Cartier Santos de Cartier',
      slug: 'cartier-santos-medium',
      sku: 'LTC-CART-SAN-001',
      description: `The Santos de Cartier is one of the first modern wristwatches, designed in 1904 for aviator Alberto Santos-Dumont. This contemporary version maintains the iconic square case with exposed screws while featuring the innovative QuickSwitch bracelet system.

**Specifications:**
- Model: Santos de Cartier Medium
- Case Size: 35.1mm x 41.9mm
- Movement: Calibre 1847 MC Automatic
- Power Reserve: Approximately 42 hours
- Water Resistance: 100 meters
- Crystal: Sapphire

**What's Included:**
- Cartier Santos watch
- Additional leather strap
- Original red box
- Certificate and warranty card`,
      shortDescription: 'Iconic square case design with QuickSwitch interchangeable straps',
      price: 7900.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 4,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&h=800&fit=crop',
      badges: ['Heritage', 'Iconic Design'],
      colors: ['Silver Dial', 'Blue Dial'],
      sizes: ['Medium', 'Large'],
      materials: ['Stainless Steel', 'Sapphire Crystal'],
      rating: 4.9,
      reviewCount: 31,
      viewCount: 720,
      likeCount: 198,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&h=800&fit=crop', alt: 'Cartier Santos', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'cartier' }, { name: 'santos' }, { name: 'dress-watch' }, { name: 'heritage' }] },
    },
  });

  const patekNautilus = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'Patek Philippe Nautilus 5711',
      slug: 'patek-philippe-nautilus-5711',
      sku: 'LTC-PP-NAU-001',
      description: `The Patek Philippe Nautilus 5711/1A is one of the most coveted timepieces in the world. Designed by Gerald Genta in 1976, its distinctive porthole-shaped case and horizontal embossed dial make it instantly recognizable.

**Specifications:**
- Model: Nautilus 5711/1A-014
- Case Size: 40mm
- Movement: Calibre 26-330 S C Automatic
- Power Reserve: 45 hours minimum
- Water Resistance: 120 meters
- Crystal: Sapphire crystal
- Bracelet: Integrated stainless steel

**What's Included:**
- Patek Philippe Nautilus watch
- Full documentation and archive extract
- Original box set
- Patek Philippe Certificate of Origin`,
      shortDescription: 'The legendary sports-elegant timepiece by Gerald Genta',
      price: 35000.00,
      compareAtPrice: 42000.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 1,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1639006570490-79c0c53f1080?w=800&h=800&fit=crop',
      badges: ['Ultra Rare', 'Investment Grade'],
      colors: ['Blue Dial', 'Green Dial'],
      sizes: ['40mm'],
      materials: ['Stainless Steel', 'Sapphire Crystal'],
      rating: 5.0,
      reviewCount: 8,
      viewCount: 2100,
      likeCount: 567,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1639006570490-79c0c53f1080?w=800&h=800&fit=crop', alt: 'Patek Philippe Nautilus', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'patek-philippe' }, { name: 'nautilus' }, { name: 'grail-watch' }, { name: 'investment' }] },
    },
  });

  const breitlingNavitimer = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: watchesCategory.id,
      name: 'Breitling Navitimer B01 Chronograph',
      slug: 'breitling-navitimer-b01',
      sku: 'LTC-BREIT-NAV-001',
      description: `The Breitling Navitimer is the ultimate pilot's watch, featuring the iconic circular slide rule bezel that can perform all calculations essential to flight. The B01 version houses Breitling's in-house chronograph movement.

**Specifications:**
- Model: Navitimer B01 Chronograph 43
- Case Size: 43mm
- Movement: Breitling Manufacture Caliber 01
- Power Reserve: 70 hours
- Water Resistance: 30 meters
- Crystal: Domed sapphire, glare-proof

**What's Included:**
- Breitling Navitimer watch
- Original box and papers
- 5-year warranty`,
      shortDescription: 'Iconic aviation chronograph with circular slide rule bezel',
      price: 5500.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 6,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&h=800&fit=crop',
      badges: ['Aviation Heritage'],
      colors: ['Black', 'Blue', 'Green'],
      sizes: ['43mm', '46mm'],
      materials: ['Stainless Steel', 'Sapphire Crystal'],
      rating: 4.7,
      reviewCount: 19,
      viewCount: 540,
      likeCount: 112,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&h=800&fit=crop', alt: 'Breitling Navitimer', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'breitling' }, { name: 'navitimer' }, { name: 'pilot-watch' }, { name: 'chronograph' }] },
    },
  });

  console.log('   ✓ Created 6 luxury watches');

  // ----- PHYSICAL Products: Accessories (3 items) -----
  console.log('   Creating accessories...');

  const watchRoll = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: accessoriesCategory.id,
      name: 'Leather Watch Roll (3 Slots)',
      slug: 'leather-watch-roll-3-slots',
      sku: 'LTC-ACC-WR3-001',
      description: `Premium handcrafted leather watch roll with three individual slots for traveling with your timepieces. Features butter-soft Italian calfskin leather exterior and microfiber lining to protect your watches.

**Features:**
- 3 individual watch compartments
- Soft microfiber lining
- Snap closure
- Fits watches up to 50mm
- Compact travel size

**Dimensions:** 8.5" x 3.5" when closed`,
      shortDescription: 'Handcrafted Italian leather watch roll for 3 timepieces',
      price: 299.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 25,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
      badges: ['Handcrafted'],
      colors: ['Brown', 'Black', 'Navy'],
      materials: ['Italian Calfskin', 'Microfiber'],
      rating: 4.8,
      reviewCount: 67,
      viewCount: 890,
      likeCount: 234,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop', alt: 'Leather Watch Roll', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'accessories' }, { name: 'watch-roll' }, { name: 'travel' }, { name: 'leather' }] },
    },
  });

  const cleaningKit = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: accessoriesCategory.id,
      name: 'Professional Watch Cleaning Kit',
      slug: 'professional-watch-cleaning-kit',
      sku: 'LTC-ACC-CK-001',
      description: `Complete watch cleaning and maintenance kit used by professional watchmakers. Includes everything needed to keep your timepieces in pristine condition.

**Kit Contents:**
- Anti-static microfiber cloths (3)
- Soft bristle cleaning brush
- Watch cleaning solution (100ml)
- Crystal polishing cloth
- Spring bar tool
- Cleaning mat
- Storage pouch

**Safe for:** All watch types including precious metals and exotic materials`,
      shortDescription: 'Complete cleaning kit for luxury watch maintenance',
      price: 49.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 50,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&h=800&fit=crop',
      badges: ['Professional Grade'],
      materials: ['Microfiber', 'Nylon', 'Stainless Steel'],
      rating: 4.6,
      reviewCount: 112,
      viewCount: 1450,
      likeCount: 287,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&h=800&fit=crop', alt: 'Watch Cleaning Kit', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'accessories' }, { name: 'cleaning' }, { name: 'maintenance' }, { name: 'tools' }] },
    },
  });

  const watchBox = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: accessoriesCategory.id,
      name: 'Premium Watch Box (12 Slots)',
      slug: 'premium-watch-box-12-slots',
      sku: 'LTC-ACC-WB12-001',
      description: `Elegant watch display box with capacity for 12 timepieces. Features a glass top for display, piano lacquer finish, and individual cushions for each watch.

**Features:**
- 12 individual watch compartments
- Tempered glass display top
- Piano lacquer wood finish
- Soft velvet lining
- Individual removable cushions
- Lock and key
- Drawer for accessories

**Dimensions:** 14" x 10" x 5"`,
      shortDescription: '12-slot luxury watch display box with glass top',
      price: 450.00,
      compareAtPrice: 550.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 12,
      productType: 'PHYSICAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop',
      badges: ['Sale', 'Premium'],
      colors: ['Ebony', 'Walnut', 'Cherry'],
      materials: ['Lacquered Wood', 'Velvet', 'Tempered Glass'],
      rating: 4.9,
      reviewCount: 34,
      viewCount: 670,
      likeCount: 156,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop', alt: 'Premium Watch Box', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'accessories' }, { name: 'watch-box' }, { name: 'storage' }, { name: 'display' }] },
    },
  });

  console.log('   ✓ Created 3 accessories');

  // ----- REAL_ESTATE Product (1 item) -----
  console.log('   Creating real estate listing...');

  const penthouse = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: realEstateCategory.id,
      name: 'Luxury Penthouse - Manhattan',
      slug: 'luxury-penthouse-manhattan',
      sku: 'LTC-RE-PH-001',
      description: `Exceptional penthouse residence in the heart of Manhattan with breathtaking skyline views. This stunning 2,800 sqft home features floor-to-ceiling windows, premium finishes throughout, and access to world-class amenities.

**Property Details:**
- Bedrooms: 3
- Bathrooms: 2.5
- Square Feet: 2,800
- Floor: 45th (Penthouse Level)
- Year Built: 2022

**Features:**
- Private terrace with panoramic views
- Gourmet chef's kitchen with Miele appliances
- Primary suite with spa bathroom
- Custom Italian cabinetry
- Smart home automation
- Wine storage

**Building Amenities:**
- 24/7 Concierge & Doorman
- Private fitness center
- Rooftop pool and lounge
- Residents' club room
- Private parking available

**Location:** Prime Upper East Side, steps from Central Park and world-class dining`,
      shortDescription: '3 bed, 2.5 bath penthouse with skyline views | 2,800 sqft',
      price: 2500000.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 1,
      productType: 'REAL_ESTATE',
      purchaseType: 'INQUIRY',
      contactRequired: true,
      heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=800&fit=crop',
      badges: ['Premium Listing', 'New Development'],
      materials: ['Marble', 'Italian Tile', 'Hardwood'],
      rating: 5.0,
      reviewCount: 2,
      viewCount: 3400,
      likeCount: 456,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=800&fit=crop', alt: 'Penthouse Exterior', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=800&fit=crop', alt: 'Living Room', width: 800, height: 800, isPrimary: false, displayOrder: 2 },
          { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=800&fit=crop', alt: 'Kitchen', width: 800, height: 800, isPrimary: false, displayOrder: 3 },
        ],
      },
      tags: { create: [{ name: 'real-estate' }, { name: 'penthouse' }, { name: 'manhattan' }, { name: 'luxury-home' }] },
    },
  });

  console.log('   ✓ Created 1 real estate listing');

  // ----- VEHICLE Product (1 item) -----
  console.log('   Creating vehicle listing...');

  const porsche = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: vehiclesCategory.id,
      name: '2023 Porsche 911 Turbo S',
      slug: '2023-porsche-911-turbo-s',
      sku: 'LTC-VH-P911-001',
      description: `Pristine 2023 Porsche 911 Turbo S in the stunning GT Silver Metallic. This flagship sports car delivers exhilarating performance with everyday usability. One owner, garage kept, with full Porsche service history.

**Vehicle Specifications:**
- Year: 2023
- Make: Porsche
- Model: 911 Turbo S
- Mileage: 1,200 miles
- Color: GT Silver Metallic
- Interior: Black/Red Leather
- Engine: 3.8L Twin-Turbo Flat-6
- Horsepower: 640 hp
- 0-60 mph: 2.6 seconds
- Transmission: 8-speed PDK

**Key Options:**
- Sport Chrono Package
- PCCB Ceramic Brakes
- Burmester Sound System
- Front Axle Lift
- Adaptive Cruise Control
- Lane Keep Assist
- Carbon Fiber Interior Package
- Heated/Ventilated Seats

**Documentation:**
- Clean CARFAX
- Original window sticker
- All service records
- 2 keys and original books`,
      shortDescription: 'GT Silver | 1,200 miles | Sport Chrono | PCCB | One Owner',
      price: 215000.00,
      status: 'ACTIVE',
      featured: true,
      inventory: 1,
      productType: 'VEHICLE',
      purchaseType: 'INQUIRY',
      contactRequired: true,
      heroImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=800&fit=crop',
      badges: ['Low Mileage', 'One Owner'],
      colors: ['GT Silver Metallic'],
      materials: ['Leather', 'Carbon Fiber', 'Aluminum'],
      rating: 5.0,
      reviewCount: 1,
      viewCount: 2800,
      likeCount: 389,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=800&fit=crop', alt: 'Porsche 911 Exterior', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
          { url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=800&fit=crop', alt: 'Porsche Interior', width: 800, height: 800, isPrimary: false, displayOrder: 2 },
        ],
      },
      tags: { create: [{ name: 'vehicle' }, { name: 'porsche' }, { name: '911' }, { name: 'sports-car' }] },
    },
  });

  console.log('   ✓ Created 1 vehicle listing');

  // ----- DIGITAL Product (1 item) -----
  console.log('   Creating digital product...');

  const authGuide = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: digitalCategory.id,
      name: 'Watch Authentication Guide (PDF)',
      slug: 'watch-authentication-guide-pdf',
      sku: 'LTC-DIG-AUTH-001',
      description: `Comprehensive 150-page guide to authenticating luxury watches. Written by certified watchmakers and authentication experts, this guide covers the most counterfeited brands and models.

**What You'll Learn:**
- How to identify authentic vs. fake watches
- Brand-specific authentication tips for Rolex, Omega, Patek Philippe, AP, and more
- Movement identification guide
- Serial number verification methods
- Case back inspection techniques
- Dial and hands authentication
- Bracelet and clasp verification
- Documentation authentication

**Brands Covered:**
- Rolex
- Patek Philippe
- Audemars Piguet
- Omega
- Cartier
- TAG Heuer
- Breitling
- IWC
- And more...

**Format:** PDF (150 pages)
**License:** Personal use only
**Updates:** Lifetime updates included`,
      shortDescription: '150-page authentication guide covering major luxury brands',
      price: 29.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 9999,
      productType: 'DIGITAL',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=800&fit=crop',
      badges: ['Digital Download', 'Expert Guide'],
      rating: 4.9,
      reviewCount: 89,
      viewCount: 2100,
      likeCount: 432,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=800&fit=crop', alt: 'Authentication Guide', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'digital' }, { name: 'guide' }, { name: 'authentication' }, { name: 'education' }] },
    },
  });

  console.log('   ✓ Created 1 digital product');

  // ----- SERVICE Product (1 item) -----
  console.log('   Creating service product...');

  const appraisalService = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: servicesCategory.id,
      name: 'Watch Appraisal Service',
      slug: 'watch-appraisal-service',
      sku: 'LTC-SVC-APP-001',
      description: `Professional watch appraisal service conducted by our certified horologists. Receive a detailed written appraisal for insurance, estate planning, or sale purposes.

**Service Includes:**
- Complete physical examination
- Movement inspection
- Authentication verification
- Condition assessment
- Market value analysis
- Written appraisal certificate
- High-resolution photography

**Duration:** Approximately 60 minutes

**Available Options:**
- In-person (New York location)
- Virtual appraisal (via video call)
- Mail-in service (insured shipping)

**Appraisal Certificate:**
Our appraisals are accepted by major insurance companies and are suitable for:
- Insurance coverage
- Estate valuations
- Pre-sale assessments
- Collection documentation

**Our Qualifications:**
- NAWCC certified watchmakers
- 25+ years combined experience
- Authorized service for major brands`,
      shortDescription: 'Professional appraisal by certified horologists | In-person or virtual',
      price: 150.00,
      status: 'ACTIVE',
      featured: false,
      inventory: 100,
      productType: 'SERVICE',
      purchaseType: 'INSTANT',
      heroImage: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&h=800&fit=crop',
      badges: ['Certified Experts', 'Insurance Accepted'],
      rating: 5.0,
      reviewCount: 156,
      viewCount: 1800,
      likeCount: 234,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&h=800&fit=crop', alt: 'Watch Appraisal', width: 800, height: 800, isPrimary: true, displayOrder: 1 },
        ],
      },
      tags: { create: [{ name: 'service' }, { name: 'appraisal' }, { name: 'certification' }, { name: 'insurance' }] },
    },
  });

  console.log('   ✓ Created 1 service product');

  // ============================================================================
  // STEP 5: Create Product Variants for Rolex Submariner
  // ============================================================================
  console.log('5. Creating product variants...');

  await prisma.productVariant.createMany({
    data: [
      {
        productId: rolexSubmariner.id,
        name: 'Black Dial',
        sku: 'LTC-ROLEX-SUB-001-BLK',
        price: 12500.00,
        inventory: 2,
        options: { dial: 'Black', bezel: 'Black Ceramic' },
        colorHex: '#000000',
        colorName: 'Black',
        displayOrder: 1,
      },
      {
        productId: rolexSubmariner.id,
        name: 'Blue Dial (Smurf)',
        sku: 'LTC-ROLEX-SUB-001-BLU',
        price: 13200.00,
        inventory: 1,
        options: { dial: 'Blue', bezel: 'Blue Ceramic' },
        colorHex: '#1E3A5F',
        colorName: 'Royal Blue',
        displayOrder: 2,
      },
      {
        productId: rolexSubmariner.id,
        name: 'Green Dial (Hulk)',
        sku: 'LTC-ROLEX-SUB-001-GRN',
        price: 14000.00,
        compareAtPrice: 16000.00,
        inventory: 1,
        options: { dial: 'Green', bezel: 'Green Ceramic' },
        colorHex: '#2E7D32',
        colorName: 'Hulk Green',
        displayOrder: 3,
      },
    ],
  });

  console.log('   ✓ Created 3 variants for Rolex Submariner');

  // ============================================================================
  // STEP 6: Create Sample Reviews
  // ============================================================================
  console.log('6. Creating sample reviews...');

  // Get buyer accounts for reviews
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' },
    take: 3,
  });

  if (buyers.length < 3) {
    // Create buyer accounts if they don't exist
    for (let i = buyers.length + 1; i <= 3; i++) {
      const buyer = await prisma.user.upsert({
        where: { email: `buyer${i}@nextpik.com` },
        update: {},
        create: {
          email: `buyer${i}@nextpik.com`,
          firstName: 'Buyer',
          lastName: `${i}`,
          password: testPassword,
          role: 'BUYER',
          emailVerified: true,
          isActive: true,
        },
      });
      buyers.push(buyer);
    }
  }

  const reviews = [
    // Reviews for Rolex Submariner
    {
      productId: rolexSubmariner.id,
      userId: buyers[0].id,
      rating: 5,
      title: 'Perfect condition, exactly as described',
      comment: 'I was nervous about purchasing such an expensive watch online, but Luxury Timepieces Co exceeded all my expectations. The watch arrived in perfect condition, all paperwork was authentic, and the presentation was impeccable. The black dial Submariner is absolutely stunning in person. Fast shipping with proper insurance. Will definitely buy again!',
      isVerified: true,
      isApproved: true,
      helpfulCount: 24,
    },
    {
      productId: rolexSubmariner.id,
      userId: buyers[1].id,
      rating: 5,
      title: 'Authentic and beautiful',
      comment: 'I had the watch verified by a local authorized dealer and everything checked out perfectly. The condition is as described - like new with minimal signs of wear. The seller was very responsive and provided additional photos when requested. Great experience overall.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 18,
    },
    // Reviews for Omega Seamaster
    {
      productId: omegaSeamaster.id,
      userId: buyers[2].id,
      rating: 5,
      title: 'The James Bond watch lives up to the hype',
      comment: 'As a longtime Bond fan, I had to have this watch. The wave pattern dial is mesmerizing and the blue color is even more striking in person than in photos. The watch keeps excellent time and the bracelet is very comfortable. Highly recommend this seller!',
      isVerified: true,
      isApproved: true,
      helpfulCount: 31,
    },
    {
      productId: omegaSeamaster.id,
      userId: buyers[0].id,
      rating: 4,
      title: 'Great watch, minor shipping delay',
      comment: 'The watch itself is fantastic - beautiful, accurate, and versatile enough for any occasion. Shipping took a few days longer than expected due to weather, but the seller kept me informed throughout. The watch arrived safely and in perfect condition.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 12,
    },
    // Review for Patek Nautilus
    {
      productId: patekNautilus.id,
      userId: buyers[1].id,
      rating: 5,
      title: 'The holy grail of watches',
      comment: 'After years of searching, I finally found a Nautilus at a fair price. The transaction was smooth, all documentation was provided including the Patek extract, and the watch is absolutely flawless. This is the pinnacle of watchmaking and worth every penny. Thank you Luxury Timepieces Co!',
      isVerified: true,
      isApproved: true,
      helpfulCount: 45,
    },
    // Reviews for accessories
    {
      productId: watchRoll.id,
      userId: buyers[2].id,
      rating: 5,
      title: 'Perfect for travel',
      comment: 'This watch roll is beautifully made. The leather quality is excellent and the interior is soft enough to protect my watches. Fits my Submariner and two other 42mm watches perfectly. Worth every penny for the quality.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 8,
    },
    {
      productId: cleaningKit.id,
      userId: buyers[0].id,
      rating: 4,
      title: 'Good quality kit',
      comment: 'Everything you need to keep your watches clean and looking great. The cleaning solution works well and the cloths are high quality. Only wish it came with a loupe for detailed inspection.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 5,
    },
    // Reviews for services
    {
      productId: appraisalService.id,
      userId: buyers[1].id,
      rating: 5,
      title: 'Professional and thorough',
      comment: 'Had my vintage Rolex appraised for insurance purposes. The expert was incredibly knowledgeable and took the time to explain everything about my watch. The written appraisal was detailed and accepted by my insurance company immediately. Highly recommend!',
      isVerified: true,
      isApproved: true,
      helpfulCount: 22,
    },
    {
      productId: authGuide.id,
      userId: buyers[2].id,
      rating: 5,
      title: 'Essential guide for any collector',
      comment: 'This PDF guide has saved me from making several potentially costly mistakes. The photos are clear, the explanations are easy to understand, and it covers all the major brands. A must-have for anyone buying pre-owned luxury watches.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 34,
    },
    {
      productId: watchBox.id,
      userId: buyers[0].id,
      rating: 5,
      title: 'Beautiful display piece',
      comment: 'This watch box is a work of art itself. The piano lacquer finish is stunning and the glass top lets me display my collection beautifully. The drawer underneath is perfect for storing extra straps and tools. Worth the investment.',
      isVerified: true,
      isApproved: true,
      helpfulCount: 15,
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({
      data: review,
    });
  }

  console.log(`   ✓ Created ${reviews.length} reviews`);

  // ============================================================================
  // STEP 7: Update Store Product Count
  // ============================================================================
  console.log('7. Updating store statistics...');

  const productCount = await prisma.product.count({
    where: { storeId: store.id },
  });

  await prisma.store.update({
    where: { id: store.id },
    data: { totalProducts: productCount },
  });

  console.log(`   ✓ Store has ${productCount} products`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('='.repeat(70));
  console.log('  SEEDING COMPLETED SUCCESSFULLY');
  console.log('='.repeat(70));
  console.log('');
  console.log('Store Details:');
  console.log(`  Name: ${store.name}`);
  console.log(`  URL:  /store/${store.slug}`);
  console.log(`  Products: ${productCount}`);
  console.log('');
  console.log('Products Created:');
  console.log('  - 6 Luxury Watches (PHYSICAL)');
  console.log('  - 3 Accessories (PHYSICAL)');
  console.log('  - 1 Real Estate Listing (REAL_ESTATE)');
  console.log('  - 1 Vehicle Listing (VEHICLE)');
  console.log('  - 1 Digital Guide (DIGITAL)');
  console.log('  - 1 Appraisal Service (SERVICE)');
  console.log('');
  console.log('Additional Data:');
  console.log('  - 3 Product Variants (Rolex Submariner)');
  console.log(`  - ${reviews.length} Product Reviews`);
  console.log('');
  console.log('Test Account:');
  console.log('  Email: seller1@nextpik.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('='.repeat(70));
}

// Run the seed
seedComprehensiveStore()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
