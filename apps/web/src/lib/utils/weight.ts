/**
 * Frontend weight handling utilities for NextPik.
 *
 * Mirrors apps/api/src/common/utils/weight.ts.
 * Sellers enter values in their preferred unit; the frontend converts to grams
 * before sending to the backend.
 */

export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';

const TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

export function toGrams(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * TO_GRAMS[unit]);
}

export function fromGrams(grams: number, unit: WeightUnit): number {
  if (!Number.isFinite(grams)) return 0;
  return grams / TO_GRAMS[unit];
}

export function formatWeight(grams: number | null | undefined, unit: WeightUnit = 'g'): string {
  if (grams == null) return '—';
  const value = fromGrams(grams, unit);
  const precision = unit === 'g' ? 0 : 2;
  return `${value.toFixed(precision)} ${unit}`;
}

/**
 * Default unit per locale. Sellers see the right default; can change via selector.
 */
export function defaultUnitForLocale(locale: string | undefined): WeightUnit {
  if (!locale) return 'g';
  if (locale.startsWith('en-US') || locale === 'en_US') return 'oz';
  if (locale.startsWith('en-GB') || locale === 'en_UK') return 'kg';
  if (locale.startsWith('fr')) return 'kg';
  return 'g';
}
