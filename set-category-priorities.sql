-- NextPik: Set navbar category priorities for multi-vendor platform
-- Run on production: psql $DATABASE_URL -f set-category-priorities.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Top 5 → shown as main columns in the mega menu (highest priority first)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE categories SET priority = 100 WHERE name ILIKE '%electronics%'               AND "parentId" IS NULL;
UPDATE categories SET priority = 90  WHERE name ILIKE '%fashion%'                   AND "parentId" IS NULL;
UPDATE categories SET priority = 80  WHERE name ILIKE '%home%' AND name ILIKE '%garden%' AND "parentId" IS NULL;
UPDATE categories SET priority = 70  WHERE (name ILIKE '%health%' OR name ILIKE '%cosmetic%' OR name ILIKE '%personal care%') AND "parentId" IS NULL;
UPDATE categories SET priority = 60  WHERE name ILIKE '%sport%'                     AND "parentId" IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Secondary → visible under "More"
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE categories SET priority = 50  WHERE (name ILIKE '%watch%' OR name ILIKE '%jewelry%' OR name ILIKE '%jewellery%') AND "parentId" IS NULL;
UPDATE categories SET priority = 45  WHERE name ILIKE '%accessories%'               AND "parentId" IS NULL;
UPDATE categories SET priority = 40  WHERE name ILIKE '%baby%'                      AND "parentId" IS NULL;
UPDATE categories SET priority = 35  WHERE name ILIKE '%groceri%'                   AND "parentId" IS NULL;
UPDATE categories SET priority = 30  WHERE name ILIKE '%appliance%'                 AND "parentId" IS NULL;
UPDATE categories SET priority = 25  WHERE name ILIKE '%vehicle%'                   AND "parentId" IS NULL;
UPDATE categories SET priority = 20  WHERE name ILIKE '%auto%'                      AND "parentId" IS NULL AND priority < 20;
UPDATE categories SET priority = 15  WHERE name ILIKE '%real%estate%'               AND "parentId" IS NULL;
UPDATE categories SET priority = 10  WHERE name ILIKE '%digital%'                   AND "parentId" IS NULL;
UPDATE categories SET priority = 5   WHERE name ILIKE '%office%'                    AND "parentId" IS NULL;
UPDATE categories SET priority = 3   WHERE name ILIKE '%ticketing%'                 AND "parentId" IS NULL;
UPDATE categories SET priority = 2   WHERE name ILIKE '%pet%'                       AND "parentId" IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify result
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  name,
  priority,
  CASE WHEN ROW_NUMBER() OVER (ORDER BY priority DESC, "displayOrder" ASC, name ASC) <= 5
       THEN '✅ COLUMN'
       ELSE '   more'
  END AS position
FROM categories
WHERE "parentId" IS NULL AND "showInNavbar" = true
ORDER BY priority DESC, "displayOrder" ASC, name ASC;
