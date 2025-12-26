-- Full-Text Search Setup for NextPik E-commerce
-- This file sets up PostgreSQL full-text search with tsvector

-- ============================================================================
-- 1. Create function to update search vector
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW."seoKeywords", ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.materials, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Create trigger to auto-update search vector
-- ============================================================================
DROP TRIGGER IF EXISTS products_search_vector_update ON products;
CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE OF name, description, "shortDescription", "seoKeywords", materials
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- ============================================================================
-- 3. Populate search vector for existing products
-- ============================================================================
UPDATE products
SET "updatedAt" = "updatedAt"
WHERE "searchVector" IS NULL;

-- ============================================================================
-- 4. Create search function with ranking
-- ============================================================================
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  "heroImage" TEXT,
  "shortDescription" TEXT,
  badges TEXT[],
  rating DECIMAL,
  "reviewCount" INT,
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
    p."shortDescription",
    p.badges,
    p.rating,
    p."reviewCount",
    ts_rank_cd(p."searchVector", websearch_to_tsquery('english', search_query), 32) AS rank
  FROM products p
  LEFT JOIN categories c ON p."categoryId" = c.id
  WHERE
    p."searchVector" @@ websearch_to_tsquery('english', search_query)
    AND p.status = 'ACTIVE'
    AND (category_filter IS NULL OR c.slug = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  ORDER BY rank DESC, p."displayOrder" ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Create autocomplete function
-- ============================================================================
CREATE OR REPLACE FUNCTION autocomplete_products(
  search_query TEXT,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH suggestions AS (
    SELECT DISTINCT
      unnest(string_to_array(p.name, ' ')) as word,
      COUNT(*) as cnt
    FROM products p
    WHERE
      p.status = 'ACTIVE'
      AND p.name ILIKE search_query || '%'
    GROUP BY word
  )
  SELECT
    s.word as suggestion,
    s.cnt as product_count
  FROM suggestions s
  WHERE LENGTH(s.word) > 2
  ORDER BY s.cnt DESC, s.word
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Set database text search config
-- ============================================================================
COMMENT ON FUNCTION search_products IS 'Full-text search for products with filters';
COMMENT ON FUNCTION autocomplete_products IS 'Product name autocomplete suggestions';
COMMENT ON FUNCTION update_product_search_vector IS 'Automatically updates search vector on product changes';
