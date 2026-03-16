# EasyPost Manual Test Guide

**Date:** March 17, 2026
**Status:** Ready for Testing

---

## Prerequisites

✅ EasyPost settings seeded in database
✅ Frontend components integrated
✅ User logged in as SELLER or ADMIN
✅ Test order available: **#ORD-1773606661947**

---

## Test Flow Overview

1. **Admin Settings** - Configure EasyPost (5 min)
2. **Rate Fetching** - Get shipping rates (2 min)
3. **Label Purchase** - Buy shipping label (3 min)
4. **Tracking Display** - View tracking info (2 min)

**Total Time:** ~12 minutes

---

## Part 1: Admin Settings Configuration

### Step 1: Navigate to Admin Settings

1. Open browser: `http://localhost:3000`
2. Navigate to: **Admin → Settings**
3. Click tab: **"EasyPost Shipping"**

### Step 2: Configure EasyPost Settings

You should see the EasyPost configuration panel. The settings are already populated with defaults:

**Expected Settings:**

```
✓ Enable EasyPost: ON (enabled)
✓ API Key: EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q
✓ Test Mode: ON (enabled)
✓ Default Label Format: PDF
✓ Address Verification: ON
✓ Default Carriers: USPS, UPS, FedEx
```

### Step 3: Test Save Functionality

1. Click **"Save Settings"** button
2. **Expected:** ✅ Success toast: "EasyPost settings saved successfully"
3. **If Error:** Check browser console and report error message

**✅ Checkpoint:** Settings save without errors

---

## Part 2: Rate Fetching (Core Test)

### Step 1: Navigate to Order Details

1. Go to: **Seller Dashboard → Orders**
2. Click on order: **#ORD-1773606661947**
   - Or any order with status **PROCESSING**
   - Must have shipping address

### Step 2: Locate EasyPost Button

Scroll down to **"Create Shipment"** section.

**Expected to see:**

```
┌─────────────────────────────────────┐
│ 🚚 Create Shipment                  │
│                                     │
│ 📦 Ready to ship! Choose your       │
│ preferred shipping method below.    │
│                                     │
│ [Get Shipping Label] ← EasyPost     │
│ [Create Shipment with DHL]          │
└─────────────────────────────────────┘
```

### Step 3: Click "Get Shipping Label"

1. Click the **"Get Shipping Label"** button
2. **Expected:** Modal opens with loading state
3. **Wait:** API fetches rates from EasyPost (5-10 seconds)

### Step 4: Review Rate Comparison

**Expected Modal Content:**

```
┌─────────────────────────────────────┐
│ 🚚 Select Shipping Rate             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ USPS - Priority Mail            │ │
│ │ Estimated 2 business days       │ │
│ │                      $XX.XX USD │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ UPS - Ground                    │ │
│ │ Estimated 3 business days       │ │
│ │                      $XX.XX USD │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... more rates ...                  │
│                                     │
│ [Cancel]            [Purchase Label]│
└─────────────────────────────────────┘
```

### Step 5: Verify Rate Details

**Check that each rate shows:**

- ✓ Carrier name (USPS, UPS, FedEx, etc.)
- ✓ Service type (Priority, Ground, Express, etc.)
- ✓ Price in USD
- ✓ Estimated delivery days
- ✓ Optional: Delivery date
- ✓ Optional: "Guaranteed Delivery" badge

**Troubleshooting:**

| Issue            | Cause                    | Solution                                       |
| ---------------- | ------------------------ | ---------------------------------------------- |
| No rates shown   | Invalid address          | Check shipping address has all required fields |
| API error        | EasyPost API key invalid | Verify API key in admin settings               |
| 401 Unauthorized | Not logged in as SELLER  | Log in as seller account                       |
| Timeout          | Network/API slow         | Wait longer or check API status                |

**✅ Checkpoint:** Multiple carrier rates displayed

---

## Part 3: Label Purchase

### Step 1: Select a Rate

1. Click on any rate card to select it
2. **Expected:** Card highlights with blue border
3. **Expected:** "Purchase Label" button becomes enabled

### Step 2: Purchase Label

1. Click **"Purchase Label"** button
2. **Expected:** Loading spinner shows
3. **Wait:** Label purchase completes (3-5 seconds)

### Step 3: Verify Label Success

**Expected Success Screen:**

```
┌─────────────────────────────────────┐
│ 📦 Label Purchased                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Tracking Number                 │ │
│ │ EZ1234567890                    │ │
│ │ USPS - Priority                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Estimated Delivery: Mar 20, 2026    │
│                                     │
│ [Download Label (PDF)]              │
│ [Track Package]                     │
│                                     │
│ [Done]                              │
└─────────────────────────────────────┘
```

### Step 4: Download Label

1. Click **"Download Label (PDF)"**
2. **Expected:** PDF file downloads
3. **Verify:** PDF contains shipping label with barcode

### Step 5: Test Tracking URL

1. Click **"Track Package"**
2. **Expected:** Opens carrier tracking page in new tab
3. **Verify:** Tracking number is displayed on carrier website

**✅ Checkpoint:** Label downloaded and tracking URL works

---

## Part 4: Tracking Display (Optional)

### Step 1: Get Shipment ID

From the browser console, after label purchase:

1. Open DevTools (F12)
2. Go to Network tab
3. Find `/easypost/purchase` request
4. Check response for `shipmentId`

### Step 2: View Tracking Component

Currently, the tracking component can be tested by:

1. Adding it to the order details page manually, OR
2. Testing via Storybook (if available), OR
3. Wait for customer order tracking feature

**Expected Tracking Display:**

```
┌─────────────────────────────────────┐
│ 🚚 Package Tracking                 │
│ EZ1234567890 | USPS                │
│ [Track] [Refresh]                   │
├─────────────────────────────────────┤
│ Current Status                      │
│ ● In Transit                        │
│ Package is on its way               │
│ Est. Delivery: Mar 20, 2026         │
├─────────────────────────────────────┤
│ Tracking History                    │
│                                     │
│ ● Departed USPS Facility            │
│   Oakland, CA                       │
│   Mar 17, 2026 10:30 AM            │
│                                     │
│ ○ Arrived at USPS Facility          │
│   San Francisco, CA                 │
│   Mar 17, 2026 8:15 AM             │
└─────────────────────────────────────┘
```

---

## Expected Results Summary

### ✅ Success Criteria

- [ ] Admin settings page loads without errors
- [ ] Can save EasyPost settings successfully
- [ ] "Get Shipping Label" button visible on order page
- [ ] Rate comparison modal opens and loads rates
- [ ] Multiple carriers shown (USPS, UPS, FedEx)
- [ ] Can select a rate
- [ ] Label purchase completes successfully
- [ ] PDF label downloads
- [ ] Tracking number displayed
- [ ] Tracking URL opens carrier website

### ❌ Known Limitations

1. **Product Weights:** Using default 16 oz per item
   - Future: Add weight field to products

2. **Store Address:** Using fallback if not set
   - Future: Require sellers to set store address

3. **Address Fields:** Mismatch between DB fields and EasyPost
   - DB uses: `address1`, `province`, `postalCode`
   - EasyPost expects: `street1`, `state`, `zip`
   - **Action Needed:** Map address fields correctly

---

## Test Data

### Test Order Details

```
Order ID: cmms7m2xi000yosre60tgukqg
Order Number: ORD-1773606661947
Status: PROCESSING

Customer: Jean Francois Munyaneza
Email: mjeanfrancois360@gmail.com

Shipping Address:
  15 Rue de Rivoli
  Paris, 75004
  France

Store ID: cmlxy8xo0000cospdaczor0s9
```

### EasyPost API Key (Test)

```
Key: EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q
Mode: Test
Status: Active
```

---

## Troubleshooting

### Issue: "Failed to update setting (404)"

**Cause:** EasyPost settings not seeded in database

**Solution:**

```bash
cd packages/database
node seed-easypost.js
```

### Issue: "Unauthorized" when clicking button

**Cause:** Not logged in as SELLER or ADMIN

**Solution:**

- Log in with seller account
- Check user role in database

### Issue: No rates returned

**Possible Causes:**

1. Invalid address (missing required fields)
2. EasyPost API key expired
3. Network/firewall blocking API calls
4. International shipping restrictions

**Solution:**

- Check browser console for detailed error
- Verify address has street, city, state/province, zip, country
- Test with US domestic address first

### Issue: Address field mismatch

**Problem:**

- Order has `address1` but EasyPost expects `street1`
- Order has `province` but EasyPost expects `state`
- Order has `postalCode` but EasyPost expects `zip`

**Current Workaround:**
Component maps fields automatically in the seller order page

**Permanent Fix Needed:**
Update address mapping in backend service

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Document Results** - Take screenshots of success
2. **Add Product Weights** - Enhance parcel calculation
3. **Add Store Addresses** - For accurate "from" addresses
4. **Implement Webhooks** - Auto-update tracking status
5. **Deploy to Production** - Push changes live

### If Tests Fail ❌

1. **Note Error Messages** - Screenshot and copy full error
2. **Check Browser Console** - Look for detailed errors
3. **Check Network Tab** - Verify API requests/responses
4. **Report Issues** - Share errors for debugging

---

## Support

**Questions?** Check these docs:

- `EASYPOST_SETUP_COMPLETE.md` - Full setup guide
- `EASYPOST_SETTINGS_FIX.md` - Settings troubleshooting
- `EASYPOST_FRONTEND_COMPLETE.md` - Component documentation

**Need Help?**

- Check browser console for errors
- Review backend API logs
- Verify database settings exist

---

**Ready to Test!** 🚀

Start with Part 1 (Admin Settings) and work through each section in order.
