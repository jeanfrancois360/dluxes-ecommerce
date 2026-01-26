# 🧪 Tax & Shipping Settings - Testing Guide

## Quick Test Summary
This guide will help you verify that the new tax and shipping configuration system is working correctly.

---

## ✅ Test 1: Verify Settings Are Loaded (1 min)

### Check Public Settings API:
```bash
curl http://localhost:4000/api/v1/settings/public | jq '.data[] | select(.key | contains("tax_calculation_mode") or .key == "shipping_standard_rate")'
```

**Expected Output:**
```json
{
  "key": "tax_calculation_mode",
  "value": "disabled"
}
{
  "key": "shipping_standard_rate",
  "value": 9.99
}
```

✅ **PASS** if you see the settings
❌ **FAIL** if empty or error

---

## ✅ Test 2: Test Tax Settings UI (3 min)

### Steps:
1. **Navigate to Admin Settings:**
   - Go to: http://localhost:3000/admin/settings
   - Login as admin if needed

2. **Click on "Tax" tab** (should be between Inventory and Shipping)

3. **Verify UI Elements:**
   - ✓ Tax Calculation Mode dropdown exists
   - ✓ Shows 3 options: Disabled, Simple, By State
   - ✓ Info banner explaining each mode
   - ✓ Legacy toggle at bottom (deprecated notice)

4. **Test Mode Changes:**

   **Test A: Simple Mode**
   - Change mode to "Simple (Default Rate)"
   - ✓ Default Tax Rate field appears
   - ✓ Shows decimal input (e.g., 0.10 for 10%)
   - Set rate to `0.15` (15%)
   - Click **Save**
   - ✓ Success toast appears
   - ✓ Form is no longer dirty (Save button disabled)

   **Test B: By State Mode**
   - Change mode to "By State (US Only)"
   - ✓ Info box appears explaining state rates
   - ✓ No rate input (uses hardcoded rates)
   - Click **Save**
   - ✓ Success toast appears

   **Test C: Disabled Mode**
   - Change mode to "Disabled (No Tax)"
   - ✓ No tax rate field shown
   - Click **Save**
   - ✓ Success toast appears

---

## ✅ Test 3: Test Shipping Settings UI (3 min)

### Steps:
1. **Click on "Shipping" tab** (next to Tax)

2. **Verify UI Elements:**
   - ✓ Shipping Mode dropdown exists
   - ✓ Shows: Manual, DHL API (disabled), Hybrid (disabled)
   - ✓ Info banner explaining modes
   - ✓ 4 rate input fields visible

3. **Test Rate Changes:**
   - Change "Standard Shipping Rate" to `11.99`
   - Change "Express Shipping Rate" to `24.99`
   - Change "Overnight Shipping Rate" to `34.99`
   - Change "International Surcharge" to `20.00`
   - ✓ Rate Preview box updates in real-time
   - Click **Save**
   - ✓ Success toast appears

---

## ✅ Test 4: Verify Cart Reflects Tax Settings (5 min)

### Test A: Tax Disabled
1. Set tax mode to **"Disabled"** in admin settings
2. Open browser developer console
3. Navigate to: http://localhost:3000/cart (with item in cart)
4. **Expected Results:**
   - ✓ Console shows: `[Cart] Tax mode: disabled`
   - ✓ NO tax line in Order Summary
   - ✓ Total = Subtotal + Shipping only

### Test B: Tax Simple Mode (15%)
1. Set tax mode to **"Simple"** with rate **0.15** in admin settings
2. Refresh cart page
3. **Expected Results:**
   - ✓ Console shows: `[Cart] Tax mode: simple, rate: 0.15`
   - ✓ Tax line shows: **"Tax (15%)"**
   - ✓ Tax amount = Subtotal × 0.15
   - ✓ Total = Subtotal + Shipping + Tax

### Test C: Tax By State Mode
1. Set tax mode to **"By State (US Only)"** in admin settings
2. Refresh cart page
3. **Expected Results:**
   - ✓ Console shows: `[Cart] Tax mode: by_state (calculated at checkout)`
   - ✓ Tax line shows: **"Tax (Calculated at checkout)"**
   - ✓ Tax amount = $0.00 (calculated at final checkout)

---

## ✅ Test 5: Verify Shipping Rates in Cart (3 min)

### Steps:
1. Set shipping rates in admin:
   - Standard: **$11.99**
   - Express: **$24.99**
   - Overnight: **$34.99**

2. Add item to cart and go to cart page

3. **Expected Results:**
   - ✓ Shipping cost shows **$11.99** (or €, based on currency)
   - Note: Frontend converts from USD to selected currency

---

## ✅ Test 6: Backend Order Calculation (5 min)

### Prerequisite:
Get your buyer JWT token from browser:
```javascript
// In browser console (logged in as buyer):
localStorage.getItem('token')
```

### Test Tax Calculation:
```bash
# Set your token and test
BUYER_TOKEN="your-jwt-token-here"

curl -X POST http://localhost:4000/api/v1/orders/calculate-totals \
  -H "Authorization: Bearer ${BUYER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "your-product-id",
        "quantity": 1,
        "price": 100.00
      }
    ],
    "shippingAddressId": "your-address-id",
    "shippingMethod": "standard"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "subtotal": 100.00,
  "shipping": {
    "method": "standard",
    "price": 11.99
  },
  "tax": {
    "amount": 15.00,  // If simple mode at 15%
    "rate": 0.15,
    "jurisdiction": "Default Tax Rate"  // or state name if by_state
  },
  "total": 126.99
}
```

---

## ✅ Test 7: Settings Persistence & Audit Log (2 min)

### Steps:
1. In admin settings, make a change (e.g., set tax rate to 0.20)
2. Click **Save**
3. Scroll down to **"Audit Log"** section (or check audit logs tab)
4. **Expected:**
   - ✓ See entry for `tax_default_rate` change
   - ✓ Shows old value (0.15) and new value (0.20)
   - ✓ Shows your email and timestamp

5. Refresh the settings page
6. **Expected:**
   - ✓ Tax rate still shows 0.20 (persisted)

---

## ✅ Test 8: Real Order Flow (5 min)

### Full E2E Test:
1. **Setup:**
   - Set tax mode: **Simple** at **10%** (0.10)
   - Set standard shipping: **$10.00**

2. **Create Order:**
   - Add product ($100) to cart
   - Proceed to checkout
   - Select standard shipping
   - Complete order

3. **Verify Order:**
   - Check order details
   - ✓ Subtotal: $100.00
   - ✓ Shipping: $10.00
   - ✓ Tax: $10.00 (10% of $100)
   - ✓ Total: $120.00

---

## 🐛 Troubleshooting

### Issue: Tax still shows in cart when mode is "disabled"
**Solution:**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear localStorage: `localStorage.clear()` in console
- Check console for: `[Cart] Tax mode: disabled`

### Issue: Settings not saving
**Solution:**
- Check browser console for errors
- Verify you're logged in as admin
- Check network tab for 401/403 errors

### Issue: Rates not updating in cart
**Solution:**
- Refresh cart page
- Check public settings API: `curl http://localhost:4000/api/v1/settings/public`
- Verify `tax_calculation_mode` and shipping rates are correct

### Issue: Backend returns old hardcoded values
**Solution:**
- Restart API server
- Verify settings were saved: check database or public API
- Check SettingsService is properly injected

---

## 📊 Expected Results Summary

| Test | Expected Behavior | Status |
|------|------------------|--------|
| Tax UI exists | "Tax" tab visible in admin settings | □ |
| Shipping UI exists | "Shipping" tab visible in admin settings | □ |
| Tax modes work | Can switch between disabled/simple/by_state | □ |
| Shipping rates editable | Can change all 4 rate fields | □ |
| Cart shows no tax (disabled) | Tax line hidden when mode is disabled | □ |
| Cart shows tax (simple) | Shows "Tax (X%)" with calculated amount | □ |
| Cart shows tax (by_state) | Shows "Calculated at checkout" | □ |
| Shipping rates apply | Cart uses updated shipping rates | □ |
| Settings persist | Changes survive page refresh | □ |
| Audit log works | Changes tracked in audit log | □ |
| Backend calculations | Order totals match settings | □ |

---

## 🎯 Quick Visual Test (30 seconds)

**Cart page should look like this:**

### Tax Disabled:
```
Subtotal: €391.00
Shipping: €8.46
─────────────────
Total: €399.46
```

### Tax Simple (10%):
```
Subtotal: €391.00
Shipping: €8.46
Tax (10%): €39.10
─────────────────
Total: €438.56
```

### Tax By State:
```
Subtotal: €391.00
Shipping: €8.46
Tax (Calculated at checkout): €0.00
─────────────────
Total: €399.46
```

---

## ✅ Success Criteria

All tests pass if:
- ✅ Admin can configure tax modes
- ✅ Admin can configure shipping rates
- ✅ Cart reflects tax settings immediately
- ✅ Backend uses settings for calculations
- ✅ Changes persist and are audited
- ✅ No hardcoded tax/shipping in cart

---

**Last Updated:** Jan 25, 2026
**Version:** v2.7.0
