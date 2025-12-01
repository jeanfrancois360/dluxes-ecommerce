# Escrow & Payout System Settings - Configuration Guide

## Overview

The platform has been configured with **Escrow as the default and core payment mechanism**. All payments automatically route through escrow, and funds remain locked until delivery confirmation by the buyer or admin.

## System Settings (Database Configuration)

All settings are stored in the `SystemSetting` table and can be managed through the Admin Dashboard or Settings API.

### 🔐 Escrow Settings

#### 1. `escrow.enabled` (Default: `true`)
- **Category:** PAYMENT
- **Type:** BOOLEAN
- **Description:** When enabled, all payments go through escrow and funds are held until delivery confirmation. This is the core payment mechanism and should remain enabled for marketplace security.
- **Editable:** Yes (Admin only)
- **Public:** No
- **⚠️ IMPORTANT:** This setting should always be `true` in production.

#### 2. `escrow.immediate_payout_enabled` (Default: `false`)
- **Category:** PAYMENT
- **Type:** BOOLEAN
- **Description:** When enabled, allows immediate payouts bypassing escrow for trusted sellers. Should be **DISABLED** in production. Only enable for testing or specific trusted seller accounts.
- **Editable:** Yes (Admin only)
- **Public:** No
- **⚠️ WARNING:** Only enable this for testing or whitelisted trusted sellers. This bypasses all buyer protection.

#### 3. `escrow.hold_period_days` (Default: `7`)
- **Category:** PAYMENT
- **Type:** NUMBER
- **Description:** Number of days to hold funds in escrow after delivery confirmation before auto-releasing to seller.
- **Recommended Range:** 3-7 days for buyer protection
- **Editable:** Yes
- **Public:** Yes (buyers can see this)

#### 4. `escrow.auto_release_enabled` (Default: `true`)
- **Category:** PAYMENT
- **Type:** BOOLEAN
- **Description:** Automatically release funds to seller after hold period expires. If disabled, requires manual admin approval for every payout.
- **Editable:** Yes (Admin only)
- **Public:** No
- **Note:** Disabling this will create significant admin overhead.

### 💰 Payout Settings

#### 5. `payout.minimum_amount` (Default: `50.00`)
- **Category:** PAYOUT
- **Type:** NUMBER (USD)
- **Description:** Minimum accumulated earnings required before triggering a payout to seller.
- **Purpose:** Prevents small transaction fees and reduces payout processing costs.
- **Editable:** Yes
- **Public:** Yes

#### 6. `payout.default_frequency` (Default: `WEEKLY`)
- **Category:** PAYOUT
- **Type:** STRING
- **Options:** `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`
- **Description:** Default frequency for automated seller payouts. Sellers can customize their preference.
- **Editable:** Yes
- **Public:** Yes

#### 7. `payout.auto_schedule_enabled` (Default: `true`)
- **Category:** PAYOUT
- **Type:** BOOLEAN
- **Description:** Automatically process payouts based on seller frequency preferences and minimum thresholds.
- **Editable:** Yes (Admin only)
- **Public:** No
- **Note:** If disabled, all payouts require manual processing.

### 🔍 Audit & Logging Settings

#### 8. `audit.log_all_escrow_actions` (Default: `true`)
- **Category:** SECURITY
- **Type:** BOOLEAN
- **Description:** Maintain full audit trail of all escrow releases, refunds, and modifications.
- **Required for:** Financial compliance and dispute resolution
- **Editable:** No (System enforced)
- **Public:** No

#### 9. `audit.log_retention_days` (Default: `2555`)
- **Category:** SECURITY
- **Type:** NUMBER
- **Description:** Number of days to retain audit logs.
- **Default:** 2555 days (7 years) - meets most financial regulations
- **Editable:** Yes (Admin only)
- **Public:** No
- **⚠️ COMPLIANCE:** Financial regulations typically require 7 years (2555 days) for transaction records.

### 💵 Commission Settings

#### 10. `commission.default_rate` (Default: `10.0`)
- **Category:** COMMISSION
- **Type:** NUMBER (Percentage)
- **Description:** Default commission percentage charged on each transaction.
- **Editable:** Yes (Admin only)
- **Public:** Yes
- **Note:** Can be overridden per category or seller through `CommissionRule` and `SellerCommissionOverride`.

## Payment Flow with Escrow (Default Behavior)

```
1. Customer Completes Payment
   ↓
2. Payment Service Creates PaymentTransaction (status: COMPLETED)
   ↓
3. Commission Service Calculates Platform Fee
   ↓
4. Escrow Service Creates EscrowTransaction (status: HELD)
   - totalAmount: Full order amount
   - platformFee: Commission amount
   - sellerAmount: totalAmount - platformFee
   - holdPeriodDays: From system settings (default 7 days)
   - autoReleaseAt: Calculated date for auto-release
   ↓
5. Funds Remain HELD Until:
   a) Buyer confirms delivery, OR
   b) Admin confirms delivery, OR
   c) Auto-release period expires
   ↓
6. After Delivery Confirmation:
   - Hold period countdown starts (7 days)
   - Buyer can still dispute
   ↓
7. Auto-Release (if enabled):
   - EscrowService.autoReleaseExpiredEscrows() runs periodically
   - Releases funds to seller account
   - Updates escrow status to RELEASED
   - Creates audit trail in OrderTimeline
   ↓
8. Payout Scheduler:
   - Aggregates released funds per seller
   - Respects seller payout frequency preference
   - Only processes if >= minimum payout amount
   - Creates Payout record and transfers funds
```

## API Endpoints

### Escrow Management (Admin Only)

```typescript
GET    /api/v1/escrow/:orderId              // Get escrow for specific order
POST   /api/v1/escrow/:id/release           // Manually release escrow
POST   /api/v1/escrow/:id/refund            // Refund escrow to buyer
POST   /api/v1/escrow/:id/confirm-delivery  // Confirm delivery (starts hold period)
GET    /api/v1/escrow/pending               // Get all pending escrows
GET    /api/v1/escrow/expired               // Get escrows past auto-release date
POST   /api/v1/escrow/auto-release          // Trigger manual auto-release job
```

### Payout Management (Admin Only)

```typescript
GET    /api/v1/payouts/admin/all            // Get all payouts
POST   /api/v1/payouts/admin/process        // Process all pending payouts
POST   /api/v1/payouts/admin/seller/:id/trigger  // Trigger payout for specific seller
PUT    /api/v1/payouts/admin/:id/complete  // Mark payout as completed
PUT    /api/v1/payouts/admin/:id/fail      // Mark payout as failed
GET    /api/v1/payouts/schedule             // Get payout schedule config
```

### Settings Management (Admin Only)

```typescript
GET    /api/v1/settings/:key                // Get specific setting
GET    /api/v1/settings/category/:category  // Get settings by category (e.g., PAYMENT)
GET    /api/v1/settings/public              // Get all public settings (no auth required)
GET    /api/v1/settings                     // Get all settings (admin only)
PUT    /api/v1/settings/:key                // Update setting value
POST   /api/v1/settings/:key/rollback       // Rollback setting to previous value
GET    /api/v1/settings/:key/audit          // Get audit log for setting changes
```

## Automated Jobs & Schedulers

### 1. Auto-Release Expired Escrows
- **Service:** `EscrowService.autoReleaseExpiredEscrows()`
- **Frequency:** Should run every hour (configure via cron job or scheduler)
- **Logic:**
  - Finds all escrows with `status = HELD` and `autoReleaseAt <= NOW()`
  - Calls `releaseEscrow()` for each expired escrow
  - Logs success/failure counts
  - Creates audit trail

### 2. Automated Payout Scheduler
- **Service:** `PayoutSchedulerService.processScheduledPayouts()`
- **Frequency:** Runs daily (checks each seller's frequency preference)
- **Logic:**
  - For each active seller with payout schedule:
    - Check if payout is due based on frequency
    - Check if accumulated balance >= minimum amount
    - Aggregate all RELEASED escrow funds
    - Create Payout record
    - Transfer funds to seller account
  - Respects hold period and only processes confirmed escrows

### Recommended Cron Configuration

```typescript
// In your NestJS app.module.ts or scheduler module
import { ScheduleModule } from '@nestjs/schedule';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EscrowScheduler {
  constructor(
    private readonly escrowService: EscrowService,
    private readonly payoutService: PayoutSchedulerService,
  ) {}

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleEscrowAutoRelease() {
    await this.escrowService.autoReleaseExpiredEscrows();
  }

  // Run every day at 2 AM
  @Cron('0 2 * * *')
  async handleAutomatedPayouts() {
    await this.payoutService.processScheduledPayouts();
  }
}
```

## Security & Compliance

### Audit Trail
- **All escrow releases** are logged to `OrderTimeline` table
- **All escrow refunds** are logged to `OrderTimeline` table
- **All setting changes** are logged to `SettingsAuditLog` with rollback capability
- **Retention:** 7 years (configurable via `audit.log_retention_days`)

### Fund Protection
1. **Buyer Protection:** Funds held until delivery confirmed + hold period
2. **Seller Protection:** Auto-release ensures timely payment if no disputes
3. **Platform Protection:** Commission deducted before escrow release

### Compliance Features
- Full transaction audit trail (7-year retention)
- Automatic escrow release with configurable hold periods
- Manual override capability for disputes
- Rollback capability for system settings
- Detailed logging of all financial actions

## Testing & Development

### Enable Immediate Payouts (Testing Only)
```sql
-- ⚠️ WARNING: Only use in development/testing!
UPDATE system_settings
SET value = true
WHERE key = 'escrow.immediate_payout_enabled';
```

### Disable Escrow (Emergency Only)
```sql
-- ⚠️ EMERGENCY ONLY: This removes buyer protection!
UPDATE system_settings
SET value = false
WHERE key = 'escrow.enabled';
```

### Test Auto-Release Manually
```typescript
// Call the auto-release endpoint (admin only)
POST /api/v1/escrow/auto-release
Authorization: Bearer <admin-token>
```

## Admin Dashboard Integration

The following pages have been created for managing escrow and payouts:

1. **`/admin/escrow`** - View and manage all escrow transactions
   - Filter by status (HELD, PENDING_RELEASE, RELEASED, REFUNDED)
   - View statistics (total held, pending release, released)
   - Manually release or refund escrow
   - View delivery confirmation details

2. **`/admin/payouts`** - Manage seller payouts
   - View payout history and status
   - Process pending payouts
   - Trigger manual payouts for specific sellers
   - Configure payout schedule

3. **`/admin/settings`** - Configure system settings
   - Edit escrow and payout settings
   - View and rollback setting changes
   - Access audit logs

## Seeding Default Settings

All settings are automatically seeded when you run:

```bash
pnpm prisma:seed
```

Settings are created with `upsert`, so running the seed multiple times won't create duplicates.

## Quick Reference

| Setting | Default | Production Value | Test Value |
|---------|---------|------------------|------------|
| `escrow.enabled` | `true` | `true` ✅ | `true` ✅ |
| `escrow.immediate_payout_enabled` | `false` | `false` ✅ | `true` (testing only) |
| `escrow.hold_period_days` | `7` | `5-7` ✅ | `1` (faster testing) |
| `escrow.auto_release_enabled` | `true` | `true` ✅ | `true` ✅ |
| `payout.minimum_amount` | `50.00` | `50-100` ✅ | `10.00` (easier testing) |
| `payout.default_frequency` | `WEEKLY` | `WEEKLY` ✅ | `DAILY` (faster testing) |
| `payout.auto_schedule_enabled` | `true` | `true` ✅ | `false` (manual control) |
| `audit.log_all_escrow_actions` | `true` | `true` ✅ | `true` ✅ |

## Next Steps

1. **Run Database Seed:** `pnpm prisma:seed` to create all settings
2. **Configure Cron Jobs:** Set up hourly auto-release and daily payout scheduler
3. **Test Payment Flow:** Make a test purchase and verify escrow creation
4. **Admin Review:** Access `/admin/escrow` to monitor transactions
5. **Production Deployment:** Ensure all production settings are correct

---

**⚠️ PRODUCTION CHECKLIST:**
- [ ] `escrow.enabled` = `true`
- [ ] `escrow.immediate_payout_enabled` = `false`
- [ ] `escrow.hold_period_days` = `5-7`
- [ ] `escrow.auto_release_enabled` = `true`
- [ ] `audit.log_all_escrow_actions` = `true`
- [ ] Auto-release cron job configured
- [ ] Payout scheduler cron job configured
- [ ] Admin access to escrow management dashboard
- [ ] Stripe payment integration configured
- [ ] Email notifications configured for payouts
