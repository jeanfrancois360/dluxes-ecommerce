import { toGrams, fromGrams, formatWeight } from './weight';

describe('weight utilities', () => {
  describe('toGrams', () => {
    it('converts grams identity', () => {
      expect(toGrams(500, 'g')).toBe(500);
    });
    it('converts kg to grams', () => {
      expect(toGrams(1.5, 'kg')).toBe(1500);
      expect(toGrams(2, 'kg')).toBe(2000);
    });
    it('converts lb to grams', () => {
      expect(toGrams(1, 'lb')).toBe(454);
    });
    it('converts oz to grams', () => {
      expect(toGrams(1, 'oz')).toBe(28);
      expect(toGrams(16, 'oz')).toBe(454);
    });
    it('rounds to nearest gram', () => {
      expect(toGrams(0.0001, 'kg')).toBe(0);
      expect(toGrams(0.0006, 'kg')).toBe(1);
    });
    it('rejects negative values', () => {
      expect(() => toGrams(-1, 'kg')).toThrow();
    });
    it('rejects non-finite values', () => {
      expect(() => toGrams(NaN, 'kg')).toThrow();
      expect(() => toGrams(Infinity, 'kg')).toThrow();
    });
  });

  describe('fromGrams', () => {
    it('converts to kg', () => {
      expect(fromGrams(1500, 'kg')).toBe(1.5);
    });
    it('converts to oz', () => {
      expect(fromGrams(454, 'oz')).toBeCloseTo(16, 1);
    });
  });

  describe('formatWeight', () => {
    it('returns dash for null', () => {
      expect(formatWeight(null)).toBe('—');
      expect(formatWeight(undefined)).toBe('—');
    });
    it('formats grams without decimals', () => {
      expect(formatWeight(500, 'g')).toBe('500 g');
    });
    it('formats kg with 2 decimals', () => {
      expect(formatWeight(1500, 'kg')).toBe('1.50 kg');
    });
  });
});
