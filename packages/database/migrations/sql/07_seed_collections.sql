-- Luxury Collections Seed Data
-- Create elegant curated collections for the luxury e-commerce platform

-- ============================================================================
-- 1. Create Featured Collections
-- ============================================================================

-- New Arrivals Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'New Arrivals',
  'new-arrivals',
  'Discover our latest luxury pieces, carefully curated for the discerning collector',
  '/collections/new-arrivals-hero.jpg',
  '{
    "colors": ["#000000", "#D4AF37", "#FFFFFF"],
    "mood": "elegant",
    "accentColor": "#D4AF37"
  }'::json,
  1,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Best Sellers Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Best Sellers',
  'best-sellers',
  'Our most coveted pieces, chosen by collectors worldwide',
  '/collections/best-sellers-hero.jpg',
  '{
    "colors": ["#1a1a1a", "#C0C0C0", "#FFFFFF"],
    "mood": "sophisticated",
    "accentColor": "#C0C0C0"
  }'::json,
  2,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Limited Edition Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Limited Edition',
  'limited-edition',
  'Exclusive pieces available for a limited time only',
  '/collections/limited-edition-hero.jpg',
  '{
    "colors": ["#000000", "#FFD700", "#8B0000"],
    "mood": "exclusive",
    "accentColor": "#FFD700"
  }'::json,
  3,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. Seasonal Collections
-- ============================================================================

-- Spring/Summer Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured", "startDate", "endDate")
VALUES (
  gen_random_uuid(),
  'Spring Summer 2025',
  'spring-summer-2025',
  'Light, elegant pieces perfect for the warmer seasons',
  '/collections/spring-summer-hero.jpg',
  '{
    "colors": ["#F5F5DC", "#87CEEB", "#D4AF37"],
    "mood": "airy",
    "accentColor": "#87CEEB"
  }'::json,
  10,
  true,
  false,
  '2025-03-01'::timestamp,
  '2025-08-31'::timestamp
)
ON CONFLICT (slug) DO NOTHING;

-- Fall/Winter Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured", "startDate", "endDate")
VALUES (
  gen_random_uuid(),
  'Fall Winter 2024',
  'fall-winter-2024',
  'Rich, luxurious pieces for the cooler months',
  '/collections/fall-winter-hero.jpg',
  '{
    "colors": ["#2F4F4F", "#8B4513", "#D4AF37"],
    "mood": "cozy-luxury",
    "accentColor": "#8B4513"
  }'::json,
  11,
  true,
  false,
  '2024-09-01'::timestamp,
  '2025-02-28'::timestamp
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. Occasion-Based Collections
-- ============================================================================

-- Bridal Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Bridal',
  'bridal',
  'Exquisite pieces for your special day',
  '/collections/bridal-hero.jpg',
  '{
    "colors": ["#FFFFFF", "#FFE4E1", "#D4AF37"],
    "mood": "romantic",
    "accentColor": "#FFE4E1"
  }'::json,
  20,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Evening Elegance Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Evening Elegance',
  'evening-elegance',
  'Sophisticated pieces for formal occasions',
  '/collections/evening-hero.jpg',
  '{
    "colors": ["#000000", "#4B0082", "#D4AF37"],
    "mood": "dramatic",
    "accentColor": "#4B0082"
  }'::json,
  21,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Everyday Luxury Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Everyday Luxury',
  'everyday-luxury',
  'Refined pieces for daily elegance',
  '/collections/everyday-hero.jpg',
  '{
    "colors": ["#F5F5F5", "#696969", "#D4AF37"],
    "mood": "understated",
    "accentColor": "#696969"
  }'::json,
  22,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. Gift Collections
-- ============================================================================

-- Gifts for Her
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Gifts for Her',
  'gifts-for-her',
  'Thoughtfully curated luxury gifts',
  '/collections/gifts-her-hero.jpg',
  '{
    "colors": ["#FFB6C1", "#FFD700", "#FFFFFF"],
    "mood": "delicate",
    "accentColor": "#FFB6C1"
  }'::json,
  30,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Gifts for Him
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Gifts for Him',
  'gifts-for-him',
  'Distinguished gifts for the modern gentleman',
  '/collections/gifts-him-hero.jpg',
  '{
    "colors": ["#2F4F4F", "#C0C0C0", "#8B4513"],
    "mood": "masculine",
    "accentColor": "#2F4F4F"
  }'::json,
  31,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 5. Price Range Collections
-- ============================================================================

-- Investment Pieces Collection
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Investment Pieces',
  'investment-pieces',
  'Timeless treasures that appreciate in value',
  '/collections/investment-hero.jpg',
  '{
    "colors": ["#000000", "#B8860B", "#FFFFFF"],
    "mood": "prestige",
    "accentColor": "#B8860B"
  }'::json,
  40,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. Collaboration Collections
-- ============================================================================

-- Designer Collaboration
INSERT INTO collections (id, name, slug, description, "heroImage", theme, "displayOrder", "isActive", "isFeatured")
VALUES (
  gen_random_uuid(),
  'Designer Collaborations',
  'designer-collaborations',
  'Exclusive partnerships with world-renowned designers',
  '/collections/collaborations-hero.jpg',
  '{
    "colors": ["#000000", "#FF6347", "#D4AF37"],
    "mood": "avant-garde",
    "accentColor": "#FF6347"
  }'::json,
  50,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 7. Helper Functions for Collections
-- ============================================================================

-- Get active collections
CREATE OR REPLACE FUNCTION get_active_collections()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  "heroImage" TEXT,
  theme JSON,
  "displayOrder" INT,
  "isFeatured" BOOLEAN,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c."heroImage",
    c.theme,
    c."displayOrder",
    c."isFeatured",
    COUNT(pc."productId") as product_count
  FROM collections c
  LEFT JOIN product_collections pc ON c.id = pc."collectionId"
  WHERE
    c."isActive" = true
    AND (c."startDate" IS NULL OR c."startDate" <= NOW())
    AND (c."endDate" IS NULL OR c."endDate" >= NOW())
  GROUP BY c.id
  ORDER BY c."isFeatured" DESC, c."displayOrder" ASC;
END;
$$ LANGUAGE plpgsql;

-- Add products to collection by criteria
CREATE OR REPLACE FUNCTION add_products_to_collection(
  collection_slug_param TEXT,
  criteria_type TEXT,  -- 'new', 'top-rated', 'trending', 'category', 'price-range'
  criteria_value TEXT DEFAULT NULL,
  max_products INT DEFAULT 20
)
RETURNS INT AS $$
DECLARE
  collection_id_var TEXT;
  added_count INT := 0;
BEGIN
  -- Get collection ID
  SELECT id INTO collection_id_var
  FROM collections
  WHERE slug = collection_slug_param;

  IF collection_id_var IS NULL THEN
    RAISE EXCEPTION 'Collection not found: %', collection_slug_param;
  END IF;

  -- Add products based on criteria
  IF criteria_type = 'new' THEN
    INSERT INTO product_collections ("productId", "collectionId", "displayOrder")
    SELECT p.id, collection_id_var, ROW_NUMBER() OVER (ORDER BY p."createdAt" DESC)
    FROM products p
    WHERE p.status = 'ACTIVE'
    ORDER BY p."createdAt" DESC
    LIMIT max_products
    ON CONFLICT DO NOTHING;

  ELSIF criteria_type = 'top-rated' THEN
    INSERT INTO product_collections ("productId", "collectionId", "displayOrder")
    SELECT p.id, collection_id_var, ROW_NUMBER() OVER (ORDER BY p.rating DESC)
    FROM products p
    WHERE p.status = 'ACTIVE' AND p.rating IS NOT NULL
    ORDER BY p.rating DESC, p."reviewCount" DESC
    LIMIT max_products
    ON CONFLICT DO NOTHING;

  ELSIF criteria_type = 'trending' THEN
    INSERT INTO product_collections ("productId", "collectionId", "displayOrder")
    SELECT p.id, collection_id_var, ROW_NUMBER() OVER (ORDER BY p."viewCount" DESC)
    FROM products p
    WHERE p.status = 'ACTIVE'
    ORDER BY p."viewCount" DESC, p."likeCount" DESC
    LIMIT max_products
    ON CONFLICT DO NOTHING;

  ELSIF criteria_type = 'category' AND criteria_value IS NOT NULL THEN
    INSERT INTO product_collections ("productId", "collectionId", "displayOrder")
    SELECT p.id, collection_id_var, ROW_NUMBER() OVER (ORDER BY p."displayOrder")
    FROM products p
    INNER JOIN categories c ON p."categoryId" = c.id
    WHERE p.status = 'ACTIVE' AND c.slug = criteria_value
    LIMIT max_products
    ON CONFLICT DO NOTHING;

  ELSIF criteria_type = 'badges' AND criteria_value IS NOT NULL THEN
    INSERT INTO product_collections ("productId", "collectionId", "displayOrder")
    SELECT p.id, collection_id_var, ROW_NUMBER() OVER (ORDER BY p."createdAt" DESC)
    FROM products p
    WHERE p.status = 'ACTIVE' AND criteria_value = ANY(p.badges)
    LIMIT max_products
    ON CONFLICT DO NOTHING;
  END IF;

  GET DIAGNOSTICS added_count = ROW_COUNT;
  RETURN added_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Verification
-- ============================================================================

-- List all collections
SELECT
  name,
  slug,
  "displayOrder",
  "isActive",
  "isFeatured",
  CASE
    WHEN "startDate" IS NOT NULL AND "endDate" IS NOT NULL
    THEN 'Seasonal (' || to_char("startDate", 'Mon DD') || ' - ' || to_char("endDate", 'Mon DD') || ')'
    ELSE 'Permanent'
  END as type
FROM collections
ORDER BY "displayOrder";

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION get_active_collections IS 'Get all active collections with product counts';
COMMENT ON FUNCTION add_products_to_collection IS 'Automatically add products to a collection based on criteria';

-- ============================================================================
-- Example Usage
-- ============================================================================

-- Populate collections with products (uncomment after products are added):
/*
SELECT add_products_to_collection('new-arrivals', 'new', NULL, 20);
SELECT add_products_to_collection('best-sellers', 'top-rated', NULL, 15);
SELECT add_products_to_collection('limited-edition', 'badges', 'Limited Edition', 10);
SELECT add_products_to_collection('bridal', 'category', 'jewelry', 12);
*/
