-- Analytics & Engagement Triggers
-- Auto-update counters for views, likes, and ratings

-- ============================================================================
-- 1. Product View Counter
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET "viewCount" = "viewCount" + 1
  WHERE id = NEW."productId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_view_increment ON product_views;
CREATE TRIGGER product_view_increment
  AFTER INSERT ON product_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_product_views();

-- ============================================================================
-- 2. Product Like Counter
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products
    SET "likeCount" = "likeCount" + 1
    WHERE id = NEW."productId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET "likeCount" = GREATEST("likeCount" - 1, 0)
    WHERE id = OLD."productId";
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_like_update ON product_likes;
CREATE TRIGGER product_like_update
  AFTER INSERT OR DELETE ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes();

-- ============================================================================
-- 3. Product Rating & Review Counter
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id TEXT;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD."productId";
  ELSE
    target_product_id := NEW."productId";
  END IF;

  -- Update rating and review count (only approved reviews)
  UPDATE products
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE "productId" = target_product_id AND "isApproved" = true
    ),
    "reviewCount" = (
      SELECT COUNT(*)
      FROM reviews
      WHERE "productId" = target_product_id AND "isApproved" = true
    )
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_rating_update ON reviews;
CREATE TRIGGER review_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- ============================================================================
-- 4. Initialize Analytics Counters (Run once during migration)
-- ============================================================================

-- Update view counts from ProductView table
UPDATE products p
SET "viewCount" = COALESCE((
  SELECT COUNT(*) FROM product_views pv WHERE pv."productId" = p.id
), 0)
WHERE "viewCount" = 0;

-- Update like counts from ProductLike table
UPDATE products p
SET "likeCount" = COALESCE((
  SELECT COUNT(*) FROM product_likes pl WHERE pl."productId" = p.id
), 0)
WHERE "likeCount" = 0;

-- Update ratings and review counts from Review table
UPDATE products p
SET
  rating = (
    SELECT ROUND(AVG(r.rating)::numeric, 2)
    FROM reviews r
    WHERE r."productId" = p.id AND r."isApproved" = true
  ),
  "reviewCount" = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r."productId" = p.id AND r."isApproved" = true
  )
WHERE p.rating IS NULL OR p."reviewCount" = 0;

-- ============================================================================
-- 5. Helpful Functions for Analytics
-- ============================================================================

-- Get trending products based on recent views
CREATE OR REPLACE FUNCTION get_trending_products(
  days_back INT DEFAULT 7,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  "heroImage" TEXT,
  "viewCount" BIGINT,
  "likeCount" INT,
  rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p."heroImage",
    COUNT(pv.id) as view_count,
    p."likeCount",
    p.rating
  FROM products p
  LEFT JOIN product_views pv ON p.id = pv."productId"
    AND pv."createdAt" >= NOW() - (days_back || ' days')::INTERVAL
  WHERE p.status = 'ACTIVE'
  GROUP BY p.id
  ORDER BY view_count DESC, p."likeCount" DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Get top-rated products
CREATE OR REPLACE FUNCTION get_top_rated_products(
  min_reviews INT DEFAULT 5,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  "heroImage" TEXT,
  rating DECIMAL,
  "reviewCount" INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p."heroImage",
    p.rating,
    p."reviewCount"
  FROM products p
  WHERE
    p.status = 'ACTIVE'
    AND p.rating IS NOT NULL
    AND p."reviewCount" >= min_reviews
  ORDER BY p.rating DESC, p."reviewCount" DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION increment_product_views IS 'Auto-increments product view count';
COMMENT ON FUNCTION update_product_likes IS 'Auto-updates product like count on insert/delete';
COMMENT ON FUNCTION update_product_rating IS 'Auto-updates product rating and review count';
COMMENT ON FUNCTION get_trending_products IS 'Returns trending products based on recent views';
COMMENT ON FUNCTION get_top_rated_products IS 'Returns top-rated products with minimum review count';
