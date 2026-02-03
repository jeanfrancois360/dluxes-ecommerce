# Quick Start Guide - NextPik E-commerce Database

## What You Have

A production-ready PostgreSQL schema for a luxury e-commerce platform with:

✅ **Rich Product Catalog** - 360° galleries, variants, categories, collections
✅ **Full-Text Search** - PostgreSQL tsvector with autocomplete
✅ **Real-Time Analytics** - Views, likes, ratings (auto-updating)
✅ **Smooth Animations** - Inventory tracking for elegant UI transitions
✅ **Recommendation Engine** - Collaborative, content-based, trending algorithms
✅ **Reviews & Ratings** - Rich media, verification, moderation
✅ **Wishlist System** - Premium UX with priority sorting
✅ **Order Tracking** - Beautiful timeline for customer experience
✅ **Zero-Downtime Migrations** - All indexes use CONCURRENTLY

## File Structure

```
packages/database/
├── prisma/
│   └── schema.prisma           # ⭐ Enhanced Prisma schema
│
├── migrations/sql/             # 🚀 PostgreSQL enhancements
│   ├── README.md              # Detailed SQL documentation
│   ├── 01_setup_search.sql    # Full-text search
│   ├── 02_setup_analytics.sql # Auto-updating counters
│   ├── 03_setup_animations.sql # UI transition support
│   ├── 04_create_indexes.sql  # 40+ performance indexes
│   ├── 05_migrate_categories.sql # Hierarchical categories
│   ├── 06_setup_recommendations.sql # Recommendation engine
│   └── 07_seed_collections.sql # Curated collections
│
├── MIGRATION_GUIDE.md          # 📘 Zero-downtime deployment
├── SCHEMA_OVERVIEW.md          # 📊 Database architecture
└── QUICKSTART.md              # 👉 You are here
```

## Deploy in 5 Steps

### Step 1: Review the Schema
```bash
cat packages/database/prisma/schema.prisma
```

**Key Enhancements:**
- Product: +25 fields (heroImage, gallery, badges, analytics, search)
- Category: New hierarchical model with color schemes
- Collection: Curated product sets with themes
- Wishlist, Reviews, Analytics, Recommendations: All new

### Step 2: Create Prisma Migration
```bash
cd packages/database
npx prisma migrate dev --name nextpik_ecommerce_schema
```

This creates the tables defined in `schema.prisma`.

### Step 3: Deploy SQL Enhancements
```bash
# Run all SQL files in order
for file in migrations/sql/0*.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f "$file"
done
```

**What this does:**
- Sets up full-text search with auto-updating tsvector
- Creates triggers for real-time analytics
- Adds animation support (previous values tracking)
- Creates 40+ performance indexes
- Seeds categories & collections
- Sets up recommendation engine

### Step 4: Verify Installation
```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Check functions
\df

# Check triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

# Test search function
SELECT * FROM search_products('luxury', NULL, NULL, NULL, 5, 0);
```

### Step 5: Generate Prisma Client
```bash
npx prisma generate
```

Now you can use Prisma Client in your application!

## Usage Examples

### Product Search
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Use the PostgreSQL search function
const results = await prisma.$queryRaw`
  SELECT * FROM search_products(
    ${searchQuery},
    ${category || null},
    ${minPrice || null},
    ${maxPrice || null},
    ${limit},
    ${offset}
  )
`
```

### Track Product View
```typescript
// Auto-increments product.viewCount via trigger
await prisma.productView.create({
  data: {
    productId: 'prod_123',
    userId: user?.id,
    sessionId: session.id,
    referrer: req.headers.referer,
    userAgent: req.headers['user-agent']
  }
})
```

### Add to Wishlist
```typescript
await prisma.wishlistItem.create({
  data: {
    userId: user.id,
    productId: 'prod_123',
    priority: 1
  }
})
```

### Get Recommendations
```typescript
const recommendations = await prisma.$queryRaw`
  SELECT * FROM get_product_recommendations(${productId}, 6)
`
```

### Submit Review
```typescript
// Auto-updates product.rating via trigger
await prisma.review.create({
  data: {
    productId: 'prod_123',
    userId: user.id,
    orderId: order.id, // Verified purchase
    rating: 5,
    title: 'Exceptional Quality',
    comment: 'Beautiful craftsmanship...',
    images: ['review1.jpg', 'review2.jpg'],
    isVerified: true,
    isApproved: false // Pending moderation
  }
})
```

### Track Order Timeline
```typescript
// Beautiful timeline for customer order tracking
await prisma.orderTimeline.create({
  data: {
    orderId: order.id,
    status: 'SHIPPED',
    title: 'Order Shipped',
    description: 'Your order has left our facility',
    location: 'New York, NY',
    icon: 'truck'
  }
})
```

### Get Trending Products
```typescript
const trending = await prisma.$queryRaw`
  SELECT * FROM get_trending_products(7, 10)
`
```

## Key Features Demo

### 1. Full-Text Search with Filters
```sql
-- Search for "gold watch" under $5000 in watches category
SELECT * FROM search_products(
  'gold watch',
  'watches',
  NULL,
  5000,
  10,
  0
);

-- Autocomplete
SELECT * FROM autocomplete_products('gol', 10);
```

### 2. Category Hierarchy
```sql
-- Get full category tree
SELECT * FROM get_category_tree();

-- Get all products in jewelry category (including subcategories)
SELECT * FROM get_products_by_category('jewelry', true);
```

### 3. Collections Management
```sql
-- View active collections
SELECT * FROM get_active_collections();

-- Auto-populate collection with new arrivals
SELECT add_products_to_collection('new-arrivals', 'new', NULL, 20);

-- Auto-populate with top-rated products
SELECT add_products_to_collection('best-sellers', 'top-rated', NULL, 15);
```

### 4. Recommendations Engine
```sql
-- Generate all recommendation types
SELECT * FROM generate_all_recommendations();

-- View recommendations for a product
SELECT * FROM get_product_recommendations('prod_123', 6);

-- Check performance metrics
SELECT * FROM get_recommendation_performance();
```

### 5. Low Stock Alerts
```sql
-- Get products needing restock
SELECT * FROM get_low_stock_products();
```

## API Integration Examples

### Next.js API Route - Product Search
```typescript
// app/api/products/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const category = searchParams.get('category')

  const products = await prisma.$queryRaw`
    SELECT * FROM search_products(
      ${query},
      ${category},
      NULL, NULL, 20, 0
    )
  `

  return Response.json({ products })
}
```

### Product Page with Analytics
```typescript
// app/products/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      variants: true,
      reviews: { where: { isApproved: true } }
    }
  })

  // Track view (auto-increments viewCount)
  await prisma.productView.create({
    data: { productId: product.id }
  })

  // Get recommendations
  const recommendations = await prisma.$queryRaw`
    SELECT * FROM get_product_recommendations(${product.id}, 6)
  `

  return <ProductDetail product={product} recommendations={recommendations} />
}
```

## Maintenance Tasks

### Daily (Automated)
```sql
-- Schedule with pg_cron
SELECT cron.schedule(
  'refresh-recommendations',
  '0 2 * * *',
  $$ SELECT generate_all_recommendations(); $$
);
```

### Weekly
```bash
# Update database statistics
psql $DATABASE_URL -c "ANALYZE products; ANALYZE product_views; ANALYZE reviews;"
```

### Monthly
```sql
-- Clean up old recommendations
SELECT cleanup_recommendations(0.1, 30);

-- Reindex search vectors (low traffic window)
REINDEX INDEX CONCURRENTLY idx_products_searchvector;
```

## Performance Monitoring

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### View Slow Queries
```sql
SELECT
  calls,
  mean_time,
  query
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Common Queries

### Get Featured Products
```typescript
const featured = await prisma.product.findMany({
  where: {
    featured: true,
    status: 'ACTIVE'
  },
  include: { images: true },
  orderBy: { displayOrder: 'asc' },
  take: 10
})
```

### Get Product with Full Details
```typescript
const product = await prisma.product.findUnique({
  where: { slug: 'luxury-watch' },
  include: {
    category: true,
    images: { orderBy: { displayOrder: 'asc' } },
    variants: {
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' }
    },
    reviews: {
      where: { isApproved: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    },
    collections: {
      include: { collection: true }
    }
  }
})
```

### User's Wishlist
```typescript
const wishlist = await prisma.wishlistItem.findMany({
  where: { userId: user.id },
  include: {
    product: {
      include: { images: true }
    }
  },
  orderBy: [
    { priority: 'desc' },
    { createdAt: 'desc' }
  ]
})
```

## Troubleshooting

### Search not working?
```sql
-- Check if search vectors are populated
SELECT name, "searchVector" FROM products LIMIT 5;

-- If null, run:
UPDATE products SET "updatedAt" = "updatedAt";
```

### Counters not updating?
```sql
-- Check if triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'products';

-- Re-run setup script if missing:
psql $DATABASE_URL -f migrations/sql/02_setup_analytics.sql
```

### Slow queries?
```sql
-- Check if indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'products';

-- If missing, re-run:
psql $DATABASE_URL -f migrations/sql/04_create_indexes.sql
```

## Next Steps

1. **Seed Sample Data**: Create sample products, categories, collections
2. **Build API Endpoints**: Use Prisma Client to create REST/GraphQL APIs
3. **Implement Frontend**: Build UI with the luxury theme (Black/Gold/Gray/White)
4. **Add Authentication**: Integrate NextAuth.js or similar
5. **Setup Image Upload**: Integrate Cloudinary/S3 for product images
6. **Configure Payment**: Add Stripe/PayPal integration
7. **Deploy**: Use Vercel + Supabase/Railway for hosting

## Documentation

- 📘 **MIGRATION_GUIDE.md** - Detailed deployment steps
- 📊 **SCHEMA_OVERVIEW.md** - Database architecture
- 🗂️ **migrations/sql/README.md** - SQL functions reference
- 📝 **schema.prisma** - Full schema definition

## Support

Run into issues? Check:
1. PostgreSQL logs
2. Prisma migration status: `npx prisma migrate status`
3. Function definitions: `\df` in psql
4. Trigger status: `SELECT * FROM information_schema.triggers;`

---

**You're all set!** 🎉

Your luxury e-commerce database is ready to power a premium shopping experience with:
- Lightning-fast search
- Real-time analytics
- Intelligent recommendations
- Beautiful UI animations
- Production-grade performance

Start building your elegant storefront! 💎
