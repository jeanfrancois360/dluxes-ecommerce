import { fromGrams } from '../../common/utils/weight';

/**
 * DHL expects shipment weight in kilograms (decimal).
 * Minimum 0.5 kg applies — DHL Express minimum billable weight.
 */
export const DHL_MIN_KG = 0.5;

export function gramsToDhlKg(grams: number): number {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new Error(`Invalid grams: ${grams}`);
  }
  const kg = fromGrams(grams, 'kg');
  return Math.max(DHL_MIN_KG, kg);
}
