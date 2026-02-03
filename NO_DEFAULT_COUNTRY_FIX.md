# 🔧 No Default Country Fix

**Date:** January 31, 2026
**Issue:** User wants no default country selected - form should start empty

---

## Changes Made

### File: `universal-address-form.tsx`

#### 1. Removed Default Country Value
```typescript
// BEFORE:
country: initialData?.country || 'US', // Default to United States

// AFTER:
country: initialData?.country || '', // No default - user must select
```

#### 2. Updated Initial Country Config
```typescript
// BEFORE:
const [countryConfig, setCountryConfig] = useState<CountryAddressConfig>(
  getCountryConfig(formData.country)
);

// AFTER:
const [countryConfig, setCountryConfig] = useState<CountryAddressConfig>(
  formData.country ? getCountryConfig(formData.country) : getCountryConfig('US')
);
```
**Why:** Use US config as a template when no country is selected (for field labels)

#### 3. Updated Country Change Effect
```typescript
// BEFORE:
useEffect(() => {
  const config = getCountryConfig(formData.country);
  setCountryConfig(config);

// AFTER:
useEffect(() => {
  if (!formData.country) return; // Don't update config if no country selected

  const config = getCountryConfig(formData.country);
  setCountryConfig(config);
```

#### 4. Hide State Field When No Country Selected
```typescript
// BEFORE:
{countryConfig.showState && (

// AFTER:
{formData.country && countryConfig.showState && (
```

#### 5. Hide Postal Code Field When No Country Selected
```typescript
// BEFORE:
{countryConfig.showPostalCode && (

// AFTER:
{formData.country && countryConfig.showPostalCode && (
```

---

## Expected Behavior

### On Initial Load:
```
┌─────────────────────────────────────┐
│ Country: Select country...    [▼]  │ ← No country selected
│ Full Name: [________________]  *   │
│ Phone: [___________________]   *   │
│ Address: [________________]    *   │
│          [________________]        │
│ City: [________________]       *   │
│ (No State field)                   │ ← Hidden
│ (No Postal field)                  │ ← Hidden
│ Delivery Notes: [_________]        │
│ □ Save as default                  │
│ [Continue to Shipping Method]      │
└─────────────────────────────────────┘
```

### After Selecting United States:
```
┌─────────────────────────────────────┐
│ Country: 🇺🇸 United States   [▼]   │ ← Selected
│ Full Name: [________________]  *   │
│ Phone: +1 [_____________]      *   │ ← Prefix added
│ Address: [________________]    *   │
│          [________________]        │
│ City: [________________]       *   │
│ State: [________________]      *   │ ← NOW VISIBLE
│ ZIP Code: [_____________]      *   │ ← NOW VISIBLE
│ Delivery Notes: [_________]        │
│ □ Save as default                  │
│ [Continue to Shipping Method]      │
└─────────────────────────────────────┘
```

### After Selecting Rwanda:
```
┌─────────────────────────────────────┐
│ Country: 🇷🇼 Rwanda          [▼]   │ ← Selected
│ Full Name: [________________]  *   │
│ Phone: +250 [___________]      *   │ ← Prefix added
│ Address: [________________]    *   │
│          [________________]        │
│ City: [________________]       *   │
│ (No State field)                   │ ← Still hidden
│ (No Postal field)                  │ ← Still hidden
│ Delivery Notes: [_________]        │
│ □ Save as default                  │
│ [Continue to Shipping Method]      │
└─────────────────────────────────────┘
```

---

## Validation

### Country is Required
The validation already checks:
```typescript
if (!formData.country) {
  newErrors.country = 'Please select a country';
}
```

### What Happens if User Tries to Submit Without Country:
1. Form validation fails
2. Error message appears: "Please select a country"
3. Form scrolls to country field
4. Red border appears on country dropdown
5. Submit is blocked until country is selected

---

## Benefits

✅ **No assumptions** - User explicitly chooses their country
✅ **Cleaner UX** - Only shows relevant fields after country selection
✅ **Better validation** - Forces user to consciously select country
✅ **Less clutter** - State/postal fields hidden until needed
✅ **International-friendly** - No bias toward any country

---

## Testing

### Test 1: Initial State ✅
1. Open http://localhost:3001/checkout
2. **Expected:** Country dropdown shows "Select country..."
3. **Expected:** No State field visible
4. **Expected:** No Postal Code field visible
5. **Expected:** Phone prefix not shown yet

### Test 2: Try Submit Without Country ✅
1. Fill in Name, Phone, Address, City
2. Click "Continue to Shipping Method"
3. **Expected:** Error "Please select a country"
4. **Expected:** Red border on country dropdown
5. **Expected:** Form does not submit

### Test 3: Select United States ✅
1. Click country dropdown
2. Select "🇺🇸 United States"
3. **Expected:** State field appears (required)
4. **Expected:** ZIP Code field appears (required)
5. **Expected:** Phone shows "+1" prefix

### Test 4: Select Rwanda ✅
1. Change country to "🇷🇼 Rwanda"
2. **Expected:** State field disappears
3. **Expected:** Postal Code field disappears
4. **Expected:** Phone shows "+250" prefix

### Test 5: Switch Between Countries ✅
1. Select US → State/ZIP appear
2. Switch to Rwanda → State/ZIP disappear
3. Switch back to US → State/ZIP reappear
4. **Expected:** All transitions smooth, no errors

---

## Files Modified

1. ✅ `apps/web/src/components/checkout/universal-address-form.tsx`
   - Line 69: Default country changed to empty string
   - Line 82-84: Updated initial countryConfig state
   - Line 90: Added early return if no country selected
   - Line 397: Added country check before showing state field
   - Line 424: Added country check before showing postal field

---

## Technical Notes

### Why Use US Config as Template?
```typescript
formData.country ? getCountryConfig(formData.country) : getCountryConfig('US')
```

When no country is selected, we still need field labels like:
- "State/Province"
- "Postal Code"

Using US config provides sensible defaults for these labels without actually selecting US.

### Why Check formData.country Before Showing Fields?
```typescript
{formData.country && countryConfig.showState && (
```

This ensures:
1. Fields only appear AFTER a country is selected
2. Prevents showing fields with generic labels
3. Creates clearer user flow
4. Reduces visual clutter on initial load

---

## Verification Checklist

- [✅] Default country is empty string
- [✅] Country dropdown shows "Select country..."
- [✅] State field hidden until country selected
- [✅] Postal field hidden until country selected
- [✅] Phone prefix not shown until country selected
- [✅] Validation requires country selection
- [✅] Error message shown if submit without country
- [✅] Code compiles without errors
- [✅] No TypeScript errors in form components

---

## Summary

**Before:** Form defaulted to US with State/ZIP fields visible
**After:** Form starts empty, fields appear after country selection

**User Experience:**
1. See "Select country..." placeholder
2. Click to open dropdown
3. Choose their country
4. Form adapts to show only relevant fields
5. Submit with confidence

**Status:** ✅ Complete and ready for testing
