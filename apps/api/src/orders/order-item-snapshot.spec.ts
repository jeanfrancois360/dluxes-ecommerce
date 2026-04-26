/**
 * Phase 6 verification — weightGramsSnapshot write-path correctness
 *
 * Proves two things:
 * 1. Site 1 (createOrderFromCart): snapshot uses variant → product → legacy-kg → null
 *    mirrors orders.service.ts ~line 507:
 *      weightGramsSnapshot:
 *        item.variant?.weightGrams ??
 *        item.product?.weightGrams ??
 *        (item.product?.weight != null
 *          ? Math.round(Number(item.product.weight) * 1000)
 *          : null),
 *
 * 2. Site 2 (create — legacy path): snapshot uses variant[0] → product → legacy-kg → null
 *    mirrors orders.service.ts ~line 851:
 *      weightGramsSnapshot:
 *        product.variants?.[0]?.weightGrams ??
 *        product.weightGrams ??
 *        (product.weight != null ? Math.round(Number(product.weight) * 1000) : null),
 *
 * No service mocking — both are pure expressions.
 */

// ---------------------------------------------------------------------------
// Site 1 — createOrderFromCart
// ---------------------------------------------------------------------------

function snapshotFromCartItem(item: {
  variant?: { weightGrams?: number | null } | null;
  product?: {
    weightGrams?: number | null;
    weight?: { valueOf?: () => number } | number | null;
  } | null;
}): number | null {
  return (
    item.variant?.weightGrams ??
    item.product?.weightGrams ??
    (item.product?.weight != null ? Math.round(Number(item.product.weight) * 1000) : null)
  );
}

describe('weightGramsSnapshot — Site 1 (createOrderFromCart)', () => {
  it('uses variant.weightGrams when present', () => {
    expect(
      snapshotFromCartItem({ variant: { weightGrams: 750 }, product: { weightGrams: 1000 } })
    ).toBe(750);
  });

  it('falls back to product.weightGrams when variant.weightGrams is null', () => {
    expect(
      snapshotFromCartItem({ variant: { weightGrams: null }, product: { weightGrams: 1000 } })
    ).toBe(1000);
  });

  it('falls back to product.weightGrams when no variant', () => {
    expect(snapshotFromCartItem({ variant: null, product: { weightGrams: 1000 } })).toBe(1000);
  });

  it('falls back to legacy weight * 1000 when weightGrams is null (unmigrated row)', () => {
    expect(
      snapshotFromCartItem({ variant: null, product: { weightGrams: null, weight: 1.5 } })
    ).toBe(1500);
  });

  it('returns null when all weight sources are absent', () => {
    expect(
      snapshotFromCartItem({ variant: null, product: { weightGrams: null, weight: null } })
    ).toBeNull();
  });

  it('returns null when product is absent', () => {
    expect(snapshotFromCartItem({ variant: null, product: null })).toBeNull();
  });

  it('seeded 1 kg product (migrated) → snapshot = 1000', () => {
    expect(
      snapshotFromCartItem({ variant: null, product: { weightGrams: 1000, weight: 1.0 } })
    ).toBe(1000);
  });

  it('variant overrides product even when product also has weightGrams', () => {
    // e.g. XXL variant is heavier than the product default
    expect(
      snapshotFromCartItem({ variant: { weightGrams: 350 }, product: { weightGrams: 300 } })
    ).toBe(350);
  });

  it('variant.weightGrams = 0 is used as-is (not skipped as falsy)', () => {
    expect(
      snapshotFromCartItem({ variant: { weightGrams: 0 }, product: { weightGrams: 500 } })
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Site 2 — create (legacy path, variant filtered by ID so variants[0] is the selected one)
// ---------------------------------------------------------------------------

function snapshotFromProduct(product: {
  variants?: Array<{ weightGrams?: number | null }> | null;
  weightGrams?: number | null;
  weight?: { valueOf?: () => number } | number | null;
}): number | null {
  return (
    product.variants?.[0]?.weightGrams ??
    product.weightGrams ??
    (product.weight != null ? Math.round(Number(product.weight) * 1000) : null)
  );
}

describe('weightGramsSnapshot — Site 2 (create legacy path)', () => {
  it('uses variants[0].weightGrams when present (selected variant)', () => {
    expect(snapshotFromProduct({ variants: [{ weightGrams: 750 }], weightGrams: 1000 })).toBe(750);
  });

  it('falls back to product.weightGrams when variant.weightGrams is null', () => {
    expect(snapshotFromProduct({ variants: [{ weightGrams: null }], weightGrams: 1000 })).toBe(
      1000
    );
  });

  it('falls back to product.weightGrams when no variants loaded', () => {
    expect(snapshotFromProduct({ variants: [], weightGrams: 1000 })).toBe(1000);
  });

  it('falls back to product.weightGrams when variants is undefined (no variant selected)', () => {
    expect(snapshotFromProduct({ weightGrams: 500 })).toBe(500);
  });

  it('falls back to legacy weight * 1000 when weightGrams is null (unmigrated row)', () => {
    expect(snapshotFromProduct({ variants: [], weightGrams: null, weight: 2.0 })).toBe(2000);
  });

  it('returns null when all sources absent', () => {
    expect(snapshotFromProduct({ variants: [], weightGrams: null, weight: null })).toBeNull();
  });

  it('seeded 1 kg product (migrated, no variant) → snapshot = 1000', () => {
    expect(snapshotFromProduct({ weightGrams: 1000, weight: 1.0 })).toBe(1000);
  });

  it('seeded 1 kg product (migrated, with matching variant) → snapshot = variant weight', () => {
    // Variant weight takes precedence
    expect(snapshotFromProduct({ variants: [{ weightGrams: 1200 }], weightGrams: 1000 })).toBe(
      1200
    );
  });

  it('variant.weightGrams = 0 is used as-is', () => {
    expect(snapshotFromProduct({ variants: [{ weightGrams: 0 }], weightGrams: 500 })).toBe(0);
  });

  it('unmigrated 1.5 kg product without variant → snapshot = 1500', () => {
    expect(snapshotFromProduct({ weightGrams: null, weight: 1.5 })).toBe(1500);
  });
});
