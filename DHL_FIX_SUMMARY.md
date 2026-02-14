# DHL Product Code Fix - FINAL SUMMARY

## 🎯 Issue Resolved

**Original Problem:** Belgium → France shipments were failing because the code used wrong product codes.

**Root Cause:** Two issues discovered:

1. ❌ EU-to-EU shipments were treated as "domestic" (using code 'N')
2. ❌ Belgium-specific product codes were not being used (e.g., 'S' instead of 'P')

---

## ✅ What Was Fixed

### Discovery Timeline

1. **DHL Support Email:**
   - Clarified: Belgium → France = **International EU** (use code 'U', not 'P')

2. **Official DHL Products BE Table:**
   - Revealed: Belgium uses **country-specific codes**
   - Belgium → International NON-EU = code **'S'** (not global code 'P')

### The Solution

Updated product code routing for Belgium:

| Route                  | Old Code | New Code | Status           |
| ---------------------- | -------- | -------- | ---------------- |
| BE → BE (Domestic)     | N ✅     | N ✅     | No change needed |
| BE → FR (Int'l EU)     | N ❌     | **U** ✅ | **FIXED**        |
| BE → US (Int'l NON-EU) | P ❌     | **S** ✅ | **FIXED**        |
| BE → UK (Int'l NON-EU) | N ❌     | **S** ✅ | **FIXED**        |

---

## 📊 Belgium Product Codes (Official)

From the **DHL Products BE** table (5/15/2019):

### Standard Express Services

```
┌─────────────────────┬──────────────┬──────────────┐
│ Route Type          │ BE Code      │ Global Code  │
├─────────────────────┼──────────────┼──────────────┤
│ Domestic            │ N            │ N            │
│ International EU    │ U            │ U            │
│ Int'l NON-EU        │ S ⚠️          │ P            │
└─────────────────────┴──────────────┴──────────────┘
```

**⚠️ Critical:** Belgium uses 'S' where other countries use 'P'!

### All Belgium Codes

| Code  | Service                   | Destination                |
| ----- | ------------------------- | -------------------------- |
| **N** | Express Domestic 18:00    | BE → BE                    |
| **U** | Express Worldwide         | BE → EU countries          |
| **S** | Express Worldwide Non-doc | BE → NON-EU ⚠️             |
| **W** | Economy Select            | BE → EU/International      |
| **K** | Express 9:00 Document     | BE → EU/International      |
| **C** | Express 9:00 Non-doc      | BE → International         |
| **T** | Express 12:00 Document    | BE → EU/International      |
| **Y** | Express 12:00 Non-doc     | BE → International         |
| **X** | Express 10:30             | BE → USA only              |
| I     | Express 9:00 Domestic     | BE → BE                    |
| 1     | Express 12:00 Domestic    | BE → BE                    |
| E     | Express Enveloppe         | BE → Domestic/EU/Int'l Doc |
| O     | Medical Express Doc       | BE → EU/Int'l              |
| Q     | Medical Express Non-doc   | BE → Int'l                 |
| R     | Global Mail Business      | BE → EU                    |

---

## 🔧 Code Changes

### 1. Updated `shipments.controller.ts`

**File:** `apps/api/src/shipments/shipments.controller.ts` (lines 880-937)

**Key Changes:**

```typescript
// Before (WRONG):
if (isEuDomestic || isDomestic) {
  return 'N'; // Treated BE → FR as domestic!
}
return 'P'; // Used global code for Belgium

// After (CORRECT):
if (isDomestic) {
  return 'N'; // Only same country
}

if (isInternationalEu) {
  return 'U'; // BE → FR uses 'U' ✅
}

// Belgium uses 'S' instead of 'P'!
return originCountry === 'BE' ? 'S' : 'P';
```

### 2. Updated `dhl-shipment.service.ts`

**File:** `apps/api/src/integrations/dhl/dhl-shipment.service.ts`

**Changes:**

- ✅ Added `determineProductCode()` helper method
- ✅ Updated product code descriptions with Belgium-specific codes
- ✅ Added all Belgium codes: S, C, T, X, E, O, Q, R
- ✅ Added comments explaining Belgium vs Global codes

---

## 📝 New Documentation Files

1. **`DHL_PRODUCT_CODE_FIX.md`**
   - Detailed technical documentation of the fix
   - Before/after comparison
   - Testing instructions

2. **`DHL_PRODUCTS_BE_REFERENCE.md`**
   - Complete official DHL Products BE table
   - All Belgium-specific product codes
   - Routing logic examples

3. **`DHL_FIX_SUMMARY.md`** (this file)
   - Executive summary
   - Quick reference

4. **`test-product-code-fix.sh`**
   - Automated test script
   - Tests all three scenarios (domestic, EU, NON-EU)

---

## 🧪 Testing

### Quick Test

```bash
# 1. Ensure API is running
pnpm dev:api

# 2. Run automated test (in new terminal)
./test-product-code-fix.sh
```

### Manual Test

1. **Go to:** Seller Dashboard
2. **Find:** Order with France delivery address
3. **Click:** "Mark as Shipped"
4. **Select:** "Auto-generate with DHL"
5. **Choose:** "Express" service
6. **Submit**

### Expected Results

**Backend logs should show:**

```
Selected product: U (DHL Express Worldwide (EU))
✅ Shipment created successfully with product U
```

**NOT:**

```
❌ Selected product: N
❌ Selected product: P
```

---

## 🎯 Testing Matrix

| Origin | Destination | Product Code | Reason                                  |
| ------ | ----------- | ------------ | --------------------------------------- |
| BE     | BE          | **N**        | Domestic ✅                             |
| BE     | FR          | **U**        | International EU ✅                     |
| BE     | DE          | **U**        | International EU ✅                     |
| BE     | IT          | **U**        | International EU ✅                     |
| BE     | US          | **S**        | International NON-EU (BE-specific) ✅   |
| BE     | GB          | **S**        | International NON-EU (post-Brexit) ✅   |
| BE     | CH          | **S**        | International NON-EU (not EU member) ✅ |

---

## ⚙️ How It Works Now

### Product Code Selection Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Try DHL Rating API first                        │
│    └─ Get available products for account           │
└─────────────────────────────────────────────────────┘
                      ↓
                   SUCCESS?
                      ↓
┌─────────────────────────────────────────────────────┐
│ YES: Use product codes from Rating API response    │
│      (try each one in order until successful)      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ NO: Fallback to manual selection                   │
│     └─ Use mapServiceTypeToDhlProduct()            │
│        ├─ BE → BE: 'N' (domestic)                  │
│        ├─ BE → FR: 'U' (international EU)          │
│        └─ BE → US: 'S' (international NON-EU)      │
└─────────────────────────────────────────────────────┘
```

### Why Belgium is Special

Most countries use **global product codes**:

- Domestic: N
- International EU: U
- International NON-EU: **P** ← Global code

Belgium uses **country-specific codes**:

- Domestic: N ✅ (same as global)
- International EU: U ✅ (same as global)
- International NON-EU: **S** ⚠️ (different from global!)

**This is why the fix was needed!**

---

## 📋 Files Modified

### Backend Changes

1. ✅ `apps/api/src/shipments/shipments.controller.ts`
   - Fixed `mapServiceTypeToDhlProduct()` method
   - Added Belgium-specific code logic

2. ✅ `apps/api/src/integrations/dhl/dhl-shipment.service.ts`
   - Added `determineProductCode()` helper
   - Updated product descriptions
   - Added Belgium-specific codes (S, C, T, X, E, O, Q, R)

### Frontend Changes

- ℹ️ No changes needed (already passes `serviceType` to backend)

### Documentation Added

1. `DHL_PRODUCT_CODE_FIX.md` - Technical details
2. `DHL_PRODUCTS_BE_REFERENCE.md` - Official product table
3. `DHL_FIX_SUMMARY.md` - This summary
4. `test-product-code-fix.sh` - Test script

---

## ✅ Verification Checklist

- [x] Type check passed (no TypeScript errors)
- [x] Belgium-specific codes implemented (S, C, T, X, etc.)
- [x] EU routing fixed (BE → FR uses 'U' not 'N')
- [x] Domestic routing unchanged (BE → BE uses 'N')
- [x] International NON-EU uses Belgium code 'S'
- [x] Documentation created
- [x] Test script created
- [ ] **Manual test:** Create actual shipment BE → FR
- [ ] **Verify logs:** Confirm product 'U' is used
- [ ] **DHL API:** Confirm shipment succeeds

---

## 🚀 Next Steps

1. **Rebuild API:**

   ```bash
   cd apps/api
   pnpm build
   ```

2. **Restart API:**

   ```bash
   pnpm dev:api
   ```

3. **Test with real order:**
   - Create test order with France delivery
   - Mark as shipped with DHL auto-generate
   - Verify it succeeds

4. **Monitor logs:**
   - Check for: `Selected product: U (DHL Express Worldwide (EU))`
   - Confirm: `✅ Shipment created successfully with product U`

---

## 🔍 Common Issues & Solutions

### Issue: Still getting error 410135

**Solution:** Your DHL account might not support the product code

- Check if Rating API returns available products
- Verify your DHL account has Belgium access

### Issue: Getting "Product not available"

**Solution:** Try different product codes from Rating API response

- The code now tries all available products from Rating API
- Logs will show which products were attempted

### Issue: Unknown product code

**Solution:** Check the DHL Products BE table

- See: `DHL_PRODUCTS_BE_REFERENCE.md`
- Verify you're using Belgium-specific codes

---

## 📚 References

1. **DHL Support Email:** `DHL_SUPPORT_EMAIL.md`
   - Clarified BE → FR requires 'U' not 'P'

2. **DHL Products BE Table:** Screenshot (5/15/2019)
   - Official product codes for Belgium
   - Documented in: `DHL_PRODUCTS_BE_REFERENCE.md`

3. **DHL MyDHL API Documentation:**
   - https://developer.dhl.com/api-reference/mydhl-api-dhl-express

---

## 🎉 Summary

**Problem:** Belgium → France shipments failed due to wrong product codes

**Solution:**

- ✅ Fixed EU routing (BE → FR now uses 'U' instead of 'N')
- ✅ Implemented Belgium-specific codes (uses 'S' instead of 'P')
- ✅ Updated both controller and service layers
- ✅ Added comprehensive documentation

**Result:** Belgium shipments to all destinations now use correct product codes!

---

**Fixed by:** Claude Code
**Date:** February 13, 2026
**Version:** v2.6.1 - DHL Product Code Fix (Belgium-specific)
**Status:** ✅ Ready for testing
