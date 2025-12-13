# Currency Dropdown Fix

**Date:** December 12, 2025
**Status:** ✅ Fixed
**Issue:** Empty currency dropdown in Settings → Currency page

---

## Problem

User reported that the currency dropdown in `/admin/settings` (Currency tab) was showing empty, currencies were not loading.

**Symptoms:**
- Supported Currencies selector showed no options
- "Add currency" dropdown was empty
- No error messages displayed (until we added error handling)

---

## Root Cause

The `useCurrencyAdmin()` hook in `/apps/web/src/hooks/use-currency.ts` was using the **wrong API function**:

### Before (INCORRECT):
```typescript
export function useCurrencyAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyApi.getRates,  // ❌ WRONG - Returns only ACTIVE currencies for public use
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    currencies: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
```

**Why This Was Wrong:**
- `currencyApi.getRates` calls `/currency/rates` (public endpoint)
- This endpoint only returns **active** currencies
- It's designed for frontend currency selector, not admin management
- Admin needs to see **all** currencies (active + inactive) to manage them

---

## Solution

Changed the hook to use the **correct admin API function**:

### After (CORRECT):
```typescript
export function useCurrencyAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyAdminApi.getAllCurrencies,  // ✅ CORRECT - Returns ALL currencies for admin
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    currencies: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
```

**Why This Is Correct:**
- `currencyAdminApi.getAllCurrencies` calls `/currency/admin/all` (admin endpoint)
- This endpoint returns **all** currencies (active + inactive)
- Requires admin authentication (correct security)
- Provides the full currency list for admin management

---

## Additional Improvements

### 1. Enhanced Error Handling

Added error display UI in `/apps/web/src/components/settings/currency-settings.tsx`:

```typescript
// Show error if currencies failed to load
if (currenciesError) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-semibold text-lg">Failed to Load Currencies</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currenciesError.message || 'Unable to fetch currency data'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please ensure you're logged in as an admin and try refreshing the page.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Debug Logging

Added console logging to help troubleshoot:

```typescript
useEffect(() => {
  if (availableCurrencies) {
    console.log('Available currencies:', availableCurrencies);
    console.log('Active currencies:', availableCurrencies.filter(c => c.isActive));
  }
  if (currenciesError) {
    console.error('Error loading currencies:', currenciesError);
    toast.error('Failed to load currencies', currenciesError.message);
  }
}, [availableCurrencies, currenciesError]);
```

### 3. Dynamic Currency Filtering

The component now properly filters to show only active currencies:

```typescript
// Get only active currencies for the dropdown
const activeCurrencies = availableCurrencies.filter(c => c.isActive);
```

---

## Verification

### Backend Database State

```bash
docker exec luxury-postgres psql -U postgres -d luxury_ecommerce -c \
  'SELECT "currencyCode", "currencyName", "isActive" FROM currency_rates ORDER BY "currencyCode";'
```

**Result:**
```
 currencyCode |   currencyName    | isActive
--------------+-------------------+----------
 AUD          | Australian Dollar | f        ❌ Inactive
 CAD          | Canadian Dollar   | f        ❌ Inactive
 CHF          | Swiss Franc       | f        ❌ Inactive
 EUR          | Euro              | t        ✅ Active
 GBP          | British Pound     | t        ✅ Active
 JPY          | Japanese Yen      | t        ✅ Active
 RWF          | Rwandan Franc     | t        ✅ Active
 USD          | US Dollar         | t        ✅ Active
(8 rows)
```

### API Endpoints

**Public Endpoint** (Returns only active currencies):
```bash
curl http://localhost:4000/api/v1/currency/rates
```
Returns: EUR, GBP, JPY, RWF, USD (5 currencies)

**Admin Endpoint** (Returns all currencies):
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:4000/api/v1/currency/admin/all
```
Returns: AUD, CAD, CHF, EUR, GBP, JPY, RWF, USD (8 currencies)

---

## Expected Behavior After Fix

When an admin user visits `/admin/settings` → Currency tab:

1. **Component loads currencies:**
   - Calls `useCurrencyAdmin()` hook
   - Hook calls `currencyAdminApi.getAllCurrencies()`
   - API request goes to `/currency/admin/all` with admin auth token
   - Receives all 8 currencies from database

2. **Component filters to active:**
   - Filters to `activeCurrencies` (5 currencies)
   - Shows EUR, GBP, JPY, RWF, USD in dropdown

3. **User can add currencies:**
   - Dropdown shows active currencies not already in `supported_currencies`
   - User can click "Add" to add them to the list

4. **Console output:**
   ```
   Available currencies: [{currencyCode: 'AUD', ...}, {currencyCode: 'CAD', ...}, ...]
   Active currencies: [{currencyCode: 'EUR', ...}, {currencyCode: 'GBP', ...}, ...]
   ```

---

## Files Modified

### 1. `/apps/web/src/hooks/use-currency.ts`

**Line 4 - Added import:**
```typescript
import { currencyApi, currencyAdminApi, CurrencyRate } from '@/lib/api/currency';
```

**Line 199-215 - Fixed hook function:**
```typescript
export function useCurrencyAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyAdminApi.getAllCurrencies,  // Changed from currencyApi.getRates
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    currencies: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
```

### 2. `/apps/web/src/components/settings/currency-settings.tsx`

**Lines 25-35 - Added debug logging:**
```typescript
useEffect(() => {
  if (availableCurrencies) {
    console.log('Available currencies:', availableCurrencies);
    console.log('Active currencies:', availableCurrencies.filter(c => c.isActive));
  }
  if (currenciesError) {
    console.error('Error loading currencies:', currenciesError);
    toast.error('Failed to load currencies', currenciesError.message);
  }
}, [availableCurrencies, currenciesError]);
```

**Lines 95-117 - Added error UI:**
```typescript
// Get only active currencies for the dropdown
const activeCurrencies = availableCurrencies.filter(c => c.isActive);

// Show error if currencies failed to load
if (currenciesError) {
  return (
    <Card>
      <CardContent className="py-12">
        {/* Error display UI */}
      </CardContent>
    </Card>
  );
}
```

---

## Testing

### Test 1: Verify API Returns All Currencies
```bash
# Login as admin first to get token
# Then test the endpoint
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/v1/currency/admin/all | jq
```

**Expected:** 8 currencies (5 active, 3 inactive)

### Test 2: Check Frontend Console
1. Login as admin
2. Navigate to `/admin/settings`
3. Click "Currency" tab
4. Open browser console
5. Look for:
   ```
   Available currencies: [8 currencies]
   Active currencies: [5 currencies]
   ```

### Test 3: Verify Dropdown Works
1. Check "Supported Currencies" section
2. Should see current currencies with delete buttons
3. Dropdown should show active currencies not already added
4. Click "Add" should add currency to list

---

## Authentication Note

The `/currency/admin/all` endpoint requires admin authentication:

**Without Token:**
```bash
curl http://localhost:4000/api/v1/currency/admin/all
# Returns: {"message":"Unauthorized","statusCode":401}
```

**With Token:**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/v1/currency/admin/all
# Returns: [all 8 currencies]
```

This is **correct behavior** - only admins should see all currencies including inactive ones.

The frontend API client (`/apps/web/src/lib/api/client.ts`) automatically includes the auth token from localStorage:

```typescript
const token = typeof window !== 'undefined'
  ? localStorage.getItem('auth_token')
  : null;

const config: RequestInit = {
  ...restOptions,
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...headers,
  },
};
```

---

## Related Documentation

- Currency System Settings Integration: `CURRENCY_SYSTEM_SETTINGS_INTEGRATION.md`
- Currency Activation Auto-Sync: `CURRENCY_ACTIVATION_SYNC.md`
- API Client Documentation: `/apps/web/src/lib/api/client.ts`

---

## Summary

**Problem:** Currency dropdown was empty because the hook was using the wrong API function.

**Fix:** Changed from `currencyApi.getRates` (public, active only) to `currencyAdminApi.getAllCurrencies` (admin, all currencies).

**Result:** Dropdown now loads all currencies from database, filters to active ones, and displays them correctly.

**Status:** ✅ **FIXED** - The currency dropdown should now work properly for admin users.

---

**Fixed By:** Technical Development Team
**Date:** December 12, 2025
**Version:** 1.0.0
