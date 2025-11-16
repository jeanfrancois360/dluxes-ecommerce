-- Smooth UI Animation Support
-- Tracks previous values for elegant transitions

-- ============================================================================
-- 1. Cart Item Quantity Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION track_cart_item_quantity_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if quantity actually changed
  IF NEW.quantity IS DISTINCT FROM OLD.quantity THEN
    NEW."previousQuantity" := OLD.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_item_quantity_change ON cart_items;
CREATE TRIGGER cart_item_quantity_change
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION track_cart_item_quantity_change();

-- ============================================================================
-- 2. Product Inventory Changes
-- ============================================================================
CREATE OR REPLACE FUNCTION track_product_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Track previous inventory for smooth animations
  IF NEW.inventory IS DISTINCT FROM OLD.inventory THEN
    NEW."previousStock" := OLD.inventory;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_inventory_change ON products;
CREATE TRIGGER product_inventory_change
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION track_product_inventory_change();

-- ============================================================================
-- 3. Product Variant Inventory Changes
-- ============================================================================
DROP TRIGGER IF EXISTS variant_inventory_change ON product_variants;
CREATE TRIGGER variant_inventory_change
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION track_product_inventory_change();

-- ============================================================================
-- 4. Low Stock Notification Helper
-- ============================================================================
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  sku TEXT,
  inventory INT,
  "previousStock" INT,
  type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Get low stock products
  SELECT
    p.id,
    p.name,
    'PRODUCT' as sku,
    p.inventory,
    p."previousStock",
    'product' as type
  FROM products p
  WHERE
    p.status = 'ACTIVE'
    AND p.inventory <= 10
    AND p.inventory > 0

  UNION ALL

  -- Get low stock variants
  SELECT
    pv.id,
    p.name || ' - ' || pv.name as name,
    pv.sku,
    pv.inventory,
    pv."previousStock",
    'variant' as type
  FROM product_variants pv
  JOIN products p ON pv."productId" = p.id
  WHERE
    pv."isAvailable" = true
    AND pv.inventory <= pv."lowStockThreshold"
    AND pv.inventory > 0

  ORDER BY inventory ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Auto-update variant availability based on inventory
-- ============================================================================
CREATE OR REPLACE FUNCTION update_variant_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-mark variant as unavailable when inventory hits 0
  IF NEW.inventory <= 0 AND OLD.inventory > 0 THEN
    NEW."isAvailable" := false;
  -- Auto-mark variant as available when inventory is restocked
  ELSIF NEW.inventory > 0 AND OLD.inventory <= 0 THEN
    NEW."isAvailable" := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS variant_availability_update ON product_variants;
CREATE TRIGGER variant_availability_update
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION update_variant_availability();

-- ============================================================================
-- 6. Auto-update product status based on inventory
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_status_on_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-mark product as OUT_OF_STOCK when inventory hits 0
  IF NEW.inventory <= 0 AND OLD.inventory > 0 AND NEW.status = 'ACTIVE' THEN
    NEW.status := 'OUT_OF_STOCK';
  -- Auto-mark product as ACTIVE when inventory is restocked
  ELSIF NEW.inventory > 0 AND OLD.inventory <= 0 AND NEW.status = 'OUT_OF_STOCK' THEN
    NEW.status := 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_status_inventory_update ON products;
CREATE TRIGGER product_status_inventory_update
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.inventory IS DISTINCT FROM OLD.inventory)
  EXECUTE FUNCTION update_product_status_on_inventory();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION track_cart_item_quantity_change IS 'Tracks previous cart item quantity for UI animations';
COMMENT ON FUNCTION track_product_inventory_change IS 'Tracks previous inventory for smooth UI transitions';
COMMENT ON FUNCTION get_low_stock_products IS 'Returns products and variants with low stock';
COMMENT ON FUNCTION update_variant_availability IS 'Auto-updates variant availability based on inventory';
COMMENT ON FUNCTION update_product_status_on_inventory IS 'Auto-updates product status when inventory changes';
