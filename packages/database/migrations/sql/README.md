# SQL Migrations - NextPik E-commerce Platform

This directory contains SQL scripts to enhance your PostgreSQL database with luxury e-commerce features.

## Overview

These migrations add advanced functionality for:
- 🔍 Full-text search with PostgreSQL tsvector
- 📊 Real-time analytics (views, likes, ratings)
- 🎨 Smooth UI animations (inventory tracking)
- 🏷️ Hierarchical categories
- 💎 Curated collections
- 🤖 Product recommendations engine
- ⭐ Reviews & ratings
- 💫 Wishlist functionality

## Execution Order

Run these scripts **after** deploying your Prisma migration:

```bash
# 1. Deploy Prisma schema changes first
npx prisma migrate deploy

# 2. Then run SQL enhancements in order
psql $DATABASE_URL -f 01_setup_search.sql
psql $DATABASE_URL -f 02_setup_analytics.sql
psql $DATABASE_URL -f 03_setup_animations.sql
psql $DATABASE_URL -f 04_create_indexes.sql
psql $DATABASE_URL -f 05_migrate_categories.sql
psql $DATABASE_URL -f 06_setup_recommendations.sql
psql $DATABASE_URL -f 07_seed_collections.sql
```

## File Descriptions

### 01_setup_search.sql
**Purpose:** Full-text search functionality

**Features:**
- Auto-updating tsvector for product search
- Search function with filters (category, price)
- Autocomplete suggestions
- Ranking algorithm for relevance

**Usage in Application:**
```sql
-- Search products
SELECT * FROM search_products('luxury watch', NULL, 1000, 5000, 20, 0);

-- Autocomplete
SELECT * FROM autocomplete_products('gol', 10);
```

### 02_setup_analytics.sql
**Purpose:** Real-time analytics counters

**Features:**
- Auto-increment view counts on ProductView insert
- Auto-update like counts on ProductLike insert/delete
- Auto-calculate ratings from approved reviews
- Trending products function
- Top-rated products function

**Usage in Application:**
```sql
-- Get trending products (last 7 days)
SELECT * FROM get_trending_products(7, 10);

-- Get top-rated products
SELECT * FROM get_top_rated_products(5, 10);
```

**Triggers Installed:**
- `product_view_increment` - Updates viewCount
- `product_like_update` - Updates likeCount
- `review_rating_update` - Updates rating & reviewCount

### 03_setup_animations.sql
**Purpose:** Support for smooth UI transitions

**Features:**
- Tracks previous cart item quantities
- Tracks previous inventory levels
- Auto-updates variant availability
- Auto-updates product status based on inventory
- Low stock alerts

**Usage in Application:**
```sql
-- Get products needing restock
SELECT * FROM get_low_stock_products();
```

**Triggers Installed:**
- `cart_item_quantity_change` - Stores previousQuantity
- `product_inventory_change` - Stores previousStock
- `variant_inventory_change` - Stores previousStock
- `variant_availability_update` - Auto-marks unavailable at 0 inventory
- `product_status_inventory_update` - Auto-changes status

### 04_create_indexes.sql
**Purpose:** Performance optimization

**Features:**
- 40+ optimized indexes for common queries
- Partial indexes for filtered queries
- GIN indexes for array columns
- Composite indexes for sorting

**Index Categories:**
- Product discovery (featured, category, price)
- Search & filtering (colors, sizes, materials, badges)
- Analytics (views, ratings, trending)
- Shopping (cart, orders, wishlist)
- Admin (low stock, moderation)

**Note:** All indexes use `CONCURRENTLY` to avoid table locks.

### 05_migrate_categories.sql
**Purpose:** Category hierarchy setup

**Features:**
- Creates 6 main categories with luxury styling
- Creates subcategories (rings, necklaces, watches, etc.)
- Color schemes for each category
- Helper functions for category tree traversal

**Functions:**
```sql
-- Get full category tree
SELECT * FROM get_category_tree();

-- Get products by category (with subcategories)
SELECT * FROM get_products_by_category('jewelry', true);
```

**Categories Created:**
1. Jewelry (with subcategories: Rings, Necklaces, Bracelets, Earrings)
2. Watches (Men's, Women's, Smartwatches)
3. Apparel (Suits, Casual, Outerwear, Evening Wear)
4. Accessories (Handbags, Wallets, Belts, Sunglasses, Scarves)
5. Beauty
6. Home

### 06_setup_recommendations.sql
**Purpose:** Product recommendation engine

**Features:**
- Collaborative filtering ("Customers also bought")
- Content-based filtering (Similar items)
- Trending recommendations
- Performance tracking (impressions, clicks, conversions)

**Functions:**
```sql
-- Generate all recommendations
SELECT * FROM generate_all_recommendations();

-- Get recommendations for a product
SELECT * FROM get_product_recommendations('product_id_here', 6);

-- Track performance
SELECT * FROM get_recommendation_performance();

-- Cleanup old recommendations
SELECT cleanup_recommendations(0.1, 30);
```

**Tracking Functions:**
```sql
-- Track when recommendation is shown
SELECT track_recommendation_impression('source_id', 'recommended_id');

-- Track when user clicks
SELECT track_recommendation_click('source_id', 'recommended_id');

-- Track when purchase happens
SELECT track_recommendation_conversion('source_id', 'recommended_id');
```

### 07_seed_collections.sql
**Purpose:** Curated collection setup

**Features:**
- 10+ pre-defined luxury collections
- Seasonal collections with date ranges
- Theme configuration (colors, mood)
- Auto-population functions

**Collections Created:**
- New Arrivals (Featured)
- Best Sellers (Featured)
- Limited Edition (Featured)
- Spring/Summer 2025
- Fall/Winter 2024
- Bridal
- Evening Elegance
- Everyday Luxury
- Gifts for Her/Him
- Investment Pieces
- Designer Collaborations

**Functions:**
```sql
-- Get active collections
SELECT * FROM get_active_collections();

-- Auto-add products to collection
SELECT add_products_to_collection('new-arrivals', 'new', NULL, 20);
SELECT add_products_to_collection('best-sellers', 'top-rated', NULL, 15);
SELECT add_products_to_collection('bridal', 'category', 'jewelry', 12);
```

## Initial Setup

After running all migrations:

1. **Populate search vectors:**
```sql
UPDATE products SET "updatedAt" = "updatedAt";
```

2. **Initialize analytics counters:**
```sql
-- Already handled in 02_setup_analytics.sql
-- Counters are automatically populated
```

3. **Generate initial recommendations:**
```sql
-- Wait until you have order data, then:
SELECT generate_all_recommendations();
```

4. **Populate collections:**
```sql
SELECT add_products_to_collection('new-arrivals', 'new', NULL, 20);
SELECT add_products_to_collection('best-sellers', 'top-rated', NULL, 15);
SELECT add_products_to_collection('limited-edition', 'badges', 'Limited Edition', 10);
```

## Maintenance

### Weekly Tasks

```sql
-- Refresh recommendations
SELECT generate_all_recommendations();

-- Clean up low-performing recommendations
SELECT cleanup_recommendations(0.1, 30);

-- Update statistics
ANALYZE products;
ANALYZE product_views;
ANALYZE reviews;
```

### Monthly Tasks

```sql
-- Reindex search vectors (during low traffic)
REINDEX INDEX CONCURRENTLY idx_products_searchvector;

-- Review recommendation performance
SELECT * FROM get_recommendation_performance();
```

## Testing Queries

### Test Search
```sql
-- Basic search
SELECT * FROM search_products('gold necklace', NULL, NULL, NULL, 10, 0);

-- Search with filters
SELECT * FROM search_products(
  'luxury watch',
  'watches',        -- category
  1000,            -- min price
  5000,            -- max price
  10,              -- limit
  0                -- offset
);

-- Autocomplete
SELECT * FROM autocomplete_products('neck', 10);
```

### Test Analytics
```sql
-- Add a product view
INSERT INTO product_views ("productId", "userId", "sessionId")
VALUES ('product_id_here', 'user_id_here', 'session_123');

-- Check if viewCount increased
SELECT name, "viewCount" FROM products WHERE id = 'product_id_here';

-- Add a like
INSERT INTO product_likes ("productId", "userId")
VALUES ('product_id_here', 'user_id_here');

-- Check if likeCount increased
SELECT name, "likeCount" FROM products WHERE id = 'product_id_here';
```

### Test Recommendations
```sql
-- Generate test recommendations
SELECT generate_collaborative_recommendations(50);
SELECT generate_content_based_recommendations(50);

-- View recommendations for a product
SELECT * FROM get_product_recommendations('product_id_here', 6);

-- Check performance
SELECT * FROM get_recommendation_performance();
```

## Performance Monitoring

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Find Slow Queries
```sql
SELECT
  calls,
  total_time,
  mean_time,
  query
FROM pg_stat_statements
WHERE query ILIKE '%products%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Check Table Sizes
```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Rollback

If you need to rollback:

```bash
# Rollback Prisma migration
npx prisma migrate resolve --rolled-back <migration_name>

# Drop SQL enhancements (run in reverse order)
psql $DATABASE_URL -f rollback/07_drop_collections.sql
psql $DATABASE_URL -f rollback/06_drop_recommendations.sql
# ... etc
```

## Production Checklist

Before deploying to production:

- [ ] Test all migrations on staging environment
- [ ] Backup production database
- [ ] Review slow query log
- [ ] Verify all indexes created successfully
- [ ] Test search functionality
- [ ] Verify analytics counters are accurate
- [ ] Test recommendation generation
- [ ] Monitor database performance after deployment
- [ ] Set up pg_cron for automated tasks (optional)

## Support

For issues or questions:
1. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql.log`
2. Review migration execution: `SELECT * FROM _prisma_migrations;`
3. Verify functions exist: `\df` in psql
4. Check trigger status: `SELECT * FROM information_schema.triggers;`

## Advanced: Scheduled Jobs

If you have `pg_cron` installed:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily recommendation refresh at 2 AM
SELECT cron.schedule(
  'refresh-recommendations',
  '0 2 * * *',
  $$ SELECT generate_all_recommendations(); $$
);

-- Schedule weekly analytics update
SELECT cron.schedule(
  'update-analytics',
  '0 3 * * 0',
  $$
    ANALYZE products;
    ANALYZE product_views;
    ANALYZE reviews;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

## Summary

These SQL migrations transform your database into a high-performance luxury e-commerce platform with:

✅ Lightning-fast full-text search
✅ Real-time analytics tracking
✅ Smooth UI animation support
✅ Intelligent recommendations
✅ Hierarchical categories
✅ Curated collections
✅ Advanced filtering & sorting
✅ Production-ready performance

Estimated setup time: **30-60 minutes**
Zero downtime: **Yes** (all indexes use CONCURRENTLY)
