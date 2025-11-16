-- Product Recommendations Engine
-- Functions for generating and managing product recommendations

-- ============================================================================
-- 1. Collaborative Filtering - "Customers who bought X also bought Y"
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_collaborative_recommendations(
  batch_size INT DEFAULT 100
)
RETURNS void AS $$
BEGIN
  -- Find products frequently bought together
  INSERT INTO product_recommendations (
    "sourceProductId",
    "recommendedProductId",
    score,
    algorithm,
    reason,
    "createdAt",
    "updatedAt"
  )
  SELECT
    oi1."productId" as source_product_id,
    oi2."productId" as recommended_product_id,
    -- Score based on co-occurrence frequency
    LEAST(COUNT(*)::numeric / 100.0, 1.0) as score,
    'collaborative' as algorithm,
    'Customers also bought' as reason,
    NOW() as created_at,
    NOW() as updated_at
  FROM order_items oi1
  INNER JOIN order_items oi2
    ON oi1."orderId" = oi2."orderId"
    AND oi1."productId" != oi2."productId"
  INNER JOIN products p1 ON oi1."productId" = p1.id
  INNER JOIN products p2 ON oi2."productId" = p2.id
  WHERE
    p1.status = 'ACTIVE'
    AND p2.status = 'ACTIVE'
  GROUP BY oi1."productId", oi2."productId"
  HAVING COUNT(*) >= 2  -- At least 2 co-purchases
  ORDER BY COUNT(*) DESC
  LIMIT batch_size
  ON CONFLICT ("sourceProductId", "recommendedProductId")
  DO UPDATE SET
    score = EXCLUDED.score,
    "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Content-Based Filtering - Similar Products
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_content_based_recommendations(
  batch_size INT DEFAULT 100
)
RETURNS void AS $$
BEGIN
  -- Find similar products based on category, price range, and attributes
  INSERT INTO product_recommendations (
    "sourceProductId",
    "recommendedProductId",
    score,
    algorithm,
    reason,
    "createdAt",
    "updatedAt"
  )
  SELECT
    p1.id as source_product_id,
    p2.id as recommended_product_id,
    -- Calculate similarity score
    (
      -- Same category: +0.4
      CASE WHEN p1."categoryId" = p2."categoryId" THEN 0.4 ELSE 0.0 END +
      -- Similar price range (within 30%): +0.3
      CASE
        WHEN ABS(p1.price - p2.price) / NULLIF(p1.price, 0) <= 0.3 THEN 0.3
        ELSE 0.0
      END +
      -- Shared materials: +0.2
      CASE
        WHEN array_length(p1.materials & p2.materials, 1) > 0 THEN 0.2
        ELSE 0.0
      END +
      -- Shared colors: +0.1
      CASE
        WHEN array_length(p1.colors & p2.colors, 1) > 0 THEN 0.1
        ELSE 0.0
      END
    ) as score,
    'content-based' as algorithm,
    'Similar items' as reason,
    NOW() as created_at,
    NOW() as updated_at
  FROM products p1
  CROSS JOIN products p2
  WHERE
    p1.id != p2.id
    AND p1.status = 'ACTIVE'
    AND p2.status = 'ACTIVE'
    AND p1."categoryId" IS NOT NULL
    AND p2."categoryId" IS NOT NULL
    -- At least some similarity
    AND (
      p1."categoryId" = p2."categoryId"
      OR ABS(p1.price - p2.price) / NULLIF(p1.price, 0) <= 0.3
    )
  LIMIT batch_size
  ON CONFLICT ("sourceProductId", "recommendedProductId")
  DO UPDATE SET
    score = EXCLUDED.score,
    "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. Trending Products - Based on Recent Views
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_trending_recommendations(
  days_back INT DEFAULT 7,
  batch_size INT DEFAULT 50
)
RETURNS void AS $$
BEGIN
  -- Products trending in the same category
  INSERT INTO product_recommendations (
    "sourceProductId",
    "recommendedProductId",
    score,
    algorithm,
    reason,
    "createdAt",
    "updatedAt"
  )
  SELECT
    p1.id as source_product_id,
    trending.product_id as recommended_product_id,
    LEAST(trending.view_count::numeric / 1000.0, 1.0) as score,
    'trending' as algorithm,
    'Trending now' as reason,
    NOW() as created_at,
    NOW() as updated_at
  FROM products p1
  CROSS JOIN LATERAL (
    SELECT
      p2.id as product_id,
      COUNT(pv.id) as view_count
    FROM products p2
    LEFT JOIN product_views pv
      ON p2.id = pv."productId"
      AND pv."createdAt" >= NOW() - (days_back || ' days')::INTERVAL
    WHERE
      p2.status = 'ACTIVE'
      AND p2."categoryId" = p1."categoryId"
      AND p2.id != p1.id
    GROUP BY p2.id
    HAVING COUNT(pv.id) > 10
    ORDER BY view_count DESC
    LIMIT 10
  ) trending
  WHERE p1.status = 'ACTIVE'
  LIMIT batch_size
  ON CONFLICT ("sourceProductId", "recommendedProductId")
  DO UPDATE SET
    score = EXCLUDED.score,
    "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Get Recommendations for a Product
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_recommendations(
  product_id_param TEXT,
  limit_count INT DEFAULT 6
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  "compareAtPrice" DECIMAL,
  "heroImage" TEXT,
  rating DECIMAL,
  "reviewCount" INT,
  badges TEXT[],
  algorithm TEXT,
  reason TEXT,
  score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    p."compareAtPrice",
    p."heroImage",
    p.rating,
    p."reviewCount",
    p.badges,
    pr.algorithm,
    pr.reason,
    pr.score
  FROM product_recommendations pr
  INNER JOIN products p ON pr."recommendedProductId" = p.id
  WHERE
    pr."sourceProductId" = product_id_param
    AND p.status = 'ACTIVE'
    AND p.inventory > 0
  ORDER BY pr.score DESC, p.rating DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Track Recommendation Performance
-- ============================================================================

-- Increment impression count
CREATE OR REPLACE FUNCTION track_recommendation_impression(
  source_product_id_param TEXT,
  recommended_product_id_param TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE product_recommendations
  SET impressions = impressions + 1
  WHERE
    "sourceProductId" = source_product_id_param
    AND "recommendedProductId" = recommended_product_id_param;
END;
$$ LANGUAGE plpgsql;

-- Increment click count
CREATE OR REPLACE FUNCTION track_recommendation_click(
  source_product_id_param TEXT,
  recommended_product_id_param TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE product_recommendations
  SET clicks = clicks + 1
  WHERE
    "sourceProductId" = source_product_id_param
    AND "recommendedProductId" = recommended_product_id_param;
END;
$$ LANGUAGE plpgsql;

-- Increment conversion count
CREATE OR REPLACE FUNCTION track_recommendation_conversion(
  source_product_id_param TEXT,
  recommended_product_id_param TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE product_recommendations
  SET conversions = conversions + 1
  WHERE
    "sourceProductId" = source_product_id_param
    AND "recommendedProductId" = recommended_product_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Get Recommendation Performance Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recommendation_performance()
RETURNS TABLE (
  algorithm TEXT,
  total_recommendations BIGINT,
  avg_score DECIMAL,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  ctr DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.algorithm,
    COUNT(*) as total_recommendations,
    ROUND(AVG(pr.score)::numeric, 4) as avg_score,
    SUM(pr.impressions) as total_impressions,
    SUM(pr.clicks) as total_clicks,
    SUM(pr.conversions) as total_conversions,
    CASE
      WHEN SUM(pr.impressions) > 0
      THEN ROUND((SUM(pr.clicks)::numeric / SUM(pr.impressions) * 100), 2)
      ELSE 0
    END as ctr,
    CASE
      WHEN SUM(pr.clicks) > 0
      THEN ROUND((SUM(pr.conversions)::numeric / SUM(pr.clicks) * 100), 2)
      ELSE 0
    END as conversion_rate
  FROM product_recommendations pr
  GROUP BY pr.algorithm
  ORDER BY total_conversions DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Cleanup Old/Low-Performing Recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_recommendations(
  min_score DECIMAL DEFAULT 0.1,
  days_old INT DEFAULT 30
)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM product_recommendations
    WHERE
      (score < min_score AND impressions > 100 AND clicks < 5)
      OR ("updatedAt" < NOW() - (days_old || ' days')::INTERVAL AND impressions = 0)
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Master Function - Generate All Recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_all_recommendations()
RETURNS TABLE (
  algorithm TEXT,
  recommendations_created INT
) AS $$
DECLARE
  collab_count INT;
  content_count INT;
  trending_count INT;
BEGIN
  -- Run all recommendation algorithms
  PERFORM generate_collaborative_recommendations(200);
  PERFORM generate_content_based_recommendations(200);
  PERFORM generate_trending_recommendations(7, 100);

  -- Return counts
  RETURN QUERY
  SELECT
    pr.algorithm,
    COUNT(*)::INT as count
  FROM product_recommendations pr
  WHERE pr."updatedAt" >= NOW() - INTERVAL '5 minutes'
  GROUP BY pr.algorithm;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Schedule Recommendation Refresh (Optional - requires pg_cron)
-- ============================================================================

-- Uncomment if using pg_cron extension:
/*
-- Install pg_cron extension first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily recommendation refresh at 2 AM
SELECT cron.schedule(
  'refresh-recommendations',
  '0 2 * * *',
  $$ SELECT generate_all_recommendations(); $$
);

-- Schedule weekly cleanup at 3 AM on Sundays
SELECT cron.schedule(
  'cleanup-recommendations',
  '0 3 * * 0',
  $$ SELECT cleanup_recommendations(0.1, 30); $$
);
*/

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION generate_collaborative_recommendations IS 'Generate "customers also bought" recommendations';
COMMENT ON FUNCTION generate_content_based_recommendations IS 'Generate recommendations based on product similarity';
COMMENT ON FUNCTION generate_trending_recommendations IS 'Generate recommendations based on trending products';
COMMENT ON FUNCTION get_product_recommendations IS 'Get recommendations for a specific product';
COMMENT ON FUNCTION track_recommendation_impression IS 'Track when a recommendation is displayed';
COMMENT ON FUNCTION track_recommendation_click IS 'Track when a recommendation is clicked';
COMMENT ON FUNCTION track_recommendation_conversion IS 'Track when a recommendation leads to purchase';
COMMENT ON FUNCTION get_recommendation_performance IS 'Get performance metrics for recommendation algorithms';
COMMENT ON FUNCTION cleanup_recommendations IS 'Remove old or low-performing recommendations';
COMMENT ON FUNCTION generate_all_recommendations IS 'Generate recommendations using all algorithms';

-- ============================================================================
-- Initial Run
-- ============================================================================

-- Generate initial recommendations (run after you have some order data)
-- SELECT generate_all_recommendations();
