import { gramsToEasyshipKg, EASYSHIP_MIN_KG } from './weight-conversion';

describe('gramsToEasyshipKg', () => {
  it('converts grams to kg', () => {
    expect(gramsToEasyshipKg(1000)).toBe(1.0);
    expect(gramsToEasyshipKg(2500)).toBe(2.5);
    expect(gramsToEasyshipKg(15000)).toBe(15.0);
  });
  it('enforces minimum', () => {
    expect(gramsToEasyshipKg(0)).toBe(EASYSHIP_MIN_KG);
    expect(gramsToEasyshipKg(50)).toBe(EASYSHIP_MIN_KG); // 50g = 0.05 kg < 0.1
  });
  it('does not clamp above-minimum values', () => {
    expect(gramsToEasyshipKg(500)).toBe(0.5);
    expect(gramsToEasyshipKg(200)).toBe(0.2);
  });
  it('rejects invalid input', () => {
    expect(() => gramsToEasyshipKg(-1)).toThrow();
    expect(() => gramsToEasyshipKg(NaN)).toThrow();
    expect(() => gramsToEasyshipKg(Infinity)).toThrow();
  });
});
