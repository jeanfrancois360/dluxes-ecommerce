/**
 * Weight handling utilities for NextPik.
 *
 * The canonical internal unit is GRAMS (integer).
 * All storage, aggregation, and calculation uses grams.
 * Conversion to carrier-specific units happens in integration adapters (Phase 4).
 *
 * Design rationale:
 * - Integer grams avoid floating-point drift in JS arithmetic.
 * - Unit is explicit in field names (weightGrams) — no ambiguity.
 * - Sub-gram precision is not needed for e-commerce shipping.
 */

export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';

const TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

/**
 * Convert a weight value in any supported unit to grams (integer).
 * Rounds to the nearest gram.
 *
 * @throws Error if value is not finite, not a number, or negative.
 */
export function toGrams(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid weight value: ${value}`);
  }
  if (value < 0) {
    throw new Error(`Weight cannot be negative: ${value}`);
  }
  return Math.round(value * TO_GRAMS[unit]);
}

/**
 * Convert grams to a target unit. Returns a decimal value.
 * Use for display purposes only.
 */
export function fromGrams(grams: number, unit: WeightUnit): number {
  if (!Number.isFinite(grams)) {
    throw new Error(`Invalid grams value: ${grams}`);
  }
  return grams / TO_GRAMS[unit];
}

/**
 * Format grams for display in a given unit with appropriate precision.
 * Returns "—" for null/undefined.
 */
export function formatWeight(grams: number | null | undefined, unit: WeightUnit = 'g'): string {
  if (grams == null) return '—';
  const value = fromGrams(grams, unit);
  const precision = unit === 'g' ? 0 : 2;
  return `${value.toFixed(precision)} ${unit}`;
}
