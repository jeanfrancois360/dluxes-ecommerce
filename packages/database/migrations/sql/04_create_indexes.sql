-- Performance Indexes for NextPik E-commerce
-- Use CONCURRENTLY to avoid locking tables during creation

-- ============================================================================
-- 1. Product Indexes
-- ============================================================================

-- Composite index for featured products on homepage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_active
  ON products (featured, status, "displayOrder")
  WHERE featured = true AND status = 'ACTIVE';

-- Composite index for category browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active
  ON products ("categoryId", status, "displayOrder")
  WHERE status = 'ACTIVE';

-- Partial index for low stock alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
  ON products (inventory, name)
  WHERE inventory <= 10 AND status = 'ACTIVE';

-- Index for sorting by popularity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_popularity
  ON products ("viewCount" DESC, "likeCount" DESC)
  WHERE status = 'ACTIVE';

-- Index for sorting by rating
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_rating
  ON products (rating DESC NULLS LAST, "reviewCount" DESC)
  WHERE status = 'ACTIVE' AND rating IS NOT NULL;

-- Index for price range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price_range
  ON products (price, status)
  WHERE status = 'ACTIVE';

-- Composite index for new arrivals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_new_arrivals
  ON products ("createdAt" DESC, status)
  WHERE status = 'ACTIVE';

-- Index for badge filtering (e.g., "Sale", "New")
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_badges
  ON products USING GIN (badges)
  WHERE status = 'ACTIVE';

-- Index for color filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_colors
  ON products USING GIN (colors)
  WHERE status = 'ACTIVE';

-- Index for size filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sizes
  ON products USING GIN (sizes)
  WHERE status = 'ACTIVE';

-- Index for material filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_materials
  ON products USING GIN (materials)
  WHERE status = 'ACTIVE';

-- ============================================================================
-- 2. Product Variant Indexes
-- ============================================================================

-- Composite index for available variants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_available
  ON product_variants ("productId", "isAvailable", "displayOrder")
  WHERE "isAvailable" = true;

-- Index for low stock variants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_low_stock
  ON product_variants ("productId", inventory, "lowStockThreshold")
  WHERE "isAvailable" = true AND inventory <= "lowStockThreshold";

-- Index for color variant filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_color
  ON product_variants ("productId", "colorHex")
  WHERE "isAvailable" = true AND "colorHex" IS NOT NULL;

-- ============================================================================
-- 3. Category Indexes
-- ============================================================================

-- Index for hierarchical category queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_hierarchy
  ON categories ("parentId", "displayOrder")
  WHERE "isActive" = true;

-- ============================================================================
-- 4. Collection Indexes
-- ============================================================================

-- Index for active collections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_active
  ON collections ("isActive", "isFeatured", "displayOrder")
  WHERE "isActive" = true;

-- Index for time-based collections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_timebound
  ON collections ("startDate", "endDate", "isActive")
  WHERE "isActive" = true;

-- Index for product-collection lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_collections_lookup
  ON product_collections ("collectionId", "displayOrder");

-- ============================================================================
-- 5. Cart & Order Indexes
-- ============================================================================

-- Index for user cart lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_user_active
  ON carts ("userId", "updatedAt" DESC)
  WHERE "userId" IS NOT NULL;

-- Index for session cart lookup (anonymous users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_session_active
  ON carts ("sessionId", "updatedAt" DESC);

-- Index for cart abandonment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_abandoned
  ON carts ("updatedAt", "userId")
  WHERE "userId" IS NOT NULL
    AND "updatedAt" < NOW() - INTERVAL '1 day';

-- Index for order history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_recent
  ON orders ("userId", "createdAt" DESC);

-- Index for order status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_date
  ON orders (status, "createdAt" DESC);

-- Index for payment processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_pending
  ON orders ("paymentStatus", "createdAt")
  WHERE "paymentStatus" = 'PENDING';

-- ============================================================================
-- 6. Analytics Indexes
-- ============================================================================

-- Index for recent product views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_recent
  ON product_views ("productId", "createdAt" DESC);

-- Index for user view history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_user
  ON product_views ("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

-- Index for session tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_session
  ON product_views ("sessionId", "createdAt" DESC)
  WHERE "sessionId" IS NOT NULL;

-- Index for trending analysis (last 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_trending
  ON product_views ("productId", "createdAt")
  WHERE "createdAt" >= NOW() - INTERVAL '7 days';

-- ============================================================================
-- 7. Review Indexes
-- ============================================================================

-- Index for approved product reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_approved
  ON reviews ("productId", "isApproved", rating, "createdAt" DESC)
  WHERE "isApproved" = true;

-- Index for user reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user
  ON reviews ("userId", "createdAt" DESC);

-- Index for verified purchase reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_verified
  ON reviews ("productId", "isVerified", rating)
  WHERE "isApproved" = true AND "isVerified" = true;

-- Index for pinned reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pinned
  ON reviews ("productId", "isPinned", "createdAt" DESC)
  WHERE "isPinned" = true;

-- Index for review moderation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pending_approval
  ON reviews ("isApproved", "createdAt")
  WHERE "isApproved" = false;

-- ============================================================================
-- 8. Wishlist Indexes
-- ============================================================================

-- Index for user wishlist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlist_user
  ON wishlist_items ("userId", priority DESC, "createdAt" DESC);

-- Index for product popularity (how many wishlists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlist_product_count
  ON wishlist_items ("productId");

-- ============================================================================
-- 9. Recommendation Indexes
-- ============================================================================

-- Index for product recommendations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recommendations_source
  ON product_recommendations ("sourceProductId", score DESC);

-- Index for recommendation performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recommendations_performance
  ON product_recommendations (algorithm, conversions DESC)
  WHERE impressions > 100;

-- ============================================================================
-- 10. Order Timeline Indexes
-- ============================================================================

-- Index for order timeline tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_timeline_order
  ON order_timeline ("orderId", "createdAt" ASC);

-- ============================================================================
-- Performance Statistics
-- ============================================================================

-- Increase statistics target for frequently filtered columns
ALTER TABLE products ALTER COLUMN "categoryId" SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN price SET STATISTICS 1000;
ALTER TABLE product_variants ALTER COLUMN "productId" SET STATISTICS 1000;

-- ============================================================================
-- Analyze Tables
-- ============================================================================

-- Update query planner statistics
ANALYZE products;
ANALYZE product_variants;
ANALYZE categories;
ANALYZE collections;
ANALYZE product_collections;
ANALYZE reviews;
ANALYZE product_views;
ANALYZE product_likes;
ANALYZE wishlist_items;
ANALYZE carts;
ANALYZE cart_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE order_timeline;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'product_variants', 'categories', 'collections',
    'reviews', 'product_views', 'wishlist_items', 'orders', 'carts'
  )
ORDER BY tablename, indexname;
