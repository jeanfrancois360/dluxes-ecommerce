-- CreateTable: hot_deal_categories (admin-managed dynamic categories)
CREATE TABLE "hot_deal_categories" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50) NOT NULL DEFAULT 'MoreHorizontal',
    "color" VARCHAR(30) NOT NULL DEFAULT 'gray',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hot_deal_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_categories_slug_key" ON "hot_deal_categories"("slug");
CREATE INDEX "hot_deal_categories_isActive_displayOrder_idx" ON "hot_deal_categories"("isActive", "displayOrder");

-- Seed the 10 original categories so existing data is preserved
INSERT INTO "hot_deal_categories" ("id", "slug", "label", "icon", "color", "displayOrder", "isActive", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'CHILDCARE',        'Childcare & Babysitting', 'Heart',          'pink',    0,  true, NOW()),
    (gen_random_uuid()::text, 'HOME_SERVICES',    'Home Services',           'Home',           'blue',    1,  true, NOW()),
    (gen_random_uuid()::text, 'AUTOMOTIVE',       'Automotive',              'Car',            'slate',   2,  true, NOW()),
    (gen_random_uuid()::text, 'PET_SERVICES',     'Pet Services',            'Star',           'amber',   3,  true, NOW()),
    (gen_random_uuid()::text, 'MOVING_DELIVERY',  'Moving & Delivery',       'Truck',          'orange',  4,  true, NOW()),
    (gen_random_uuid()::text, 'TECH_SUPPORT',     'Tech Support',            'Monitor',        'violet',  5,  true, NOW()),
    (gen_random_uuid()::text, 'TUTORING',         'Tutoring',                'BookOpen',       'emerald', 6,  true, NOW()),
    (gen_random_uuid()::text, 'HEALTH_WELLNESS',  'Health & Wellness',       'Activity',       'red',     7,  true, NOW()),
    (gen_random_uuid()::text, 'CLEANING',         'Cleaning',                'Sparkles',       'cyan',    8,  true, NOW()),
    (gen_random_uuid()::text, 'OTHER',            'Other',                   'MoreHorizontal', 'gray',    9,  true, NOW());

-- Step 1: Add categoryId column (nullable initially)
ALTER TABLE "hot_deals" ADD COLUMN "categoryId" VARCHAR(50);

-- Step 2: Migrate existing enum values into the new string column
UPDATE "hot_deals" SET "categoryId" = "category"::text;

-- Step 3: Make categoryId NOT NULL
ALTER TABLE "hot_deals" ALTER COLUMN "categoryId" SET NOT NULL;

-- Step 4: Drop old category column (enum-typed) and old index
DROP INDEX IF EXISTS "hot_deals_category_status_idx";
ALTER TABLE "hot_deals" DROP COLUMN "category";

-- Step 5: Create new index on categoryId
CREATE INDEX "hot_deals_categoryId_status_idx" ON "hot_deals"("categoryId", "status");

-- Step 6: Add foreign key
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "hot_deal_categories"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop the enum type (no longer used)
DROP TYPE IF EXISTS "HotDealCategory";
