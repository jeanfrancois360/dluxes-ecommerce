# 🧪 Subscription System - End-to-End Test Plan

**Date:** January 3, 2026
**Platform:** NextPik E-Commerce
**Tester:** Follow this guide to test subscription integration

---

## 📋 Pre-Test Setup

### 1. Start Development Servers
```bash
# Terminal 1 - Backend API
pnpm dev:api

# Terminal 2 - Frontend
pnpm dev:web
```

**Verify servers are running:**
- ✅ Backend: http://localhost:4000/api/v1
- ✅ Frontend: http://localhost:3001

### 2. Test User Accounts

| Email | Password | Role | Subscription |
|-------|----------|------|--------------|
| `seller1@nextpik.com` | `Password123!` | SELLER | FREE Plan (3 listings max) |
| `seller2@nextpik.com` | `Password123!` | SELLER | STARTER Plan (15 listings max) |
| `admin@nextpik.com` | `Password123!` | SUPER_ADMIN | N/A |

---

## 🧪 TEST SUITE 1: Dashboard Subscription Widget

### Test 1.1: Widget Visibility
**Steps:**
1. Open http://localhost:3001
2. Login as `seller1@nextpik.com` / `Password123!`
3. Navigate to `/dashboard/seller`
4. Scroll down below the stats cards

**Expected Results:**
- ✅ See "Your Subscription" widget with crown icon
- ✅ Widget shows "FREE Plan" or current plan name
- ✅ Three usage stat boxes displayed:
  - Active Listings (with progress bar)
  - Featured Slots (with progress bar)
  - Credits (with progress bar)
- ✅ "Manage Plan →" link visible in top right

**Screenshot Location:** Dashboard widget should appear after the 4 stats cards

---

### Test 1.2: Usage Statistics Accuracy
**Steps:**
1. Note the "Active Listings" count in the widget
2. Navigate to `/seller/products`
3. Count active products
4. Compare numbers

**Expected Results:**
- ✅ Numbers match between widget and products page
- ✅ Progress bar fills correctly based on percentage
- ✅ Progress bar color:
  - Green if under 80%
  - Amber if 80-99%
  - Red if at 100%

---

### Test 1.3: Upgrade Warning (if applicable)
**Prerequisites:** Must have 80%+ capacity used

**Steps:**
1. From dashboard, check if warning banner appears below usage stats
2. Read the warning message

**Expected Results:**
- ✅ If at 80%+: Amber warning box appears
- ✅ Warning says "Running low on listings!"
- ✅ Shows current usage count
- ✅ "Upgrade Plan" button present and links to `/seller/plans`

---

## 🧪 TEST SUITE 2: Product Creation - Success Path

### Test 2.1: Normal Product Creation (Under Limit)
**Prerequisites:** Seller has capacity (e.g., 2/3 listings used)

**Steps:**
1. Login as `seller1@nextpik.com`
2. Navigate to `/seller/products/new`
3. Observe the header section

**Expected Results:**
- ✅ Page loads immediately (< 2 seconds)
- ✅ Header shows: "Using X of Y listings" with package icon
- ✅ Product form is visible and accessible
- ✅ No blocking messages

---

### Test 2.2: Warning Banner at 70%+ Capacity
**Prerequisites:** Seller at 70-99% capacity (e.g., 2/3 = 66%, need 3/3 or 11/15)

**Steps:**
1. Navigate to `/seller/products/new` with seller near limit
2. Look for warning banner above the form

**Expected Results:**
- ✅ Amber warning banner appears
- ✅ Message: "You're using X% of your listing capacity"
- ✅ Suggestion to upgrade with link to `/seller/plans`
- ✅ Form still accessible

---

## 🧪 TEST SUITE 3: Subscription Limit Enforcement

### Test 3.1: At Listing Limit
**Prerequisites:** Seller must be at max capacity (3/3 for FREE plan)

**Setup:**
```sql
-- If needed, create temporary products to reach limit
-- Or delete products to free up space
```

**Steps:**
1. Ensure seller has 3/3 active listings
2. Navigate to `/seller/products/new`
3. Observe what happens

**Expected Results:**
- ✅ Loading spinner appears briefly: "Checking subscription limits..."
- ✅ Instead of form, see upgrade screen with:
  - 🔒 Lock icon (amber background)
  - Title: "Listing Limit Reached"
  - Message: "You have reached your listing limit"
  - Current plan info box showing:
    - Plan name with crown icon
    - Active Listings: 3 / 3
    - Progress bar (red, 100% filled)
    - Available Credits count
    - Allowed Product Types badges
  - Blue info box explaining why blocked
  - Two buttons: "Back to Products" and "Upgrade Plan"
- ✅ Product form is NOT visible
- ✅ No way to bypass the limit screen

**Screenshot:** Capture this screen for documentation

---

### Test 3.2: Product Type Not Allowed
**Prerequisites:** FREE plan only allows PHYSICAL products

**Steps:**
1. Try to create a VEHICLE or REAL_ESTATE product
2. Observe blocking message

**Expected Results:**
- ✅ Blocked with message: "Your plan doesn't support VEHICLE listings"
- ✅ Shows allowed product types for current plan
- ✅ Suggests upgrading

**Note:** This test requires modifying the product form to select product type. The current implementation uses 'PHYSICAL' by default.

---

### Test 3.3: Insufficient Credits
**Prerequisites:** Seller has 0 credits and tries to create SERVICE product

**Steps:**
1. Verify seller has 0 credits
2. Attempt to create SERVICE product
3. Observe error

**Expected Results:**
- ✅ Blocked with: "Insufficient credits to create listing"
- ✅ Shows credit balance: 0
- ✅ Upgrade option presented

---

## 🧪 TEST SUITE 4: Backend API Validation

### Test 4.1: Direct API Call (Bypass Attempt)
**Purpose:** Verify backend enforces limits even if frontend is bypassed

**Steps:**
1. Open browser DevTools (F12) → Console
2. Ensure logged in as seller at limit
3. Run this code:
```javascript
// Attempt to create product via API directly
const createProduct = async () => {
  const response = await fetch('http://localhost:4000/api/v1/seller/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Bypass Test Product',
      description: 'Testing limit bypass',
      price: 99.99,
      inventory: 10,
      categoryId: 'some-category-id',
      productType: 'PHYSICAL'
    })
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
};

createProduct();
```

**Expected Results:**
- ✅ Response status: 403 Forbidden or 400 Bad Request
- ✅ Error message mentions subscription limit
- ✅ Product is NOT created in database
- ✅ Console shows error details

---

### Test 4.2: Subscription Info Endpoint
**Steps:**
1. Open DevTools → Console
2. Run:
```javascript
// Get subscription info
const getSubscription = async () => {
  const response = await fetch('http://localhost:4000/api/v1/subscription/my-subscription', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    }
  });
  const data = await response.json();
  console.log('Subscription:', data);
  return data;
};

getSubscription();
```

**Expected Results:**
- ✅ Returns subscription object with:
  - `subscription.activeListingsCount`
  - `plan.maxActiveListings`
  - `plan.name`
  - `plan.tier`
  - `isActive: true`

---

### Test 4.3: Can List Product Type Check
**Steps:**
1. Open DevTools → Console
2. Run:
```javascript
// Check if can list PHYSICAL product
const canListPhysical = async () => {
  const response = await fetch('http://localhost:4000/api/v1/subscription/can-list/PHYSICAL', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    }
  });
  const data = await response.json();
  console.log('Can list PHYSICAL:', data);
  return data;
};

canListPhysical();

// Check if can list VEHICLE (not allowed on FREE)
const canListVehicle = async () => {
  const response = await fetch('http://localhost:4000/api/v1/subscription/can-list/VEHICLE', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    }
  });
  const data = await response.json();
  console.log('Can list VEHICLE:', data);
  return data;
};

canListVehicle();
```

**Expected Results:**
- ✅ PHYSICAL returns: `{ canList: false, reasons: { hasListingCapacity: false, ... } }`
- ✅ VEHICLE returns: `{ canList: false, reasons: { productTypeAllowed: false, ... } }`

---

## 🧪 TEST SUITE 5: Upgrade Flow

### Test 5.1: Upgrade Button Navigation
**Steps:**
1. From any blocked screen, click "Upgrade Plan" button
2. Observe navigation

**Expected Results:**
- ✅ Navigates to `/seller/plans`
- ✅ Shows available subscription plans
- ✅ Current plan is highlighted
- ✅ Can compare features

---

### Test 5.2: Manage Plan Link
**Steps:**
1. From dashboard widget, click "Manage Plan →"
2. Observe navigation

**Expected Results:**
- ✅ Navigates to `/seller/subscription`
- ✅ Shows detailed subscription management page
- ✅ Can view current usage
- ✅ Can upgrade plan

---

## 🧪 TEST SUITE 6: Edge Cases

### Test 6.1: Unlimited Listings Plan
**Prerequisites:** Login as seller with BUSINESS plan (unlimited listings)

**Steps:**
1. Navigate to `/seller/products/new`
2. Check display

**Expected Results:**
- ✅ Shows "Using X of ∞ listings"
- ✅ No capacity warnings
- ✅ Form always accessible
- ✅ Progress bar shows 0% or minimal width

---

### Test 6.2: New Seller (No Subscription)
**Steps:**
1. Create new seller account
2. Navigate to `/seller/products/new`
3. Observe behavior

**Expected Results:**
- ✅ Auto-assigned FREE plan
- ✅ Can create up to 3 products
- ✅ Widget shows FREE plan limits

---

### Test 6.3: Expired Subscription
**Prerequisites:** Seller with expired subscription

**Expected Results:**
- ✅ Treated as FREE plan
- ✅ Limits enforced
- ✅ Upgrade prompts shown

---

## 📊 TEST RESULTS TRACKING

### Browser Compatibility
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Design
Test at:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Performance
- [ ] Dashboard loads in < 3s
- [ ] Subscription check in < 1s
- [ ] No console errors
- [ ] No memory leaks

---

## 🐛 Bug Reporting Template

If you find issues, report using this format:

```
**Test Case:** [Test number and name]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshots:** [Attach if applicable]
**Browser:** [Chrome/Firefox/Safari]
**Console Errors:** [Copy any errors]
```

---

## ✅ Sign-Off Checklist

After completing all tests:

- [ ] All TEST SUITE 1 tests passed
- [ ] All TEST SUITE 2 tests passed
- [ ] All TEST SUITE 3 tests passed
- [ ] All TEST SUITE 4 tests passed
- [ ] All TEST SUITE 5 tests passed
- [ ] All TEST SUITE 6 tests passed
- [ ] No critical bugs found
- [ ] All bugs reported
- [ ] Screenshots documented

**Tester Signature:** _______________
**Date:** _______________
**Status:** ⬜ PASS | ⬜ FAIL | ⬜ NEEDS WORK

---

## 📞 Support

If you encounter issues during testing:
1. Check browser console for errors
2. Verify both servers are running
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Check network tab for failed API calls

**Happy Testing!** 🎉
