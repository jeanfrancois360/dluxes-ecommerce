# 🧪 Buyer Journey QA Testing Framework

## 📋 **Testing Strategy**

### Approach
- **Manual First**: Real-world user simulation
- **Systematic**: Step-by-step validation
- **Document Everything**: Track bugs, issues, improvements
- **Non-Breaking**: Fixes only, no feature additions during QA

### Testing Environment
```
Frontend: http://localhost:3000
Backend API: http://localhost:4000/api/v1
Database: PostgreSQL on port 5433
Test Mode: Stripe Test Keys Active
```

---

## 🎯 **Test Suite 1: Authentication & Account**

### 1.1 Registration Flow
**Route:** `/auth/register`

**Test Steps:**
1. Navigate to registration page
2. Fill in all required fields:
   - Email: `buyer.test@example.com`
   - Password: `Test@123!`
   - Confirm Password: `Test@123!`
   - Name: `Test Buyer`
3. Submit form
4. Check for validation errors (if any)
5. Verify success message
6. Check if redirected properly

**Expected Results:**
- ✓ Form validates properly (email format, password strength)
- ✓ Clear error messages for invalid inputs
- ✓ Success toast notification appears
- ✓ Redirected to dashboard or login
- ✓ User created in database

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 1.2 Login Flow
**Route:** `/auth/login`

**Test Steps:**
1. Navigate to login page
2. Enter credentials:
   - Email: `buyer.test@example.com`
   - Password: `Test@123!`
3. Submit form
4. Verify redirect to appropriate page
5. Check auth token in localStorage
6. Verify user info in state

**Expected Results:**
- ✓ Successful login with valid credentials
- ✓ Error message for invalid credentials
- ✓ Token stored in localStorage
- ✓ Redirected to intended page
- ✓ User data loaded in context

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 1.3 Password Reset
**Route:** `/auth/forgot-password`

**Test Steps:**
1. Navigate to forgot password
2. Enter email
3. Submit request
4. Check for success message
5. (Optional) Check email inbox for reset link

**Expected Results:**
- ✓ Email validation works
- ✓ Success message shown
- ✓ Reset email sent (if configured)
- ✓ Clear instructions provided

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 🛍️ **Test Suite 2: Product Discovery**

### 2.1 Homepage Load
**Route:** `/`

**Test Steps:**
1. Navigate to homepage
2. Check loading skeletons appear (if any)
3. Verify hero section loads
4. Check featured products display
5. Verify all images load
6. Test navigation links
7. Check mobile view

**Expected Results:**
- ✓ Professional loading state
- ✓ Hero section displays correctly
- ✓ Featured products load
- ✓ Images optimized and load fast
- ✓ Navigation works smoothly
- ✓ Mobile responsive

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 2.2 Product Listing
**Route:** `/products`

**Test Steps:**
1. Navigate to products page
2. Check if products load with skeleton
3. Test category filters
4. Test price range filters
5. Test sorting (price, name, date)
6. Test pagination or infinite scroll
7. Verify product cards display correctly
8. Check product images
9. Test "Add to Cart" from listing

**Expected Results:**
- ✓ Loading skeleton appears briefly
- ✓ Products load and display correctly
- ✓ Filters work without page refresh
- ✓ Sorting updates results
- ✓ Pagination/scroll works smoothly
- ✓ Images load properly
- ✓ Add to cart works from listing

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 2.3 Product Detail Page
**Route:** `/products/[slug]`

**Test Steps:**
1. Click on any product
2. Verify detail page loads
3. Check product images/gallery
4. Verify product info (price, description, specs)
5. Test quantity selector
6. Test "Add to Cart" button
7. Test "Add to Wishlist" button
8. Check reviews section (if exists)
9. Verify related products (if exists)
10. Test mobile view

**Expected Results:**
- ✓ Page loads smoothly
- ✓ All product info displays correctly
- ✓ Images load and can be viewed
- ✓ Quantity selector works
- ✓ Add to cart provides feedback
- ✓ Add to wishlist works
- ✓ Reviews display (if any)
- ✓ Mobile responsive

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 2.4 Search Functionality
**Route:** `/search` or global search

**Test Steps:**
1. Use search bar in header
2. Enter product name
3. Check search results
4. Test autocomplete (if exists)
5. Test "no results" state
6. Verify search filters work

**Expected Results:**
- ✓ Search is fast and responsive
- ✓ Results are relevant
- ✓ Autocomplete works (if implemented)
- ✓ Clear "no results" message
- ✓ Can filter search results

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 🛒 **Test Suite 3: Cart & Wishlist**

### 3.1 Add to Cart
**Multiple Routes**

**Test Steps:**
1. From product listing, click "Add to Cart"
2. From product detail, click "Add to Cart"
3. Check for optimistic update
4. Verify cart count updates in header
5. Check toast notification
6. Navigate to cart page
7. Verify item appears with correct details

**Expected Results:**
- ✓ Instant visual feedback (optimistic update)
- ✓ Cart count updates immediately
- ✓ Success toast notification
- ✓ Item appears in cart with correct:
  - Product name
  - Image
  - Price
  - Quantity
  - SKU (if applicable)

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 3.2 Cart Management
**Route:** `/cart`

**Test Steps:**
1. Navigate to cart page
2. Check loading skeleton appears
3. Verify all cart items display
4. Test quantity increase
5. Test quantity decrease
6. Test quantity input directly
7. Test remove item
8. Check cart totals update
9. Verify shipping calculation
10. Test "Continue Shopping" link
11. Test "Checkout" button
12. Refresh page and verify cart persists

**Expected Results:**
- ✓ Professional loading skeleton
- ✓ All items display correctly
- ✓ Quantity updates are instant (optimistic)
- ✓ Remove has smooth animation
- ✓ Totals calculate correctly:
  - Subtotal
  - Shipping
  - Tax
  - Total
- ✓ Cart persists after refresh
- ✓ Empty cart state shows properly

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 3.3 Wishlist Management
**Route:** `/wishlist`

**Test Steps:**
1. Add item to wishlist from product page
2. Navigate to wishlist page
3. Verify items display correctly
4. Test "Move to Cart" button
5. Test "Remove" button
6. Check empty wishlist state
7. Verify wishlist persists after refresh

**Expected Results:**
- ✓ Items add to wishlist instantly
- ✓ Wishlist page displays all items
- ✓ Move to cart works smoothly
- ✓ Remove works with animation
- ✓ Empty state is clear
- ✓ Persistence works

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 💳 **Test Suite 4: Checkout & Payment**

### 4.1 Checkout Access & Security
**Route:** `/checkout`

**Test Steps:**
1. Try accessing checkout without login
2. Try checkout with empty cart
3. Login and access checkout with items
4. Verify loading skeleton appears
5. Check checkout page loads properly

**Expected Results:**
- ✓ Redirects to login if not authenticated
- ✓ Redirects to cart if empty
- ✓ Loading skeleton displays
- ✓ Checkout loads when conditions met

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 4.2 Shipping Address
**Route:** `/checkout` (Step 1)

**Test Steps:**
1. Fill in shipping address form:
   - Full Name
   - Address Line 1
   - Address Line 2 (optional)
   - City
   - State/Province
   - Postal Code
   - Country
   - Phone
2. Submit form
3. Check validation
4. Verify progress to next step

**Expected Results:**
- ✓ Form validation works
- ✓ Required fields marked
- ✓ Error messages clear
- ✓ Success feedback shown
- ✓ Progress to shipping method

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 4.3 Shipping Method Selection
**Route:** `/checkout` (Step 2)

**Test Steps:**
1. View available shipping methods
2. Select each method
3. Verify price updates in order summary
4. Continue to payment

**Expected Results:**
- ✓ All shipping methods display
- ✓ Selection updates total
- ✓ Clear pricing shown
- ✓ Can proceed to payment

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 4.4 Stripe Payment
**Route:** `/checkout` (Step 3)

**Test Steps:**
1. Verify Stripe Elements load
2. Enter test card: `4242 4242 4242 4242`
3. Expiry: Any future date (e.g., `12/25`)
4. CVC: Any 3 digits (e.g., `123`)
5. ZIP: Any 5 digits (e.g., `12345`)
6. Submit payment
7. Check loading state
8. Verify success redirect
9. Check order confirmation

**Test Card Scenarios:**
- ✓ Success: `4242 4242 4242 4242`
- ✓ Decline: `4000 0000 0000 0002`
- ✓ Insufficient Funds: `4000 0000 0000 9995`
- ✓ 3D Secure: `4000 0027 6000 3184`

**Expected Results:**
- ✓ Stripe Elements load correctly
- ✓ Card validation works
- ✓ Loading state during processing
- ✓ Success redirects to confirmation
- ✓ Declined cards show clear error
- ✓ Order created on success
- ✓ Cart cleared after success
- ✓ Payment intent created correctly

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 4.5 Order Confirmation
**Route:** `/checkout/success?orderId=[id]`

**Test Steps:**
1. Verify redirect after payment
2. Check order details display:
   - Order number
   - Items ordered
   - Total paid
   - Shipping address
   - Estimated delivery
3. Verify "Track Order" link works
4. Check "View Order" button

**Expected Results:**
- ✓ Confirmation page loads
- ✓ All order details correct
- ✓ Order number displayed
- ✓ Links work properly
- ✓ Professional, clear layout

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 📦 **Test Suite 5: Post-Purchase**

### 5.1 Order Tracking
**Route:** `/track` and `/track/[trackingNumber]`

**Test Steps:**
1. Navigate to track order page
2. Enter order number
3. Enter email
4. Submit tracking request
5. Verify order status displays
6. Check delivery updates
7. Verify tracking timeline

**Expected Results:**
- ✓ Tracking form validates
- ✓ Order found successfully
- ✓ Status displays clearly
- ✓ Timeline shows progress
- ✓ Delivery info accurate

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 5.2 Order History
**Route:** `/account/orders`

**Test Steps:**
1. Login as buyer
2. Navigate to account orders
3. Verify all orders display
4. Check order status indicators
5. Click to view order details
6. Test filtering/sorting (if exists)

**Expected Results:**
- ✓ All orders listed
- ✓ Status accurate
- ✓ Can view details
- ✓ Filters work (if any)
- ✓ Pagination works (if needed)

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 5.3 Buyer Dashboard
**Route:** `/dashboard/buyer`

**Test Steps:**
1. Navigate to buyer dashboard
2. Check overview statistics
3. Verify recent orders
4. Check any notifications
5. Test quick actions

**Expected Results:**
- ✓ Dashboard loads quickly
- ✓ Statistics accurate
- ✓ Recent activity shown
- ✓ Quick actions work

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 🔧 **Test Suite 6: Edge Cases & Errors**

### 6.1 Network Errors
**Test Scenarios:**
1. Slow 3G simulation
2. Offline mode
3. API timeout
4. API error (500)

**Test Steps:**
1. Open DevTools → Network
2. Set throttling to "Slow 3G"
3. Try adding to cart
4. Try checkout
5. Check error handling

**Expected Results:**
- ✓ Loading states show clearly
- ✓ Timeout errors handled gracefully
- ✓ Retry options provided
- ✓ User informed of issues
- ✓ No data loss

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 6.2 Payment Failures
**Test Scenarios:**
1. Declined card
2. Insufficient funds
3. Card expired
4. Network error during payment

**Test Steps:**
1. Use test card: `4000 0000 0000 0002` (decline)
2. Complete checkout
3. Observe error handling
4. Verify can retry

**Expected Results:**
- ✓ Clear error message
- ✓ Can retry payment
- ✓ Order not created
- ✓ Cart not cleared
- ✓ User can go back

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

### 6.3 Session Expiration
**Test Steps:**
1. Login to account
2. Wait for session to expire OR manually delete token
3. Try to checkout
4. Try to view orders
5. Check redirect behavior

**Expected Results:**
- ✓ Redirect to login
- ✓ Return to intended page after login
- ✓ Clear session expired message

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 📱 **Test Suite 7: Mobile Responsiveness**

### 7.1 Mobile Layout Test
**Devices to Simulate:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- iPad Pro (1024px)

**Pages to Test:**
1. Homepage
2. Product listing
3. Product detail
4. Cart
5. Checkout
6. Account pages

**Test Steps:**
1. Open DevTools
2. Toggle device toolbar
3. Test each viewport
4. Check touch interactions
5. Verify scrolling
6. Test forms

**Expected Results:**
- ✓ All pages responsive
- ✓ Touch targets adequate (44px min)
- ✓ Text readable without zoom
- ✓ Images scale properly
- ✓ Forms easy to fill
- ✓ Navigation accessible

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 🎨 **Test Suite 8: Multi-Currency**

### 8.1 Currency Display
**Test Steps:**
1. Check default currency
2. Switch to different currency (EUR, GBP, RWF)
3. Verify prices update
4. Add to cart
5. Verify cart shows correct currency
6. Proceed to checkout
7. Verify checkout totals

**Expected Results:**
- ✓ Currency switches smoothly
- ✓ All prices update
- ✓ Cart maintains currency
- ✓ Checkout uses selected currency
- ✓ Conversion rates accurate

**Actual Results:**
```
[To be filled during testing]
Status: [ ] PASS [ ] FAIL [ ] PARTIAL
Issues Found:
Severity: [ ] Critical [ ] Major [ ] Minor [ ] None
```

---

## 📊 **Test Results Summary**

### Overall Status
```
Total Test Suites: 8
Total Test Cases: [To be counted]

Passed: [ ]
Failed: [ ]
Partial: [ ]
Blocked: [ ]

Pass Rate: [  ]%
```

### Critical Issues Found
```
1. [Issue description]
   Severity: Critical/Major/Minor
   Location: [File/Component]
   Steps to Reproduce:
   Expected vs Actual:
   
2. [Next issue...]
```

### Recommendations
```
High Priority:
- [ ] [Fix description]

Medium Priority:
- [ ] [Enhancement description]

Low Priority:
- [ ] [Nice to have]
```

---

## 🚀 **Next Steps After QA**

### Immediate Fixes Required
- [ ] [Critical bug 1]
- [ ] [Critical bug 2]

### Enhancements
- [ ] [Improvement 1]
- [ ] [Improvement 2]

### Documentation Updates
- [ ] Update README with findings
- [ ] Document known issues
- [ ] Update test credentials

---

*QA Started: [Date]
*QA Completed: [Date]
*Tested By: [Name]*
