# ⚡ Quick Test Checklist - Parts 6 & 7

**URL:** http://localhost:3001/checkout
**Time:** ~2 minutes
**Status:** Ready to test! 🚀

---

## Quick Test (2 minutes)

### Step 1: Initial Load ✨
1. Open: http://localhost:3001/checkout
2. Look at **Order Summary** (right sidebar)

**Expected:**
```
Shipping: Calculated at next step   ← Should see this!
Tax:      Calculated at next step   ← Should see this!
```

✅ **PASS** if you see "Calculated at next step" (not $0.00)
❌ **FAIL** if you see $0.00 or errors

---

### Step 2: Enter Address ✨
1. **Fill in the form:**
   - Country: United States
   - Full Name: John Doe
   - Phone: 1234567890
   - Address: 123 Main St
   - City: New York
   - State: New York
   - ZIP: 10001

2. **Click:** "Continue to Shipping Method"

3. **Look at Order Summary**

**Expected:**
```
Shipping: $10.00         ← Should see dollar amount!
Tax:      $XX.XX         ← Should see dollar amount!
```

✅ **PASS** if you see dollar amounts (not "Calculated at next step")
❌ **FAIL** if still shows placeholder text

---

### Step 3: Test Rwanda (Optional Fields) ✨
1. **Go back** to shipping step
2. **Change country** to 🇷🇼 Rwanda
3. **Notice:**
   - State field disappears ✅
   - Postal Code field disappears ✅
4. **Fill in:**
   - Full Name: Jean Claude
   - Phone: 123456789
   - Address: Kigali Heights
   - City: Kigali
5. **Submit**

**Expected:**
- Form submits successfully
- No errors about missing state/postal
- Shipping/tax show amounts

✅ **PASS** if submits without state/postal code
❌ **FAIL** if validation errors or crashes

---

## What to Look For

### ✅ Success Indicators:
- "Calculated at next step" shows initially
- Text is gray and small
- Dollar amounts appear after address entry
- Rwanda address submits without state/postal
- No console errors

### ❌ Failure Indicators:
- Shows $0.00 instead of placeholder
- Placeholder doesn't disappear after address
- Console errors about hasShippingAddress
- Rwanda address requires state/postal
- App crashes or freezes

---

## If Tests Pass:
🎉 **Parts 6 & 7 are complete and working!**

## If Tests Fail:
1. Check browser console (F12)
2. Take screenshot
3. Note which step failed
4. Report the issue

---

## Browser Console Check

Press **F12** → **Console tab**

Should see:
- No errors
- Payment intent logs (normal)
- Address save confirmations

Should NOT see:
- "hasShippingAddress is undefined"
- "Cannot read property of undefined"
- Any red errors related to OrderSummary

---

## Visual Reference

### Before Address (Step 1):
```
┌─────────────────────────────┐
│ Order Summary               │
├─────────────────────────────┤
│ Subtotal         $150.00    │
│ Shipping         Calculated │  ← Gray, small text
│                  at next    │
│                  step       │
│ Tax              Calculated │  ← Gray, small text
│                  at next    │
│                  step       │
├─────────────────────────────┤
│ Total            $150.00    │
└─────────────────────────────┘
```

### After Address (Step 2):
```
┌─────────────────────────────┐
│ Order Summary               │
├─────────────────────────────┤
│ Subtotal         $150.00    │
│ Shipping         $10.00     │  ← Black, normal text
│ Tax              $31.50     │  ← Black, normal text
├─────────────────────────────┤
│ Total            $191.50    │
└─────────────────────────────┘
```

---

**Time to test:** ~2 minutes
**Difficulty:** Easy
**Server:** http://localhost:3001/checkout

**Ready? Go! 🚀**
