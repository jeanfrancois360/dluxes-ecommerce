# Product CRUD Operations - Testing Checklist

## Test Environment

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **Date**: 2026-02-09

---

## 🧪 SELLER PRODUCT TESTS

### 1. CREATE Product (POST /seller/products)

#### Test 1.1: Create product with all required fields ✅

- [ ] Navigate to Seller Portal → Products → Add New Product
- [ ] Fill in:
  - Name: "Luxury Watch Collection"
  - Description: "Premium Swiss watches"
  - Price: $299.99
  - Inventory: 10
  - Status: Active
- [ ] **Expected**: Product created successfully with auto-generated SKU
- [ ] **Verify**: SKU format matches `NEXTPIK-MM-DD-XXXX`

#### Test 1.2: Create product WITHOUT category ✅

- [ ] Create new product
- [ ] Leave category dropdown empty/unselected
- [ ] Fill other required fields
- [ ] **Expected**: Product creates successfully (no "Referenced record not found" error)
- [ ] **Verify**: Product has no category assigned

#### Test 1.3: Create product WITH category ✅

- [ ] Create new product
- [ ] Select a category from dropdown
- [ ] Fill other required fields
- [ ] **Expected**: Product created with category link
- [ ] **Verify**: Category displays correctly in product details

#### Test 1.4: Create product with optional fields ✅

- [ ] Add hero image
- [ ] Add multiple gallery images
- [ ] Add badges (New, Featured)
- [ ] Add colors, sizes, materials
- [ ] **Expected**: All optional fields saved correctly

#### Test 1.5: Validation errors ❌

- [ ] Try to create product with:
  - Empty name → Should show error
  - Negative price → Should show error
  - Empty description → Should show error
- [ ] **Expected**: Clear validation messages, no server crash

#### Test 1.6: Real Estate product type ✅

- [ ] Set Product Type: Real Estate
- [ ] Fill real estate fields (bedrooms, bathrooms, sqft)
- [ ] **Expected**: Creates successfully with RE-specific fields

#### Test 1.7: Vehicle product type ✅

- [ ] Set Product Type: Vehicle
- [ ] Fill vehicle fields (make, model, year, mileage)
- [ ] **Expected**: Creates successfully with vehicle-specific fields

#### Test 1.8: Digital product type ✅

- [ ] Set Product Type: Digital
- [ ] Fill digital fields (file URL, format, license type)
- [ ] **Expected**: Creates successfully with digital-specific fields

---

### 2. READ Products (GET /seller/products)

#### Test 2.1: List all seller products ✅

- [ ] Go to Seller Portal → Products
- [ ] **Expected**: See list of all your products only
- [ ] **Verify**: No products from other sellers visible

#### Test 2.2: Product details view ✅

- [ ] Click on a product to view details
- [ ] **Expected**: All product fields displayed correctly
- [ ] **Verify**: Images, pricing, inventory all accurate

#### Test 2.3: Filter products by status ✅

- [ ] Use status filter: Active, Draft, Inactive
- [ ] **Expected**: Only products with selected status shown

#### Test 2.4: Search products ✅

- [ ] Use search bar to find product by name
- [ ] **Expected**: Relevant results appear

#### Test 2.5: Pagination ✅

- [ ] If >10 products, check pagination controls
- [ ] **Expected**: Can navigate between pages

---

### 3. UPDATE Product (PATCH /seller/products/:id)

#### Test 3.1: Update basic fields ✅

- [ ] Edit existing product
- [ ] Change name, description, price
- [ ] Save changes
- [ ] **Expected**: Changes saved and reflected immediately

#### Test 3.2: Update inventory ✅

- [ ] Change inventory count
- [ ] Save
- [ ] **Expected**: New inventory count displayed

#### Test 3.3: Update status ✅

- [ ] Change status from Active → Draft
- [ ] Save
- [ ] **Expected**: Status updates, product hidden from storefront

#### Test 3.4: Add/remove images ✅

- [ ] Upload new images
- [ ] Delete existing images
- [ ] Reorder images
- [ ] **Expected**: Image changes saved correctly

#### Test 3.5: Update category ✅

- [ ] Change product category
- [ ] Save
- [ ] **Expected**: New category assigned

#### Test 3.6: Remove category ✅

- [ ] Set category to empty/none
- [ ] Save
- [ ] **Expected**: Product no longer has category (no error)

#### Test 3.7: Update SKU (should be read-only) ❌

- [ ] Try to edit SKU field
- [ ] **Expected**: SKU field is read-only with info message
- [ ] **Verify**: Message shows "Auto-generated upon creation"

---

### 4. DELETE Product (DELETE /seller/products/:id)

#### Test 4.1: Delete single product ✅

- [ ] Select a product
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] **Expected**: Product removed from list

#### Test 4.2: Delete product with orders ❌

- [ ] Try to delete product that has been ordered
- [ ] **Expected**: Error message or warning
- [ ] **Verify**: System prevents deletion or archives instead

#### Test 4.3: Bulk delete ✅

- [ ] Select multiple products
- [ ] Bulk delete action
- [ ] **Expected**: All selected products deleted

---

### 5. EDGE CASES & ERROR HANDLING

#### Test 5.1: Network interruption ⚠️

- [ ] Start creating product
- [ ] Disable network mid-submission
- [ ] **Expected**: Clear error message, data not lost

#### Test 5.2: Duplicate product slug ❌

- [ ] Create product with existing slug
- [ ] **Expected**: Error message about duplicate slug

#### Test 5.3: Very large images ❌

- [ ] Upload 20MB+ image
- [ ] **Expected**: Error or automatic compression message

#### Test 5.4: Special characters ✅

- [ ] Product name with: "quotes", <tags>, & symbols
- [ ] **Expected**: Handles correctly, no XSS issues

#### Test 5.5: Empty/whitespace only fields ❌

- [ ] Name: " " (spaces only)
- [ ] **Expected**: Validation error

---

## 👑 ADMIN PRODUCT TESTS

### 6. ADMIN CREATE (POST /products)

#### Test 6.1: Admin creates product without store ✅

- [ ] Login as Admin
- [ ] Navigate to Admin Panel → Products → Add New
- [ ] Create product without assigning to seller
- [ ] **Expected**: Product created successfully (admin-owned)

#### Test 6.2: Admin assigns product to seller ✅

- [ ] Create product
- [ ] Assign to specific seller/store
- [ ] **Expected**: Product appears in seller's inventory

---

### 7. ADMIN READ (GET /products)

#### Test 7.1: View all products (all sellers) ✅

- [ ] Admin panel → Products → View All
- [ ] **Expected**: See products from ALL sellers + admin products

#### Test 7.2: Filter by seller/store ✅

- [ ] Filter products by specific store
- [ ] **Expected**: Only that store's products shown

#### Test 7.3: Filter by status (DRAFT, ACTIVE, INACTIVE, ARCHIVED) ✅

- [ ] Use status filter
- [ ] **Expected**: Accurate filtering

---

### 8. ADMIN UPDATE (PATCH /products/:id)

#### Test 8.1: Admin edits any seller product ✅

- [ ] Select a seller's product
- [ ] Edit fields (price, status, featured flag)
- [ ] Save
- [ ] **Expected**: Changes saved successfully

#### Test 8.2: Admin features a product ✅

- [ ] Set product as "Featured"
- [ ] **Expected**: Product appears in featured section on homepage

#### Test 8.3: Admin changes product status ✅

- [ ] Change product from ACTIVE → INACTIVE
- [ ] **Expected**: Product hidden from storefront
- [ ] **Verify**: Seller can still see it in their dashboard

---

### 9. ADMIN DELETE (DELETE /products/:id)

#### Test 9.1: Admin deletes any product ✅

- [ ] Select any product (seller or admin-owned)
- [ ] Delete
- [ ] **Expected**: Product permanently removed

#### Test 9.2: Bulk delete (admin) ✅

- [ ] Select multiple products from different sellers
- [ ] Bulk delete
- [ ] **Expected**: All deleted successfully

#### Test 9.3: Soft delete / Archive ⚠️

- [ ] Check if deletion is soft (archived) or hard (permanent)
- [ ] **Expected**: Depending on system design

---

### 10. ADMIN BULK OPERATIONS

#### Test 10.1: Bulk status update ✅

- [ ] Select 10+ products
- [ ] Change status to INACTIVE
- [ ] **Expected**: All updated simultaneously

#### Test 10.2: Bulk category assignment ✅

- [ ] Select products
- [ ] Assign all to same category
- [ ] **Expected**: Category updated for all

#### Test 10.3: Bulk price adjustment ⚠️

- [ ] Select products
- [ ] Apply 10% discount
- [ ] **Expected**: Prices adjusted correctly

---

## 🔐 SECURITY & PERMISSIONS TESTS

### 11. Authorization Tests

#### Test 11.1: Seller cannot access other seller's products ❌

- [ ] Login as Seller A
- [ ] Try to access Seller B's product URL directly
- [ ] **Expected**: 404 or Forbidden error

#### Test 11.2: Seller cannot delete admin products ❌

- [ ] Login as Seller
- [ ] Try to delete admin-created product
- [ ] **Expected**: Forbidden error

#### Test 11.3: Unauthenticated user restrictions ❌

- [ ] Logout
- [ ] Try to access /seller/products
- [ ] **Expected**: Redirect to login

#### Test 11.4: Buyer cannot access seller endpoints ❌

- [ ] Login as Buyer
- [ ] Try to access seller product creation
- [ ] **Expected**: Permission denied

---

## 📊 PERFORMANCE TESTS

### 12. Load & Performance

#### Test 12.1: Large product list ⚠️

- [ ] View page with 100+ products
- [ ] **Expected**: Page loads < 3 seconds
- [ ] **Verify**: Smooth scrolling, no lag

#### Test 12.2: Image upload speed ⚠️

- [ ] Upload 5 images simultaneously
- [ ] **Expected**: Uploads complete reasonably fast
- [ ] **Verify**: Progress indicators work

#### Test 12.3: Concurrent edits ⚠️

- [ ] Two users edit same product simultaneously
- [ ] **Expected**: Conflict resolution or last-write-wins
- [ ] **Verify**: No data corruption

---

## ✅ Test Results Summary

### Seller CRUD Operations

- ✅ **Create**: Pass
- ✅ **Read**: Pass
- ✅ **Update**: Pass
- ✅ **Delete**: Pass

### Admin CRUD Operations

- ⏳ **Create**: Pending
- ⏳ **Read**: Pending
- ⏳ **Update**: Pending
- ⏳ **Delete**: Pending

### Critical Issues Found

1. [ ] None yet - testing in progress

### Non-Critical Issues

1. [ ] SKU field removal confirmed working

---

## 🐛 Bug Report Template

**Issue**: [Brief description]

**Steps to Reproduce**:

1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Environment**:

- Role: Seller / Admin
- Browser:
- Date/Time:

**Screenshots**: [Attach if applicable]

**Priority**: 🔴 Critical / 🟡 Medium / 🟢 Low

---

## Notes

- All tests should be run with fresh test data
- Clear browser cache before starting
- Test in both Chrome and Safari (M1 Mac)
- Monitor browser console for errors
- Check backend logs for API errors
- Test responsive design (mobile, tablet, desktop)

---

**Test Conducted By**: ******\_******
**Date**: 2026-02-09
**Sign-off**: ******\_******
