/**
 * Sendcloud expects parcel weight in grams (integer).
 * Minimum 100g applies — Sendcloud rejects anything lighter.
 */
export const SENDCLOUD_MIN_GRAMS = 100;

export function gramsToSendcloud(grams: number): number {
  if (!Number.isInteger(grams) || grams < 0) {
    throw new Error(`Invalid grams: ${grams}`);
  }
  return Math.max(SENDCLOUD_MIN_GRAMS, grams);
}
