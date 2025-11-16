# Database Migration Guide - Luxury E-commerce Platform

## Overview
This guide provides a zero-downtime migration strategy for deploying the enhanced luxury e-commerce schema.

## Migration Strategy

### Phase 1: Add New Columns (Non-Breaking)
Run these migrations first - they're additive and won't break existing functionality.

```bash
# Generate migration
npx prisma migrate dev --name add_luxury_features_phase1

# Or for production
npx prisma migrate deploy
```

**What happens:**
- Adds new optional fields to existing tables
- Creates new tables (Category, Collection, Wishlist, etc.)
- Existing queries continue to work

### Phase 2: Data Migration
Migrate data from old structure to new structure while both are active.

#### 2.1 Migrate ProductCategory Enum to Category Table

```sql
-- Create migration script: migrate-categories.sql
-- Insert categories from enum values
INSERT INTO categories (id, name, slug, "displayOrder", "isActive")
VALUES
  (gen_random_uuid(), 'Accessories', 'accessories', 1, true),
  (gen_random_uuid(), 'Apparel', 'apparel', 2, true),
  (gen_random_uuid(), 'Beauty', 'beauty', 3, true),
  (gen_random_uuid(), 'Home', 'home', 4, true),
  (gen_random_uuid(), 'Jewelry', 'jewelry', 5, true),
  (gen_random_uuid(), 'Watches', 'watches', 6, true)
ON CONFLICT DO NOTHING;

-- Update products to reference new category table
-- This can be run in batches to avoid locks
UPDATE products p
SET "categoryId" = c.id
FROM categories c
WHERE LOWER(c.slug) = LOWER(p.category::text)
AND p."categoryId" IS NULL;
```

#### 2.2 Initialize Analytics Counters

```sql
-- Update view counts from ProductView table
UPDATE products p
SET "viewCount" = (
  SELECT COUNT(*) FROM product_views pv WHERE pv."productId" = p.id
);

-- Update like counts from ProductLike table
UPDATE products p
SET "likeCount" = (
  SELECT COUNT(*) FROM product_likes pl WHERE pl."productId" = p.id
);

-- Update ratings from Review table
UPDATE products p
SET
  rating = (SELECT AVG(rating) FROM reviews r WHERE r."productId" = p.id),
  "reviewCount" = (SELECT COUNT(*) FROM reviews r WHERE r."productId" = p.id);
```

### Phase 3: Setup Full-Text Search

#### 3.1 Create Search Vector Update Function

```sql
-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW."seoKeywords", ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- Populate existing products
UPDATE products SET "updatedAt" = "updatedAt";
```

#### 3.2 Create Search Function for Application

```sql
-- Function for product search with ranking
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  "heroImage" TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p."heroImage",
    ts_rank(p."searchVector", websearch_to_tsquery('english', search_query)) AS rank
  FROM products p
  WHERE
    p."searchVector" @@ websearch_to_tsquery('english', search_query)
    AND p.status = 'ACTIVE'
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

### Phase 4: Create Helpful Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_active
  ON products (featured, status) WHERE featured = true AND status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active
  ON products ("categoryId", status, "displayOrder") WHERE status = 'ACTIVE';

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
  ON products (inventory) WHERE inventory <= 10 AND status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_available
  ON product_variants ("productId", "isAvailable") WHERE "isAvailable" = true;

-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_date_product
  ON product_views ("createdAt", "productId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved
  ON reviews ("productId", rating) WHERE "isApproved" = true;
```

### Phase 5: Create Database Functions for Smooth Animations

#### 5.1 Cart Item Update with Previous Quantity

```sql
-- Function to track previous quantity for animations
CREATE OR REPLACE FUNCTION update_cart_item_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity != OLD.quantity THEN
    NEW."previousQuantity" := OLD.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_item_quantity_change
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION update_cart_item_quantity();
```

#### 5.2 Product Inventory Update with Previous Stock

```sql
-- Track previous stock for smooth transitions
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inventory != OLD.inventory THEN
    NEW."previousStock" := OLD.inventory;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_inventory_change
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION update_product_inventory();

-- Same for variants
CREATE TRIGGER variant_inventory_change
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION update_product_inventory();
```

### Phase 6: Create Auto-Update Triggers for Counters

```sql
-- Auto-update product rating when review is added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    rating = (SELECT AVG(rating) FROM reviews WHERE "productId" = COALESCE(NEW."productId", OLD."productId") AND "isApproved" = true),
    "reviewCount" = (SELECT COUNT(*) FROM reviews WHERE "productId" = COALESCE(NEW."productId", OLD."productId") AND "isApproved" = true)
  WHERE id = COALESCE(NEW."productId", OLD."productId");
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Auto-update view count
CREATE OR REPLACE FUNCTION increment_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET "viewCount" = "viewCount" + 1
  WHERE id = NEW."productId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_view_increment
  AFTER INSERT ON product_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_product_views();

-- Auto-update like count
CREATE OR REPLACE FUNCTION update_product_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET "likeCount" = "likeCount" + 1 WHERE id = NEW."productId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET "likeCount" = "likeCount" - 1 WHERE id = OLD."productId";
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_like_update
  AFTER INSERT OR DELETE ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes();
```

## Zero-Downtime Deployment Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Verify all indexes are created with CONCURRENTLY
- [ ] Review slow query log for potential issues

### Deployment Steps
1. **Deploy Phase 1** - Add new columns/tables (5 min)
   ```bash
   npx prisma migrate deploy
   ```

2. **Run Data Migration** - Batch processing (15-30 min)
   ```bash
   psql $DATABASE_URL -f migrations/migrate-categories.sql
   psql $DATABASE_URL -f migrations/migrate-analytics.sql
   ```

3. **Create Indexes Concurrently** - Won't lock tables (30-60 min)
   ```bash
   psql $DATABASE_URL -f migrations/create-indexes.sql
   ```

4. **Setup Functions & Triggers** - Quick (2 min)
   ```bash
   psql $DATABASE_URL -f migrations/setup-functions.sql
   ```

5. **Deploy Application Code** - New features enabled
   ```bash
   # Deploy API/frontend with new features
   ```

6. **Monitor & Verify**
   - Check application logs
   - Verify search functionality
   - Test wishlist/reviews
   - Monitor database performance

### Post-Deployment
- [ ] Verify all counters are accurate
- [ ] Test full-text search
- [ ] Run ANALYZE on updated tables
- [ ] Monitor query performance
- [ ] Set up alerts for slow queries

## Performance Optimization

### Recommended PostgreSQL Settings

```sql
-- For better full-text search performance
ALTER DATABASE luxury_ecommerce SET default_text_search_config = 'pg_catalog.english';

-- Increase work_mem for complex queries
ALTER DATABASE luxury_ecommerce SET work_mem = '256MB';

-- Better statistics for query planner
ALTER TABLE products ALTER COLUMN "searchVector" SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN "categoryId" SET STATISTICS 1000;
```

### Periodic Maintenance

```sql
-- Run weekly to keep statistics fresh
ANALYZE products;
ANALYZE product_variants;
ANALYZE reviews;

-- Reindex search vectors if needed (during low traffic)
REINDEX INDEX CONCURRENTLY idx_products_searchvector;
```

## Rollback Strategy

If issues occur during migration:

```sql
-- Rollback to previous migration
npx prisma migrate resolve --rolled-back <migration_name>

-- Or manually drop new tables/columns if needed
BEGIN;
  -- Drop triggers first
  DROP TRIGGER IF EXISTS products_search_vector_update ON products;
  DROP TRIGGER IF EXISTS cart_item_quantity_change ON cart_items;
  -- ... etc

  -- Drop new columns
  ALTER TABLE products DROP COLUMN IF EXISTS "searchVector";
  -- ... etc
ROLLBACK; -- Test first, then COMMIT when ready
```

## Monitoring Queries

Use these queries to monitor the migration:

```sql
-- Check search vector population
SELECT
  COUNT(*) as total,
  COUNT("searchVector") as with_search_vector,
  ROUND(COUNT("searchVector")::numeric / COUNT(*) * 100, 2) as percentage
FROM products;

-- Verify category migration
SELECT
  COUNT(*) as products_with_category_id
FROM products
WHERE "categoryId" IS NOT NULL;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('products', 'product_variants', 'reviews')
ORDER BY idx_scan DESC;
```

## Support & Troubleshooting

### Common Issues

**Search not working:**
```sql
-- Verify tsvector is populated
SELECT name, "searchVector" FROM products LIMIT 5;

-- Test search function
SELECT * FROM search_products('luxury watch', 10, 0);
```

**Slow queries:**
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'products'
ORDER BY abs(correlation) DESC;
```

**Lock timeouts:**
```sql
-- Monitor long-running queries
SELECT pid, age(clock_timestamp(), query_start), query
FROM pg_stat_activity
WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start;
```

## Summary

This migration adds:
- ✅ Rich media galleries (images, videos, 360° views)
- ✅ Full-text search with PostgreSQL tsvector
- ✅ Wishlist & favorites
- ✅ Product reviews & ratings
- ✅ Analytics (views, likes)
- ✅ Recommendation engine foundation
- ✅ Order timeline tracking
- ✅ Smooth UI animations support
- ✅ Hierarchical categories
- ✅ Curated collections

All with zero downtime! 🎉
