# Frontend Inventory System - Manual Testing Guide

**Test Date**: December 13, 2025
**Frontend URL**: http://localhost:3000
**Backend URL**: http://localhost:4000
**Test User**: admin@luxury.com / Password123!

---

## Prerequisites

✅ Backend server running on port 4000
✅ Frontend server running on port 3000
✅ Database seeded with inventory settings
✅ Test products available in database

---

## Test Checklist

### 1. Inventory Settings Page (`/admin/settings` → Inventory Tab)

**Access the Page:**
- [ ] Navigate to http://localhost:3000/admin/settings
- [ ] Log in with admin credentials if prompted
- [ ] Click on the "Inventory" tab (should have Package icon)
- [ ] Page loads without errors

**Stock Thresholds Section:**
- [ ] **Low Stock Threshold**
  - [ ] Current value displays (should be 10)
  - [ ] Input field is editable
  - [ ] Change value to 15
  - [ ] Click "Save" button
  - [ ] Success toast appears
  - [ ] Value persists after page refresh
  - [ ] Change back to 10 and verify

- [ ] **Transaction History Page Size**
  - [ ] Current value displays (should be 20)
  - [ ] Input accepts values between 10-100
  - [ ] Change value to 30
  - [ ] Click "Save" button
  - [ ] Success toast appears
  - [ ] Restore to 20

**SKU Generation Section:**
- [ ] **Auto SKU Generation Toggle**
  - [ ] Switch shows current state (should be ON)
  - [ ] Toggle switch to OFF
  - [ ] Changes save automatically
  - [ ] Toggle back to ON
  - [ ] No errors in console

- [ ] **SKU Prefix**
  - [ ] Current value displays (should be "PROD")
  - [ ] Input field accepts uppercase text
  - [ ] Change to "LUX"
  - [ ] Click "Save" button
  - [ ] Success toast appears
  - [ ] Change back to "PROD"

**Notifications & Policies Section:**
- [ ] **Enable Stock Notifications Toggle**
  - [ ] Switch shows current state (should be ON)
  - [ ] Toggle works without errors
  - [ ] State persists after refresh

- [ ] **Allow Negative Stock Toggle**
  - [ ] Switch shows current state (should be OFF)
  - [ ] Toggle works without errors
  - [ ] Warning appears if enabled

**General Checks:**
- [ ] No console errors
- [ ] Loading states appear during API calls
- [ ] Error handling works (test by stopping backend)
- [ ] All labels and descriptions are clear
- [ ] Settings are organized in clear sections

---

### 2. Product Edit Page (`/admin/products/[id]`)

**Access the Page:**
- [ ] Navigate to http://localhost:3000/admin/products
- [ ] Click "Edit" on any product
- [ ] Product edit page loads
- [ ] Current stock level visible

**Inventory Adjustment Modal:**
- [ ] Click "Adjust Stock" button
- [ ] Modal opens with correct product name
- [ ] Current stock displays correctly

- [ ] **Test RESTOCK (+):**
  - [ ] Select "Restock" transaction type
  - [ ] Enter quantity: 10
  - [ ] Enter reason: "Stock replenishment test"
  - [ ] Preview shows: Current (e.g., 5) → New (15)
  - [ ] Click "Adjust Stock"
  - [ ] Success toast appears
  - [ ] Modal closes
  - [ ] Stock count updates in UI
  - [ ] Page refetches product data

- [ ] **Test SALE (-):**
  - [ ] Open adjustment modal again
  - [ ] Select "Sale" transaction type
  - [ ] Enter quantity: 3
  - [ ] Enter reason: "Test sale"
  - [ ] Preview shows correct calculation
  - [ ] Click "Adjust Stock"
  - [ ] Stock decreases by 3
  - [ ] Verify in UI

- [ ] **Test ADJUSTMENT:**
  - [ ] Select "Adjustment" type
  - [ ] Test with positive and negative values
  - [ ] Verify preview calculations

- [ ] **Test DAMAGE:**
  - [ ] Select "Damage" type
  - [ ] Enter quantity: 2
  - [ ] Enter reason: "Damaged in warehouse"
  - [ ] Verify stock decreases

- [ ] **Test RETURN:**
  - [ ] Select "Return" type
  - [ ] Enter quantity: 1
  - [ ] Enter reason: "Customer return"
  - [ ] Verify stock increases

- [ ] **Validation:**
  - [ ] Try to adjust stock below 0
  - [ ] Error message appears
  - [ ] Modal doesn't close
  - [ ] Required fields show errors if empty

**Inventory History Modal:**
- [ ] Click "History" button
- [ ] Modal opens showing transaction list
- [ ] Transactions display in chronological order (newest first)
- [ ] Each transaction shows:
  - [ ] Transaction type badge (color-coded)
  - [ ] Quantity change (+/- number)
  - [ ] Previous stock → New stock
  - [ ] Reason and notes
  - [ ] Timestamp
  - [ ] User who performed action

- [ ] **Pagination:**
  - [ ] "Load More" button appears if > 20 transactions
  - [ ] Clicking loads next page
  - [ ] No duplicates in list
  - [ ] Loading state shows during fetch

**Sync from Variants:**
- [ ] Click "Sync from Variants" button (if product has variants)
- [ ] Confirmation dialog appears
- [ ] Click "Sync"
- [ ] Success toast shows
- [ ] Product inventory updates to sum of variant inventories
- [ ] If no variants, button shows disabled state or helpful message

**General Checks:**
- [ ] Stock level indicator shows correct color:
  - [ ] Green for in stock (> threshold)
  - [ ] Yellow for low stock (≤ threshold)
  - [ ] Red for out of stock (0)
- [ ] All modals close on ESC key
- [ ] All modals close on backdrop click
- [ ] No console errors

---

### 3. Products List Page (`/admin/products`)

**Stock Status Badges:**
- [ ] Navigate to http://localhost:3000/admin/products
- [ ] Products display in table/grid
- [ ] Each product shows stock status badge
- [ ] Badge colors match stock levels:
  - [ ] **In Stock** - Green badge (stock > 10)
  - [ ] **Low Stock** - Yellow badge (stock ≤ 10)
  - [ ] **Out of Stock** - Red badge (stock = 0)
- [ ] Badge text is readable
- [ ] Icons appear in badges

**Stock Level Indicator:**
- [ ] Progress bar shows stock level
- [ ] Bar color matches stock status
- [ ] Percentage calculated correctly
- [ ] Tooltip shows exact stock count

**Bulk Inventory Modal:**
- [ ] Select multiple products (checkbox)
- [ ] Click "Bulk Actions" → "Adjust Stock"
- [ ] Bulk modal opens
- [ ] Shows list of selected products
- [ ] Can select transaction type for all
- [ ] Can enter quantity for all
- [ ] Can enter reason
- [ ] Click "Update All"
- [ ] Progress indicator shows
- [ ] Success/failure count displays
- [ ] Products refresh after operation
- [ ] Verify stock updated for all selected items

**Filtering:**
- [ ] Filter by "Low Stock" (if filter exists)
- [ ] Only shows products with stock ≤ threshold
- [ ] Filter by "Out of Stock"
- [ ] Only shows products with 0 stock
- [ ] Clear filters works

**General Checks:**
- [ ] Table loads quickly
- [ ] Pagination works
- [ ] Search works
- [ ] No console errors
- [ ] Stock updates reflect immediately

---

### 4. Integration Tests

**Settings → Products Flow:**
- [ ] Go to Settings → Inventory
- [ ] Change low stock threshold to 20
- [ ] Save setting
- [ ] Navigate to Products list
- [ ] Products with stock ≤ 20 now show "Low Stock" badge
- [ ] Badge colors updated correctly
- [ ] No page refresh needed

**Stock Adjustment → History Flow:**
- [ ] Edit a product
- [ ] Adjust stock (any type)
- [ ] Close modal
- [ ] Open History modal
- [ ] New transaction appears at top of list
- [ ] All details correct

**Bulk Update → Individual Product:**
- [ ] Perform bulk stock update on 3 products
- [ ] Navigate to one of those products
- [ ] Open History modal
- [ ] Bulk update transaction appears in history
- [ ] Stock level matches expected value

**Real-Time Updates:**
- [ ] Open product edit in one tab
- [ ] Adjust stock
- [ ] Open products list in another tab
- [ ] Stock update reflects (may need refresh if no WebSocket)

---

### 5. Error Handling & Edge Cases

**Network Errors:**
- [ ] Stop backend server
- [ ] Try to load settings page
- [ ] Error message displays
- [ ] "Retry" button works
- [ ] Restart backend
- [ ] Click retry
- [ ] Data loads successfully

**Invalid Input:**
- [ ] Try negative stock adjustment that exceeds current stock
- [ ] Error message clear
- [ ] Modal stays open
- [ ] Form not submitted

**Empty States:**
- [ ] Product with no transaction history
- [ ] History modal shows "No transactions" message
- [ ] Message is helpful

**Loading States:**
- [ ] Settings page shows loading spinner
- [ ] Skeleton states during data fetch
- [ ] Disable buttons during save operations
- [ ] No double-click issues

**Permissions:**
- [ ] Log out
- [ ] Try to access /admin/settings
- [ ] Redirects to login
- [ ] Log in as non-admin user (if exists)
- [ ] Inventory features not accessible
- [ ] Proper error messages

---

### 6. Performance & UX

**Performance:**
- [ ] Settings page loads in < 2 seconds
- [ ] Stock adjustments process in < 1 second
- [ ] No lag when typing in forms
- [ ] Bulk operations complete in reasonable time
- [ ] No memory leaks (check devtools)

**User Experience:**
- [ ] All buttons have clear labels
- [ ] Icons are intuitive
- [ ] Toast notifications clear and helpful
- [ ] Forms have proper validation messages
- [ ] Modals are responsive (test on mobile size)
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Focus management in modals

**Accessibility:**
- [ ] All form inputs have labels
- [ ] Color contrast sufficient
- [ ] Screen reader friendly (use screen reader if available)
- [ ] ARIA labels present
- [ ] Focus indicators visible

---

## Test Results Template

### Test Summary

**Date**: ___________
**Tester**: ___________
**Browser**: ___________
**Status**: ⬜ PASS / ⬜ FAIL

### Issues Found

| #  | Component | Issue Description | Severity | Status |
|----|-----------|------------------|----------|--------|
| 1  |           |                  | 🔴/🟡/🟢 |        |
| 2  |           |                  |          |        |
| 3  |           |                  |          |        |

**Severity Levels:**
- 🔴 Critical - Blocks functionality
- 🟡 Major - Impacts usability
- 🟢 Minor - Cosmetic/nice-to-have

### Screenshots

Attach screenshots of:
1. Inventory Settings page
2. Stock adjustment modal
3. Transaction history modal
4. Products list with stock badges
5. Any errors encountered

---

## Quick Test Script

For quick smoke testing, run this minimal checklist:

1. ✅ Settings page loads
2. ✅ Change low stock threshold, verify save
3. ✅ Open product edit
4. ✅ Adjust stock (RESTOCK +10)
5. ✅ View transaction history
6. ✅ Check products list shows updated stock
7. ✅ Stock badge color correct

If all above pass, major functionality works!

---

## Notes

- Some features may require database seeding
- First-time load may be slower (Next.js compilation)
- Clear browser cache if experiencing issues
- Check browser console for errors
- Backend must be running for all tests

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify database has inventory settings seeded
4. Check network tab in devtools
5. Try clearing browser cache/cookies

Report issues with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots
- Browser console errors
- Backend logs (if relevant)
