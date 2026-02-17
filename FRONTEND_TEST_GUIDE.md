# Frontend Testing Guide - Commission Override System

**Status:** ✅ Frontend running on http://localhost:3000
**API:** ✅ Backend running on http://localhost:4000

---

## 🚀 Quick Start

### 1. Access the Admin Panel

```
URL: http://localhost:3000/admin/commissions
```

**Prerequisites:**

- You need to be logged in as an admin
- If not logged in, go to: http://localhost:3000/login

---

## ✅ Test Checklist

### Test 1: Create Category-Only Override

**Steps:**

1. Click "Create Override" button
2. **Leave "Seller Email" field BLANK**
3. Select a category from the dropdown (e.g., "Electronics")
4. Set commission type: "PERCENTAGE"
5. Set commission rate: 7.5
6. Add notes: "Test category-only override"
7. Click "Create"

**Expected Results:**

- ✅ Form accepts empty seller email (no validation error)
- ✅ Override is created successfully
- ✅ Table shows new row with:
  - Seller column: "All Sellers" badge (gray/secondary)
  - Category column: "Electronics" (or selected category)
  - Scope column: 🟢 Green "Category" badge
  - Rate: 7.5%

**Validation:**

- ❌ Should NOT show "Seller email required" error
- ✅ Should create override successfully

---

### Test 2: Create Seller-Only Override

**Steps:**

1. Click "Create Override" button
2. Enter seller email (get from users list)
3. **Leave "Category" as "All Categories" or blank**
4. Set commission type: "PERCENTAGE"
5. Set commission rate: 5.0
6. Add notes: "Test seller-only override"
7. Click "Create"

**Expected Results:**

- ✅ Form accepts empty/all category selection
- ✅ Override is created successfully
- ✅ Table shows new row with:
  - Seller column: Seller name and email
  - Category column: "All Categories" (muted text)
  - Scope column: 🔵 Blue "Seller" badge
  - Rate: 5.0%

---

### Test 3: Create Specific (Seller + Category) Override

**Steps:**

1. Click "Create Override" button
2. Enter seller email (same as Test 2)
3. Select a category (same as Test 1)
4. Set commission type: "PERCENTAGE"
5. Set commission rate: 4.0
6. Add notes: "Test specific override"
7. Click "Create"

**Expected Results:**

- ✅ Override is created successfully
- ✅ Table shows new row with:
  - Seller column: Seller name and email
  - Category column: Category name (e.g., "Electronics")
  - Scope column: 🟣 Purple "Specific" badge
  - Rate: 4.0%

---

### Test 4: Validation - Neither Seller Nor Category

**Steps:**

1. Click "Create Override" button
2. **Leave seller email BLANK**
3. **Leave category as "All Categories" or blank**
4. Set commission rate: 10.0
5. Try to submit

**Expected Results:**

- ⚠️ Validation warning appears:
  - Yellow/amber warning box
  - Message: "⚠️ Please select at least one: Seller OR Category (or both for specific combination)"
- ❌ Form submission fails with error toast:
  - "Please select either a seller or category (or both)"

---

### Test 5: Duplicate Prevention

**Steps:**

1. Click "Create Override" button
2. Use same seller + category combination as Test 3
3. Set commission rate: 99.0 (different rate)
4. Try to submit

**Expected Results:**

- ❌ Error toast appears:
  - "Override already exists for this seller + category combination"
- ❌ Override is NOT created
- ✅ Existing override remains unchanged

---

### Test 6: Table Display Verification

**Check the table shows:**

| Column       | What to Verify                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Seller**   | - Shows seller name/email OR "All Sellers" badge                                                                   |
| **Category** | - Shows category name OR "All Categories" text OR "Global" badge                                                   |
| **Scope**    | - Purple "Specific" for seller+category<br>- Blue "Seller" for seller-only<br>- Green "Category" for category-only |
| **Rate**     | - Displays percentage correctly (e.g., "5%")                                                                       |
| **Type**     | - Shows "PERCENTAGE" or "FIXED" badge                                                                              |
| **Status**   | - Shows "Active" or "Inactive" badge                                                                               |

---

### Test 7: Search and Filter

**Search Test:**

1. Enter seller email in search box
2. Wait for debounce (500ms)
3. ✅ Table filters to show only that seller's overrides

**Category Filter:**

1. Select a category from filter dropdown
2. ✅ Table filters to show only that category's overrides

**Status Filter:**

1. Select "Active" or "Inactive"
2. ✅ Table filters accordingly

**Clear Filters:**

1. Click "Clear Filters" button
2. ✅ All filters reset
3. ✅ Full table displayed

---

### Test 8: Edit Override

**Steps:**

1. Click edit icon (pencil) on any override
2. Modal opens with pre-filled data
3. Change commission rate (e.g., 5.0 → 6.0)
4. Click "Save"

**Expected Results:**

- ✅ Modal closes
- ✅ Success toast appears
- ✅ Table updates with new rate
- ✅ Seller and category fields are disabled (can't change after creation)

---

### Test 9: Delete Override

**Steps:**

1. Click delete icon (trash) on any override
2. Confirmation dialog appears
3. Click "OK"

**Expected Results:**

- ✅ Override is deleted
- ✅ Row disappears from table
- ✅ Success toast appears

---

### Test 10: Bulk Operations

**Bulk Select:**

1. Check checkbox for multiple overrides
2. ✅ Selected rows highlighted
3. ✅ Bulk action bar appears at bottom

**Bulk Delete:**

1. Select 2-3 overrides
2. Click "Delete Selected" in bulk action bar
3. Confirm deletion
4. ✅ All selected overrides deleted
5. ✅ Count toast shows "Deleted X items"

---

## 🎨 Visual Verification Checklist

### Scope Badges Colors

- [ ] 🟣 **Specific:** Purple background, purple text
- [ ] 🔵 **Seller:** Blue background, blue text
- [ ] 🟢 **Category:** Green background, green text

### Form Layout

- [ ] Seller email has "(optional)" label
- [ ] Category has "(optional)" label
- [ ] Validation warning appears when both are empty
- [ ] Warning is amber/yellow colored
- [ ] Fields are properly aligned in 2-column grid

### Table Layout

- [ ] Checkbox column works
- [ ] All columns visible and aligned
- [ ] Badges render correctly
- [ ] Actions (edit/delete) buttons work
- [ ] Responsive design (try resizing window)

---

## 🐛 Known Issues to Check

### Issues That Should NOT Occur:

- ❌ "Seller email is required" error when leaving it blank
- ❌ Can't create category-only override
- ❌ Can create override with neither seller nor category
- ❌ Duplicate combinations are allowed
- ❌ Scope badges missing or wrong color
- ❌ "All Sellers" badge not showing for category-only
- ❌ Delete uses sellerId instead of override ID (would fail)
- ❌ Edit modal doesn't pre-fill data

---

## 📊 Test Scenarios Summary

| Test | Type          | Expected Outcome                                |
| ---- | ------------- | ----------------------------------------------- |
| 1    | Category-only | ✅ Creates with green "Category" badge          |
| 2    | Seller-only   | ✅ Creates with blue "Seller" badge             |
| 3    | Specific      | ✅ Creates with purple "Specific" badge         |
| 4    | Validation    | ❌ Prevents creation without seller or category |
| 5    | Duplicate     | ❌ Prevents duplicate combinations              |
| 6    | Display       | ✅ All columns show correct data                |
| 7    | Filters       | ✅ Search and filters work                      |
| 8    | Edit          | ✅ Updates override correctly                   |
| 9    | Delete        | ✅ Removes override                             |
| 10   | Bulk          | ✅ Bulk operations work                         |

---

## 🔍 Screenshot Checklist

Take screenshots of:

1. **Form with validation warning** (both fields empty)
2. **Table with all 3 scope types** (purple, blue, green badges)
3. **Category-only override** (showing "All Sellers" badge)
4. **Seller-only override** (showing "All Categories" text)
5. **Edit modal** (with pre-filled data)
6. **Bulk selection** (with action bar at bottom)

---

## 🚨 Critical Tests

### MUST PASS:

1. ✅ Can create category-only override (seller = blank)
2. ✅ Can create seller-only override (category = all/blank)
3. ✅ Can create specific override (both filled)
4. ❌ Cannot create with both blank (validation works)
5. ❌ Cannot create duplicate (unique constraint works)
6. ✅ Scope badges show correct colors
7. ✅ Delete uses override ID (not sellerId)

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

Test 1 - Category-Only:     [ ] Pass  [ ] Fail  Notes: __________
Test 2 - Seller-Only:       [ ] Pass  [ ] Fail  Notes: __________
Test 3 - Specific:          [ ] Pass  [ ] Fail  Notes: __________
Test 4 - Validation:        [ ] Pass  [ ] Fail  Notes: __________
Test 5 - Duplicate:         [ ] Pass  [ ] Fail  Notes: __________
Test 6 - Display:           [ ] Pass  [ ] Fail  Notes: __________
Test 7 - Filters:           [ ] Pass  [ ] Fail  Notes: __________
Test 8 - Edit:              [ ] Pass  [ ] Fail  Notes: __________
Test 9 - Delete:            [ ] Pass  [ ] Fail  Notes: __________
Test 10 - Bulk Ops:         [ ] Pass  [ ] Fail  Notes: __________

Overall Status: [ ] All Pass  [ ] Some Failures

Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________
```

---

## 🎯 Quick Test (2 Minutes)

If you only have 2 minutes, do this:

1. **Create category-only override** (seller = blank)
   - ✅ Should succeed with green "Category" badge

2. **Try to create override with both blank**
   - ❌ Should fail with validation error

3. **Check table displays scope badges**
   - ✅ Should see colored badges in Scope column

If all 3 pass, the core functionality works! ✅

---

## 📞 Support

If any test fails:

1. Check browser console for errors (F12)
2. Check network tab for failed API calls
3. Verify API server is running (http://localhost:4000)
4. Check TEST_REPORT.md for backend test results

---

**Happy Testing! 🧪**
