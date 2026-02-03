# Tax Settings Persistence Debug Report

**Date:** January 26, 2026
**Issue:** User reported "Tax settings are not persisting"

---

## Investigation Summary

### 1. Database Query Results ✅

Current values in database:
```sql
key            | value      | valueType | category
tax_calculation_mode      | "simple"   | STRING    | tax
tax_default_rate          | 0.2        | NUMBER    | tax
tax_calculation_enabled   | false      | BOOLEAN   | tax
```

**Finding:** Database values ARE persisting. The `tax_calculation_mode` value is "simple" (not the default "disabled"), which means a previous save was successful.

### 2. Code Analysis ✅

**Frontend Implementation (`tax-settings.tsx`):**
- ✅ Uses correct persistence pattern
- ✅ Has `justSavedRef` to prevent race conditions
- ✅ Calls `refetch()` after save
- ✅ Uses `transformSettingsToForm()` to load values
- ✅ NO prefix handling needed (tax settings don't use prefixes)

**Backend Implementation (`settings.service.ts`):**
- ✅ Line 150: `value: newValue` - Direct assignment (Prisma handles JSON serialization)
- ✅ Comprehensive logging at lines 121-183
- ✅ Transaction-based updates with audit logging
- ✅ Proper error handling

**Database Schema:**
- ✅ `value` field is type `Json` in Prisma
- ✅ Prisma automatically serializes/deserializes JSON values
- ✅ STRING values stored as JSON strings (e.g., `"simple"` in DB = `simple` in JavaScript)

### 3. Validation Schema ✅

**Tax Settings Schema (`validations/settings.ts`):**
```typescript
export const taxSettingsSchema = z.object({
  tax_calculation_mode: z.enum(['disabled', 'simple', 'by_state']),
  tax_calculation_enabled: z.boolean(),
  tax_default_rate: z.number().min(0).max(1),
}).refine((data) => {
  if (data.tax_calculation_mode === 'simple' && data.tax_default_rate <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Default tax rate must be greater than 0 when using simple mode',
  path: ['tax_default_rate'],
});
```

**Potential Issue:** If user selects "simple" mode but leaves `tax_default_rate` at 0, the form validation will fail. However, this should show a validation error, not silently fail.

### 4. Comparison with Working Forms

**Inventory Settings (FIXED):**
- Had prefix mismatch issue (DB: `inventory.low_stock_threshold`, Form: `low_stock_threshold`)
- Fixed by stripping prefix on load, adding prefix on save

**Tax Settings:**
- NO prefix in database (e.g., `tax_calculation_mode` not `tax.tax_calculation_mode`)
- Current implementation is CORRECT

---

## Debug Logging Added

### Frontend (`tax-settings.tsx`)

**Added to `useEffect` (loading):**
```typescript
console.log('[Tax Settings] Raw settings from API:', settings);
console.log('[Tax Settings] Transformed form data:', formData);
```

**Added to `onSubmit` (saving):**
```typescript
console.log('[Tax Settings] Form submitted with data:', data);
console.log('[Tax Settings] Data entries to save:', Object.entries(data));
console.log(`[Tax Settings] Saving ${key} = ${value} (type: ${typeof value})`);
console.log(`[Tax Settings] Save result for ${key}:`, result);
console.log('[Tax Settings] Refetching settings...');
console.log('[Tax Settings] Refetch complete');
```

### Backend (`settings.controller.ts` - already exists)

Lines 312-318 already log:
```typescript
console.log('Update setting request:', {
  key,
  value: dto.value,
  user: req.user,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Backend (`settings.service.ts` - already exists)

Lines 121-183 already log comprehensive transaction details.

---

## Testing Instructions

### Step 1: Open Browser Console
1. Open the admin settings page: http://localhost:3000/admin/settings
2. Navigate to the "Tax" tab
3. Open browser DevTools (F12) → Console tab

### Step 2: Try to Save Settings
1. Change "Tax Calculation Mode" to "Simple"
2. Set "Default Tax Rate" to `0.15` (15%)
3. Click "Save Changes"

### Step 3: Check Console Output

**Expected logs (frontend):**
```
[Tax Settings] Form submitted with data: { tax_calculation_mode: "simple", ... }
[Tax Settings] Data entries to save: [["tax_calculation_mode", "simple"], ...]
[Tax Settings] Saving tax_calculation_mode = simple (type: string)
[Tax Settings] Save result for tax_calculation_mode: { success: true, data: {...} }
[Tax Settings] Saving tax_default_rate = 0.15 (type: number)
[Tax Settings] Save result for tax_default_rate: { success: true, data: {...} }
[Tax Settings] Saving tax_calculation_enabled = false (type: boolean)
[Tax Settings] Save result for tax_calculation_enabled: { success: true, data: {...} }
[Tax Settings] Refetching settings...
[Tax Settings] Raw settings from API: [...]
[Tax Settings] Transformed form data: {...}
[Tax Settings] Refetch complete
```

**Expected logs (backend - check terminal where API is running):**
```
Update setting request: { key: 'tax_calculation_mode', value: 'simple', user: {...} }
Attempting to update setting: tax_calculation_mode
New value: "simple"
Changed by: admin@example.com (user_id)
Old value: "disabled"
Starting transaction for tax_calculation_mode
Setting tax_calculation_mode updated in transaction
Audit log created for tax_calculation_mode
Transaction committed successfully for tax_calculation_mode
Setting updated: tax_calculation_mode by admin@example.com
```

### Step 4: Verify Persistence
1. Refresh the page (F5)
2. Check if the Tax tab still shows the values you saved

---

## Possible Issues to Investigate

### Issue 1: Validation Failure (Silent)
**Symptom:** Form submits but values don't save
**Cause:** Zod validation fails but error not shown
**Check:** Look for validation errors in console

### Issue 2: API Error (Silent)
**Symptom:** Form submits but values don't save
**Cause:** API returns error but error toast not shown
**Check:** Look for error logs in backend terminal

### Issue 3: Form State Not Updating
**Symptom:** Values save but form doesn't show updated values
**Cause:** `refetch()` not working or form not resetting
**Check:** Look for "Refetch complete" log in console

### Issue 4: Browser Cache
**Symptom:** Values save but old values still shown
**Cause:** Browser caching API responses
**Check:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue 5: Multiple Save Toasts
**Symptom:** See 4 success toasts instead of 1
**Cause:** Both hook and component show toasts
**Check:** Look for duplicate "Setting updated successfully" toasts
**Note:** This is cosmetic, doesn't affect persistence

---

## Next Steps

1. **User Tests:** User should follow testing instructions and report what they see in console
2. **Analyze Logs:** Based on console output, identify where the flow breaks
3. **Fix Root Cause:** Apply targeted fix based on findings

---

## Additional Notes

- The backend already has extensive logging (lines 121-183 in settings.service.ts)
- The settings API requires ADMIN or SUPER_ADMIN role
- All settings changes are audit-logged with user ID, email, IP, and timestamp
- The `value` field is JSON type in Prisma, so Prisma handles serialization automatically

---

**Status:** ⏳ Awaiting user testing to identify specific failure point
**Debug Logging:** ✅ Added comprehensive frontend logging
**Type Check:** ✅ Passed
**Ready for Testing:** ✅ Yes
