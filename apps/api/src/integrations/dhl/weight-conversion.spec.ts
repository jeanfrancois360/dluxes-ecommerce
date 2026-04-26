import { gramsToDhlKg, DHL_MIN_KG } from './weight-conversion';

describe('gramsToDhlKg', () => {
  it('converts grams to kg', () => {
    expect(gramsToDhlKg(1000)).toBe(1.0);
    expect(gramsToDhlKg(2500)).toBe(2.5);
    expect(gramsToDhlKg(15000)).toBe(15.0);
  });
  it('enforces minimum', () => {
    expect(gramsToDhlKg(0)).toBe(DHL_MIN_KG);
    expect(gramsToDhlKg(100)).toBe(DHL_MIN_KG); // 100g = 0.1 kg < 0.5
    expect(gramsToDhlKg(499)).toBe(DHL_MIN_KG); // 499g = 0.499 kg < 0.5
  });
  it('does not clamp above-minimum values', () => {
    expect(gramsToDhlKg(600)).toBe(0.6);
    expect(gramsToDhlKg(500)).toBe(DHL_MIN_KG); // exactly at minimum
  });
  it('rejects invalid input', () => {
    expect(() => gramsToDhlKg(-1)).toThrow();
    expect(() => gramsToDhlKg(NaN)).toThrow();
    expect(() => gramsToDhlKg(Infinity)).toThrow();
  });
});
