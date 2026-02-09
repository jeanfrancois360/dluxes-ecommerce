# Translation Audit Report - Admin Pages

**Date:** February 9, 2026
**Scope:** All 30 admin pages in `/apps/web/src/app/admin`
**Translation File:** `/apps/web/messages/en.json`

---

## Executive Summary

**Total Issues Found:** 184 missing translation keys across 7 namespaces

### Critical Issue

**adminCategories** uses `pageSubtitle` but the translation file has `pageDescription`.

**Location:** `/apps/web/src/app/admin/categories/page.tsx` line 530

**Current Code:**

```tsx
<PageHeader
  title={t('pageTitle')}
  description={t('pageSubtitle')} // ❌ WRONG - key doesn't exist
/>
```

**Fix Required:** Change to `t('pageDescription')` OR add `pageSubtitle` to en.json

---

## Detailed Findings

### 1. adminCategories (1 missing key)

- **Missing Key:** `pageSubtitle`
- **File:** `/apps/web/src/app/admin/categories/page.tsx`
- **Impact:** Page subtitle won't display
- **Fix:** Add to en.json or change code to use `pageDescription`

### 2. adminCustomers (100 missing keys)

- **Namespace Issue:** Code uses `adminCustomers.modals` for the ConfirmationModal component
- **Missing Keys Include:**
  - All modal keys (`modals.delete.*`, `modals.suspend.*`, `modals.bulkSuspend.*`)
  - All button labels (`buttons.view`, `buttons.suspend`, `buttons.activate`, etc.)
  - All filter keys (`filters.allRoles`, `filters.segments.*`, `filters.sortBy.*`)
  - All table headers (`table.headers.*`)
  - All toast messages (`toasts.*`)
  - Pagination labels
  - Stats labels
  - Export headers

**Critical Impact:** Most UI elements will show raw translation keys instead of user-friendly text

### 3. adminOrders (77 missing keys)

- **Namespace:** Code uses `adminOrders.filters.status` in one place, should be `adminOrders`
- **Similar Issues to adminCustomers:**
  - All filters, buttons, table headers, toasts, pagination
  - Bulk actions
  - Export functionality

### 4. adminPayouts (2 missing keys)

- `title`
- `description`

### 5. adminProducts (2 junk keys)

- `-` and `a` (regex parsing errors, can be ignored)

### 6. adminShipping (1 junk key)

- `,` (regex parsing error, can be ignored)

### 7. adminReviews (1 junk key)

- `-` (regex parsing error, can be ignored)

---

## Root Cause Analysis

### Why This Happened

1. **Incomplete Translation Migration:** When pages were created/updated, translations weren't fully added to en.json
2. **Nested Namespace Pattern:** Some components use nested namespaces (e.g., `adminCustomers.modals`) which require careful JSON structure
3. **Copy-Paste Without Translation Updates:** Developers likely copied components between pages without updating translation files

---

## Recommended Fixes

### Option 1: Add All Missing Keys (RECOMMENDED)

Add all 184 missing keys to `en.json`. I've prepared a complete set in `/missing-translations.json`.

**Pros:**

- Complete coverage
- Future-proof
- All features will work properly

**Cons:**

- Larger changeset
- Takes more time

### Option 2: Fix Only Critical Keys

Fix only:

1. `adminCategories.pageSubtitle`
2. Core `adminCustomers` keys (modals, buttons, basic UI)
3. Core `adminOrders` keys

**Pros:**

- Faster to implement
- Smaller changeset

**Cons:**

- Some features won't have proper labels
- Will need follow-up fixes

---

## Implementation Steps

### Step 1: Fix adminCategories (Immediate)

**Option A:** Change the code (simplest)

```tsx
// File: apps/web/src/app/admin/categories/page.tsx
// Line 530

// Change from:
<PageHeader
  title={t('pageTitle')}
  description={t('pageSubtitle')}
/>

// To:
<PageHeader
  title={t('pageTitle')}
  description={t('pageDescription')}
/>
```

**Option B:** Add to en.json

```json
{
  "adminCategories": {
    "pageSubtitle": "Manage product categories and hierarchies"
    // ... rest of existing keys
  }
}
```

### Step 2: Add Missing adminCustomers Keys

Merge the content from `/missing-translations.json` into your `en.json` file under the `adminCustomers` section.

The structure should be:

```json
{
  "adminCustomers": {
    "pageTitle": "Customers",
    "pageDescription": "...",
    "modals": {
      "delete": { ... },
      "suspend": { ... },
      "bulkSuspend": { ... }
    },
    "buttons": { ... },
    "filters": { ... },
    // etc.
  }
}
```

### Step 3: Add Missing adminOrders Keys

Same approach as adminCustomers.

### Step 4: Add Missing adminPayouts Keys

Simple addition:

```json
{
  "adminPayouts": {
    "title": "Seller Payouts",
    "description": "Manage seller payouts and commissions"
    // ... rest of existing keys
  }
}
```

---

## Verification

After implementing fixes, run:

```bash
# Re-run the analysis
python3 analyze-translations.py

# Should show 0 missing keys
```

---

## Prevention Strategy

### For Future Development

1. **Translation Checklist:** Before merging any PR with new UI:
   - [ ] All `t('...')` calls have corresponding keys in en.json
   - [ ] Run translation audit script
   - [ ] Test in browser to ensure no raw keys are visible

2. **Automated Check:** Add to CI/CD:

   ```bash
   # In your GitHub Actions or pre-commit hook
   python3 scripts/check-translations.py
   ```

3. **IDE Extension:** Use i18n extensions that highlight missing translation keys

4. **Component Template:** Create a template for new admin pages that includes complete translation structure

---

## Files Modified

After implementing all fixes:

- `/apps/web/messages/en.json` (primary changes)
- `/apps/web/src/app/admin/categories/page.tsx` (if using Option A for pageSubtitle)

---

## Complete List of Missing Keys

See `/translation-audit-report.json` for machine-readable format with all details.

---

## Questions?

If you need clarification on any missing key or want to prioritize certain fixes, let me know which pages are most critical to your users.
