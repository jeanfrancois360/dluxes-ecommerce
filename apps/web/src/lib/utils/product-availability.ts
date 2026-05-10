/**
 * Product Availability — Single Source of Truth
 *
 * Centralises all availability / in-stock logic for every product type:
 *   PHYSICAL     — inventory-based, trackInventory flag, lowStockThreshold
 *   DIGITAL      — always available (unlimited digital copies)
 *   SERVICE      — available based on isAvailable flag (no inventory)
 *   RENTAL       — available based on isAvailable flag (no inventory)
 *   REAL_ESTATE  — available based on isAvailable flag (listed / sold)
 *   VEHICLE      — available based on isAvailable flag (listed / sold)
 *   GELATO_POD   — fulfillmentType=GELATO_POD, produced on-demand, always available
 *
 * All consumers (product-transform, ProductActionButton, product detail page,
 * wishlist page) must import from this module — never duplicate this logic.
 */

export type ProductAvailabilityStatus =
  /** Physical product with stock above low-stock threshold */
  | 'in_stock'
  /** Physical product with stock at or below lowStockThreshold */
  | 'low_stock'
  /** Physical product with no inventory */
  | 'out_of_stock'
  /** Digital / Print-on-Demand — unlimited, never runs out */
  | 'always_available'
  /** Service / Rental / Real Estate / Vehicle — listed and available */
  | 'available'
  /** Any type where isAvailable=false (sold, paused, delisted) */
  | 'unavailable';

export interface ProductAvailability {
  /** Can the buyer interact with / purchase this product right now? */
  inStock: boolean;
  /** Granular status for UI labels and badge rendering */
  status: ProductAvailabilityStatus;
  /** Should a numeric quantity be shown next to the status? */
  showQuantity: boolean;
  /** Actual quantity value (null for non-tracked types) */
  quantity: number | null;
  /** True only for physical products in the low-stock band */
  isLowStock: boolean;
}

/** Product types that never carry a physical inventory count */
const NON_INVENTORY_TYPES = new Set(['DIGITAL', 'SERVICE', 'RENTAL', 'REAL_ESTATE', 'VEHICLE']);

export interface ProductAvailabilityInput {
  productType?: string | null;
  fulfillmentType?: string | null;
  inventory?: number | null;
  isAvailable?: boolean | null;
  trackInventory?: boolean | null;
  lowStockThreshold?: number | null;
}

/**
 * Compute the canonical availability for any product type.
 *
 * Priority order:
 *  1. isAvailable=false  → unavailable (sold, paused)
 *  2. fulfillmentType=GELATO_POD → always_available (print-on-demand)
 *  3. productType in NON_INVENTORY_TYPES → always_available (DIGITAL) or available (rest)
 *  4. PHYSICAL — trackInventory=false → in_stock (unlimited)
 *  5. PHYSICAL — inventory-based with lowStockThreshold
 */
export function getProductAvailability(product: ProductAvailabilityInput): ProductAvailability {
  const productType = product.productType ?? 'PHYSICAL';
  // isAvailable defaults to true if not set (Prisma default)
  const isAvailable = product.isAvailable !== false;

  // ── 1. Explicitly marked unavailable (sold property, delisted vehicle, paused service) ──
  if (!isAvailable) {
    return {
      inStock: false,
      status: 'unavailable',
      showQuantity: false,
      quantity: null,
      isLowStock: false,
    };
  }

  // ── 2. Print-on-Demand — physical but Gelato produces on demand ──
  if (product.fulfillmentType === 'GELATO_POD') {
    return {
      inStock: true,
      status: 'always_available',
      showQuantity: false,
      quantity: null,
      isLowStock: false,
    };
  }

  // ── 3. Non-inventory product types ──
  if (NON_INVENTORY_TYPES.has(productType)) {
    if (productType === 'DIGITAL') {
      return {
        inStock: true,
        status: 'always_available',
        showQuantity: false,
        quantity: null,
        isLowStock: false,
      };
    }
    // SERVICE, RENTAL, REAL_ESTATE, VEHICLE — availability is the isAvailable flag
    return {
      inStock: true,
      status: 'available',
      showQuantity: false,
      quantity: null,
      isLowStock: false,
    };
  }

  // ── 4 & 5. PHYSICAL — inventory-based ──
  const trackInventory = product.trackInventory !== false; // default: true

  if (!trackInventory) {
    return {
      inStock: true,
      status: 'in_stock',
      showQuantity: false,
      quantity: null,
      isLowStock: false,
    };
  }

  const qty = product.inventory ?? 0;
  const threshold = product.lowStockThreshold ?? 10;

  if (qty <= 0) {
    return {
      inStock: false,
      status: 'out_of_stock',
      showQuantity: false,
      quantity: 0,
      isLowStock: false,
    };
  }

  if (qty <= threshold) {
    return {
      inStock: true,
      status: 'low_stock',
      showQuantity: true,
      quantity: qty,
      isLowStock: true,
    };
  }

  return {
    inStock: true,
    status: 'in_stock',
    showQuantity: true,
    quantity: qty,
    isLowStock: false,
  };
}

/**
 * Convenience: returns true when a product can be added to cart / purchased.
 * Handles all product types including DIGITAL, POD, and service-style products.
 */
export function isProductAvailableForCart(product: ProductAvailabilityInput): boolean {
  return getProductAvailability(product).inStock;
}
