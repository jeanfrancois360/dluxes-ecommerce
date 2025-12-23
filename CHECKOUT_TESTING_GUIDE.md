# Checkout Testing Guide

## Quick Test Scenarios

### Scenario 1: First-Time User (No Saved Addresses)
1. Add items to cart
2. Go to checkout
3. Should see: **"Enter a new address" form only** (no saved addresses)
4. Fill in address details
5. Check "Save this address as my default" ✓
6. Click "Save & Continue to Shipping"
7. **Expected**: Address saved, proceed to shipping

### Scenario 2: Returning User with Saved Addresses
1. Add items to cart
2. Go to checkout
3. Should see: **"Use a Saved Address" section**
4. Should see: List of your saved addresses
5. Default address should be marked with "Default" badge

#### Option A: Use Saved Address
1. Select a saved address (radio button)
2. **Expected**:
   - Form populates with address data
   - ✅ Green banner: "Using saved address"
   - All fields become **read-only** (grayed out)
   - "Save as default" checkbox **disappears**
3. Click "Continue to Shipping"
4. **Expected**: Uses existing address, NO duplicate created

#### Option B: Enter New Address
1. Click "Enter a new address" (radio button)
2. **Expected**:
   - Form clears to empty
   - All fields become **editable**
   - "Save as default" checkbox appears
3. Fill in new address
4. Click "Save & Continue to Shipping"
5. **Expected**: New address saved, added to saved addresses

### Scenario 3: Switching Between Options
1. Select saved address → Form populates (read-only)
2. Click "Enter a new address" → Form clears (editable)
3. Select saved address again → Form populates (read-only)
4. **Expected**: Smooth transitions, no errors

## Visual Checklist

### When Using Saved Address
- [ ] Radio button selected next to saved address
- [ ] ✅ Green banner showing "Using saved address"
- [ ] Contact Information section has "(Read-only)" label
- [ ] Shipping Address section has "(Read-only)" label
- [ ] All input fields are grayed out
- [ ] Input fields cannot be edited
- [ ] "Save as default" checkbox is hidden
- [ ] Button says "Continue to Shipping"

### When Creating New Address
- [ ] Radio button selected next to "Enter a new address"
- [ ] No green banner visible
- [ ] Contact Information section has no "(Read-only)" label
- [ ] Shipping Address section has no "(Read-only)" label
- [ ] All input fields are white/active
- [ ] Input fields can be edited
- [ ] "Save as default" checkbox is visible
- [ ] Button says "Save & Continue to Shipping"

## Database Verification

### Check Address Not Duplicated
1. Before checkout: Note number of addresses in database
   ```sql
   SELECT COUNT(*) FROM "Address" WHERE "userId" = 'your-user-id';
   ```

2. Select saved address and complete checkout

3. After checkout: Check addresses again
   ```sql
   SELECT COUNT(*) FROM "Address" WHERE "userId" = 'your-user-id';
   ```

4. **Expected**: Count should be **the same** (no increase)

### Check New Address Created
1. Before checkout: Note number of addresses
2. Enter new address and complete checkout
3. After checkout: Check addresses again
4. **Expected**: Count should **increase by 1**

## Console Logs (Development Only)

When running in development mode, you should see:

### Using Saved Address
```
✓ Using existing address: abc-123-def-456
```

### Creating New Address
```
✓ Created new address: xyz-789-ghi-012
```

## Common Issues & Solutions

### Issue: Form stays editable after selecting saved address
**Solution**: Refresh page and try again. Check browser console for errors.

### Issue: Green banner doesn't show
**Solution**: Make sure you selected a saved address (not "Enter a new address")

### Issue: Duplicate addresses being created
**Solution**:
1. Check that you're selecting the saved address (radio button)
2. Verify the green banner appears
3. Check browser console for "Using existing address" log

### Issue: Can't edit form when want to enter new address
**Solution**: Click "Enter a new address" radio button at the top

## Integration Tests

### Complete Checkout Flow
1. ✅ Add product to cart
2. ✅ Go to checkout
3. ✅ Select/Enter shipping address
4. ✅ Select shipping method
5. ✅ Enter payment details (test card: 4242 4242 4242 4242)
6. ✅ Complete payment
7. ✅ See success page with correct total
8. ✅ Verify order in database
9. ✅ Verify payment in Stripe dashboard (Uncaptured)
10. ✅ Verify NO duplicate addresses created

## Performance Test

### Measure Address Creation Rate
1. Perform 10 checkouts using the same saved address
2. Check database: Should have **1 address**, not 10
3. **Success Metric**: 90% reduction in duplicate addresses

## Accessibility Test

- [ ] Can navigate form with keyboard only
- [ ] Radio buttons have proper labels
- [ ] Form validation shows clear error messages
- [ ] Screen reader announces state changes
- [ ] Color contrast meets WCAG AA standards

## Mobile Test

- [ ] Address selector works on mobile
- [ ] Form fields are properly sized
- [ ] Buttons are touch-friendly
- [ ] Read-only state is visually clear
- [ ] No horizontal scrolling

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

All features should work identically.

## Success Criteria

✅ **All tests pass** = Checkout is fully functional and professional
- No duplicate addresses created
- Clear visual feedback
- Smooth user experience
- Database stays clean
- Fast and responsive
