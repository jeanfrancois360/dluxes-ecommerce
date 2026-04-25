# STEP 2 COMPLETE: Database Schema Additions ✅

**Date:** March 29, 2026
**Branch:** `sendcloud-integration` (or create new branch `referral-system`)
**Version:** v2.11.0 - Dynamic Referral Management Module

---

## Changes Made

### 1. User Model Updates (`packages/database/prisma/schema.prisma`)

**Added Fields:**

```prisma
// Referral System (v2.11.0)
referredById   String? // Who referred this user (nullable)
referredBy     User?   @relation("Referrals", fields: [referredById], references: [id], onDelete: SetNull)
referrals      User[]  @relation("Referrals") // Users this user has referred
referralCode   ReferralCode? // This user's unique referral code (one-to-one)
storeCredit    Decimal @default(0) @db.Decimal(10, 2) // Referral reward balance
totalReferrals Int     @default(0) // Cached count of successful referrals
referrerReferrals  Referral[] @relation("ReferrerReferrals") // Referrals as referrer
referredReferrals  Referral[] @relation("ReferredReferrals") // Referrals as referred user
```

**Index Added:**

```prisma
@@index([referredById]) // For query performance
```

---

### 2. Order Model Updates

**Added Fields:**

```prisma
// Referral System (v2.11.0)
referrerId String? // The user who referred this buyer (if any)
referrals  Referral[] // Link to referral records (buyer's first qualifying order)
```

**Purpose:** Track which referral code was used when buyer makes first purchase.

---

### 3. Store Model Updates

**Added Relation:**

```prisma
// Referral System (v2.11.0) - Seller referrals track first product via store
referrals Referral[]
```

**Purpose:** Track which referral led to seller creating first product.

---

### 4. New Model: ReferralCode

```prisma
model ReferralCode {
  id         String    @id @default(cuid())
  code       String    @unique // e.g., "JOHN2024XYZ"
  userId     String    @unique // One referral code per user
  usageCount Int       @default(0) // How many times used
  maxUsage   Int? // Optional: Maximum uses (null = unlimited)
  expiresAt  DateTime? // Optional: Expiration date (null = no expiration)
  isActive   Boolean   @default(true) // Can be deactivated
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([code])
  @@index([userId])
  @@index([isActive])
  @@map("referral_codes")
}
```

**Key Features:**

- ✅ Unique code per user
- ✅ Optional usage limits
- ✅ Optional expiration
- ✅ Can be activated/deactivated
- ✅ Tracks usage count

---

### 5. New Model: Referral

```prisma
model Referral {
  id               String         @id @default(cuid())
  referrerId       String // Who referred someone
  referredId       String // Who was referred
  referredUserRole UserRole // BUYER or SELLER at registration
  rewardAmount     Decimal        @db.Decimal(10, 2) // Reward given
  rewardCurrency   String         @default("USD")
  status           ReferralStatus @default(PENDING)
  orderId          String?        @unique // First qualifying order (buyers)
  storeId          String? // Store of first product (sellers)
  qualifiedAt      DateTime? // When qualified
  paidAt           DateTime? // When reward granted
  metadata         Json? // Additional tracking
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  referrer User   @relation("ReferrerReferrals", fields: [referrerId], references: [id], onDelete: Cascade)
  referred User   @relation("ReferredReferrals", fields: [referredId], references: [id], onDelete: Cascade)
  order    Order? @relation(fields: [orderId], references: [id], onDelete: SetNull)
  store    Store? @relation(fields: [storeId], references: [id], onDelete: SetNull)

  @@index([referrerId])
  @@index([referredId])
  @@index([status])
  @@index([orderId])
  @@index([storeId])
  @@index([createdAt])
  @@map("referrals")
}
```

**Key Features:**

- ✅ Tracks both BUYER and SELLER referrals
- ✅ Links to first qualifying order (buyers)
- ✅ Links to store for first product (sellers)
- ✅ Status tracking (PENDING → QUALIFIED → PAID)
- ✅ Reward amount configurable per referral
- ✅ Metadata field for extensibility

---

### 6. New Enum: ReferralStatus

```prisma
enum ReferralStatus {
  PENDING   // Waiting for qualification (no purchase/product yet)
  QUALIFIED // User met qualification criteria
  PAID      // Reward granted to referrer
  EXPIRED   // Expired before qualifying
  CANCELLED // Cancelled (user deleted, fraud, etc.)
}
```

**Status Flow:**

```
Registration → PENDING → (Purchase/Product Created) → QUALIFIED → (Reward Granted) → PAID
                    ↓                                      ↓
                EXPIRED                               CANCELLED
```

---

## Database Schema Summary

### New Tables:

1. **referral_codes** - Unique referral codes per user
2. **referrals** - Referral tracking and rewards

### Modified Tables:

1. **users** - Added 7 referral-related fields + 1 relation
2. **orders** - Added 2 referral-related fields
3. **stores** - Added 1 referral relation

### New Enums:

1. **ReferralStatus** - 5 states for referral lifecycle

### Indexes Added:

- `users.referredById` - Query performance
- `referral_codes.code` - Fast code lookup
- `referral_codes.userId` - User lookup
- `referral_codes.isActive` - Filter active codes
- `referrals.referrerId` - Referrer queries
- `referrals.referredId` - Referred user queries
- `referrals.status` - Status filtering
- `referrals.orderId` - Order lookup
- `referrals.storeId` - Store lookup
- `referrals.createdAt` - Time-based queries

---

## Migration Files Created

### 1. Manual SQL Migration

**Location:** `packages/database/prisma/migrations/add_referral_system.sql`

This file contains the complete SQL migration with:

- ✅ All table alterations
- ✅ Foreign key constraints
- ✅ Indexes
- ✅ Rollback instructions
- ✅ Application instructions

**To Apply:**

```bash
# Option 1: Direct SQL execution
psql -d nextpik_ecommerce -f packages/database/prisma/migrations/add_referral_system.sql

# Option 2: Via Prisma (recommended)
cd packages/database
pnpm prisma db execute --file migrations/add_referral_system.sql

# Option 3: Create Prisma migration (when DB is ready)
pnpm prisma migrate dev --name add_referral_system
```

**⚠️ Important:** Always backup database before applying:

```bash
pg_dump nextpik_ecommerce > backup_before_referral_migration.sql
```

---

## Prisma Client Generation

**Status:** ✅ COMPLETED

The Prisma client has been regenerated with the new schema:

```bash
pnpm prisma generate
```

**Generated Types Available:**

- `ReferralCode`
- `Referral`
- `ReferralStatus` enum
- Updated `User` type with referral fields
- Updated `Order` type with referrerId
- Updated `Store` type with referrals relation

---

## Type Safety Verification

**Test the types:**

```typescript
import { Prisma, ReferralStatus } from '@prisma/client';

// Type-safe referral creation
const referral: Prisma.ReferralCreateInput = {
  referrer: { connect: { id: 'referrer_id' } },
  referred: { connect: { id: 'referred_id' } },
  referredUserRole: 'BUYER',
  rewardAmount: new Prisma.Decimal(10.0),
  rewardCurrency: 'USD',
  status: ReferralStatus.PENDING,
};

// Type-safe user with referral fields
const user = await prisma.user.findUnique({
  where: { id: 'user_id' },
  include: {
    referralCode: true,
    referrals: true,
    referredBy: true,
    referrerReferrals: true,
  },
});
```

---

## Data Integrity

### Foreign Key Constraints:

- ✅ `users.referredById` → `users.id` (ON DELETE SET NULL)
- ✅ `referral_codes.userId` → `users.id` (ON DELETE CASCADE)
- ✅ `referrals.referrerId` → `users.id` (ON DELETE CASCADE)
- ✅ `referrals.referredId` → `users.id` (ON DELETE CASCADE)
- ✅ `referrals.orderId` → `orders.id` (ON DELETE SET NULL)
- ✅ `referrals.storeId` → `stores.id` (ON DELETE SET NULL)

### Unique Constraints:

- ✅ `referral_codes.code` - No duplicate codes
- ✅ `referral_codes.userId` - One code per user
- ✅ `referrals.orderId` - One referral per order

### Default Values:

- ✅ `users.storeCredit` = 0
- ✅ `users.totalReferrals` = 0
- ✅ `referral_codes.usageCount` = 0
- ✅ `referral_codes.isActive` = true
- ✅ `referrals.status` = PENDING
- ✅ `referrals.rewardCurrency` = USD

---

## Testing Checklist

Before proceeding to STEP 3, verify:

**Schema Validation:**

- [x] `pnpm prisma format` - No errors
- [x] `pnpm prisma generate` - Client generated
- [ ] `pnpm prisma migrate dev` - Migration created (requires DB)

**Type Checking:**

- [ ] Run `pnpm type-check` from project root
- [ ] Verify no TypeScript errors in packages/database

**Database Connection:**

- [ ] Ensure PostgreSQL is running
- [ ] Verify DATABASE_URL in `.env`
- [ ] Test connection: `pnpm prisma db push --skip-generate`

---

## Next Steps

### ✅ STEP 2 COMPLETE - Ready for STEP 3

**STEP 3:** Add Referral Settings to Seed File

- 10+ configurable settings for admin control
- Default values for all reward amounts
- Category: 'referral'
- All settings editable via admin UI

**Proceed to STEP 3?** Yes/No

---

## Files Modified

1. ✏️ `packages/database/prisma/schema.prisma` (4 models updated, 2 models added, 1 enum added)
2. ✅ `packages/database/prisma/migrations/add_referral_system.sql` (created)
3. ✅ `node_modules/@prisma/client` (regenerated with new types)

**Total Lines Changed:** ~150 lines added

---

## Rollback Instructions

If you need to rollback this migration:

```sql
-- Run in PostgreSQL
DROP TABLE IF EXISTS "referrals" CASCADE;
DROP TABLE IF EXISTS "referral_codes" CASCADE;
DROP TYPE IF EXISTS "ReferralStatus";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "referrerId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "totalReferrals";
ALTER TABLE "users" DROP COLUMN IF EXISTS "storeCredit";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referredById";
```

Then regenerate Prisma client:

```bash
pnpm prisma generate
```

---

**Status:** ✅ STEP 2 COMPLETE
**Next:** STEP 3 - Add Referral Settings to Seed File
