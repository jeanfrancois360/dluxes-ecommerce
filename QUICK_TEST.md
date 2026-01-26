# Quick Test - 15 Minutes

Start here for immediate testing of critical fixes.

## 🚀 Fast Track Testing (15 min)

### Step 1: Verify Services Running (1 min)
```bash
# Check if frontend is running
curl http://localhost:3001

# Check if API is running
curl http://localhost:4000/api/v1
```

Both should respond. If not, start them:
```bash
pnpm dev:web  # Terminal 1
pnpm dev:api  # Terminal 2
```

---

### Step 2: Test Undefined Customer Fix (5 min)

#### A. Check Empty Orders Page
1. Go to: http://localhost:3001/admin/orders
2. **Expected**: Page loads, shows "No orders found"
3. **Open Console** (F12) - should be no errors

#### B. Create a Test Order
**Option 1: Via Frontend (Recommended)**
1. Login as a buyer account
2. Add any product to cart
3. Complete checkout (use test card: `4242 4242 4242 4242`)

**Option 2: Quick API Test**
```bash
# In terminal
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "prod-id", "quantity": 1, "price": 29.99}],
    "shippingAddress": {
      "street": "123 Test",
      "city": "City",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    }
  }'
```

#### C. Verify Order Displays
1. Go to: http://localhost:3001/admin/orders
2. **Check**:
   - ✅ Order appears in list
   - ✅ Customer name and email show
   - ✅ Avatar shows first letter
   - ✅ No console errors

#### D. Test Missing Customer Scenario
1. Open Prisma Studio: http://localhost:5555
   ```bash
   cd packages/database && npx prisma studio
   ```
2. Find your test order in `Order` table
3. Set `userId` to `null`
4. Save
5. Refresh orders page: http://localhost:3001/admin/orders
6. **Expected**:
   - ✅ Shows "Guest Customer"
   - ✅ Shows "No email provided"
   - ✅ Avatar shows "G"
   - ✅ **NO ERRORS** in console

**✅ PASS**: If page loads without crashing and shows fallback values.

---

### Step 3: Test Product Attributes (5 min)

1. Go to: http://localhost:3001/admin/products/new
2. Fill basic fields (name, price, category)
3. Set **Product Type** to **PHYSICAL**
4. Scroll down to **Product Attributes** section

**Quick Tests**:
- Type "Black" in Colors → Press Enter
  - ✅ Badge appears
- Type "M" in Sizes → Click "Add" button
  - ✅ Badge appears
- Type "Sale" in Badges
  - ✅ Gold badge appears
- Click × on any badge
  - ✅ Badge disappears
- Change Product Type to "DIGITAL"
  - ✅ Section disappears

**✅ PASS**: All adding/removing works, section shows/hides correctly.

---

### Step 4: Test Variant Features (4 min)

1. Create a product first (save it)
2. Scroll to **Product Variants** section
3. Click "+ Add Variant"

**Quick Tests**:

#### A. Real-Time Color Preview
1. In "Color Hex Code" field, type: `#FF0000`
   - ✅ Color box turns red **instantly**
2. Type `#00FF00`
   - ✅ Box turns green in real-time
3. Clear field
   - ✅ Box shows light gray

#### B. Variant Image Persistence
1. Fill variant form (name, SKU, size: M)
2. Upload an image
3. Click "Create Variant"
4. Click **Edit** button (pencil icon)
   - ✅ Form opens
   - ✅ Page auto-scrolls to form
   - ✅ Image still shows in form
5. Change name only (don't touch image)
6. Click "Update Variant"
7. **Check**: Image still displays (not lost)

#### C. Layout Check
- ✅ Color fields are in 2-column grid
- ✅ Image section is full-width below
- ✅ Has plenty of space (not cramped)

**✅ PASS**: All features work smoothly.

---

## ⚡ Super Quick Smoke Test (3 min)

If you only have 3 minutes, test these critical paths:

1. **Orders Page**
   - Visit: http://localhost:3001/admin/orders
   - ✅ No crashes

2. **Create Product**
   - Visit: http://localhost:3001/admin/products/new
   - Set type to PHYSICAL
   - ✅ Product Attributes section appears

3. **Edit Variant**
   - Create product with variant
   - Click edit on variant
   - ✅ Form opens without errors

4. **Console Check**
   - F12 → Console tab
   - ✅ No red errors

---

## 🎯 What to Look For

### ✅ Good Signs
- Pages load quickly
- No red errors in console
- Forms submit successfully
- Images upload without errors
- "Guest Customer" displays for orders without customers

### ❌ Bad Signs
- "TypeError: Cannot read properties of undefined"
- "Multipart: Boundary not found"
- "Encountered two children with the same key"
- Page crashes or infinite loops
- Data doesn't persist after saving

---

## 📊 Results Template

Copy this and fill in your results:

```
QUICK TEST RESULTS
==================
Date: ___________
Browser: ___________

✅/❌ Orders page loads without customer
✅/❌ Guest customer displays correctly
✅/❌ Product Attributes section works
✅/❌ Real-time color preview works
✅/❌ Variant image persists
✅/❌ Edit button opens form
✅/❌ No console errors

Overall: PASS / FAIL

Notes:
_________________________________
_________________________________
```

---

## 🔍 If Something Fails

1. **Check browser console** for errors
2. **Take screenshot** of the issue
3. **Note exact steps** that caused it
4. **Try in different browser** (Chrome vs Firefox)
5. **Check network tab** for failed API calls

---

## 📚 Next Steps

After quick test passes:
1. Read full `TESTING_GUIDE.md` for comprehensive tests
2. Test in multiple browsers
3. Test on mobile devices
4. Test with larger datasets

---

**Time Budget**:
- Setup: 1 min
- Orders test: 5 min
- Product Attributes: 5 min
- Variants: 4 min
**Total: ~15 minutes**

Good luck! 🚀
