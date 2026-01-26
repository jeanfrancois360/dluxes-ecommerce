# Comprehensive Testing Guide - NextPik v2.6.0

## Overview
This guide covers testing for recent fixes and enhancements:
1. Customer data safety (undefined customer handling)
2. Product & Variant management improvements
3. Image upload functionality
4. Product Attributes section

---

## Prerequisites

### 1. Ensure Services Are Running
```bash
# Terminal 1: Frontend
pnpm dev:web
# Access: http://localhost:3001

# Terminal 2: Backend API
pnpm dev:api
# Access: http://localhost:4000/api/v1

# Terminal 3: Database (if needed)
pnpm docker:up
```

### 2. Get Test Accounts

You'll need:
- **Admin Account**: For admin dashboard testing
- **Seller Account**: For seller portal testing
- **Buyer Account**: For placing orders

---

## Test Suite 1: Order Management with Undefined Customer Fix

### Objective
Verify the app handles orders with missing/undefined customer data gracefully.

### Test 1.1: View Empty Orders Page
**URL**: http://localhost:3001/admin/orders

**Expected Results**:
- ✅ Page loads without errors
- ✅ Shows "No orders found" message
- ✅ No JavaScript console errors
- ✅ All filters and search work

**Steps**:
1. Navigate to admin orders page
2. Open browser DevTools Console (F12)
3. Verify no errors appear
4. Try filters (Status, Payment Status, Date Range)
5. Try search functionality

---

### Test 1.2: Create Test Orders via API

**Method 1: Using Postman/Insomnia**

Create an order with normal customer data:
```json
POST http://localhost:4000/api/v1/orders
Authorization: Bearer YOUR_TOKEN

{
  "items": [
    {
      "productId": "product-id-here",
      "quantity": 1,
      "price": 29.99
    }
  ],
  "shippingAddress": {
    "street": "123 Test St",
    "city": "Test City",
    "state": "CA",
    "zipCode": "12345",
    "country": "USA"
  },
  "paymentMethod": "card"
}
```

**Method 2: Create Order via Frontend**
1. Login as a buyer
2. Add products to cart
3. Go through checkout process
4. Complete payment (use Stripe test card: 4242 4242 4242 4242)

---

### Test 1.3: View Orders with Customer Data

**URL**: http://localhost:3001/admin/orders

**Expected Results**:
- ✅ Order appears in list
- ✅ Customer name displays correctly
- ✅ Customer email displays correctly
- ✅ Avatar shows first letter of name
- ✅ No errors in console

**What to Check**:
- [ ] Customer column shows name and email
- [ ] Avatar circle shows correct initial
- [ ] Gold gradient background on avatar
- [ ] Click order number to view details
- [ ] Detail page shows customer info

---

### Test 1.4: Simulate Missing Customer Data (Database Manipulation)

**Using Prisma Studio** (http://localhost:5555):

1. Open Prisma Studio:
   ```bash
   cd packages/database && npx prisma studio
   ```

2. Navigate to `Order` table
3. Find a test order
4. Set `userId` field to `null`
5. Save changes

**OR using SQL**:
```bash
npx tsx -e "
import { PrismaClient } from '@nextpik/database';
const prisma = new PrismaClient();
async function test() {
  await prisma.order.updateMany({
    where: { id: 'your-order-id' },
    data: { userId: null }
  });
}
test();
"
```

---

### Test 1.5: View Orders with Missing Customer

**URL**: http://localhost:3001/admin/orders

**Expected Results** (CRITICAL):
- ✅ Page loads without crashing
- ✅ Shows "Guest Customer" for name
- ✅ Shows "No email provided" for email
- ✅ Avatar shows "G" (for Guest)
- ✅ No TypeError in console
- ✅ No red error boundaries

**Test All Views**:

1. **Orders List Page**
   - [ ] List view renders correctly
   - [ ] "Guest Customer" displays
   - [ ] No crashes or errors

2. **Order Detail Page**
   - [ ] Click order number
   - [ ] Detail page loads
   - [ ] Shipping section shows "Guest Customer"
   - [ ] Customer section shows fallback values
   - [ ] "View Customer" link hidden (no customer.id)

3. **Admin Dashboard**
   - URL: http://localhost:3001/admin/dashboard
   - [ ] Recent orders table shows "Guest Customer"
   - [ ] No errors

4. **Export Functionality**
   - [ ] Click "Export All" button
   - [ ] CSV downloads successfully
   - [ ] Open CSV in Excel/Numbers
   - [ ] Verify "Guest Customer" and "N/A" for email
   - [ ] Select orders and test "Export Selected"

---

## Test Suite 2: Product Attributes Section

### Objective
Verify the new Product Attributes section works for both admin and seller forms.

### Test 2.1: Admin Product Form - Create New Product

**URL**: http://localhost:3001/admin/products/new

**Steps**:
1. Fill basic info (Name, Description, Price, Category)
2. Set **Product Type** to "PHYSICAL"
3. Scroll to **Product Attributes** section

**Expected Results**:
- ✅ Section appears below images
- ✅ Shows 4 subsections: Colors, Sizes, Materials, Badges

**Test Each Subsection**:

#### Available Colors
1. Type "Black" and click "Add"
   - [ ] Badge appears with gray background
   - [ ] Shows "Black" text
   - [ ] Has × remove button
2. Type "Blue" and press **Enter**
   - [ ] Badge appears instantly
3. Try adding "Black" again
   - [ ] Prevented (duplicate check)
4. Click × on "Black" badge
   - [ ] Badge disappears

#### Available Sizes
1. Add "S", "M", "L" using both button and Enter key
   - [ ] All badges appear
   - [ ] Gray background
2. Add "42mm", "44mm"
   - [ ] Works with numbers and letters

#### Materials
1. Add "Stainless Steel"
2. Add "Ceramic Bezel"
3. Add "Cotton"
   - [ ] All display correctly

#### Product Badges
1. Add "Sale"
   - [ ] Badge has **gold background** (#CBB57B)
   - [ ] Black text
2. Add "New", "Featured"
   - [ ] All gold badges

**Final Check**:
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Product creates successfully
- [ ] View product to verify attributes saved

---

### Test 2.2: Admin Product Form - Edit Existing Product

**URL**: http://localhost:3001/admin/products

**Steps**:
1. Click "Edit" on any PHYSICAL product
2. Verify Product Attributes section loads with existing values
3. Add new attributes
4. Remove some attributes
5. Save changes

**Expected Results**:
- ✅ Existing attributes display correctly
- ✅ Can add/remove attributes
- ✅ Changes save successfully

---

### Test 2.3: Seller Product Form

**URL**: http://localhost:3001/dashboard/seller/products/new

**Steps**:
Repeat ALL tests from 2.1 and 2.2 in seller portal

**Expected Results**:
- ✅ Identical functionality to admin form
- ✅ Same styling (gold theme)
- ✅ All features work

---

### Test 2.4: Product Type Conditional Rendering

**Test Non-Physical Products**:
1. Set Product Type to "DIGITAL"
   - [ ] Product Attributes section **disappears**
2. Set to "SERVICE"
   - [ ] Section still hidden
3. Set back to "PHYSICAL"
   - [ ] Section **reappears**

---

## Test Suite 3: Variant Management Improvements

### Objective
Test all variant fixes: color preview, image persistence, edit button, layout.

### Test 3.1: Create Product with Variants

**URL**: http://localhost:3001/admin/products/new

**Steps**:
1. Create a physical product (save it first)
2. Scroll to **Product Variants** section
3. Click "+ Add Variant"

---

### Test 3.2: Real-Time Color Preview

**In Variant Form**:

1. Locate "Color Hex Code" field
2. Type `#FF0000` (red)
   - [ ] Color box updates **in real-time** to red
3. Type `#00FF00` (green)
   - [ ] Box changes to green instantly
4. Type `#0000FF` (blue)
   - [ ] Box changes to blue
5. Clear the field
   - [ ] Box shows light gray (#f3f4f6)
6. Type invalid hex like `#GGG`
   - [ ] Box shows the invalid color attempt

**Expected**: Color preview always visible, updates as you type

---

### Test 3.3: Variant Image Persistence

**Scenario A: Create Variant with Image**
1. Fill variant name, SKU, attributes (e.g., Size: M, Color: Red)
2. Upload variant image
3. Click "Create Variant"
4. **Verify**: Variant appears with image thumbnail

**Scenario B: Edit Variant - Keep Image**
1. Click edit button on variant
2. Change name or other field (don't touch image)
3. Click "Update Variant"
4. **Verify**: Image still displays (not lost)

**Scenario C: Edit Variant - Remove Image**
1. Click edit on variant with image
2. Click × to remove image in upload area
3. Click "Update Variant"
4. **Verify**: Image removed, shows placeholder

**Scenario D: Edit Variant - Replace Image**
1. Click edit on variant
2. Remove old image, upload new one
3. Click "Update Variant"
4. **Verify**: New image displays

---

### Test 3.4: Variant Edit Button

**Test Interactivity**:
1. Create 2-3 variants
2. Hover over edit button (pencil icon)
   - [ ] Border turns gold
   - [ ] Background turns light gold
   - [ ] Cursor is pointer
3. Click edit button
   - [ ] Form opens immediately
   - [ ] Page **auto-scrolls** to form
   - [ ] Form pre-fills with variant data

**Test with Multiple Variants**:
1. Edit first variant, make changes, save
2. Edit second variant
   - [ ] First variant's form closes
   - [ ] Second variant's form opens
   - [ ] No conflicts

---

### Test 3.5: Variant Form Layout

**Check Layout**:
1. Open variant form (create or edit)
2. Scroll to Color/Image section

**Expected Layout**:
- [ ] **2-column grid**: Color Hex Code | Color Name
- [ ] **Full-width below**: Variant Image section
- [ ] Image upload has `max-w-2xl` (not cramped)
- [ ] Plenty of breathing room

**Responsive Test**:
1. Resize browser to mobile width (<768px)
   - [ ] Grid becomes 1 column
   - [ ] Everything stacks vertically
   - [ ] Still looks good

---

### Test 3.6: Variant Reordering

**Steps**:
1. Create 3+ variants
2. Click **up arrow** on second variant
   - [ ] Moves up in list
3. Click **down arrow** on first variant
   - [ ] Moves down in list
4. Verify order persists after page refresh

---

## Test Suite 4: Primary/Featured Image Selection

### Objective
Test the new primary image feature in product forms.

### Test 4.1: Set Primary Image

**URL**: http://localhost:3001/admin/products/new (or edit)

**Steps**:
1. Upload 3+ images
2. Click "Set as Primary" on second image
   - [ ] Gold star badge appears on that image
   - [ ] Badge says "Primary" with star icon
   - [ ] Image auto-moves to first position
3. Click "Set as Primary" on third image
   - [ ] Previous primary loses badge
   - [ ] New image gets badge and moves to front

**Expected Behavior**:
- ✅ Only ONE image can be primary at a time
- ✅ Primary image always sorts to first position
- ✅ Gold star badge (#CBB57B) clearly visible

---

### Test 4.2: Primary Image on Initial Load

**Steps**:
1. Create product with multiple images, set one as primary
2. Save product
3. Navigate away
4. Edit product again
   - [ ] Primary image still marked with gold star
   - [ ] Primary image is first in list

---

## Test Suite 5: Image Upload FormData Fix

### Objective
Verify image uploads work without "Boundary not found" errors.

### Test 5.1: Product Image Upload

**URL**: http://localhost:3001/admin/products/new

**Steps**:
1. Open browser DevTools → Network tab
2. Drag & drop an image to upload area
3. Watch Network tab for upload request

**Expected Results**:
- ✅ Request shows `Content-Type: multipart/form-data; boundary=...`
- ✅ Upload succeeds (200 OK)
- ✅ Image preview appears
- ✅ No "Boundary not found" error

**Test Multiple Uploads**:
1. Upload 5 images at once
   - [ ] All upload successfully
   - [ ] Progress indicators show
   - [ ] All previews appear

---

### Test 5.2: Variant Image Upload

**Same as above but in variant form**:
1. Open variant form
2. Upload variant-specific image
3. Verify successful upload

---

## Test Suite 6: Defensive Array Rendering (Tags/Badges)

### Objective
Verify no React duplicate key warnings.

### Test 6.1: Tags Rendering

**URL**: http://localhost:3001/admin/products/new

**Steps**:
1. Open browser Console
2. Add several tags: "summer", "sale", "featured"
3. Watch console for warnings

**Expected Results**:
- ✅ No "duplicate key" warnings
- ✅ All tags display correctly
- ✅ Tags are removable

---

## Browser Compatibility Testing

Test in multiple browsers to ensure consistency:

### Chrome/Edge (Chromium)
- [ ] All tests pass

### Firefox
- [ ] All tests pass
- [ ] Image uploads work
- [ ] Drag & drop works

### Safari (Mac)
- [ ] All tests pass
- [ ] FormData handling correct

---

## Performance Testing

### Load Time
1. Navigate to admin orders page with 50+ orders
   - [ ] Loads in < 3 seconds
   - [ ] No lag when scrolling

### Memory Leaks
1. Open/close variant forms 10 times
   - [ ] No memory spike in DevTools Performance monitor
   - [ ] Page remains responsive

### Network Efficiency
1. Upload 10 images
   - [ ] Uploads happen in parallel
   - [ ] No duplicate requests

---

## Regression Testing

### Ensure Old Features Still Work

1. **Product Creation**
   - [ ] Can create all product types
   - [ ] Validation works correctly
   - [ ] Required fields enforced

2. **Order Processing**
   - [ ] Can view order details
   - [ ] Can update order status
   - [ ] Email notifications sent

3. **User Management**
   - [ ] Can create users
   - [ ] Roles work correctly
   - [ ] Permissions enforced

---

## Error Scenario Testing

### Test Edge Cases

1. **Network Failure**
   - Turn off WiFi during image upload
   - [ ] Error message displays
   - [ ] User can retry

2. **Invalid Data**
   - Enter letters in price field
   - [ ] Validation prevents submission
   - [ ] Clear error message

3. **Concurrent Edits**
   - Open same product in 2 tabs
   - Edit in both tabs
   - [ ] Last save wins OR conflict detected

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through entire product form
   - [ ] All fields reachable via Tab
   - [ ] Enter key submits forms
   - [ ] Escape closes modals

### Screen Reader
1. Use VoiceOver (Mac) or NVDA (Windows)
   - [ ] Field labels read correctly
   - [ ] Error messages announced
   - [ ] Button purposes clear

### Color Contrast
1. Use browser DevTools → Lighthouse
   - [ ] Accessibility score > 90
   - [ ] No contrast issues with gold theme

---

## Testing Checklist Summary

### Critical Tests (Must Pass)
- [ ] Orders page loads without errors (with/without customers)
- [ ] Guest customer displays correctly
- [ ] Product Attributes section appears for PHYSICAL products
- [ ] Variant image persists through edits
- [ ] Real-time color preview works
- [ ] Edit variant button opens form
- [ ] Primary image selection works
- [ ] Image uploads succeed without boundary errors

### Important Tests (Should Pass)
- [ ] Export functionality handles missing customers
- [ ] Seller forms have parity with admin forms
- [ ] Variant reordering works
- [ ] All array fields (tags, badges) render without warnings
- [ ] Form validation prevents bad data

### Nice-to-Have Tests (Good to Verify)
- [ ] Performance is acceptable
- [ ] Multiple browsers work
- [ ] Keyboard navigation smooth
- [ ] Accessibility good

---

## Reporting Issues

If you find bugs during testing:

1. **Take Screenshot/Video**
2. **Copy Console Errors** (if any)
3. **Note Steps to Reproduce**
4. **Check Browser** (Chrome, Firefox, Safari)
5. **Report** with all above info

---

## Quick Test Commands

```bash
# Clean all orders and start fresh
npx tsx scripts/clean-orders.ts

# Run type checks
pnpm type-check

# Check for lint errors
pnpm lint

# Start dev servers
pnpm dev:web  # Frontend
pnpm dev:api  # Backend

# Open Prisma Studio (database GUI)
cd packages/database && npx prisma studio
```

---

## Test Data Setup

### Create Test Products Quickly

```typescript
// Run in browser console on products page
// (After logging in as admin)

const createTestProduct = async () => {
  const response = await fetch('/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    },
    body: JSON.stringify({
      name: 'Test Product ' + Date.now(),
      description: 'Test description',
      price: 29.99,
      categoryId: 'your-category-id',
      productType: 'PHYSICAL',
      status: 'ACTIVE',
      inventory: 100
    })
  });
  return response.json();
};

// Create 5 test products
for (let i = 0; i < 5; i++) {
  await createTestProduct();
}
```

---

## Success Criteria

**All tests pass when**:
✅ No runtime errors in console
✅ No TypeScript compilation errors
✅ No React warnings about keys
✅ All forms submit successfully
✅ Data persists correctly
✅ UI is responsive and smooth
✅ Works across Chrome, Firefox, Safari

---

**Last Updated**: January 20, 2026
**Version**: 2.6.0
**Test Coverage**: Product Management, Order Management, Variants, Images
