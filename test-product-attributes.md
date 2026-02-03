# Product Attributes Testing Guide

## Test Environment
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api/v1

## Test Scenarios

### 1. Admin Product Form
**URL**: http://localhost:3000/dashboard/admin/products/new

#### Test Cases:
1. **Product Type Selection**
   - [ ] Set Product Type to "PHYSICAL"
   - [ ] Verify "Product Attributes" section appears
   - [ ] Change to other types (verify section disappears for non-physical)

2. **Available Colors**
   - [ ] Enter "Black" and click "Add"
   - [ ] Verify "Black" badge appears
   - [ ] Press Enter key with "Blue" (test keyboard support)
   - [ ] Verify "Blue" badge appears
   - [ ] Try adding "Black" again (test duplicate prevention)
   - [ ] Click "×" on "Black" badge (test removal)

3. **Available Sizes**
   - [ ] Enter "42mm" and click "Add"
   - [ ] Enter "44mm" and press Enter
   - [ ] Verify both badges appear
   - [ ] Remove one size

4. **Materials**
   - [ ] Enter "Stainless Steel" and click "Add"
   - [ ] Enter "Ceramic Bezel" and press Enter
   - [ ] Verify both badges appear
   - [ ] Test removal

5. **Product Badges**
   - [ ] Enter "Sale" and click "Add"
   - [ ] Verify badge appears with gold (#CBB57B) background
   - [ ] Test removal

6. **Form Submission**
   - [ ] Fill all required fields
   - [ ] Add colors, sizes, materials, badges
   - [ ] Submit form
   - [ ] Verify data saves correctly

---

### 2. Seller Product Form
**URL**: http://localhost:3000/dashboard/seller/products/new

#### Test Cases:
Repeat all tests from Admin form to ensure parity.

---

## Visual Verification

### Expected Design:
- Section title: "Product Attributes" (bold, dark gray)
- Input fields: White with gray border, gold focus ring
- "Add" buttons: Gold (#CBB57B) background, black text
- Color/Size/Material badges: Light gray background
- Badge badges: Gold (#CBB57B) background
- Remove "×" button: Hover shows red color

### Functionality:
✅ Enter key adds items
✅ Click "Add" button adds items
✅ No duplicate items allowed
✅ "×" button removes items
✅ Only shows for PHYSICAL product type

---

## Browser Console Checks
Open DevTools Console and verify:
- No React errors
- No "duplicate key" warnings
- No TypeScript errors

---

## Status: Ready for Manual Testing
Both frontend and API are running. Please test manually in browser.
