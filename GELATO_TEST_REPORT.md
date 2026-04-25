# 🧪 Gelato POD Integration - Complete Test Report

**Date:** February 22, 2026
**Version:** 2.8.0
**Tester:** Follow this checklist to verify all functionality

---

## ✅ **Pre-Test Verification**

### Backend Status

- ✅ **Backend Running:** Yes (Port 4000)
- ✅ **Frontend Running:** Yes (Port 3000)
- ✅ **Gelato Store ID Configured:** `35a64f7c-d936-4b25-b6f3-bb2bbf994fd5`
- ✅ **Health Check:** Passing

### Configuration Check

```env
GELATO_API_KEY=dc0d0b41-d257-420f-a273-f2ed812e69b6-...
GELATO_STORE_ID=35a64f7c-d936-4b25-b6f3-bb2bbf994fd5 ✅
GELATO_WEBHOOK_SECRET=8a2e38e3b936cad3e0e97497e95352c7...
GELATO_API_URL=https://api.gelato.com/v4
```

---

## 🔧 **Test 1: ADMIN PORTAL - Product Creation with POD**

### Test URL: `http://localhost:3000/admin/products/new`

**Login as:** Admin user

### Step 1: Access Product Form

- [ ] Navigate to `/admin/products/new`
- [ ] Page loads without errors
- [ ] All form sections visible

### Step 2: Fill Basic Product Info

- [ ] Enter product name: "Test POD T-Shirt"
- [ ] Slug auto-generates: "test-pod-t-shirt"
- [ ] Add description
- [ ] Upload at least 1 image
- [ ] Set price: $30.00
- [ ] Set inventory: 100
- [ ] Select category
- [ ] Status: ACTIVE

### Step 3: POD Configuration Section (NEW PRODUCT)

**Expected Behavior:**

```
┌─────────────────────────────────────────┐
│  🖨️  Print-on-Demand with Gelato       │
│                                          │
│  Create custom products (t-shirts,      │
│  mugs, posters, etc.) that are          │
│  printed and shipped by Gelato when     │
│  customers order.                        │
│                                          │
│  ℹ️  To enable POD: Save this product   │
│     first with basic details, then      │
│     return to configure Gelato settings.│
└─────────────────────────────────────────┘
```

**Checklist:**

- [ ] POD section shows blue banner with helpful message
- [ ] Message explains need to save first
- [ ] No errors displayed
- [ ] Save button works

### Step 4: Save Product & Return to Edit

- [ ] Click "Create Product"
- [ ] Product saves successfully
- [ ] Redirected to products list or edit page
- [ ] Navigate back to edit: `/admin/products/[id]/edit`

### Step 5: POD Configuration (EXISTING PRODUCT)

**Expected Behavior:**

```
┌─────────────────────────────────────────┐
│  Print-on-Demand (POD)                  │
│                                          │
│  ℹ️  Platform-managed fulfillment: POD  │
│     products use the platform's Gelato  │
│     account for seamless order          │
│     processing and global shipping.     │
├─────────────────────────────────────────┤
│  Fulfillment Type:                       │
│  [ Self-Fulfilled ] [ Gelato POD ]      │
└─────────────────────────────────────────┘
```

**Checklist:**

- [ ] POD section shows platform notice (blue banner)
- [ ] Fulfillment Type toggle visible
- [ ] Default: "Self-Fulfilled" selected
- [ ] Click "Gelato POD" button

### Step 6: Select Gelato Product

**When "Gelato POD" is selected:**

```
┌─────────────────────────────────────────┐
│  Gelato Product *                        │
│  ┌───────────────────────────────────┐  │
│  │ Search Gelato product catalog... ▼│  │
│  └───────────────────────────────────┘  │
│  Select the base product from Gelato's  │
│  catalog (e.g. unisex t-shirt, mug)     │
└─────────────────────────────────────────┘
```

**Test Cases:**

#### ✅ **Success Case (Gelato Configured):**

- [ ] Click on dropdown
- [ ] Search box appears
- [ ] Type "shirt"
- [ ] Products load from Gelato catalog
- [ ] Products show images and names
- [ ] Can select a product
- [ ] Selected product shows in field
- [ ] Product UID appears below dropdown

#### ❌ **Error Case (Gelato Not Configured):**

- [ ] Click on dropdown
- [ ] Shows amber warning box:
  ```
  ⚠️ Gelato Not Configured
     Configure your Gelato Store ID in the
     backend .env file to use Print-on-Demand.
  ```
- [ ] No console errors (graceful degradation)

### Step 7: Upload Design File

- [ ] Design File uploader visible
- [ ] Can click to upload
- [ ] Accepts image files (PNG, JPG)
- [ ] Shows preview after upload
- [ ] File URL saved

### Step 8: Additional POD Settings

- [ ] Markup Percentage field visible
- [ ] Can enter percentage (e.g., 30%)
- [ ] Shipping Method dropdown visible
- [ ] Options: Standard, Express, Overnight, Economy
- [ ] Info banners display correctly

### Step 9: Save POD Product

- [ ] Click "Update Product"
- [ ] Product saves successfully
- [ ] fulfillmentType: GELATO_POD
- [ ] gelatoProductUid saved
- [ ] designFileUrl saved
- [ ] No errors in console

---

## 👤 **Test 2: SELLER PORTAL - Product Creation with POD**

### Test URL: `http://localhost:3000/seller/products/new`

**Login as:** Seller user

### Step 1: Check Listing Limits

- [ ] Page shows listing usage: "Using X of Y listings"
- [ ] If at limit, shows upgrade message
- [ ] If within limit, form displays

### Step 2: Fill Basic Product Info

- [ ] Enter product name: "Seller POD Mug"
- [ ] Set price: $25.00
- [ ] Set inventory: 50
- [ ] Add images
- [ ] Select category
- [ ] Save product

### Step 3: POD Section (NEW PRODUCT)

**Expected Behavior:**

```
┌─────────────────────────────────────────┐
│  Print-on-Demand (Gelato)               │
├─────────────────────────────────────────┤
│       ⓘ                                 │
│                                          │
│  Want to use Print-on-Demand?           │
│                                          │
│  Save your product first, then come     │
│  back to configure Gelato POD settings. │
└─────────────────────────────────────────┘
```

**Checklist:**

- [ ] Shows amber dashed border notice
- [ ] Icon displays
- [ ] Message is friendly and helpful
- [ ] No errors

### Step 4: Return to Edit Mode

- [ ] Save product
- [ ] Return to edit page
- [ ] POD section now shows full configuration

### Step 5: POD Configuration (SELLER)

**Checklist:**

- [ ] Platform notice displays (same as admin)
- [ ] Fulfillment Type toggle works
- [ ] Gelato product selector works
- [ ] Design uploader works
- [ ] Same functionality as admin
- [ ] Seller can create POD products ✅

### Step 6: Seller-Specific Checks

- [ ] Platform notice clearly states "platform's Gelato account"
- [ ] No option to connect own Gelato account (as designed)
- [ ] All POD features accessible to sellers
- [ ] No permission errors

---

## 🛒 **Test 3: BUYER/CUSTOMER - Product Viewing & Purchase**

### Test URL: `http://localhost:3000`

**Test as:** Customer (buyer account or guest)

### Step 1: Browse Products

- [ ] Navigate to product listing page
- [ ] POD products display normally
- [ ] Images show correctly
- [ ] Prices display
- [ ] No indication of fulfillment type (customer doesn't need to know)

### Step 2: View POD Product Details

- [ ] Click on POD product
- [ ] Product detail page loads
- [ ] All info displays (name, price, description)
- [ ] Images carousel works
- [ ] Add to cart button visible
- [ ] No "POD" or "Gelato" visible to customer ✅

### Step 3: Add to Cart

- [ ] Click "Add to Cart"
- [ ] Product added successfully
- [ ] Cart updates
- [ ] Can view cart
- [ ] Product appears in cart

### Step 4: Checkout Flow (DON'T COMPLETE)

- [ ] Proceed to checkout
- [ ] Shipping form appears
- [ ] Can enter shipping address
- [ ] Shipping rates calculate
- [ ] Payment form appears
- [ ] **STOP HERE** (don't complete payment)

**Note:** POD products process the same as regular products from the customer's perspective. The only difference is backend fulfillment.

---

## 🔍 **Test 4: Database Verification**

### Check Product Records

**Open Prisma Studio:**

```bash
pnpm prisma:studio
```

**Verify in `products` table:**

- [ ] POD product exists
- [ ] fulfillmentType = "GELATO_POD"
- [ ] gelatoProductUid is set
- [ ] designFileUrl is set
- [ ] baseCost populated (if available)

**Check Relations:**

- [ ] Product links to store correctly
- [ ] Product has images
- [ ] All fields saved properly

---

## 🌐 **Test 5: API Endpoints**

### Test with Authentication

**You'll need a valid JWT token for these tests.**

### Gelato Catalog

```bash
# Get auth token from browser dev tools → Application → Cookies → nextpik_token
TOKEN="your_jwt_token_here"

# Test catalog endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/gelato/catalog/products?limit=10
```

**Expected Response:**

```json
{
  "products": [
    {
      "uid": "unisex-staple-t-shirt_11",
      "title": "Unisex Staple T-Shirt",
      "description": "...",
      "previewUrl": "https://...",
      "categories": ["apparel"]
    }
  ],
  "total": 150
}
```

### Gelato Status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/gelato/status
```

**Expected Response:**

```json
{
  "enabled": true,
  "configured": true,
  "storeId": "35a64f7c-d936-4b25-b6f3-bb2bbf994fd5",
  "apiUrl": "https://api.gelato.com/v4"
}
```

---

## 🚨 **Test 6: Error Handling**

### Test Graceful Degradation

**Scenario 1: Gelato API Down**

- [ ] Gelato API temporarily unavailable
- [ ] Error message shows in dropdown
- [ ] Form still functional
- [ ] Can save product without POD
- [ ] No crash or blank screen

**Scenario 2: Invalid Product Selection**

- [ ] Try to save POD product without selecting Gelato product
- [ ] Validation error shows
- [ ] Clear error message
- [ ] Form doesn't submit

**Scenario 3: Missing Design File**

- [ ] Select Gelato POD fulfillment
- [ ] Select product but don't upload design
- [ ] Can still save (design optional at creation)
- [ ] Warning message (optional)

---

## 📊 **Test Results Summary**

### ✅ **What Should Work:**

1. **Admin:**
   - Create products with POD configuration
   - Edit existing products to enable POD
   - Select Gelato products from catalog
   - Upload design files
   - Set markup and shipping

2. **Seller:**
   - Same POD features as admin
   - Platform notice displays
   - Can create POD products seamlessly
   - No extra configuration needed

3. **Buyer:**
   - View POD products normally
   - Add to cart
   - Checkout flow
   - Receive POD products (after Gelato fulfillment)

4. **Backend:**
   - Gelato API integration working
   - Product catalog accessible
   - Webhook endpoint ready
   - Database schema correct

### ❌ **Known Limitations:**

1. **Webhook Testing:**
   - Webhooks require public URL (ngrok for local)
   - Can't fully test without real order
   - See `GELATO_WEBHOOK_SETUP.md` for setup

2. **Order Fulfillment:**
   - Full POD order flow requires real Gelato account with credit
   - Test orders will be charged by Gelato
   - Use Gelato sandbox mode if available

3. **Per-Seller Gelato:**
   - Currently platform-wide only
   - Sellers can't connect own accounts
   - Future enhancement

---

## 🎯 **Quick Verification Checklist**

Run through this quickly to verify core functionality:

- [ ] Admin can access POD section
- [ ] Seller can access POD section
- [ ] Gelato product catalog loads
- [ ] Can select Gelato products
- [ ] Design uploader works
- [ ] Products save with POD configuration
- [ ] Database records correct
- [ ] No console errors
- [ ] Buyer sees products normally
- [ ] Platform notice displays
- [ ] Error handling graceful

---

## 🐛 **If Something Doesn't Work:**

### Backend Issues:

```bash
# Check logs
pnpm dev:api

# Look for:
# ✅ [GelatoService] Gelato integration initialized successfully
# ❌ [GelatoService] Gelato integration not configured
```

### Frontend Issues:

```bash
# Check browser console
# Look for:
# ✅ No errors
# ❌ API errors, component errors
```

### Database Issues:

```bash
# Check Prisma Studio
pnpm prisma:studio

# Verify:
# - Products table has POD fields
# - fulfillmentType enum exists
```

---

## 📝 **Test Completion**

**Date Tested:** ******\_\_\_******
**Tested By:** ******\_\_\_******
**Overall Result:** ✅ PASS / ❌ FAIL

**Issues Found:**

1. ***
2. ***
3. ***

**Notes:**

---

---

---

---

**Next Steps:**

- [ ] Fix any issues found
- [ ] Configure webhooks for production
- [ ] Test full order flow with real Gelato order
- [ ] Document any custom workflows
- [ ] Train sellers on POD features
