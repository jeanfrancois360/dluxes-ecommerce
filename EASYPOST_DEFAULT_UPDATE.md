# EasyPost Set as Default Primary Shipping Provider

**Date:** March 20, 2026
**Status:** ✅ COMPLETED

---

## What Changed

### Previous Configuration (BEFORE):

- **Default Primary Provider:** DHL
- **EasyPost Enabled:** `false` (disabled by default)
- **Result:** Fresh installs used DHL as primary provider

### New Configuration (AFTER):

- **Default Primary Provider:** EasyPost
- **EasyPost Enabled:** `true` (enabled by default)
- **Result:** Fresh installs use EasyPost as primary multi-carrier provider

---

## Files Modified

### 1. **packages/database/prisma/seed-settings.ts**

**Line 921-931:** Changed `easypost_enabled` default from `false` → `true`

```typescript
{
  key: 'easypost_enabled',
  value: true,  // Changed from false
  defaultValue: true,  // Changed from false
  description: 'Enable EasyPost multi-carrier shipping integration (DEFAULT: Primary shipping provider)',
}
```

**Line 903-913:** Changed `shipping_primary_provider` from `'DHL'` → `'EasyPost'`

```typescript
{
  key: 'shipping_primary_provider',
  value: 'EasyPost',  // Changed from 'DHL'
  defaultValue: 'EasyPost',  // Changed from 'DHL'
  description: 'Primary shipping carrier for deliveries (EasyPost: multi-carrier, DHL: DHL Express only)',
  isEditable: true,  // Changed from false
}
```

### 2. **apps/api/src/orders/shipping-tax.service.ts**

Updated comments to clarify EasyPost is PRIMARY/DEFAULT provider:

```typescript
// TIER 1 (EasyPost): PRIMARY/DEFAULT provider - Multi-carrier rates
```

### 3. **CLAUDE.md**

Updated documentation:

```markdown
- EasyPost is the PRIMARY/DEFAULT shipping provider (enabled by default, checked first in cascade)
```

### 4. **New Files Created**

- `update-easypost-default.sql` - Migration script for existing databases

---

## Shipping Provider Priority (Confirmed Accurate)

### ✅ Tier Order:

1. **TIER 0:** Gelato (POD items only)
2. **TIER 1:** EasyPost ← **PRIMARY/DEFAULT** (multi-carrier: USPS, UPS, FedEx, DHL, etc.)
3. **TIER 2:** DHL (DHL Express only, if enabled)
4. **TIER 3:** Zones or Manual (final fallback)

### Fresh Install Behavior (NEW):

```
Cart Submitted
    ↓
[Has POD items?] → Gelato (if applicable)
    ↓
[EasyPost] ✅ ENABLED BY DEFAULT
    ├─ Success → Returns EasyPost rates (USPS, UPS, FedEx, etc.)
    └─ Failed → Falls back to DHL/Zones/Manual
```

---

## How to Apply Changes

### For Fresh Installs (New Databases):

```bash
# Just run the seed as normal
cd packages/database
pnpm prisma migrate deploy
pnpm prisma db seed
```

### For Existing Databases:

```bash
# Option 1: Run SQL migration script
psql $DATABASE_URL -f update-easypost-default.sql

# Option 2: Update via Prisma
cd packages/database
pnpm prisma db seed  # Re-runs seed with new defaults
```

### Verify Changes:

```sql
SELECT key, value, "defaultValue"
FROM "SystemSetting"
WHERE key IN ('easypost_enabled', 'shipping_primary_provider');
```

Expected output:

```
easypost_enabled        | true      | true
shipping_primary_provider | EasyPost  | EasyPost
```

---

## Environment Variables Required

To use EasyPost as primary provider, ensure these are set:

```bash
# Required
EASYPOST_API_KEY=EZTK...  # Test key (FREE)
EASYPOST_TEST_MODE=true

# Optional
EASYPOST_WEBHOOK_SECRET=whsec_...
```

Get your free test API key: https://www.easypost.com/signup

---

## Testing

### Test EasyPost is Active:

```bash
curl http://localhost:4000/api/v1/easypost/test
# Should return: {"status":"ok","message":"EasyPost connection successful"}
```

### Test Shipping Rates:

```bash
# Make a test order and check Network tab
# Should see: [EasyPost] Using EasyPost rates (3 options)
```

---

## Rollback (If Needed)

To revert to DHL as primary:

```sql
UPDATE "SystemSetting"
SET value = false
WHERE key = 'easypost_enabled';

UPDATE "SystemSetting"
SET value = 'DHL'
WHERE key = 'shipping_primary_provider';
```

---

## Benefits of EasyPost as Default

✅ **Multi-carrier comparison:** Get best rates from USPS, UPS, FedEx, DHL, etc.
✅ **Lower costs:** Competitive rates from multiple carriers
✅ **More flexibility:** Customers can choose preferred carrier
✅ **Automatic labels:** Sellers generate labels in one click
✅ **Real-time tracking:** Webhook updates from all carriers
✅ **Address validation:** Reduces delivery errors
✅ **Free testing:** Test mode has no charges

---

## Summary

- ✅ EasyPost is now the default primary shipping provider
- ✅ Enabled by default on fresh installs
- ✅ Cascade logic remains unchanged (Gelato → EasyPost → DHL → Manual)
- ✅ DHL still available as secondary provider in hybrid mode
- ✅ Backward compatible (can be disabled via settings)

**All changes are backward compatible.** Existing installations with custom configurations will not be affected unless you run the migration script.
