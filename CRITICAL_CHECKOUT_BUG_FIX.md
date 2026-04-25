# 🚨 CRITICAL: International Checkout Failure - France Address

**Date:** March 12, 2026
**Severity:** 🔴 **CRITICAL** - Blocking all international checkouts
**User Impact:** Customer in France cannot complete checkout

---

## Error Summary

**Error Message:**

```
Failed to fetch shipping options: TypeError: can't access property "amount", t.tax is undefined
TypeError: can't access property "find", el.shippingOptions is undefined
```

**User Address:**

- Country: France
- City: Paris
- Postal Code: 75007
- State: "" (empty - France doesn't use states)

**What's Failing:**

1. User submits French shipping address
2. Backend `calculateOrderTotals` is called
3. Backend calculates shipping options successfully
4. Backend returns response
5. **Frontend crashes trying to access `calculation.tax.amount`**

---

## Root Cause Analysis

### Problem #1: Unsafe Property Access (Frontend)

**File:** `apps/web/src/app/checkout/page.tsx` line 257

**Current Code:**

```typescript
const calculation = await ordersAPI.calculateTotals({...});

setBackendCalculation(calculation);
setAvailableShippingOptions(calculation.shippingOptions);
setCalculatedTax(calculation.tax.amount);  // ❌ CRASHES if tax is undefined
```

**Issue:**

- Code assumes `calculation.tax` exists
- If backend returns incomplete response, frontend crashes
- No null/undefined checks

---

### Problem #2: Backend May Return Incomplete Response

**File:** `apps/api/src/orders/orders.service.ts` lines 1770-1777

**Current Code:**

```typescript
const taxCalc = await this.shippingTaxService.calculateTax(
  {
    country: address.country,
    state: address.province || undefined,
    postalCode: address.postalCode,
  },
  subtotal
);
```

**Potential Issue:**

- If `calculateTax` throws an error (line 1862 catch block), entire response fails
- But error suggests response IS returning, just missing `tax` field

---

### Problem #3: Response Structure Mismatch

**Backend Response Type:** `OrderCalculationResponse`
**Expected Structure:**

```typescript
{
  subtotal: number;
  shipping: {...};
  shippingOptions: ShippingOption[];
  tax: {           // ❌ This might be undefined in some cases
    amount: number;
    rate: number;
    jurisdiction: string;
    breakdown?: {...};
  };
  ...
}
```

**Actual Response (suspected):**

```typescript
{
  subtotal: 50.00,
  shipping: {...},
  shippingOptions: [...],
  // tax: undefined  ❌ Missing!
  ...
}
```

---

## Immediate Fix (Frontend - Defensive Coding)

### Fix #1: Add Null Checks

**File:** `apps/web/src/app/checkout/page.tsx` line 253-270

**BEFORE:**

```typescript
const calculation = await ordersAPI.calculateTotals({...});

setBackendCalculation(calculation);
setAvailableShippingOptions(calculation.shippingOptions);

// Set initial tax from backend
setCalculatedTax(calculation.tax.amount);  // ❌ CRASHES

// If a shipping method is selected, use its price
if (selectedShippingMethod) {
  const selectedOption = calculation.shippingOptions.find(
    (opt: APIShippingOption) => opt.id === selectedShippingMethod
  );  // ❌ CRASHES if shippingOptions is undefined
  if (selectedOption) {
    setCalculatedShipping(selectedOption.price);
  }
}
```

**AFTER:**

```typescript
const calculation = await ordersAPI.calculateTotals({...});

setBackendCalculation(calculation);

// ✅ Safe: Default to empty array if undefined
setAvailableShippingOptions(calculation.shippingOptions || []);

// ✅ Safe: Default to 0 if tax is missing
setCalculatedTax(calculation.tax?.amount || 0);

// ✅ Safe: Check shippingOptions exists before using .find()
if (selectedShippingMethod && calculation.shippingOptions) {
  const selectedOption = calculation.shippingOptions.find(
    (opt: APIShippingOption) => opt.id === selectedShippingMethod
  );
  if (selectedOption) {
    setCalculatedShipping(selectedOption.price);
  }
}

// ⚠️ Warn user if tax or shipping missing
if (!calculation.tax) {
  console.warn('[Checkout] Tax calculation missing from backend response');
  toast.warning('Tax calculation unavailable. Please contact support.');
}
if (!calculation.shippingOptions || calculation.shippingOptions.length === 0) {
  console.error('[Checkout] No shipping options available');
  toast.error('No shipping options available for your address. Please contact support.');
}
```

---

## Root Cause Fix (Backend)

### Investigation Needed

**Check these points:**

1. **Does `calculateTax` return undefined for France?**

   ```bash
   # Check logs for calculateTax output
   grep "calculateTax\|Tax calculation" /var/log/nextpik-api.log
   ```

2. **Does backend return 200 OK with partial data?**

   ```bash
   # Test with cURL
   curl -X POST https://api.nextpik.com/api/v1/orders/calculate-totals \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "items": [{"productId": "...", "quantity": 1, "price": 50}],
       "shippingAddressId": "cmmopkfyt007llb01qd9na75l",
       "currency": "USD"
     }'
   ```

3. **Check if tax calculation fails for non-US countries:**

   ```typescript
   // apps/api/src/orders/shipping-tax.service.ts line 391-397

   // Only calculate tax for US addresses
   if (address.country !== 'US' && address.country !== 'USA') {
     return {
       rate: 0,
       amount: 0,
       jurisdiction: 'No Tax (International)',
       breakdown: {},
     }; // ✅ This SHOULD return a valid object
   }
   ```

**Expected:** Tax calculation for France should return:

```json
{
  "rate": 0,
  "amount": 0,
  "jurisdiction": "No Tax (International)",
  "breakdown": {}
}
```

---

## Permanent Fix (Backend - Type Safety)

### Fix #1: Ensure Tax is Never Undefined

**File:** `apps/api/src/orders/orders.service.ts` line 1770-1848

**ADD validation after tax calculation:**

```typescript
// 5. Calculate tax
const taxCalc = await this.shippingTaxService.calculateTax(
  {
    country: address.country,
    state: address.province || undefined,
    postalCode: address.postalCode,
  },
  subtotal
);

// ✅ NEW: Validate tax calculation
if (!taxCalc || typeof taxCalc.amount === 'undefined') {
  this.logger.error(`Tax calculation failed for address ${address.id}. Falling back to zero tax.`);
  taxCalc = {
    rate: 0,
    amount: 0,
    jurisdiction: 'Tax Calculation Failed',
    breakdown: {},
  };
}
```

### Fix #2: Add Response Validation Before Returning

**File:** `apps/api/src/orders/orders.service.ts` line 1826-1861

**ADD before return:**

```typescript
// 9. Return detailed calculation in target currency

// ✅ NEW: Validate response structure
const response: OrderCalculationResponse = {
  subtotal: Math.round(subtotalInTargetCurrency * 100) / 100,
  shipping: {
    method: selectedShipping.id,
    name: selectedShipping.name,
    price: Math.round(shippingCostInTargetCurrency * 100) / 100,
    estimatedDays: selectedShipping.estimatedDays,
    carrier: selectedShipping.carrier,
  },
  shippingOptions: shippingOptions.map((opt) => ({
    id: opt.id,
    name: opt.name,
    price: Math.round(convertPrice(opt.price) * 100) / 100,
    estimatedDays: opt.estimatedDays,
    carrier: opt.carrier,
  })),
  tax: {
    amount: Math.round(taxAmountInTargetCurrency * 100) / 100,
    rate: taxCalc.rate,
    jurisdiction: taxCalc.jurisdiction || 'N/A',
    breakdown: taxCalc.breakdown || {},
  },
  discount: Math.round(discountInTargetCurrency * 100) / 100,
  coupon: couponDetails,
  total: Math.round(total * 100) / 100,
  currency: targetCurrency,
  breakdown: {
    subtotal: Math.round(subtotalInTargetCurrency * 100) / 100,
    shipping: Math.round(shippingCostInTargetCurrency * 100) / 100,
    tax: Math.round(taxAmountInTargetCurrency * 100) / 100,
    discount: Math.round(-discountInTargetCurrency * 100) / 100,
    total: Math.round(total * 100) / 100,
  },
  ...(warnings.length > 0 && { warnings }),
};

// ✅ NEW: Validate response before returning
if (!response.tax) {
  this.logger.error('CRITICAL: Response missing tax field!');
  response.tax = {
    amount: 0,
    rate: 0,
    jurisdiction: 'Error',
    breakdown: {},
  };
}

if (!response.shippingOptions || response.shippingOptions.length === 0) {
  this.logger.error('CRITICAL: Response missing shippingOptions!');
  throw new BadRequestException('No shipping options available for this address');
}

return response;
```

---

## Testing Checklist

### Reproduce the Bug

1. **Create test French address:**
   - Country: France
   - City: Paris
   - Postal Code: 75007
   - State: (empty)

2. **Go to checkout**

3. **Enter French address**

4. **Click Continue**

5. **Observe error in console**

### After Fix - Frontend

1. Apply frontend fix (null checks)
2. Rebuild frontend: `pnpm build`
3. Test with French address
4. **Expected:** No crash, tax shows $0.00, shipping options appear
5. **If fails:** Check backend logs for actual response

### After Fix - Backend

1. Apply backend fix (validation)
2. Restart API: `pm2 restart nextpik-api`
3. Test with cURL (see above)
4. **Expected:** Response always includes valid `tax` object
5. Check logs for any "CRITICAL" messages

---

## Production Deployment

### Phase 1: Frontend Fix (Can deploy immediately)

```bash
# 1. Apply fix to checkout page
# 2. Build
cd apps/web
pnpm build

# 3. Deploy to production
# DigitalOcean: Force rebuild and deploy
```

### Phase 2: Backend Fix (Test in staging first)

```bash
# 1. Apply fix to orders.service.ts
# 2. Build
cd apps/api
pnpm build

# 3. Deploy to staging
# Test with international addresses

# 4. Deploy to production
# Monitor logs for "CRITICAL" messages
```

---

## Monitoring

After deployment, monitor these:

1. **Error logs for "Tax calculation failed"**
2. **Error logs for "CRITICAL: Response missing tax"**
3. **Frontend errors for "can't access property"**
4. **Support tickets from international customers**

---

## Additional Issues Found

### Issue #1: Empty State for France

**Address Data:**

```json
{
  "country": "France",
  "state": "", // ❌ Empty string
  "postalCode": "75007"
}
```

**Problem:**
France doesn't use states, but backend might expect non-empty string for some checks.

**Fix:** Normalize empty strings to `undefined`:

```typescript
// apps/web/src/app/checkout/page.tsx
country: countryConfig.name,
state: data.state || undefined,  // ✅ Convert empty to undefined
postalCode: data.postalCode || '',
```

---

## Summary

**Root Cause:** Frontend assumes `calculation.tax` always exists, but crashes when it's undefined.

**Immediate Fix:** Add null checks in frontend (deploy ASAP)

**Permanent Fix:** Ensure backend always returns valid `tax` object, even for international orders with $0 tax.

**Priority:** 🔴 **P0** - Blocking international checkouts

**ETA:** 30 minutes (frontend fix)

---

Generated: March 12, 2026
Reporter: Production Error Logs
Status: Fix Ready for Deployment
