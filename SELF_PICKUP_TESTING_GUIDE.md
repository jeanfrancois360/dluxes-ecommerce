# Self-Pickup Feature - End-to-End Testing Guide

**Version:** v2.10.0
**Date:** March 21, 2026
**Status:** Ready for Testing

---

## 📋 Testing Checklist

### ✅ Backend API Testing

#### 1. Seller Pickup Settings Endpoints

**GET /api/v1/seller/pickup-settings**

```bash
# Test: Get seller's pickup settings
curl -X GET http://localhost:4000/api/v1/seller/pickup-settings \
  -H "Authorization: Bearer {SELLER_TOKEN}"

# Expected: 200 OK with pickup settings
# {
#   "pickupEnabled": false,
#   "storeName": "Store Name",
#   ...
# }
```

**POST /api/v1/seller/pickup-settings**

```bash
# Test: Enable pickup and configure settings
curl -X POST http://localhost:4000/api/v1/seller/pickup-settings \
  -H "Authorization: Bearer {SELLER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupEnabled": true,
    "pickupAddress": "123 Main St, City, State 12345",
    "pickupInstructions": "Enter through main entrance",
    "pickupHours": {
      "monday": "9:00 AM - 5:00 PM",
      "tuesday": "9:00 AM - 5:00 PM"
    },
    "pickupEstimatedMinutes": 30,
    "pickupFee": 0
  }'

# Expected: 200 OK with updated settings
```

**PATCH /api/v1/seller/pickup-settings/toggle**

```bash
# Test: Toggle pickup on/off
curl -X PATCH http://localhost:4000/api/v1/seller/pickup-settings/toggle \
  -H "Authorization: Bearer {SELLER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "enabled": true }'

# Expected: 200 OK
```

#### 2. Available Pickup Stores Endpoint

**POST /api/v1/orders/available-pickup-stores**

```bash
# Test: Get stores with pickup enabled for specific products
curl -X POST http://localhost:4000/api/v1/orders/available-pickup-stores \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["product-id-1", "product-id-2"]
  }'

# Expected: 200 OK with array of stores
# [{
#   "id": "store-id",
#   "name": "Store Name",
#   "pickupAddress": "...",
#   "pickupEnabled": true,
#   ...
# }]
```

#### 3. Order Creation with Pickup

**POST /api/v1/orders**

```bash
# Test: Create pickup order
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "productId": "product-id", "quantity": 1 }],
    "isPickup": true,
    "pickupStoreId": "store-id",
    "paymentMethodId": "pm_xxx"
  }'

# Expected: 201 Created
# Response should include:
# - pickupCode: 6-digit code
# - isPickup: true
# - pickupStoreId
# - shipping: 0
```

#### 4. Seller Order Management Endpoints

**PATCH /api/v1/seller/orders/:id/mark-ready-pickup**

```bash
# Test: Mark order as ready for pickup
curl -X PATCH http://localhost:4000/api/v1/seller/orders/{ORDER_ID}/mark-ready-pickup \
  -H "Authorization: Bearer {SELLER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Order is ready at front desk" }'

# Expected: 200 OK
# Order status → READY_FOR_PICKUP
```

**POST /api/v1/seller/orders/:id/confirm-pickup**

```bash
# Test: Confirm customer picked up order
curl -X POST http://localhost:4000/api/v1/seller/orders/{ORDER_ID}/confirm-pickup \
  -H "Authorization: Bearer {SELLER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupCode": "123456",
    "notes": "Verified ID and code"
  }'

# Expected: 200 OK
# Order status → PICKED_UP
# pickupCompletedAt → current timestamp
```

---

### 🎨 Frontend UI Testing

#### 1. Seller Pickup Settings Page (`/seller/pickup-settings`)

**Test Steps:**

1. ✅ Navigate to `/seller/pickup-settings`
2. ✅ Verify form loads with current settings
3. ✅ Toggle "Enable Self-Pickup" switch
4. ✅ Fill in pickup address, instructions, hours
5. ✅ Set estimated pickup time
6. ✅ Click "Save Settings"
7. ✅ Verify success toast appears
8. ✅ Refresh page - settings should persist

**Expected Results:**

- Form displays current settings
- Validation prevents saving empty required fields
- Success message on save
- Settings persist after refresh

#### 2. Checkout Flow (`/checkout`)

**Test Steps:**

1. ✅ Add product to cart (from seller with pickup enabled)
2. ✅ Navigate to `/checkout`
3. ✅ **Delivery Type Selection:**
   - Verify "Ship to Address" and "Self-Pickup" options shown
   - Pickup shows "FREE" badge
   - Select "Self-Pickup"
   - Click Continue
4. ✅ **Pickup Store Selection:**
   - Verify available stores list displays
   - Check store details (address, phone, hours)
   - Select a store
   - Click "Continue to Payment"
5. ✅ **Payment Step:**
   - Verify NO shipping method selector shown
   - Verify "Self-Pickup Selected" banner displays
   - Verify shipping cost = $0
   - Complete payment
6. ✅ **Order Confirmation:**
   - Verify order created successfully
   - Check pickup code is generated

**Expected Results:**

- Delivery type selector shows both options
- Store selector shows only stores with pickup enabled
- No shipping charges applied
- Order creates with pickup fields populated

#### 3. Customer Order Tracking (`/account/orders`)

**Test Steps:**

1. ✅ Navigate to `/account/orders`
2. ✅ Verify pickup orders show "Self-Pickup" badge
3. ✅ Verify pickup code displayed on order card
4. ✅ Click on pickup order
5. ✅ **Order Details Page:**
   - Verify PickupTrackingCard displays
   - Check pickup code is large and copyable
   - Verify status banner color matches order status
   - Check store information complete
   - Test "Get Directions" link
   - Verify pickup instructions shown
   - Check pickup hours expandable
6. ✅ **Copy Pickup Code:**
   - Click copy button
   - Verify toast success message
   - Paste to verify code copied correctly

**Expected Results:**

- Pickup orders clearly distinguished from shipped orders
- Pickup code easily visible and copyable
- Store location with Google Maps link
- All pickup details displayed correctly

#### 4. Seller Order Management (`/seller/orders/[id]`)

**Test Steps:**

1. ✅ Navigate to seller order details for pickup order
2. ✅ **Verify Pickup Information Card:**
   - Pickup code displayed
   - Status badge shown
   - Store name and address
   - Pickup instructions
   - Customer details
3. ✅ **Verify Pickup Actions Card:**
   - For PENDING/PROCESSING: "Mark Ready for Pickup" button
   - Click button → Status changes to READY_FOR_PICKUP
4. ✅ **Confirm Pickup:**
   - Click "Confirm Customer Pickup"
   - Modal opens with code input
   - Enter incorrect code → Error message
   - Enter correct code → Success
   - Order status → PICKED_UP
5. ✅ **Verify Email Notifications:**
   - Customer receives "Ready for Pickup" email
   - Customer receives "Pickup Confirmed" email

**Expected Results:**

- Seller can easily manage pickup orders
- Pickup code verification prevents unauthorized pickups
- Status updates correctly
- Email notifications sent

---

### 🔗 Integration Testing

#### 1. Multi-Vendor Scenario

**Test Steps:**

1. ✅ Add items from 2 sellers to cart
   - Seller A: Pickup enabled
   - Seller B: Pickup disabled
2. ✅ Go to checkout
3. ✅ Verify delivery type selector behavior
4. ✅ If shipping selected: Both items ship
5. ✅ If pickup selected: Verify behavior (should this be allowed?)

**Expected:**

- System handles mixed cart appropriately
- Clear messaging if pickup not available for all items

#### 2. Payment Integration

**Test Steps:**

1. ✅ Create pickup order with Stripe
2. ✅ Verify payment intent created with correct amount
3. ✅ Verify shipping = $0 in payment
4. ✅ Complete payment
5. ✅ Verify order status updates

**Expected:**

- Payment processes correctly
- No shipping charges
- Order creates with all pickup fields

#### 3. Tax Calculation

**Test Steps:**

1. ✅ Create pickup order
2. ✅ Verify tax calculated based on store address (not shipping address)
3. ✅ Check order totals

**Expected:**

- Tax calculated correctly for pickup orders
- Store address used for tax jurisdiction

---

### 🔄 Full User Flow Test

#### Customer Flow (End-to-End)

**Scenario:** Customer orders item for self-pickup

1. **Browse & Add to Cart**
   - ✅ Find product from seller with pickup enabled
   - ✅ Add to cart
   - ✅ View cart

2. **Checkout**
   - ✅ Go to checkout
   - ✅ Select "Self-Pickup"
   - ✅ Choose pickup store
   - ✅ Proceed to payment
   - ✅ Complete payment

3. **Order Confirmation**
   - ✅ Receive order confirmation email
   - ✅ Email contains pickup code
   - ✅ Email contains store address

4. **Track Order**
   - ✅ Go to `/account/orders`
   - ✅ View pickup order
   - ✅ Copy pickup code
   - ✅ Get directions to store

5. **Pickup Notification**
   - ✅ Seller marks order ready
   - ✅ Receive "Ready for Pickup" email
   - ✅ Email shows pickup code and store info

6. **Store Pickup**
   - ✅ Go to store with pickup code
   - ✅ Seller verifies code
   - ✅ Seller confirms pickup in system
   - ✅ Receive "Pickup Confirmed" email

**Success Criteria:**

- ✅ All steps complete without errors
- ✅ All emails received
- ✅ Pickup code works correctly
- ✅ Order status updates properly

#### Seller Flow (End-to-End)

**Scenario:** Seller receives and fulfills pickup order

1. **Setup Pickup**
   - ✅ Navigate to `/seller/pickup-settings`
   - ✅ Enable pickup
   - ✅ Configure address, hours, instructions
   - ✅ Save settings

2. **Receive Order**
   - ✅ Customer places pickup order
   - ✅ Seller receives order notification
   - ✅ Seller views order in `/seller/orders`

3. **Prepare Order**
   - ✅ Seller prepares items
   - ✅ Goes to order details
   - ✅ Clicks "Mark Ready for Pickup"
   - ✅ Customer receives email notification

4. **Customer Arrives**
   - ✅ Customer shows pickup code
   - ✅ Seller opens order details
   - ✅ Clicks "Confirm Customer Pickup"
   - ✅ Enters pickup code in modal
   - ✅ Code validates successfully
   - ✅ Order marked as PICKED_UP

5. **Completion**
   - ✅ Customer receives confirmation email
   - ✅ Order appears as completed
   - ✅ Seller can see pickup completion timestamp

**Success Criteria:**

- ✅ All steps complete smoothly
- ✅ Clear UI guidance at each step
- ✅ No errors or confusion

---

### 🐛 Error Handling Tests

#### Invalid Scenarios

1. **Invalid Pickup Code**
   - ✅ Enter wrong code in confirm modal
   - Expected: Error message displayed
   - ✅ Code validation prevents wrong code submission

2. **No Pickup Stores Available**
   - ✅ Cart has items from sellers without pickup
   - ✅ Try to select pickup at checkout
   - Expected: "No pickup locations available" message

3. **Pickup Settings Not Configured**
   - ✅ Seller hasn't set up pickup
   - ✅ Customer tries to select their store
   - Expected: Store not shown in available stores

4. **Expired Pickup**
   - ✅ Order status = PICKUP_EXPIRED
   - Expected: Red error banner shown
   - Expected: Contact store message

---

### 📱 Cross-Browser Testing

Test on:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

**Verify:**

- Responsive design works
- Modals display correctly
- Copy-to-clipboard works
- Google Maps links work

---

### ⚡ Performance Testing

1. **Load Time**
   - ✅ Pickup settings page loads < 2s
   - ✅ Store selector loads < 1s
   - ✅ Order details with pickup card < 2s

2. **API Response Time**
   - ✅ Get available stores < 500ms
   - ✅ Mark ready for pickup < 300ms
   - ✅ Confirm pickup < 300ms

---

### 🔒 Security Testing

1. **Authorization**
   - ✅ Only seller can access their pickup settings
   - ✅ Only seller can confirm pickups for their orders
   - ✅ Pickup code validation prevents unauthorized access

2. **Input Validation**
   - ✅ 6-digit code format enforced
   - ✅ Required fields validated
   - ✅ SQL injection prevention

---

## 📝 Test Results Template

```markdown
## Test Session: [Date]

**Tester:** [Name]
**Environment:** [Local/Staging/Production]

### Backend API Tests

- [ ] Seller pickup settings endpoints - PASS/FAIL
- [ ] Available pickup stores - PASS/FAIL
- [ ] Order creation with pickup - PASS/FAIL
- [ ] Mark ready for pickup - PASS/FAIL
- [ ] Confirm pickup - PASS/FAIL

### Frontend UI Tests

- [ ] Seller pickup settings page - PASS/FAIL
- [ ] Checkout delivery type selection - PASS/FAIL
- [ ] Checkout store selection - PASS/FAIL
- [ ] Customer order tracking - PASS/FAIL
- [ ] Seller order management - PASS/FAIL

### Full Flow Tests

- [ ] Customer end-to-end - PASS/FAIL
- [ ] Seller end-to-end - PASS/FAIL

### Issues Found

1. [Issue description]
2. [Issue description]

### Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for production
```

---

## 🚀 Production Deployment Checklist

Before deploying to production:

1. **Database Migration**
   - ✅ Run `20260312084142_add_seller_gelato_settings` migration
   - ✅ Verify tables exist: SellerGelatoSettings, gelato_pod_orders, gelato_webhook_events
   - ✅ Verify enum: GelatoPodStatus

2. **Environment Variables**
   - ✅ Backend API deployed with latest code
   - ✅ Frontend deployed with latest code
   - ✅ All pickup endpoints accessible

3. **Email Templates**
   - ✅ "Ready for Pickup" email template configured
   - ✅ "Pickup Confirmed" email template configured
   - ✅ Test emails sending correctly

4. **Monitoring**
   - ✅ Error tracking enabled
   - ✅ API monitoring active
   - ✅ Email delivery monitoring

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Pickup stores not showing at checkout
**Solution:** Verify seller has enabled pickup in settings

**Issue:** Pickup code validation fails
**Solution:** Check code is exactly 6 digits, matches expected code

**Issue:** Email notifications not sent
**Solution:** Verify email service configured, check logs

**Issue:** Google Maps link not working
**Solution:** Verify store address is complete and formatted correctly

---

## ✅ Sign-off

**Feature:** Self-Pickup (v2.10.0)
**Status:** ⏳ Testing in Progress
**Sign-off Date:** ******\_******
**Approved By:** ******\_******

**Notes:**

---

---

---
