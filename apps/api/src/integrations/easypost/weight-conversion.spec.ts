import { gramsToEasypostOunces, EASYPOST_MIN_OZ } from './weight-conversion';

describe('gramsToEasypostOunces', () => {
  it('converts grams to ounces', () => {
    expect(gramsToEasypostOunces(1000)).toBeCloseTo(35.27, 1);
    expect(gramsToEasypostOunces(500)).toBeCloseTo(17.64, 1);
    expect(gramsToEasypostOunces(15000)).toBeCloseTo(529.1, 0);
  });
  it('enforces minimum', () => {
    expect(gramsToEasypostOunces(0)).toBe(EASYPOST_MIN_OZ);
    expect(gramsToEasypostOunces(10)).toBe(EASYPOST_MIN_OZ); // 10g ≈ 0.35 oz < 1
  });
  it('does not clamp above-minimum values', () => {
    expect(gramsToEasypostOunces(454)).toBeCloseTo(16.0, 0); // ~1 lb
  });
  it('rejects invalid input', () => {
    expect(() => gramsToEasypostOunces(-1)).toThrow();
    expect(() => gramsToEasypostOunces(NaN)).toThrow();
    expect(() => gramsToEasypostOunces(Infinity)).toThrow();
  });
});
