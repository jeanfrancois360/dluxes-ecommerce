import { fromGrams } from '../../common/utils/weight';

/**
 * EasyPost expects parcel weight in ounces.
 * Minimum 1 oz applies — the API will accept smaller values but they're
 * unrealistic for any real shipment.
 */
export const EASYPOST_MIN_OZ = 1;

export function gramsToEasypostOunces(grams: number): number {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new Error(`Invalid grams: ${grams}`);
  }
  const oz = fromGrams(grams, 'oz');
  return Math.max(EASYPOST_MIN_OZ, oz);
}
