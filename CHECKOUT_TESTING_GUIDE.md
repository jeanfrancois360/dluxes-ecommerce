# 🧪 Checkout Testing Guide - Universal Address Form

**Date:** January 31, 2026
**Server:** http://localhost:3001
**Status:** Development server running
**Branch:** fix-stabilization

---

## 📋 Pre-Test Setup

### 1. Server Status

✅ **Development server is running** on `http://localhost:3001`

### 2. What to Test

We're testing the **Universal Address Form** integration in the checkout flow:
- Country dropdown with 197 countries
- Dynamic field visibility based on country selection
- Country-specific validation rules
- Phone prefix display
- Form submission to checkout flow

---

## 🧪 Test Scenarios

### Test 1: Rwanda 🇷🇼 (Minimal Format)

**Expected Behavior:**
- State/Province field: **HIDDEN**
- Postal Code field: **HIDDEN**
- Phone prefix: **+250**
- Required fields: Country, Full Name, Phone, Address, City only

**Steps:**
1. Navigate to `http://localhost:3001/checkout`
2. Select **"Rwanda"** from country dropdown
3. Verify state field is not visible
4. Verify postal code field is not visible
5. Fill in:
   - Full Name: "Jean Munyaneza"
   - Phone: "788123456" (should format to: 788 123 456)
   - Address: "KG 123 St, Kimihurura"
   - City: "Kigali"
6. Click "Continue to Shipping Method"
7. Verify form submits successfully

**Success Criteria:**
- ✅ Form only shows 5 required fields (no state, no postal)
- ✅ Phone displays with +250 prefix
- ✅ Validation passes without state/postal
- ✅ Proceeds to shipping step

---

### Test 2: United States 🇺🇸 (Full Format)

**Expected Behavior:**
- State field: **VISIBLE and REQUIRED**
- ZIP Code field: **VISIBLE and REQUIRED**
- Phone prefix: **+1**
- ZIP validation: 12345 or 12345-6789

**Steps:**
1. Change country to **"United States"**
2. Verify state field appears (with red asterisk *)
3. Verify ZIP Code field appears (with red asterisk *)
4. Fill in:
   - Full Name: "John Doe"
   - Phone: "5551234567" (should format to: (555) 123-4567)
   - Address: "123 Main Street, Apt 4B"
   - City: "New York"
   - State: "NY" (or type in field)
   - ZIP Code: "10001"
5. Test invalid ZIP: "123" → should show error
6. Fix with valid ZIP: "10001"
7. Submit form

**Success Criteria:**
- ✅ State and ZIP fields visible with required indicators
- ✅ Phone displays with +1 prefix
- ✅ ZIP validates correctly (rejects "123", accepts "10001")
- ✅ Form submission works

---

### Test 3: United Kingdom 🇬🇧 (Postal Only)

**Expected Behavior:**
- State/County field: **HIDDEN**
- Postcode field: **VISIBLE and REQUIRED**
- Phone prefix: **+44**
- Postcode validation: SW1A 1AA format

**Steps:**
1. Change country to **"United Kingdom"**
2. Verify state/county field is hidden
3. Verify postcode field is visible (required)
4. Fill in:
   - Full Name: "James Smith"
   - Phone: "2012345678" (should format to: 20 1234 5678)
   - Address: "10 Downing Street"
   - City: "London"
   - Postcode: "SW1A 1AA"
5. Test invalid postcode: "12345" → should show error
6. Fix with valid postcode: "SW1A 1AA"
7. Submit form

**Success Criteria:**
- ✅ State field hidden
- ✅ Postcode field visible and required
- ✅ Phone displays with +44 prefix
- ✅ Postcode validates UK format
- ✅ Form submission works

---

### Test 4: Philippines 🇵🇭 (Postal Optional)

**Expected Behavior:**
- State field: **HIDDEN**
- Postal Code field: **VISIBLE but OPTIONAL**
- Phone prefix: **+63**
- Postal pattern: 4 digits

**Steps:**
1. Change country to **"Philippines"**
2. Verify state field is hidden
3. Verify postal code field is visible (no red asterisk)
4. Fill in WITHOUT postal code:
   - Full Name: "Maria Santos"
   - Phone: "9171234567"
   - Address: "123 Rizal Avenue"
   - City: "Manila"
   - Postal Code: (leave empty)
5. Submit → should work
6. Go back and add postal: "1000"
7. Submit → should also work

**Success Criteria:**
- ✅ State field hidden
- ✅ Postal field visible but optional (no *)
- ✅ Form submits without postal code
- ✅ Form submits with valid postal code (4 digits)
- ✅ Phone displays with +63 prefix

---

### Test 5: Fiji 🇫🇯 (No Postal System)

**Expected Behavior:**
- State field: **HIDDEN**
- Postal Code field: **HIDDEN** (Fiji has no postal system)
- Phone prefix: **+679**

**Steps:**
1. Change country to **"Fiji"**
2. Verify both state and postal fields are hidden
3. Fill in:
   - Full Name: "Seru Rabeni"
   - Phone: "7123456"
   - Address: "Suva Central"
   - City: "Suva"
4. Submit form

**Success Criteria:**
- ✅ Both state and postal fields hidden
- ✅ Form submits with minimal fields only
- ✅ Phone displays with +679 prefix
- ✅ No postal validation errors

---

## 🔍 Additional Tests

### Test 6: Country Search

**Steps:**
1. Click on country dropdown
2. Type "Ger" in search box
3. Verify "Germany" appears in results
4. Type "new"
5. Verify "New Zealand" appears
6. Type "saint"
7. Verify all Saint countries appear (Saint Kitts, Saint Lucia, etc.)

**Success Criteria:**
- ✅ Search filters countries correctly
- ✅ Search is case-insensitive
- ✅ Partial matches work

---

### Test 7: Popular Countries Section

**Steps:**
1. Open country dropdown without typing
2. Verify "Popular Countries" section appears first
3. Expected popular countries:
   - Rwanda, Nigeria, Kenya, South Africa, Ghana (Africa)
   - United States, Canada, Brazil (Americas)
   - Singapore, India, Japan, China, UAE (Asia)
   - United Kingdom, France, Germany (Europe)
   - Australia (Oceania)

**Success Criteria:**
- ✅ Popular section appears before "All Countries"
- ✅ 17 popular countries visible
- ✅ Separator between popular and all countries

---

### Test 8: Dynamic Field Clearing

**Steps:**
1. Select "United States"
2. Fill in State: "NY" and ZIP: "10001"
3. Change country to "Rwanda"
4. Verify state and ZIP fields disappear
5. Change back to "United States"
6. Verify state and ZIP fields are empty (cleared)

**Success Criteria:**
- ✅ Incompatible fields are hidden when country changes
- ✅ Field values are cleared when hidden
- ✅ No validation errors from hidden fields

---

### Test 9: Phone Prefix Updates

**Steps:**
1. Select different countries and verify phone prefix updates:
   - Rwanda: +250
   - United States: +1
   - United Kingdom: +44
   - Philippines: +63
   - Germany: +49
   - Australia: +61
   - France: +33

**Success Criteria:**
- ✅ Phone prefix displays correctly for each country
- ✅ Prefix updates immediately when country changes
- ✅ Prefix is read-only (cannot be edited)

---

### Test 10: Validation Error Messages

**Steps:**
1. Select "United States"
2. Leave all fields empty
3. Click submit
4. Verify error messages appear for:
   - Full Name: "Full name is required"
   - Phone: "Phone number is required"
   - Address: "Address is required"
   - City: "City is required"
   - State: "State is required"
   - ZIP Code: "ZIP Code is required"
5. Fill in invalid ZIP: "abc"
6. Verify: "Invalid ZIP code format"

**Success Criteria:**
- ✅ All required field errors display
- ✅ Field-specific validation errors show
- ✅ Errors clear when field is corrected
- ✅ Page scrolls to first error

---

### Test 11: Form Submission Flow

**Steps:**
1. Fill in complete valid address (any country)
2. Check "Save as default address" checkbox
3. Submit form
4. Verify:
   - Loading state shows (button disabled, spinner)
   - Success toast appears
   - Proceeds to shipping step
   - Address is saved

**Success Criteria:**
- ✅ Loading state displays during submission
- ✅ Form doesn't allow double-submission
- ✅ Success feedback provided
- ✅ Navigation to next step works

---

## 🐛 Known Issues to Watch For

### Potential Issues

1. **Country dropdown not showing all 197 countries**
   - Check: Open dropdown and scroll to verify all countries present
   - Expected: Should see countries from A (Afghanistan) to Z (Zimbabwe)

2. **State field not hiding for Rwanda**
   - Check: Select Rwanda and verify no state field
   - Fix: Verify `showState: false` in country config

3. **Postal code validation too strict**
   - Check: Try submitting without postal for Philippines
   - Expected: Should work (postal is optional)

4. **Phone prefix not updating**
   - Check: Change countries and watch phone input
   - Expected: Prefix should change immediately

5. **TypeScript errors in console**
   - Check: Open browser console (F12)
   - Expected: No TypeScript/React errors

---

## 📊 Test Results Template

Use this template to record test results:

```markdown
### Test Results - [Date]

#### Test 1: Rwanda 🇷🇼
- ✅/❌ State field hidden
- ✅/❌ Postal field hidden
- ✅/❌ Phone prefix +250
- ✅/❌ Form submits
- Notes: _________

#### Test 2: United States 🇺🇸
- ✅/❌ State field visible & required
- ✅/❌ ZIP field visible & required
- ✅/❌ ZIP validates 12345 format
- ✅/❌ Form submits
- Notes: _________

#### Test 3: United Kingdom 🇬🇧
- ✅/❌ State field hidden
- ✅/❌ Postcode visible & required
- ✅/❌ Postcode validates SW1A 1AA
- ✅/❌ Form submits
- Notes: _________

#### Test 4: Philippines 🇵🇭
- ✅/❌ Postal optional (no asterisk)
- ✅/❌ Submits without postal
- ✅/❌ Phone prefix +63
- Notes: _________

#### Test 5: Fiji 🇫🇯
- ✅/❌ Both fields hidden
- ✅/❌ Form submits
- ✅/❌ Phone prefix +679
- Notes: _________

#### Additional Tests
- ✅/❌ Country search works
- ✅/❌ 197 countries available
- ✅/❌ Popular countries first
- ✅/❌ Phone prefix updates
- ✅/❌ Field clearing works
- ✅/❌ Validation messages clear

**Overall Status:** ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
```

---

## 🚨 Critical Bugs to Report

If you encounter any of these, report immediately:

1. **Form doesn't submit** - Checkout blocked
2. **All countries show same fields** - Dynamic behavior broken
3. **Country dropdown empty** - Country data not loading
4. **TypeScript errors in console** - Integration issues
5. **Phone prefix always +1** - Prefix not updating
6. **Cannot search countries** - Search broken

---

## ✅ Success Checklist

Before considering testing complete, verify:

- [ ] All 5 test countries work (Rwanda, US, UK, Philippines, Fiji)
- [ ] Country dropdown shows 197 countries
- [ ] Search functionality works
- [ ] Popular countries appear first
- [ ] Dynamic field hiding/showing works
- [ ] Phone prefix updates correctly
- [ ] Validation rules work per country
- [ ] Form submission works
- [ ] No console errors
- [ ] Mobile responsive (test on small screen)

---

## 📸 Screenshots to Take

For documentation, capture:
1. Country dropdown showing all countries
2. Rwanda form (minimal fields)
3. US form (full fields with state + ZIP)
4. UK form (postal only, no state)
5. Search functionality (typing "Ger" finds Germany)
6. Popular countries section
7. Validation errors display
8. Successful form submission

---

## 🔧 Troubleshooting

### Issue: Server won't start
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
pnpm dev:web
```

### Issue: Changes not reflecting
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev:web
```

### Issue: TypeScript errors
```bash
# Run type check
pnpm type-check
```

### Issue: Countries not loading
Check browser console for errors, verify:
- `apps/web/src/lib/data/address-countries.ts` exists
- No import errors
- No syntax errors in country configs

---

**Testing Start:** Open http://localhost:3001/checkout
**Report Results To:** This document (fill in template above)

---

*Ready to test! Follow the scenarios above and report any issues found.* 🧪
