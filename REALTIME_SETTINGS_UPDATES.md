# Real-Time Settings Updates

**Date:** December 12, 2025
**Status:** ✅ Implemented
**Feature:** Immediate UI updates across the app when settings are changed

---

## Overview

Settings changes now take effect **immediately** without requiring page refresh. When an admin updates settings in `/admin/settings`, all components across the application automatically update in real-time.

---

## How It Works

### SWR Cache Invalidation

The system uses SWR's cache invalidation to trigger automatic refetches across all components:

```typescript
// After successful settings save
await invalidateCurrencySettings();
```

This invalidates all SWR caches related to currencies, causing:
- ✅ Topbar currency selector to update
- ✅ Product pages to refresh with new currencies
- ✅ All currency-dependent components to reload

---

## Implementation

### 1. Cache Invalidation Utilities

**File:** `/apps/web/src/lib/settings-cache.ts`

```typescript
import { mutate } from 'swr';

/**
 * Invalidate currency-related caches
 */
export async function invalidateCurrencySettings() {
  await Promise.all([
    mutate('/settings/public'),
    mutate('/currency/rates'),
    mutate('/currency/admin/all'),
    mutate((key) => typeof key === 'string' && key.startsWith('/currency/')),
  ]);
}
```

**Benefits:**
- Centralized cache invalidation logic
- Easy to add new invalidation functions
- Consistent across all settings sections

### 2. Currency Settings Integration

**File:** `/apps/web/src/components/settings/currency-settings.tsx`

```typescript
const onSubmit = async (data: CurrencySettings) => {
  try {
    // Update all settings
    for (const key of updateOrder) {
      await updateSetting(key, value, 'Updated via settings panel');
    }

    toast.success('Currency settings saved successfully');

    // Invalidate all currency-related caches
    await Promise.all([
      refetch(), // Refetch settings
      invalidateCurrencySettings(), // Update all currency caches
    ]);

    console.log('Currency caches invalidated - UI updated immediately');
  } catch (error) {
    // Error handling
  }
};
```

---

## Available Invalidators

### 1. Currency Settings
```typescript
import { invalidateCurrencySettings } from '@/lib/settings-cache';

await invalidateCurrencySettings();
```

**Invalidates:**
- `/settings/public` - Public settings cache
- `/currency/rates` - Currency rates (topbar, products, etc.)
- `/currency/admin/all` - Admin currency list
- All `/currency/*` endpoints

### 2. Payment Settings
```typescript
import { invalidatePaymentSettings } from '@/lib/settings-cache';

await invalidatePaymentSettings();
```

**Invalidates:**
- `/settings/public` - Public settings
- `/settings/category/payment` - Payment category settings

### 3. Delivery Settings
```typescript
import { invalidateDeliverySettings } from '@/lib/settings-cache';

await invalidateDeliverySettings();
```

**Invalidates:**
- `/settings/public` - Public settings
- All `/delivery/*` endpoints

### 4. All Settings
```typescript
import { invalidateAllSettings } from '@/lib/settings-cache';

await invalidateAllSettings();
```

**Invalidates:**
- `/settings/public`
- All `/settings/category/*` endpoints
- All `/settings/*` endpoints

### 5. By Category
```typescript
import { invalidateSettingsByCategory } from '@/lib/settings-cache';

await invalidateSettingsByCategory('currency');
await invalidateSettingsByCategory('payment');
await invalidateSettingsByCategory('delivery');
```

---

## Usage Examples

### Example 1: Currency Settings Update

**Scenario:** Admin changes supported currencies from USD, EUR, GBP to USD, JPY

**What Happens:**
1. Admin removes GBP, EUR and adds JPY
2. Clicks "Save Changes"
3. Settings are saved to database
4. `invalidateCurrencySettings()` is called
5. **Topbar immediately updates** to show USD and JPY in dropdown
6. **Product pages refresh** to show prices in new currencies
7. **No page refresh needed!**

### Example 2: Default Currency Change

**Scenario:** Admin changes default currency from USD to EUR

**What Happens:**
1. Admin selects EUR as default
2. Clicks "Save Changes"
3. Settings saved, caches invalidated
4. **Topbar switches to EUR** as selected currency
5. **All prices recalculate** to EUR
6. **Immediate visual update**

### Example 3: Currency Auto-Sync Toggle

**Scenario:** Admin enables auto-sync for exchange rates

**What Happens:**
1. Admin toggles "Auto-Sync Exchange Rates" ON
2. Clicks "Save Changes"
3. Settings saved, caches invalidated
4. **Settings UI updates** to show sync frequency dropdown
5. **Background processes adjust** based on new setting

---

## Components That Update Automatically

### 1. Topbar Currency Selector
**File:** `/apps/web/src/components/layout/topbar.tsx`

Uses `useCurrencyRates()` which fetches from `/currency/rates`

**Updates when:**
- Supported currencies change
- Active currencies change
- Default currency changes

### 2. Product Cards
**File:** `/packages/ui/src/components/product-card.tsx`

Uses `useCurrencyConverter()` for price formatting

**Updates when:**
- Supported currencies change
- Exchange rates update
- Default currency changes

### 3. Product Pages
**File:** `/apps/web/src/app/products/[slug]/page.tsx`

Uses currency hooks for pricing

**Updates when:**
- Any currency setting changes

### 4. Shopping Cart
Uses currency conversion for totals

**Updates when:**
- Currency settings change
- Exchange rates update

---

## Technical Details

### SWR Mutate Function

```typescript
import { mutate } from 'swr';

// Invalidate specific key
await mutate('/currency/rates');

// Invalidate multiple keys
await Promise.all([
  mutate('/currency/rates'),
  mutate('/settings/public'),
]);

// Invalidate with pattern matching
await mutate((key) =>
  typeof key === 'string' && key.startsWith('/currency/')
);
```

### How SWR Revalidation Works

1. **Cache Invalidation:** `mutate('/currency/rates')` is called
2. **Components Detect Change:** All components using `useSWR('/currency/rates')` are notified
3. **Automatic Refetch:** SWR automatically fetches fresh data from API
4. **UI Updates:** React re-renders components with new data
5. **No Manual Refresh:** Happens automatically in background

---

## Performance Considerations

### Optimized Invalidation

Only invalidate what's needed:

```typescript
// ❌ Bad: Invalidate everything
await invalidateAllSettings();

// ✅ Good: Invalidate only currency-related caches
await invalidateCurrencySettings();
```

### Batched Updates

Multiple cache invalidations are batched:

```typescript
await Promise.all([
  mutate('/currency/rates'),
  mutate('/settings/public'),
  mutate('/currency/admin/all'),
]);
// All three fetch in parallel, UI updates once
```

### Deduplication

SWR automatically deduplicates requests:

```typescript
// Even if 10 components use this hook
useSWR('/currency/rates', fetcher);
// Only 1 actual HTTP request is made
```

---

## Adding Real-Time Updates to New Settings

### Step 1: Create Invalidation Function

In `/apps/web/src/lib/settings-cache.ts`:

```typescript
export async function invalidateMyNewSettings() {
  await Promise.all([
    mutate('/settings/public'),
    mutate('/my-new-endpoint'),
    mutate((key) => typeof key === 'string' && key.startsWith('/my-new/')),
  ]);
}
```

### Step 2: Use in Settings Component

```typescript
import { invalidateMyNewSettings } from '@/lib/settings-cache';

const onSubmit = async (data) => {
  // Save settings
  await updateSetting('my_setting', data.value);

  // Invalidate caches
  await invalidateMyNewSettings();

  toast.success('Settings saved!');
};
```

### Step 3: Ensure Components Use SWR

Make sure components use SWR hooks:

```typescript
// ✅ Good: Will auto-update
function MyComponent() {
  const { data } = useSWR('/my-new-endpoint', fetcher);
  return <div>{data}</div>;
}

// ❌ Bad: Won't auto-update
function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/my-new-endpoint').then(setData);
  }, []);
  return <div>{data}</div>;
}
```

---

## Testing Real-Time Updates

### Test 1: Currency Selector Update

1. Open app in **two browser tabs**
2. In Tab 1: Admin Settings → Currency
3. Remove EUR from supported currencies
4. Click "Save Changes"
5. **Expected in Tab 2:** Topbar currency dropdown updates immediately (EUR disappears)

### Test 2: Default Currency Update

1. Open product page showing prices in USD
2. In another tab: Change default currency to EUR
3. **Expected:** Product page prices switch to EUR without refresh

### Test 3: Multiple Components

1. Open:
   - Tab 1: Product listing page
   - Tab 2: Product detail page
   - Tab 3: Shopping cart
   - Tab 4: Admin settings
2. In Tab 4: Change supported currencies
3. **Expected:** All other tabs update simultaneously

---

## Debugging

### Check If Cache Is Invalidating

Add console logs:

```typescript
await invalidateCurrencySettings();
console.log('Cache invalidated');
```

### Monitor SWR State

Use SWR DevTools or add logging:

```typescript
const { data, error, isLoading } = useSWR('/currency/rates', fetcher, {
  onSuccess: (data) => console.log('Fetched new data:', data),
});
```

### Check Network Requests

1. Open DevTools → Network tab
2. Save settings
3. Look for requests to `/currency/rates`, `/settings/public`
4. Should see automatic refetch requests

---

## Common Issues

### Issue: UI Not Updating After Save

**Possible Causes:**
1. Cache invalidation not called
2. Component not using SWR
3. Wrong cache key

**Solution:**
```typescript
// Ensure invalidation is called
await invalidateCurrencySettings();

// Ensure component uses SWR
const { data } = useSWR('/currency/rates', fetcher);

// Check cache key matches
console.log('Key used:', '/currency/rates');
```

### Issue: Updates Slow

**Possible Causes:**
1. Too many invalidations
2. Large payload
3. Slow API response

**Solution:**
- Only invalidate what's needed
- Optimize API response size
- Add loading states

---

## Future Enhancements

1. **WebSocket Support:** Real-time updates across different users
2. **Optimistic Updates:** Update UI before API response
3. **Background Sync:** Periodic cache refresh
4. **Selective Invalidation:** More granular control

---

## Summary

✅ **Settings changes take effect immediately**
✅ **No page refresh required**
✅ **Works across all tabs and components**
✅ **Efficient with SWR caching**
✅ **Easy to extend for new settings**

**Result:** Smooth, real-time admin experience with instant feedback!

---

**Implemented By:** Technical Development Team
**Date:** December 12, 2025
**Status:** ✅ Production Ready
**Version:** 1.0.0
