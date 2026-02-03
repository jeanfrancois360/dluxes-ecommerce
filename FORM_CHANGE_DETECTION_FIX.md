# Form Change Detection Fix - Settings Module

## Issue
Settings forms were not detecting when fields were changed. The SAVE CHANGES button remained disabled even after modifying input fields.

## Root Cause
All settings components had `form` in their `useEffect` dependency arrays, which caused the form to reset on every render, preventing React Hook Form's `formState.isDirty` from ever becoming true.

```typescript
// BEFORE (causes constant resets)
useEffect(() => {
  if (settings.length > 0) {
    const formData = transformSettingsToForm(settings);
    form.reset(formData as SettingsType);
  }
}, [settings, form]); // ❌ Including 'form' causes infinite re-renders
```

## Solution
Removed `form` from the dependency array in all settings components, allowing proper change detection.

```typescript
// AFTER (allows proper change detection)
useEffect(() => {
  if (settings.length > 0) {
    const formData = transformSettingsToForm(settings);
    form.reset(formData as SettingsType);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [settings]); // ✅ Only reset when settings data changes
```

## Files Fixed

All React Hook Form-based settings components:

1. ✅ `apps/web/src/components/settings/payment-settings.tsx` (line 55-61)
2. ✅ `apps/web/src/components/settings/general-settings.tsx` (line 34-40)
3. ✅ `apps/web/src/components/settings/commission-settings.tsx` (line 31-37)
4. ✅ `apps/web/src/components/settings/seo-settings.tsx` (line 32-38)
5. ✅ `apps/web/src/components/settings/notification-settings.tsx` (line 40-46)
6. ✅ `apps/web/src/components/settings/security-settings.tsx` (line 40-46)
7. ✅ `apps/web/src/components/settings/delivery-settings.tsx` (line 31-37)
8. ✅ `apps/web/src/components/settings/currency-settings.tsx` (line 48-59)

**Note:** `inventory-settings.tsx` uses a different state management pattern (not React Hook Form) and was not affected by this issue.

## How It Works Now

1. **Initial Load:** When settings data loads from the API, `form.reset()` populates the form with current values
2. **User Makes Changes:** User modifies input fields → `form.formState.isDirty` becomes `true`
3. **Button Enables:** SAVE CHANGES button becomes enabled because `!isDirty` evaluates to `false`
4. **After Save:** `form.reset()` is called with new data, resetting `isDirty` back to `false`

## Testing

To verify the fix works:

1. Navigate to Admin Settings: http://localhost:3000/admin/settings
2. Click on any settings tab (General, Payment, Currency, etc.)
3. Modify any input field
4. **Expected:** SAVE CHANGES button should immediately enable
5. Click SAVE CHANGES
6. **Expected:** Settings should save successfully, button should disable again
7. Modify field again
8. Click Reset
9. **Expected:** Form should reset to saved values, button should disable

## Related Issues Fixed

This fix also resolves:
- Forms not tracking unsaved changes
- Reset button always being enabled
- Form state not syncing properly after save
- "Unsaved changes" indicator not appearing (on general-settings)

## Date Applied
December 26, 2025
