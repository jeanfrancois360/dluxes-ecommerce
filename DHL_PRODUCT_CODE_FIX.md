# DHL Product Code Fix - EU vs NON-EU Shipments

## Issue Summary

DHL clarified that Belgium → France is an **International EU** shipment requiring product code **'U'**, not product code **'P'** (which is for NON-EU destinations).

## Root Cause

The `mapServiceTypeToDhlProduct()` method incorrectly treated all EU-to-EU shipments as "domestic" using product code 'N', when they should be classified as **International EU** using product code 'U'.

## DHL Product Code Classification

### ⚠️ Belgium-Specific Codes (Important!)

Belgium uses **country-specific product codes** that differ from global codes!

| Product Code | Description                   | Example Routes                 | Notes                                       |
| ------------ | ----------------------------- | ------------------------------ | ------------------------------------------- |
| **N**        | Domestic (same country)       | BE → BE, FR → FR               | Universal                                   |
| **U**        | International EU              | BE → FR, DE → IT, FR → ES      | Universal                                   |
| **S**        | International NON-EU (BE)     | BE → US, BE → UK               | **Belgium uses 'S' instead of global 'P'!** |
| **P**        | International NON-EU (Global) | FR → US, DE → UK               | ⚠️ Don't use for Belgium!                   |
| **G**        | Domestic Economy              | Same country, economy service  | Universal                                   |
| **W**        | Economy Select                | International, economy service | Universal                                   |
| **K, L, Y**  | Time-definite                 | 9:00, 10:30, 12:00 delivery    | Universal                                   |

### Official DHL Products BE Table

See `DHL_PRODUCTS_BE_REFERENCE.md` for the complete official product table from DHL.

## Changes Made

### 1. Updated `shipments.controller.ts` (lines 880-937)

**File:** `apps/api/src/shipments/shipments.controller.ts`

**Before:**

```typescript
// Treated EU-to-EU as domestic (WRONG)
const isEuDomestic =
  euCountries.includes(originCountry) && euCountries.includes(destinationCountry);
if (isEuDomestic || isDomestic) {
  return 'N'; // Wrong for BE → FR
}
```

**After:**

```typescript
// Now correctly distinguishes three cases:
// 1. Domestic (same country) → 'N'
// 2. International EU (different EU countries) → 'U'
// 3. International NON-EU → 'P'

if (isDomestic) {
  return 'N'; // BE → BE
}

if (isInternationalEu) {
  return 'U'; // BE → FR ✅ CORRECT
}

return 'P'; // BE → US
```

### 2. Added Helper Method to `dhl-shipment.service.ts`

**File:** `apps/api/src/integrations/dhl/dhl-shipment.service.ts`

Added new method: `determineProductCode(originCountry, destinationCountry, serviceType)`

This allows any code to determine the correct product code programmatically:

```typescript
// Example usage:
const productCode = dhlShipmentService.determineProductCode('BE', 'FR', 'express');
// Returns: 'U' ✅

const productCode2 = dhlShipmentService.determineProductCode('BE', 'US', 'express');
// Returns: 'P' ✅

const productCode3 = dhlShipmentService.determineProductCode('BE', 'BE', 'express');
// Returns: 'N' ✅
```

### 3. Updated Product Code Descriptions

**File:** `apps/api/src/integrations/dhl/dhl-shipment.service.ts`

Made descriptions clearer:

- 'P': "DHL Express Worldwide (NON-EU)" ← More specific
- 'U': "DHL Express Worldwide (EU)" ← More specific
- 'N': "DHL Express Domestic" (Same country only)

### 4. Updated EU Country List

Added complete list of 27 EU member states (as of 2024):

```typescript
const euCountries = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
];
```

Note: UK is NOT included (post-Brexit)

## Testing Recommendations

### Test Case 1: Belgium → France (International EU)

```bash
# Expected: Product code 'U'
curl -X POST "http://localhost:4000/api/v1/shipments/dhl/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "...",
    "storeId": "...",
    "itemIds": ["..."],
    "serviceType": "express"
  }'
```

**Expected Result:**

- ✅ Shipment created with product code 'U'
- ✅ No error 410135 (product not available)

### Test Case 2: Belgium → Belgium (Domestic)

```bash
# Expected: Product code 'N'
# (if account has domestic access)
```

### Test Case 3: Belgium → USA (International NON-EU)

```bash
# Expected: Product code 'S' (Belgium-specific!)
# NOT 'P' - Belgium uses country-specific codes
```

## Files Modified

1. ✅ `apps/api/src/shipments/shipments.controller.ts` (lines 880-937)
   - Fixed `mapServiceTypeToDhlProduct()` method

2. ✅ `apps/api/src/integrations/dhl/dhl-shipment.service.ts`
   - Added `determineProductCode()` helper method
   - Updated product code descriptions
   - Updated EU country list

3. ℹ️ Frontend (`apps/web/src/components/seller/mark-as-shipped-modal.tsx`)
   - No changes needed (already passes `serviceType` to backend)

## Next Steps

1. **Test the fix:**

   ```bash
   # Rebuild the API
   cd apps/api
   pnpm build

   # Restart the API server
   pnpm dev
   ```

2. **Create a test shipment:**
   - Go to Seller Dashboard
   - Find an order with France delivery address
   - Click "Mark as Shipped"
   - Select "Auto-generate with DHL"
   - Choose "Express" service
   - Submit

3. **Verify in logs:**
   ```bash
   # Check backend logs for:
   "Selected product: U (DHL Express Worldwide (EU))"
   "✅ Shipment created successfully with product U"
   ```

## Known Limitations

1. **Pickup requests** (line 503 in `dhl-shipment.service.ts`):
   - Still uses hardcoded product code 'P'
   - Pickup API might need generic product code since destination is unknown at pickup time
   - May need adjustment if account has restrictions

2. **Account restrictions:**
   - If DHL account doesn't support certain product codes, the API will still fail
   - The Rating API is used first to get available products for the account
   - Fallback logic will try multiple products from Rating API response

## References

- DHL Email Response: See `DHL_SUPPORT_EMAIL.md`
- DHL MyDHL API Documentation: https://developer.dhl.com/api-reference/mydhl-api-dhl-express
- EU Member States: https://europa.eu/european-union/about-eu/countries_en

## Rollback Instructions

If you need to revert these changes:

```bash
git diff HEAD apps/api/src/shipments/shipments.controller.ts
git diff HEAD apps/api/src/integrations/dhl/dhl-shipment.service.ts

# To revert:
git checkout HEAD -- apps/api/src/shipments/shipments.controller.ts
git checkout HEAD -- apps/api/src/integrations/dhl/dhl-shipment.service.ts
```

---

**Fixed by:** Claude Code
**Date:** February 13, 2026
**Version:** v2.6.1 (DHL Product Code Fix)
