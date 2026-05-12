/**
 * Parcel dimension estimator for shipping rate requests.
 *
 * When products don't have explicit dimension data, we estimate the outer
 * box size from the total shipment weight using industry-standard packaging
 * tiers. This prevents carrier APIs from silently applying dimensional weight
 * (DIM) penalties on bulky-but-light goods when a flat "10×8×4" default is
 * sent for every shipment.
 *
 * Formula reference: DIM weight = (L × W × H) / DIM_FACTOR
 *   - US carriers (USPS, UPS, FedEx): 139 in³/lb
 *   - International (DHL, EasyShip):  5000 cm³/kg
 */

export interface ParcelDimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * Estimate outer box dimensions in INCHES from total shipment weight.
 * Used for EasyPost rate requests (EasyPost expects inches + oz).
 *
 * Tiers are sized so that DIM weight ≈ actual weight at the tier boundary,
 * keeping rate estimates as accurate as possible without product-level data.
 */
export function estimateParcelInches(weightOz: number): ParcelDimensions {
  // Tier: ≤ 16 oz (1 lb) — small padded box / poly mailer
  if (weightOz <= 16) return { length: 9, width: 6, height: 4 };
  // Tier: 17–48 oz (1–3 lb) — small box
  if (weightOz <= 48) return { length: 11, width: 8, height: 5 };
  // Tier: 49–112 oz (3–7 lb) — medium box
  if (weightOz <= 112) return { length: 14, width: 10, height: 6 };
  // Tier: 113–224 oz (7–14 lb) — large box
  if (weightOz <= 224) return { length: 17, width: 13, height: 9 };
  // Tier: > 224 oz (> 14 lb) — extra-large / multi-item box
  return { length: 22, width: 17, height: 12 };
}

/**
 * Estimate individual item dimensions in CENTIMETRES from item weight.
 * Used for EasyShip rate requests (EasyShip expects cm + kg per item).
 *
 * We use a 3:2:1.2 L:W:H aspect ratio (typical product box shape) and
 * derive the volume from a moderate packaging density of ~0.12 g/cm³
 * (covers apparel, small electronics, cosmetics, accessories).
 */
export function estimateItemDimensionsCm(weightGrams: number): ParcelDimensions {
  // Tier: ≤ 100 g — jewelry, small accessories, flat items
  if (weightGrams <= 100) return { length: 12, width: 10, height: 5 };
  // Tier: 101–500 g — apparel, books, small gadgets
  if (weightGrams <= 500) return { length: 18, width: 14, height: 8 };
  // Tier: 501–1500 g — shoes, mid-size electronics, bundled clothing
  if (weightGrams <= 1500) return { length: 25, width: 20, height: 12 };
  // Tier: 1501–3500 g — large apparel bundles, mid-size equipment
  if (weightGrams <= 3500) return { length: 35, width: 25, height: 15 };
  // Tier: > 3500 g — large goods, multi-item sets
  return { length: 45, width: 35, height: 20 };
}

/** Convert inches to centimetres (1 in = 2.54 cm). */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}
