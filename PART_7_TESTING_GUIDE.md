# 🧪 Part 7 Testing Guide - Order Summary UX

**Test URL:** http://localhost:3001/checkout
**Feature:** "Calculated at next step" placeholder for shipping/tax
**Date:** January 31, 2026

---

## Pre-Test Checklist

- [✅] Dev server running on http://localhost:3001
- [ ] User logged in
- [ ] Cart has items (at least 1 product)
- [ ] Browser DevTools open (F12)

---

## Test 1: Initial Load - Placeholder Text ✨

### Objective
Verify Order Summary shows "Calculated at next step" before address is entered.

### Steps
1. **Navigate to:** http://localhost:3001/checkout
2. **Look at Order Summary** (right sidebar)

### Expected Result
```
Order Summary
─────────────────────────────────────
Subtotal     $XXX.XX
Shipping     Calculated at next step   ← Check this!
Tax          Calculated at next step   ← Check this!
─────────────────────────────────────
Total        $XXX.XX (should equal Subtotal)
```

### Checklist
- [ ] Shipping shows "Calculated at next step" (not $0.00)
- [ ] Tax shows "Calculated at next step" (not $0.00)
- [ ] Total equals Subtotal (no shipping/tax added yet)
- [ ] Text is gray/muted (class: text-neutral-400)
- [ ] Text is smaller (class: text-xs)

### If Test Fails
- Check browser console for errors
- Verify `hasShippingAddress={!!shippingAddress}` is in checkout/page.tsx line 535
- Check that `shippingAddress` is null/undefined initially

---

## Test 2: After Address Entry - Real Values ✨

### Objective
Verify Order Summary shows actual shipping/tax amounts after address is entered.

### Steps
1. **Fill in shipping address:**
   - Country: United States
   - Full Name: John Doe
   - Phone: 1234567890
   - Address: 123 Main St
   - City: New York
   - State: New York
   - ZIP Code: 10001

2. **Click:** "Continue to Shipping Method"

3. **Look at Order Summary** (should update)

### Expected Result
```
Order Summary
─────────────────────────────────────
Subtotal     $XXX.XX
Shipping     $10.00                   ← Check this! (or "Free")
Tax          $YY.YY                   ← Check this! (calculated amount)
─────────────────────────────────────
Total        $ZZZ.ZZ (Subtotal + Shipping + Tax)
```

### Checklist
- [ ] Shipping shows dollar amount (NOT "Calculated at next step")
- [ ] Tax shows dollar amount (NOT "Calculated at next step")
- [ ] Total equals Subtotal + Shipping + Tax
- [ ] Amounts are properly formatted with currency symbol

### If Test Fails
- Check that `shippingAddress` is set after form submission
- Check browser console for calculation errors
- Verify `hasShippingAddress={!!shippingAddress}` evaluates to `true`

---

## Test 3: Rwanda Address - Optional Fields ✨

### Objective
Test address submission with country that doesn't use state/postal code.

### Steps
1. **Go back to shipping step** (if needed)
2. **Fill in address:**
   - Country: 🇷🇼 Rwanda
   - Full Name: Jean Claude
   - Phone: 123456789
   - Address: Kigali Heights, KG 7 Ave
   - City: Kigali
   - ⚠️ **Notice:** No State field, No Postal Code field

3. **Click:** "Continue to Shipping Method"

### Expected Result
- [ ] Form submits successfully (no validation errors)
- [ ] Order Summary updates with shipping/tax
- [ ] No errors in browser console
- [ ] Shipping/tax appear as dollar amounts

### Checklist
- [ ] State field is hidden (not just disabled)
- [ ] Postal Code field is hidden
- [ ] Form submits with only required fields
- [ ] Order Summary updates correctly

### If Test Fails
- Check `showState: false` for Rwanda in address-countries.ts
- Check `showPostalCode: false` for Rwanda
- Check conversion function handles undefined province/postalCode
- Verify backend accepts addresses without these fields

---

## Test 4: Back Button - Resets to Placeholder ✨

### Objective
Verify going back to shipping step resets the display.

### Steps
1. **Complete address entry** (shipping/tax should show amounts)
2. **Click browser back button** OR edit address
3. **Look at Order Summary**

### Expected Result
- [ ] If back on shipping step (no address yet), shows "Calculated at next step"
- [ ] If editing existing address, may still show amounts (expected behavior)

### Notes
This behavior may vary depending on whether `shippingAddress` is cleared when going back.

---

## Test 5: Different Shipping Methods ✨

### Objective
Verify shipping amount updates when method changes.

### Steps
1. **Complete address entry**
2. **On shipping method selection:**
   - Select "Standard Shipping" → Note the shipping cost
   - Select "Express Shipping" → Shipping cost should increase
   - Select "Overnight Shipping" → Shipping cost should increase more

3. **Look at Order Summary** each time

### Expected Result
- [ ] Shipping amount updates when method changes
- [ ] Tax recalculates if needed
- [ ] Total updates correctly

---

## Test 6: Edge Cases ✨

### Test 6a: Empty Cart
1. Remove all items from cart
2. Try to access /checkout
3. **Expected:** Redirect to cart page with message

### Test 6b: Not Logged In
1. Log out
2. Try to access /checkout
3. **Expected:** Redirect to login with message

### Test 6c: Free Shipping
1. Add items worth >$200 to cart (if free shipping threshold exists)
2. Complete address entry
3. **Expected:** Shipping shows "Free" in green

---

## Visual Verification Checklist

### Before Address Entry
```css
Shipping: "Calculated at next step"
  - Color: text-neutral-400 (light gray)
  - Size: text-xs (small)
  - Font: Regular (not bold)
```

### After Address Entry
```css
Shipping: "$10.00" or "Free"
  - Color: text-black (dark) or text-green-600 (if free)
  - Font: font-medium or font-semibold (if free)
```

---

## Browser Console Checks

Open DevTools (F12) → Console tab

### Things to Check:
- [ ] No React errors
- [ ] No TypeScript errors
- [ ] No API errors when submitting address
- [ ] No conversion errors

### Expected Logs:
- Payment intent creation logs (when moving to payment step)
- Address save confirmation
- No "undefined" or "null" errors related to province/postalCode

---

## Success Criteria

✅ **Part 7 is successful if:**

1. **Initial State:**
   - [ ] Shows "Calculated at next step" for shipping
   - [ ] Shows "Calculated at next step" for tax
   - [ ] Total equals subtotal only

2. **After Address:**
   - [ ] Shows actual shipping amount
   - [ ] Shows actual tax amount
   - [ ] Total includes all three

3. **Optional Fields:**
   - [ ] Rwanda address submits without state/postal
   - [ ] US address requires state/postal
   - [ ] No errors in console

4. **UX Quality:**
   - [ ] Placeholder text is clearly visible
   - [ ] Transition is smooth (no flashing)
   - [ ] Numbers are properly formatted
   - [ ] Layout doesn't shift

---

## Test Results Template

```markdown
## Test Results - [Your Name] - [Date/Time]

### Environment
- Browser: _____________
- Screen: _____________

### Test 1: Initial Load ✅/❌
- Shipping placeholder: ___________
- Tax placeholder: ___________
- Total correct: ___________
- Issues: ___________

### Test 2: After Address Entry ✅/❌
- Shipping shows amount: ___________
- Tax shows amount: ___________
- Total correct: ___________
- Issues: ___________

### Test 3: Rwanda Address ✅/❌
- No state field: ___________
- No postal field: ___________
- Submits successfully: ___________
- Issues: ___________

### Test 4: Back Button ✅/❌
- Resets to placeholder: ___________
- Issues: ___________

### Test 5: Shipping Methods ✅/❌
- Updates correctly: ___________
- Issues: ___________

### Test 6: Edge Cases ✅/❌
- Empty cart redirect: ___________
- Login redirect: ___________
- Free shipping: ___________

### Overall Result
- [ ] ✅ ALL TESTS PASSED
- [ ] ⚠️ MINOR ISSUES
- [ ] ❌ CRITICAL BUGS

### Screenshots
- [ ] Before address entry
- [ ] After address entry
- [ ] Rwanda form
- [ ] Browser console

### Issues Found
1. ___________
2. ___________
3. ___________
```

---

## Quick Visual Test (30 seconds)

If short on time, do this quick check:

1. ✅ Open http://localhost:3001/checkout
2. ✅ Check Order Summary → Should see "Calculated at next step"
3. ✅ Fill in any address and submit
4. ✅ Check Order Summary → Should see dollar amounts

If all 4 work → **Part 7 is successful! 🎉**

---

**Ready to test!** Open http://localhost:3001/checkout and follow the steps above.
