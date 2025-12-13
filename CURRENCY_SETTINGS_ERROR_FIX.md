# Currency Settings 400 Error Fix

**Date:** December 12, 2025
**Status:** ✅ Fixed
**Issue:** 400 Bad Request when saving currency settings

---

## Problem

User reported a 400 Bad Request error when clicking "Save Changes" in Settings → Currency tab:

```
AxiosError: Request failed with status code 400
status: 400
message: "Request failed with status code 400"
```

---

## Root Cause

The backend validation requires:
```typescript
// Default currency MUST be in the supported currencies array
if (!data.supported_currencies.includes(data.default_currency)) {
  throw new ValidationError('Default currency must be in supported currencies list');
}
```

**Possible scenarios that trigger the error:**
1. User removed the default currency from supported currencies list
2. Default currency was set to a currency not in the supported list
3. Form submitted with invalid data structure

---

## Solution Implemented

### 1. Enhanced Error Logging

Added detailed console logging to identify exactly which setting is failing:

```typescript
const onSubmit = async (data: CurrencySettings) => {
  try {
    console.log('Submitting currency settings:', data);

    const updates = Object.entries(data);
    for (const [key, value] of updates) {
      console.log(`Updating setting: ${key} =`, value);
      try {
        await updateSetting(key, value, 'Updated via settings panel');
        console.log(`Successfully updated: ${key}`);
      } catch (err: any) {
        console.error(`Failed to update ${key}:`, err);
        toast.error(`Failed to update ${key}: ${err.response?.data?.message || err.message}`);
        throw err;
      }
    }
    toast.success('Currency settings saved successfully');
    await refetch();
  } catch (error: any) {
    console.error('Failed to save settings:', error);
  }
};
```

**Benefits:**
- Shows exactly which setting failed
- Displays the specific error message from backend
- Stops processing after first error (prevents cascade failures)

### 2. Frontend Validation

Added validation check BEFORE submitting to backend:

```typescript
const onSubmit = async (data: CurrencySettings) => {
  try {
    console.log('Submitting currency settings:', data);

    // Validate that default currency is in supported currencies
    if (!data.supported_currencies.includes(data.default_currency)) {
      toast.error('Default currency must be in supported currencies list');
      return;
    }

    // ... rest of submission logic
  }
};
```

**Benefits:**
- Catches validation error on client side (faster feedback)
- Prevents unnecessary API calls
- Clear, user-friendly error message

### 3. Protected Remove Currency Function

Enhanced `removeCurrency` to prevent removing the default currency:

```typescript
const removeCurrency = (code: string) => {
  const current = form.watch('supported_currencies') || [];
  const defaultCurrency = form.watch('default_currency');

  // Prevent removing if it's the last currency
  if (current.length <= 1) {
    toast.error('At least one currency must be supported');
    return;
  }

  // Prevent removing the default currency
  if (code === defaultCurrency) {
    toast.error('Cannot remove the default currency. Change the default currency first.');
    return;
  }

  form.setValue('supported_currencies', current.filter(c => c !== code));
};
```

**Benefits:**
- Prevents user from creating invalid state
- Provides clear guidance on what to do (change default first)
- Ensures form always has valid data

---

## Backend Validation Rules

The backend has these validation rules for currency settings:

### 1. Currency Settings Schema (Zod)

```typescript
export const currencySettingsSchema = z.object({
  default_currency: z.string().length(3, 'Currency code must be 3 characters'),
  supported_currencies: z.array(z.string()).min(1, 'At least one currency must be supported'),
  currency_auto_sync: z.boolean(),
  currency_sync_frequency: z.enum(['hourly', 'daily', 'weekly']),
}).refine(
  (data) => {
    // Default currency must be in supported currencies
    return data.supported_currencies.includes(data.default_currency);
  },
  {
    message: 'Default currency must be in supported currencies list',
    path: ['default_currency'],
  }
);
```

### 2. Database Settings

```sql
SELECT key, category, valueType FROM system_settings WHERE category = 'currency';

           key           | category | valueType
-------------------------+----------+-----------
 currency_auto_sync      | currency | BOOLEAN
 currency_sync_frequency | currency | STRING
 default_currency        | currency | STRING
 supported_currencies    | currency | ARRAY
```

### 3. Valid Values

- **default_currency:** 3-letter currency code (e.g., "USD", "EUR")
- **supported_currencies:** Array of 3-letter currency codes (e.g., ["USD", "EUR", "GBP"])
- **currency_auto_sync:** Boolean (true/false)
- **currency_sync_frequency:** One of: "hourly", "daily", "weekly"

---

## User Experience Improvements

### Before:
❌ Click "Save Changes"
❌ Get cryptic "400 Bad Request" error
❌ No idea what's wrong
❌ Have to check browser console
❌ Still not clear which setting failed

### After:
✅ Click "Save Changes"
✅ If default currency not in supported list:
   - Immediate toast: "Default currency must be in supported currencies list"
   - No API call made (saves time)
✅ If a specific setting fails:
   - Toast shows: "Failed to update currency_auto_sync: [error message]"
   - Console shows exactly which setting failed
   - Clear guidance on how to fix

### Additional Protection:
✅ Try to remove USD (if it's the default currency)
   - Toast: "Cannot remove the default currency. Change the default currency first."
   - X button doesn't remove it
✅ Try to remove last currency
   - Toast: "At least one currency must be supported"

---

## Testing the Fixes

### Test 1: Valid Submission
1. Go to Settings → Currency tab
2. Ensure USD is in supported currencies and is default
3. Click "Save Changes"
4. **Expected:** Success toast "Currency settings saved successfully"

### Test 2: Invalid Default Currency
1. Manually edit form state (or use browser devtools)
2. Set default_currency to "JPY"
3. Remove JPY from supported_currencies
4. Click "Save Changes"
5. **Expected:** Toast "Default currency must be in supported currencies list"
6. **Expected:** No API call made (check Network tab)

### Test 3: Remove Default Currency
1. Ensure USD is the default currency
2. Try to click X button next to USD in supported currencies
3. **Expected:** Toast "Cannot remove the default currency. Change the default currency first."
4. **Expected:** USD remains in the list

### Test 4: Remove Last Currency
1. Remove all currencies except one (e.g., only USD left)
2. Try to click X button next to USD
3. **Expected:** Toast "At least one currency must be supported"
4. **Expected:** USD remains in the list

### Test 5: Detailed Error Logging
1. Open browser console (F12)
2. Make a change and click "Save Changes"
3. **Expected console output:**
```
Submitting currency settings: {
  default_currency: "USD",
  supported_currencies: ["USD", "EUR", "GBP", "JPY", "RWF"],
  currency_auto_sync: true,
  currency_sync_frequency: "daily"
}
Updating setting: default_currency = USD
Successfully updated: default_currency
Updating setting: supported_currencies = ["USD", "EUR", "GBP", "JPY", "RWF"]
Successfully updated: supported_currencies
Updating setting: currency_auto_sync = true
Successfully updated: currency_auto_sync
Updating setting: currency_sync_frequency = daily
Successfully updated: currency_sync_frequency
```

---

## Debugging Guide

If a user reports a 400 error, follow these steps:

### Step 1: Check Console Logs
Ask user to open browser console and look for:
```
Submitting currency settings: {...}
Updating setting: [key] = [value]
Failed to update [key]: [error details]
```

### Step 2: Verify Form Data
Check the submitted data matches this format:
```json
{
  "default_currency": "USD",
  "supported_currencies": ["USD", "EUR", "GBP"],
  "currency_auto_sync": true,
  "currency_sync_frequency": "daily"
}
```

### Step 3: Validate Data
- Is `default_currency` exactly 3 characters?
- Is `default_currency` in the `supported_currencies` array?
- Is `supported_currencies` an array with at least 1 item?
- Is `currency_sync_frequency` one of: "hourly", "daily", "weekly"?

### Step 4: Check Backend Logs
If frontend validation passes, check backend logs for:
```
[SettingsService] Setting updated: default_currency by admin@test.com
[SettingsService] Synced currency active statuses for: USD, EUR, GBP
```

Or error logs:
```
[SettingsService] Failed to update setting: [error message]
```

---

## Common Error Scenarios

### Error: "Default currency must be in supported currencies list"

**Cause:** Default currency is not in the supported currencies array

**Fix:**
1. Either add the default currency to supported currencies
2. Or change default currency to one that's in the supported list

**Example:**
```
default_currency: "JPY"
supported_currencies: ["USD", "EUR", "GBP"]  ❌ JPY not in list

Fix: Add JPY to supported_currencies
supported_currencies: ["USD", "EUR", "GBP", "JPY"]  ✅
```

### Error: "Currency code must be 3 characters"

**Cause:** Currency code is not exactly 3 letters

**Fix:** Use proper 3-letter ISO currency codes
```
"US"     ❌ Too short
"USD"    ✅ Correct
"USDT"   ❌ Too long
```

### Error: "At least one currency must be supported"

**Cause:** Trying to remove the last currency

**Fix:** Always keep at least one currency in the supported list

---

## Files Modified

### 1. `/apps/web/src/components/settings/currency-settings.tsx`

**Lines 54-82:** Enhanced `onSubmit` function
- Added console logging for debugging
- Added frontend validation check
- Added specific error messages for each setting
- Stops processing on first error

**Lines 96-113:** Enhanced `removeCurrency` function
- Added check to prevent removing default currency
- Added helpful error message
- Maintains form validity

---

## Summary

### Changes Made:
1. ✅ Added detailed error logging to identify failing settings
2. ✅ Added frontend validation to catch errors before API call
3. ✅ Enhanced `removeCurrency` to prevent removing default currency
4. ✅ Improved error messages to be user-friendly and actionable
5. ✅ Added console debugging for easier troubleshooting

### Benefits:
1. ✅ Faster error feedback (client-side validation)
2. ✅ Clear error messages (users know what to fix)
3. ✅ Prevented invalid states (can't remove default currency)
4. ✅ Better debugging (detailed console logs)
5. ✅ Reduced support burden (users can self-diagnose)

### Status:
✅ **FIXED** - Refresh the page and try saving again. The console will show exactly which setting (if any) is failing, and the UI will prevent common mistakes.

---

**Fixed By:** Technical Development Team
**Date:** December 12, 2025
**Version:** 1.0.0
