# STEP 3 COMPLETE: Referral Settings Added to Seed File ✅

**Date:** March 29, 2026
**Version:** v2.11.0 - Dynamic Referral Management Module
**Category:** `referral` (13 settings)

---

## Settings Added

All 13 referral system settings have been added to `packages/database/prisma/seed.ts` (lines 2231-2451).

### 1. System Control Settings

#### `referral_enabled`

```typescript
{
  key: 'referral_enabled',
  category: 'referral',
  value: true,
  valueType: 'BOOLEAN',
  label: 'Enable Referral System',
  description: 'Enable or disable the entire referral system...',
  defaultValue: true,
}
```

**Purpose:** Master switch for the entire referral system
**Default:** `true` (enabled)
**Impact:** When disabled, no codes can be used, no rewards granted

---

#### `referral_auto_generate_code`

```typescript
{
  key: 'referral_auto_generate_code',
  value: true,
  valueType: 'BOOLEAN',
  label: 'Auto-Generate Referral Codes on Registration',
  defaultValue: true,
}
```

**Purpose:** Automatically create referral code for every new user
**Default:** `true` (auto-generate)
**Impact:** If false, users must manually generate codes from settings

---

### 2. Reward Amount Settings

#### `referral_buyer_reward`

```typescript
{
  key: 'referral_buyer_reward',
  value: 10.0,
  valueType: 'NUMBER',
  label: 'Buyer Referral Reward (USD)',
  description: 'Store credit given when referred BUYER makes first qualifying purchase',
  defaultValue: 10.0,
}
```

**Purpose:** Reward amount for successful buyer referrals
**Default:** `$10.00 USD`
**Type:** Store credit (can be used for purchases)

---

#### `referral_seller_reward`

```typescript
{
  key: 'referral_seller_reward',
  value: 50.0,
  valueType: 'NUMBER',
  label: 'Seller Referral Reward (USD)',
  description: 'Store credit given when referred SELLER creates first product',
  defaultValue: 50.0,
}
```

**Purpose:** Reward amount for successful seller referrals
**Default:** `$50.00 USD`
**Rationale:** Higher reward because sellers add more value to the platform

---

### 3. Qualification Settings

#### `referral_min_order_value`

```typescript
{
  key: 'referral_min_order_value',
  value: 25.0,
  valueType: 'NUMBER',
  label: 'Minimum Order Value for Buyer Qualification (USD)',
  description: 'Minimum order value required for buyer referral to qualify',
  defaultValue: 25.0,
}
```

**Purpose:** Prevent gaming the system with small orders
**Default:** `$25.00 USD`
**Note:** Set to `0` to allow any order value

---

#### `referral_buyer_expiration_days`

```typescript
{
  key: 'referral_buyer_expiration_days',
  value: 90,
  valueType: 'NUMBER',
  label: 'Buyer Referral Expiration (Days)',
  description: 'Days buyer has to make first qualifying purchase',
  defaultValue: 90,
}
```

**Purpose:** Create urgency for referred buyers to make purchase
**Default:** `90 days` (3 months)
**Note:** Set to `0` for no expiration

---

#### `referral_seller_expiration_days`

```typescript
{
  key: 'referral_seller_expiration_days',
  value: 180,
  valueType: 'NUMBER',
  label: 'Seller Referral Expiration (Days)',
  description: 'Days seller has to create first product',
  defaultValue: 180,
}
```

**Purpose:** Give sellers more time to onboard and list products
**Default:** `180 days` (6 months)
**Rationale:** Selling requires more setup than buying

---

### 4. Code Generation Settings

#### `referral_code_length`

```typescript
{
  key: 'referral_code_length',
  value: 8,
  valueType: 'NUMBER',
  label: 'Referral Code Length',
  description: 'Length of auto-generated codes (excluding prefix). Min: 6, Max: 12',
  defaultValue: 8,
}
```

**Purpose:** Control code length for usability and security
**Default:** `8 characters`
**Example:** `ABCD1234` (8 chars) or `REFABCD1234` (with prefix)

---

#### `referral_code_prefix`

```typescript
{
  key: 'referral_code_prefix',
  value: '',
  valueType: 'STRING',
  label: 'Referral Code Prefix',
  description: 'Optional prefix for all codes. Max 4 characters.',
  defaultValue: '',
}
```

**Purpose:** Brand referral codes (e.g., "NEXT" → "NEXTABCD1234")
**Default:** Empty (no prefix)
**Max Length:** 4 characters

---

#### `referral_max_usage_per_code`

```typescript
{
  key: 'referral_max_usage_per_code',
  value: 0,
  valueType: 'NUMBER',
  label: 'Maximum Uses Per Referral Code',
  description: 'Max times a code can be used. 0 = unlimited',
  defaultValue: 0,
}
```

**Purpose:** Limit code usage to prevent abuse
**Default:** `0` (unlimited uses)
**Note:** Useful for promotional campaigns with limited spots

---

### 5. Reward Usage Settings

#### `referral_min_payout_amount`

```typescript
{
  key: 'referral_min_payout_amount',
  value: 5.0,
  valueType: 'NUMBER',
  label: 'Minimum Store Credit Balance for Use (USD)',
  description: 'Min balance before users can use referral rewards',
  defaultValue: 5.0,
}
```

**Purpose:** Prevent micro-transactions and processing overhead
**Default:** `$5.00 USD`
**Note:** Set to `0` to allow any amount

---

### 6. Currency Settings

#### `referral_reward_currency`

```typescript
{
  key: 'referral_reward_currency',
  value: 'USD',
  valueType: 'STRING',
  label: 'Referral Reward Currency',
  description: 'Currency for all referral rewards',
  defaultValue: 'USD',
}
```

**Purpose:** Standardize reward currency
**Default:** `USD`
**Note:** Should match platform's primary currency

---

### 7. Gamification Settings

#### `referral_show_leaderboard`

```typescript
{
  key: 'referral_show_leaderboard',
  value: true,
  valueType: 'BOOLEAN',
  label: 'Show Public Referral Leaderboard',
  description: 'Display public leaderboard showing top referrers',
  defaultValue: true,
}
```

**Purpose:** Encourage competition and increase referral activity
**Default:** `true` (show leaderboard)
**Privacy:** Users can opt-out individually from privacy settings

---

## Settings Summary Table

| Setting Key                       | Type    | Default | Category | Editable |
| --------------------------------- | ------- | ------- | -------- | -------- |
| `referral_enabled`                | BOOLEAN | `true`  | referral | ✅       |
| `referral_buyer_reward`           | NUMBER  | `10.0`  | referral | ✅       |
| `referral_seller_reward`          | NUMBER  | `50.0`  | referral | ✅       |
| `referral_min_order_value`        | NUMBER  | `25.0`  | referral | ✅       |
| `referral_buyer_expiration_days`  | NUMBER  | `90`    | referral | ✅       |
| `referral_seller_expiration_days` | NUMBER  | `180`   | referral | ✅       |
| `referral_code_length`            | NUMBER  | `8`     | referral | ✅       |
| `referral_code_prefix`            | STRING  | `''`    | referral | ✅       |
| `referral_max_usage_per_code`     | NUMBER  | `0`     | referral | ✅       |
| `referral_reward_currency`        | STRING  | `'USD'` | referral | ✅       |
| `referral_auto_generate_code`     | BOOLEAN | `true`  | referral | ✅       |
| `referral_min_payout_amount`      | NUMBER  | `5.0`   | referral | ✅       |
| `referral_show_leaderboard`       | BOOLEAN | `true`  | referral | ✅       |

**Total Settings:** 13
**All Editable:** Yes (via Admin UI)
**Category:** `referral`
**Public Settings:** None (all admin-only)

---

## How Settings Are Used

### 1. Admin Configuration

Settings can be changed via Admin UI:

```
Admin Dashboard → Settings → Referral
```

Each setting includes:

- ✅ Label (human-readable)
- ✅ Description (help text)
- ✅ Default value (fallback)
- ✅ Value type validation (BOOLEAN, NUMBER, STRING)
- ✅ Audit log (who changed, when, old/new values)

---

### 2. Service Layer Access

**In ReferralService:**

```typescript
async getReferralBuyerReward(): Promise<number> {
  try {
    const setting = await this.settingsService.getSetting('referral_buyer_reward');
    return Number(setting.value) || 10.0; // Default fallback
  } catch (error) {
    return 10.0; // Fallback if setting doesn't exist
  }
}

async isReferralEnabled(): Promise<boolean> {
  try {
    const setting = await this.settingsService.getSetting('referral_enabled');
    return Boolean(setting.value);
  } catch (error) {
    return true; // Default to enabled
  }
}
```

**Bulk Fetch (Optimized):**

```typescript
async getReferralSettings(): Promise<ReferralSettings> {
  const settings = await this.settingsService.getSettingsByCategory('referral');

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);

  return {
    enabled: Boolean(settingsMap['referral_enabled'] ?? true),
    buyerReward: Number(settingsMap['referral_buyer_reward']) || 10.0,
    sellerReward: Number(settingsMap['referral_seller_reward']) || 50.0,
    // ... all other settings
  };
}
```

---

### 3. Settings Validation

**Type Safety:**

- ✅ `valueType: 'BOOLEAN'` → Only true/false accepted
- ✅ `valueType: 'NUMBER'` → Only numbers accepted
- ✅ `valueType: 'STRING'` → Only strings accepted

**Business Rules:**

```typescript
// Code length must be 6-12
if (codeLength < 6 || codeLength > 12) {
  throw new Error('Code length must be between 6 and 12');
}

// Prefix max 4 characters
if (prefix.length > 4) {
  throw new Error('Prefix must be 4 characters or less');
}

// Min order value cannot be negative
if (minOrderValue < 0) {
  throw new Error('Minimum order value cannot be negative');
}
```

---

## Applying the Settings

### Option 1: Run Seed Script (Recommended)

```bash
cd packages/database
pnpm prisma db seed
```

This will:

- ✅ Create/update all 13 referral settings
- ✅ Use `upsert` (won't duplicate if run multiple times)
- ✅ Set `lastUpdatedBy` to superAdmin.id
- ✅ Apply default values

**Output:**

```
✅ Created 56 system settings (including 13 new referral settings)
```

---

### Option 2: Manual Database Insert

```sql
-- If you prefer direct SQL insertion
INSERT INTO "SystemSetting" (
  "id", "key", "category", "value", "valueType", "label",
  "description", "isPublic", "isEditable", "requiresRestart",
  "defaultValue", "lastUpdatedBy", "createdAt", "updatedAt"
) VALUES
  -- Insert each setting...
  (gen_random_uuid(), 'referral_enabled', 'referral', 'true', 'BOOLEAN', ...),
  (gen_random_uuid(), 'referral_buyer_reward', 'referral', '10.0', 'NUMBER', ...);
```

---

### Option 3: Via Admin API (After STEP 8)

```bash
# Using the settings API
POST /api/v1/settings
{
  "key": "referral_enabled",
  "category": "referral",
  "value": true,
  "valueType": "BOOLEAN",
  "label": "Enable Referral System",
  "description": "...",
  "isEditable": true
}
```

---

## Testing the Settings

### 1. Verify Settings Created

```bash
# After running seed
cd packages/database
pnpm prisma studio

# Navigate to: SystemSetting table
# Filter by: category = 'referral'
# Expected: 13 rows
```

---

### 2. Test Settings Service

```typescript
// Test file: apps/api/src/settings/settings.service.spec.ts
describe('Referral Settings', () => {
  it('should get referral_enabled setting', async () => {
    const setting = await settingsService.getSetting('referral_enabled');
    expect(setting.key).toBe('referral_enabled');
    expect(setting.valueType).toBe('BOOLEAN');
    expect(setting.value).toBe(true);
  });

  it('should get all referral settings', async () => {
    const settings = await settingsService.getSettingsByCategory('referral');
    expect(settings).toHaveLength(13);
  });
});
```

---

### 3. Verify TypeScript Types

```typescript
import { SettingValueType } from '@prisma/client';

// Should not have TypeScript errors
const setting = await prisma.systemSetting.findUnique({
  where: { key: 'referral_enabled' },
});

if (setting?.valueType === 'BOOLEAN') {
  const enabled: boolean = Boolean(setting.value);
}
```

---

## Admin UI Preview

**Location:** `Admin Dashboard → Settings → Referral`

**Expected UI:**

```
┌─────────────────────────────────────────────────────────┐
│ Referral System Settings                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔧 System Control                                        │
│ ├─ Enable Referral System            [✓] Enabled       │
│ └─ Auto-Generate Codes on Registration [✓] Enabled     │
│                                                          │
│ 💰 Reward Amounts                                        │
│ ├─ Buyer Referral Reward             [$10.00]          │
│ └─ Seller Referral Reward            [$50.00]          │
│                                                          │
│ ✅ Qualification Rules                                   │
│ ├─ Min Order Value (Buyers)          [$25.00]          │
│ ├─ Buyer Expiration (Days)           [90]              │
│ └─ Seller Expiration (Days)          [180]             │
│                                                          │
│ 🎫 Code Generation                                       │
│ ├─ Code Length                        [8]               │
│ ├─ Code Prefix                        [    ]            │
│ └─ Max Uses Per Code                  [0] (Unlimited)   │
│                                                          │
│ 💳 Reward Usage                                          │
│ └─ Min Balance for Use                [$5.00]           │
│                                                          │
│ 🏆 Gamification                                          │
│ └─ Show Public Leaderboard            [✓] Enabled       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

### ✅ STEP 3 COMPLETE - Ready for STEP 4

**STEP 4:** Create Referral Service

- ReferralService with 10+ methods
- Integration with SettingsService
- Non-blocking error handling
- Transaction-safe operations
- Logger for debugging

**Methods to Implement:**

1. `generateReferralCode(userId)`
2. `validateReferralCode(code)`
3. `applyReferralCode(code, newUserId)`
4. `getReferralSummary(userId)`
5. `getReferralHistory(userId, filters)`
6. `checkBuyerQualification(orderId)`
7. `checkSellerQualification(sellerId)`
8. `grantReferralReward(referralId)`
9. `getReferralSettings()`
10. `getTopReferrers(limit)`

**Proceed to STEP 4?** Yes/No

---

## Files Modified

1. ✏️ `packages/database/prisma/seed.ts` (+220 lines, 13 settings added)

**Total Settings Count:** 56 → 69 (13 new)

---

## Rollback Instructions

To remove referral settings:

```sql
DELETE FROM "SystemSetting" WHERE category = 'referral';
```

Or via seed script (remove lines 2231-2451).

---

**Status:** ✅ STEP 3 COMPLETE
**Next:** STEP 4 - Create Referral Service (Backend)
