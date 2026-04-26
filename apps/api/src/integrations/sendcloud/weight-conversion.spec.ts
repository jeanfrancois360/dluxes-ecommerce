import { gramsToSendcloud, SENDCLOUD_MIN_GRAMS } from './weight-conversion';

describe('gramsToSendcloud', () => {
  it('passes through values above minimum unchanged', () => {
    expect(gramsToSendcloud(500)).toBe(500);
    expect(gramsToSendcloud(1000)).toBe(1000);
    expect(gramsToSendcloud(15000)).toBe(15000);
  });
  it('enforces minimum', () => {
    expect(gramsToSendcloud(0)).toBe(SENDCLOUD_MIN_GRAMS);
    expect(gramsToSendcloud(50)).toBe(SENDCLOUD_MIN_GRAMS);
    expect(gramsToSendcloud(100)).toBe(SENDCLOUD_MIN_GRAMS); // exactly at minimum
  });
  it('does not clamp above-minimum values', () => {
    expect(gramsToSendcloud(101)).toBe(101);
  });
  it('rejects non-integer input', () => {
    expect(() => gramsToSendcloud(500.5)).toThrow();
    expect(() => gramsToSendcloud(NaN)).toThrow();
  });
  it('rejects negative input', () => {
    expect(() => gramsToSendcloud(-1)).toThrow();
  });
});
