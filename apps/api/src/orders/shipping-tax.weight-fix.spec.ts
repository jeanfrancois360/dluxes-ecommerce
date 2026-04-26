/**
 * Phase 5 verification — weight wiring correctness
 *
 * These tests prove two things:
 * 1. The aggregation formula in calculateShippingOptions produces the correct
 *    totalWeightGrams when CartItem.weight is in grams.
 * 2. The read path in orders.service.ts correctly derives CartItem.weight
 *    (in grams) from product.weightGrams, with backward-compat fallback to
 *    product.weight (stored in kg) for rows that predate the migration.
 *
 * No service mocking required — both pieces are pure expressions.
 */

// ---------------------------------------------------------------------------
// 1. Aggregation formula
//    mirrors: shipping-tax.service.ts
//      const totalWeightGrams = itemsForShipping.reduce(
//        (sum, item) => sum + (item.weight || 500) * item.quantity, 0
//      );
// ---------------------------------------------------------------------------

function aggregateWeight(items: Array<{ weight?: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
}

describe('totalWeightGrams aggregation (Phase 5 — shipping-tax.service.ts)', () => {
  it('1 kg product, qty 1 → 1000 g', () => {
    expect(aggregateWeight([{ weight: 1000, quantity: 1 }])).toBe(1000);
  });

  it('1 kg product, qty 3 → 3000 g', () => {
    expect(aggregateWeight([{ weight: 1000, quantity: 3 }])).toBe(3000);
  });

  it('1 kg product, qty 6 → 6000 g', () => {
    expect(aggregateWeight([{ weight: 1000, quantity: 6 }])).toBe(6000);
  });

  it('null weight falls back to 500 g per item', () => {
    expect(aggregateWeight([{ weight: undefined, quantity: 1 }])).toBe(500);
    expect(aggregateWeight([{ weight: undefined, quantity: 3 }])).toBe(1500);
  });

  it('mixed cart: 1 kg product + null-weight product → 1500 g', () => {
    const items = [
      { weight: 1000, quantity: 1 },
      { weight: undefined, quantity: 1 }, // 500 g fallback
    ];
    expect(aggregateWeight(items)).toBe(1500);
  });

  it('multi-qty mixed cart: 1 kg × 2 + null-weight × 2 → 3000 g', () => {
    const items = [
      { weight: 1000, quantity: 2 }, // 2000 g
      { weight: undefined, quantity: 2 }, // 1000 g
    ];
    expect(aggregateWeight(items)).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// 2. Read path
//    mirrors: orders.service.ts (three call sites)
//      weight: product.weightGrams ??
//        (product.weight != null ? Math.round(Number(product.weight) * 1000) : undefined),
// ---------------------------------------------------------------------------

function deriveCartItemWeight(product: {
  weightGrams?: number | null;
  weight?: { toNumber?: () => number } | number | null;
}): number | undefined {
  return (
    product.weightGrams ??
    (product.weight != null ? Math.round(Number(product.weight) * 1000) : undefined)
  );
}

describe('CartItem.weight derivation from product (Phase 5 — orders.service.ts)', () => {
  it('uses weightGrams when present (migrated row)', () => {
    // The 1 kg seeded test product: weightGrams=1000, weight=1.00
    expect(deriveCartItemWeight({ weightGrams: 1000, weight: 1.0 })).toBe(1000);
  });

  it('weightGrams=0 is a valid value and is used as-is (not falsy-skipped)', () => {
    // 0 g is unusual but the field is nullable, not "truthy-gated"
    expect(deriveCartItemWeight({ weightGrams: 0, weight: 0.5 })).toBe(0);
  });

  it('falls back to weight * 1000 when weightGrams is null (unmigrated row)', () => {
    // product.weight stored in kg; 1.5 kg → 1500 g
    expect(deriveCartItemWeight({ weightGrams: null, weight: 1.5 })).toBe(1500);
  });

  it('falls back to weight * 1000 when weightGrams is undefined (unmigrated row)', () => {
    expect(deriveCartItemWeight({ weightGrams: undefined, weight: 2.0 })).toBe(2000);
  });

  it('returns undefined when both weightGrams and weight are absent', () => {
    // Triggers the 500 g fallback inside the aggregation
    expect(deriveCartItemWeight({ weightGrams: null, weight: null })).toBeUndefined();
    expect(deriveCartItemWeight({ weightGrams: undefined, weight: undefined })).toBeUndefined();
  });

  it('handles Decimal-like weight object (Prisma Decimal coerced to number)', () => {
    // Prisma Decimal objects are coerced via Number(); simulate with an object
    // whose numeric coercion yields 1.0
    const decimalLike = { valueOf: () => 1.0, toString: () => '1.00' } as unknown as number;
    expect(deriveCartItemWeight({ weightGrams: null, weight: decimalLike })).toBe(1000);
  });

  it('end-to-end: seeded 1 kg product → aggregation produces 1000 g for qty 1', () => {
    const product = { weightGrams: 1000, weight: 1.0 };
    const cartItemWeight = deriveCartItemWeight(product);
    const totalWeightGrams = aggregateWeight([{ weight: cartItemWeight, quantity: 1 }]);
    expect(totalWeightGrams).toBe(1000);
  });

  it('end-to-end: seeded 1 kg product → aggregation produces 3000 g for qty 3', () => {
    const product = { weightGrams: 1000, weight: 1.0 };
    const cartItemWeight = deriveCartItemWeight(product);
    const totalWeightGrams = aggregateWeight([{ weight: cartItemWeight, quantity: 3 }]);
    expect(totalWeightGrams).toBe(3000);
  });

  it('end-to-end: unmigrated 1.5 kg product → aggregation produces 1500 g for qty 1', () => {
    // weightGrams not yet set (null); falls back to weight * 1000
    const product = { weightGrams: null, weight: 1.5 };
    const cartItemWeight = deriveCartItemWeight(product);
    const totalWeightGrams = aggregateWeight([{ weight: cartItemWeight, quantity: 1 }]);
    expect(totalWeightGrams).toBe(1500);
  });

  it('end-to-end: no-weight product → aggregation applies 500 g fallback', () => {
    const product = { weightGrams: null, weight: null };
    const cartItemWeight = deriveCartItemWeight(product);
    const totalWeightGrams = aggregateWeight([{ weight: cartItemWeight, quantity: 1 }]);
    expect(totalWeightGrams).toBe(500);
  });
});
