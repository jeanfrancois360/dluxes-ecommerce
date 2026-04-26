import { fromGrams } from '../../common/utils/weight';

/**
 * Easyship expects parcel weight in kilograms (decimal).
 * Minimum 0.1 kg applies.
 */
export const EASYSHIP_MIN_KG = 0.1;

export function gramsToEasyshipKg(grams: number): number {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new Error(`Invalid grams: ${grams}`);
  }
  const kg = fromGrams(grams, 'kg');
  return Math.max(EASYSHIP_MIN_KG, kg);
}
