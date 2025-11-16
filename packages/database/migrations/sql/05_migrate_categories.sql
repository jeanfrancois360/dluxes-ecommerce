-- Category Migration
-- Migrates from ProductCategory enum to Category model

-- ============================================================================
-- 1. Insert Default Categories
-- ============================================================================

-- Insert main categories with luxury styling
INSERT INTO categories (id, name, slug, description, icon, "displayOrder", "isActive", "colorScheme")
VALUES
  (
    gen_random_uuid(),
    'Jewelry',
    'jewelry',
    'Exquisite handcrafted jewelry pieces featuring precious metals and gemstones',
    'diamond',
    1,
    true,
    '{"primary": "#D4AF37", "secondary": "#000000"}'::json
  ),
  (
    gen_random_uuid(),
    'Watches',
    'watches',
    'Timeless luxury timepieces from renowned Swiss and Italian artisans',
    'watch',
    2,
    true,
    '{"primary": "#C0C0C0", "secondary": "#1a1a1a"}'::json
  ),
  (
    gen_random_uuid(),
    'Apparel',
    'apparel',
    'Designer clothing crafted from the finest fabrics',
    'shirt',
    3,
    true,
    '{"primary": "#000000", "secondary": "#D4AF37"}'::json
  ),
  (
    gen_random_uuid(),
    'Accessories',
    'accessories',
    'Luxury accessories to complement your refined style',
    'bag',
    4,
    true,
    '{"primary": "#8B4513", "secondary": "#D4AF37"}'::json
  ),
  (
    gen_random_uuid(),
    'Beauty',
    'beauty',
    'Premium beauty and fragrance collections',
    'sparkles',
    5,
    true,
    '{"primary": "#FFD700", "secondary": "#FFF"}'::json
  ),
  (
    gen_random_uuid(),
    'Home',
    'home',
    'Elegant home décor and lifestyle pieces',
    'home',
    6,
    true,
    '{"primary": "#4A4A4A", "secondary": "#D4AF37"}'::json
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. Create Subcategories (Examples)
-- ============================================================================

-- Jewelry subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "displayOrder", "isActive")
SELECT
  gen_random_uuid(),
  subcategory.name,
  subcategory.slug,
  subcategory.description,
  c.id as "parentId",
  subcategory.display_order,
  true
FROM categories c
CROSS JOIN (
  VALUES
    ('Rings', 'rings', 'Engagement rings, wedding bands, and statement pieces', 1),
    ('Necklaces', 'necklaces', 'Elegant necklaces and pendants', 2),
    ('Bracelets', 'bracelets', 'Luxury bracelets and bangles', 3),
    ('Earrings', 'earrings', 'Diamond and gemstone earrings', 4)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'jewelry'
ON CONFLICT (slug) DO NOTHING;

-- Watches subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "displayOrder", "isActive")
SELECT
  gen_random_uuid(),
  subcategory.name,
  subcategory.slug,
  subcategory.description,
  c.id as "parentId",
  subcategory.display_order,
  true
FROM categories c
CROSS JOIN (
  VALUES
    ('Men''s Watches', 'mens-watches', 'Luxury timepieces for men', 1),
    ('Women''s Watches', 'womens-watches', 'Elegant watches for women', 2),
    ('Smartwatches', 'smartwatches', 'Luxury smart timepieces', 3)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'watches'
ON CONFLICT (slug) DO NOTHING;

-- Apparel subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "displayOrder", "isActive")
SELECT
  gen_random_uuid(),
  subcategory.name,
  subcategory.slug,
  subcategory.description,
  c.id as "parentId",
  subcategory.display_order,
  true
FROM categories c
CROSS JOIN (
  VALUES
    ('Suits & Tailoring', 'suits-tailoring', 'Bespoke suits and formal wear', 1),
    ('Casual Wear', 'casual-wear', 'Luxury casual clothing', 2),
    ('Outerwear', 'outerwear', 'Premium coats and jackets', 3),
    ('Evening Wear', 'evening-wear', 'Elegant evening attire', 4)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO NOTHING;

-- Accessories subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "displayOrder", "isActive")
SELECT
  gen_random_uuid(),
  subcategory.name,
  subcategory.slug,
  subcategory.description,
  c.id as "parentId",
  subcategory.display_order,
  true
FROM categories c
CROSS JOIN (
  VALUES
    ('Handbags', 'handbags', 'Designer handbags and clutches', 1),
    ('Wallets', 'wallets', 'Luxury leather wallets', 2),
    ('Belts', 'belts', 'Premium leather belts', 3),
    ('Sunglasses', 'sunglasses', 'Designer eyewear', 4),
    ('Scarves', 'scarves', 'Silk and cashmere scarves', 5)
) AS subcategory(name, slug, description, display_order)
WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. Link Existing Products to Categories (if category enum exists)
-- ============================================================================

-- Note: This requires the old 'category' column to still exist
-- If it doesn't exist yet, this will be handled during the Prisma migration

-- Update products with categoryId based on old enum value
-- Uncomment when migrating from old schema:
/*
UPDATE products p
SET "categoryId" = c.id
FROM categories c
WHERE LOWER(c.slug) = LOWER(p.category::text)
  AND p."categoryId" IS NULL;
*/

-- ============================================================================
-- 4. Verification Queries
-- ============================================================================

-- Count categories
SELECT 'Total Categories' as metric, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Top-Level Categories', COUNT(*) FROM categories WHERE "parentId" IS NULL
UNION ALL
SELECT 'Subcategories', COUNT(*) FROM categories WHERE "parentId" IS NOT NULL;

-- Show category hierarchy
SELECT
  COALESCE(parent.name, 'ROOT') as parent_category,
  child.name as category_name,
  child.slug,
  child."displayOrder"
FROM categories child
LEFT JOIN categories parent ON child."parentId" = parent.id
ORDER BY COALESCE(parent."displayOrder", 0), child."displayOrder";

-- ============================================================================
-- 5. Helper Function - Get Category Tree
-- ============================================================================

-- Recursive function to get full category hierarchy
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  level INT,
  path TEXT
) AS $$
WITH RECURSIVE category_tree AS (
  -- Base case: top-level categories
  SELECT
    c.id,
    c.name,
    c.slug,
    c."parentId",
    1 as level,
    c.name as path
  FROM categories c
  WHERE c."parentId" IS NULL AND c."isActive" = true

  UNION ALL

  -- Recursive case: subcategories
  SELECT
    c.id,
    c.name,
    c.slug,
    c."parentId",
    ct.level + 1,
    ct.path || ' > ' || c.name
  FROM categories c
  INNER JOIN category_tree ct ON c."parentId" = ct.id
  WHERE c."isActive" = true
)
SELECT id, name, slug, level, path
FROM category_tree
ORDER BY path;
$$ LANGUAGE SQL;

-- ============================================================================
-- 6. Helper Function - Get Products by Category (including subcategories)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_products_by_category(
  category_slug_param TEXT,
  include_subcategories BOOLEAN DEFAULT true
)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  product_slug TEXT,
  price DECIMAL,
  category_name TEXT
) AS $$
BEGIN
  IF include_subcategories THEN
    -- Include products from subcategories
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
      SELECT id FROM categories WHERE slug = category_slug_param
      UNION ALL
      SELECT c.id
      FROM categories c
      INNER JOIN category_tree ct ON c."parentId" = ct.id
    )
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      c.name as category_name
    FROM products p
    INNER JOIN category_tree ct ON p."categoryId" = ct.id
    INNER JOIN categories c ON p."categoryId" = c.id
    WHERE p.status = 'ACTIVE';
  ELSE
    -- Only products directly in this category
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      c.name as category_name
    FROM products p
    INNER JOIN categories c ON p."categoryId" = c.id
    WHERE c.slug = category_slug_param AND p.status = 'ACTIVE';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION get_category_tree IS 'Returns hierarchical category tree';
COMMENT ON FUNCTION get_products_by_category IS 'Get products by category with optional subcategory inclusion';
