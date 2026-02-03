# Auto-Release Escrow - Immediate Save Feature

## Date: December 26, 2025

## What Changed

The **"Auto-Release Escrow"** toggle now saves immediately when toggled, just like the **"Escrow System"** toggle.

### Before:
- ❌ Toggle "Auto-Release Escrow"
- ❌ Click "Save Changes" button
- ❌ Wait for form submission

### After:
- ✅ Toggle "Auto-Release Escrow"
- ✅ Saves automatically (no "Save Changes" button needed)
- ✅ Shows toast notification on success

---

## Files Modified

### 1. `/apps/web/src/components/settings/payment-settings.tsx`

#### Added Helper Function (line 167-171):
```typescript
// Helper to get lowercase payment category setting
const getPaymentSetting = (key: string) => {
  const setting = settings.find(s => s.key === key);
  return setting?.value;
};
```

#### Updated Form DefaultValues (line 43-51):
**Removed** `escrow_auto_release_enabled` from form defaults since it's no longer part of the form.

```typescript
const form = useForm<PaymentSettings>({
  resolver: zodResolver(paymentSettingsSchema),
  defaultValues: {
    escrow_default_hold_days: 7,
    min_payout_amount: 50,
    payout_schedule: 'weekly',
    payment_methods: ['stripe', 'paypal'],
    // ❌ escrow_auto_release_enabled: true, (REMOVED)
  },
});
```

#### Updated Form Data Filter (line 61-66):
**Removed** `escrow_auto_release_enabled` from filtered form data.

```typescript
const filteredData: Partial<PaymentSettings> = {
  escrow_default_hold_days: allFormData.escrow_default_hold_days ?? 7,
  min_payout_amount: allFormData.min_payout_amount ?? 50,
  payout_schedule: allFormData.payout_schedule ?? 'weekly',
  payment_methods: allFormData.payment_methods ?? ['stripe', 'paypal'],
  // ❌ escrow_auto_release_enabled (REMOVED)
};
```

#### Updated onSubmit Skip Logic (line 132-133):
```typescript
for (const [key, value] of updates) {
  // Skip fields that save immediately via their own toggles
  if (key === 'escrow_enabled' || key === 'escrow_auto_release_enabled') continue;

  console.log(`Updating setting: ${key} =`, value);
  await updateSetting(key, value, 'Updated via settings panel');
}
```

#### Updated Auto-Release Toggle (line 567-584):
**Before:**
```typescript
<Switch
  id="escrow_auto_release_enabled"
  checked={form.watch('escrow_auto_release_enabled')}
  onCheckedChange={(checked) => {
    form.setValue('escrow_auto_release_enabled', checked, { shouldDirty: true });
  }}
/>
```

**After:**
```typescript
<div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
  <div className="space-y-0.5">
    <Label htmlFor="escrow_auto_release_enabled">Auto-Release Escrow</Label>
    <p className="text-sm text-muted-foreground">
      Automatically release payment after hold period expires
    </p>
  </div>
  <Switch
    id="escrow_auto_release_enabled"
    checked={getPaymentSetting('escrow_auto_release_enabled') ?? true}
    onCheckedChange={async (checked) => {
      await updateSetting('escrow_auto_release_enabled', checked, 'Toggled auto-release escrow');
      await refetch();
    }}
    disabled={updating}
  />
</div>
```

**Key Changes:**
- ✅ Uses `getPaymentSetting()` instead of `form.watch()`
- ✅ Calls `updateSetting()` directly (saves to database immediately)
- ✅ Calls `refetch()` to reload settings after save
- ✅ Adds `disabled={updating}` to prevent double-clicks
- ✅ Added `bg-muted/50` background (same as Escrow System toggle)
- ✅ Removed form-related logic (setValue, shouldDirty)

---

### 2. `/apps/web/src/lib/validations/settings.ts`

#### Updated Schema (line 22):
```typescript
export const paymentSettingsSchema = z.object({
  escrow_enabled: z.boolean().optional(),
  escrow_default_hold_days: z.number().int().min(1).max(90),
  escrow_auto_release_enabled: z.boolean().optional(), // ← Changed from required to optional
  min_payout_amount: z.number().min(0),
  payout_schedule: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  payment_methods: z.array(z.string()).min(1),
});
```

**Why:** Since `escrow_auto_release_enabled` is no longer part of the form data (it saves immediately), validation should not require it.

---

## How It Works Now

### User Flow:

1. **User opens Payment Settings**
   - Auto-Release toggle reflects current database value
   - Toggle is enabled (can be clicked)

2. **User clicks the Auto-Release toggle**
   - ✅ Toggle switches immediately (visual feedback)
   - ✅ `updateSetting()` API call fires
   - ✅ Database updated with new value
   - ✅ Success toast: "Setting updated successfully"
   - ✅ Settings refetched to sync UI with database

3. **Form behavior:**
   - ✅ Toggling Auto-Release does **NOT** trigger "Unsaved changes" badge
   - ✅ Toggling Auto-Release does **NOT** enable "Save Changes" button
   - ✅ Other form fields (Hold Days, Payout Amount, etc.) still require "Save Changes"

### Consistency with Other Toggles:

| Toggle | Saves Immediately? | Form Field? | Category |
|--------|-------------------|-------------|----------|
| **Escrow System** | ✅ Yes | ❌ No | `PAYMENT` (uppercase) |
| **Auto-Release Escrow** | ✅ Yes | ❌ No | `payment` (lowercase) |
| **Stripe Enabled** | ✅ Yes | ❌ No | `payment` (Stripe section) |
| **Stripe Test Mode** | ✅ Yes | ❌ No | `payment` (Stripe section) |

All toggles now follow the same pattern: **click → save → toast → refetch**.

---

## Testing Instructions

1. **Hard refresh browser:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Go to http://localhost:3000/admin/settings
3. Click **Payment** tab
4. Find **Auto-Release Escrow** toggle

### Test Case 1: Toggle ON → OFF
- Initial state: Toggle is **ON** (blue)
- Click the toggle
- Expected:
  - ✅ Toggle switches to **OFF** (gray)
  - ✅ Toast: "Setting updated successfully"
  - ✅ No "Unsaved changes" badge appears
  - ✅ "Save Changes" button stays disabled

### Test Case 2: Toggle OFF → ON
- Initial state: Toggle is **OFF** (gray)
- Click the toggle
- Expected:
  - ✅ Toggle switches to **ON** (blue)
  - ✅ Toast: "Setting updated successfully"
  - ✅ No "Unsaved changes" badge appears
  - ✅ "Save Changes" button stays disabled

### Test Case 3: Refresh Page
- Toggle Auto-Release to **OFF**
- Wait for success toast
- Refresh page (`Cmd+R`)
- Expected:
  - ✅ Toggle is still **OFF** (persisted to database)

### Test Case 4: Combined with Form Fields
- Toggle Auto-Release to **OFF**
- Change **Escrow Hold Days** from `7` to `14`
- Expected:
  - ✅ "Unsaved changes" badge appears (for Hold Days)
  - ✅ "Save Changes" button becomes enabled
- Click "Save Changes"
- Expected:
  - ✅ Hold Days saves successfully
  - ✅ Auto-Release stays OFF (unchanged)

---

## Database Verification

The setting is stored in the `SystemSetting` table:

```sql
SELECT key, value, "valueType", category
FROM "SystemSetting"
WHERE key = 'escrow_auto_release_enabled';
```

**Expected Result:**
```
key                           | value | valueType | category
------------------------------+-------+-----------+---------
escrow_auto_release_enabled   | true  | BOOLEAN   | payment
```

When you toggle it OFF, `value` should change to `false`.

---

## Troubleshooting

### Issue: Toggle doesn't save
**Symptom:** Click toggle but it reverts immediately

**Check:**
1. Open browser console (F12)
2. Look for errors in Network tab
3. Check if API call to `/settings/escrow_auto_release_enabled` is being made

**Fix:** Backend might not be running. Check `pnpm dev:api` is active.

---

### Issue: Toggle is disabled/grayed out
**Symptom:** Can't click the toggle

**Check:**
1. Look for `disabled={updating}` in code
2. Check if `updating` state is stuck as `true`

**Fix:** Refresh the page. If persists, check console for errors.

---

### Issue: Toast doesn't appear
**Symptom:** Toggle works but no success message

**Check:**
1. `useSettingsUpdate()` hook returns `updating` state and shows toast
2. Check if sonner toast library is working for other settings

**Fix:** The toast comes from `updateSetting()` function in `use-settings.ts`.

---

## API Flow

```
User clicks toggle
    ↓
onCheckedChange fires
    ↓
updateSetting('escrow_auto_release_enabled', checked, 'Toggled auto-release escrow')
    ↓
PATCH /api/v1/settings/escrow_auto_release_enabled
    Body: { value: true/false, reason: 'Toggled auto-release escrow' }
    ↓
Backend updates database
    ↓
Backend logs to SettingsAuditLog
    ↓
API returns updated setting
    ↓
Toast: "Setting updated successfully"
    ↓
refetch() - Reload all payment settings
    ↓
UI updates with fresh data
```

---

## Benefits

1. **Consistency:** Matches behavior of Escrow System toggle
2. **Better UX:** No need to remember to click "Save Changes"
3. **Immediate feedback:** User sees result right away
4. **Audit trail:** Each toggle creates a separate audit log entry
5. **Less confusion:** Clear separation between immediate-save toggles and form fields

---

## Notes

- The toggle is styled with `bg-muted/50` to visually match the Escrow System toggle
- The `disabled={updating}` prevents rapid toggling while API call is in progress
- The `?? true` provides a default value if the setting doesn't exist in the database
- Form validation no longer checks `escrow_auto_release_enabled` since it's optional

---

*Implemented: December 26, 2025*
*Status: ✅ Ready for Testing*
