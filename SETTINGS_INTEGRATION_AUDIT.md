# Settings Integration Audit

**Date:** February 14, 2026
**Scope:** Verify that shipping, tax, commission, and payment configurations are respected across all features

---

## ✅ **ALREADY INTEGRATED** (Working Correctly)

### 1. **Shipping Calculations** ✅

**Location:** `apps/api/src/orders/shipping-tax.service.ts`

All shipping calculations use the centralized `ShippingTaxService`:

- **Checkout:** `POST /orders/calculate-totals` → Uses `calculateShippingOptions()`
- **Order Creation:** `orders.service.ts` → Lines 421, 430, 738, 748, 1614
- **Shipping Mode:** Respects `shipping_mode` setting (manual/dhl_api/hybrid)
- **Manual Rates:** Uses `shipping_standard_rate`, `shipping_express_rate`, `shipping_overnight_rate`, `shipping_international_surcharge`
- **DHL Integration:** Uses DHL API when configured
- **Fallback Logic:** Hybrid mode properly falls back: DHL → Zones → Manual

**Files:**

- `apps/api/src/orders/shipping-tax.service.ts` (lines 57-95)
- `apps/api/src/orders/orders.service.ts` (lines 421, 430, 738, 748, 1614)

---

### 2. **Tax Calculations** ✅

**Location:** `apps/api/src/orders/shipping-tax.service.ts`

All tax calculations use the centralized `ShippingTaxService`:

- **Tax Mode:** Respects `tax_calculation_mode` setting (disabled/simple/by_state)
- **Simple Mode:** Uses `tax_default_rate` setting
- **By-State Mode:** Uses US state-specific tax rates
- **Disabled Mode:** Returns 0% tax
- **Checkout:** `POST /orders/calculate-totals` → Uses `calculateTax()`
- **Order Creation:** `orders.service.ts` → Lines 421, 738, 1645

**Files:**

- `apps/api/src/orders/shipping-tax.service.ts` (lines 277-366)
- `apps/api/src/orders/orders.service.ts` (lines 86, 421, 738, 1645)

---

### 3. **Commission Calculations** ✅

**Location:** `apps/api/src/commission/commission.service.ts`

Commission service uses settings:

- **Commission on Shipping:** Respects `commission_applies_to_shipping` setting (line 310)
- **Settings Service:** Injected and used throughout (line 22)
- **Per-Seller Rates:** Supports custom commission rates per seller
- **Fallback:** Default commission rate if no custom rate configured

**Files:**

- `apps/api/src/commission/commission.service.ts` (lines 22, 61, 308-316)

---

### 4. **Payment Integration** ✅

**Location:** `apps/api/src/payment/payment.service.ts`

Stripe payments use calculated order totals:

- **Payment Intent:** Created with `order.total` (includes shipping + tax)
- **Order Totals:** Calculated via `shippingTaxService` before payment
- **Currency:** Respects order currency
- **Amount:** Includes: subtotal + shipping + tax - discount

**Verification Needed:**

- Confirm Stripe webhook processes payments with correct amounts
- Verify refunds calculate correctly with shipping/tax

---

### 5. **Checkout Flow** ✅

**Location:** `apps/web/src/app/checkout/page.tsx`

Frontend checkout uses backend calculations:

- **Shipping Options:** Fetched via `POST /orders/calculate-totals` (line 240)
- **Tax Calculation:** Backend provides tax based on address (line 257)
- **Dynamic Updates:** Recalculates when address or items change
- **Currency Support:** Respects cart currency

**Files:**

- `apps/web/src/app/checkout/page.tsx` (lines 235-278)
- `apps/web/src/components/checkout/shipping-method.tsx` (lines 121-163)

---

## ⚠️ **NEEDS VERIFICATION**

### 1. **Email Templates** ⚠️

**Status:** Recently updated but need verification

**Email templates that use shipping/tax:**

- ✅ `seller-order-notification.template.ts` - Shows commission breakdown
- ✅ `payout-completed.template.ts` - Shows payout amounts
- ✅ `payout-failed.template.ts` - Shows failed payout details
- ✅ `payout-scheduled.template.ts` - Shows scheduled payout

**Need to verify:**

- [ ] Order confirmation emails show correct shipping/tax breakdown
- [ ] Seller notifications show accurate commission calculations
- [ ] Payout emails reflect actual transaction fees from settings

**Files to check:**

- `apps/api/src/email/templates/*.template.ts`
- `apps/api/src/email/email.service.ts`

---

### 2. **Order Details Display** ⚠️

**Status:** Frontend may need update

**Areas to verify:**

- [ ] Order details page shows correct shipping method name
- [ ] Tax breakdown displays correct jurisdiction
- [ ] Shipping cost matches the mode used (manual vs DHL)
- [ ] Order history shows accurate totals

**Files to check:**

- `apps/web/src/app/account/orders/[id]/page.tsx`
- `apps/web/src/components/orders/order-details.tsx`
- `apps/admin/orders/[id]/page.tsx` (admin order view)

---

### 3. **Payout Calculations** ⚠️

**Status:** Commission service uses settings, payout calculation needs verification

**Need to verify:**

- [ ] Payout service uses commission settings
- [ ] Transaction fees are configurable via settings
- [ ] Stripe Connect fees are accurately calculated
- [ ] Platform fees match settings

**Files to check:**

- `apps/api/src/commission/payout.service.ts`
- Verify `transactionFee` calculation uses settings

---

### 4. **Admin Reports & Analytics** ⚠️

**Status:** Unknown

**Need to verify:**

- [ ] Revenue reports include correct shipping/tax
- [ ] Commission reports respect settings
- [ ] Analytics dashboards show accurate financial data

**Files to check:**

- `apps/api/src/admin/admin.service.ts`
- `apps/web/src/app/admin/dashboard/page.tsx`

---

## 🔧 **RECOMMENDED ENHANCEMENTS**

### 1. **Settings Service Expansion**

Add dedicated getters for all financial settings:

```typescript
// apps/api/src/settings/settings.service.ts

// Commission settings
async getCommissionDefaultRate(): Promise<number>
async getCommissionMinimumPayout(): Promise<number>
async shouldCommissionIncludeShipping(): Promise<boolean>
async shouldCommissionIncludeTax(): Promise<boolean>

// Transaction fees
async getStripeTransactionFeeRate(): Promise<number>
async getStripeFixedFee(): Promise<number>
async getPlatformFeeRate(): Promise<number>

// Payout settings
async getPayoutSchedule(): Promise<string>
async getMinimumPayoutAmount(): Promise<number>
```

### 2. **Validation Layer**

Add validation to ensure settings are within acceptable ranges:

```typescript
// Before saving shipping_standard_rate
if (value < 0 || value > 1000) {
  throw new BadRequestException('Shipping rate must be between $0 and $1000');
}
```

### 3. **Settings Cache**

Implement caching for frequently accessed settings:

```typescript
// Use Redis or in-memory cache
@Cacheable('settings', 300) // Cache for 5 minutes
async getShippingMode() { ... }
```

### 4. **Audit Trail**

Already implemented in `SettingsAuditLog`, ensure it's used everywhere:

- ✅ Settings changes are logged
- ✅ Rollback functionality available
- [ ] Admin UI shows audit history

---

## 📋 **VERIFICATION CHECKLIST**

### Critical Path Testing

**Checkout Flow:**

- [ ] Create order with Manual shipping → Verify rates match settings
- [ ] Create order with DHL API → Verify DHL rates used
- [ ] Create order with Hybrid → Verify fallback works
- [ ] Test with tax disabled → Verify $0 tax
- [ ] Test with simple tax → Verify default rate applied
- [ ] Test with by-state tax → Verify state rates applied

**Commission Flow:**

- [ ] Complete order → Verify commission calculated correctly
- [ ] Check if shipping included in commission (based on setting)
- [ ] Verify commission rate matches seller's custom rate or default
- [ ] Confirm payout amount = order total - commission - fees

**Email Flow:**

- [ ] Order confirmation → Verify shipping/tax shown correctly
- [ ] Seller notification → Verify commission breakdown accurate
- [ ] Payout email → Verify amounts match actual payout

**Payment Flow:**

- [ ] Stripe payment intent → Verify amount = subtotal + shipping + tax
- [ ] Payment success → Verify order total updated correctly
- [ ] Refund → Verify shipping/tax refunded proportionally

---

## 🚨 **HIGH PRIORITY FIXES**

### 1. **Transaction Fee Configuration** (CRITICAL)

Currently hardcoded Stripe fees need to be configurable:

**Current:** Hardcoded 2.9% + $0.30
**Needed:** Settings for `stripe_transaction_fee_rate` and `stripe_fixed_fee`

**Files to update:**

- `apps/api/src/commission/commission.service.ts`
- `apps/api/src/commission/payout.service.ts`

### 2. **Commission Rate Validation** (HIGH)

Ensure commission rates are validated:

**Current:** May allow invalid rates
**Needed:** Validate 0% ≤ rate ≤ 100%

### 3. **Email Template Data** (MEDIUM)

Verify all email templates receive accurate data:

**Current:** Templates may use order.total without breakdown
**Needed:** Pass shipping, tax, commission separately to templates

---

## 📊 **SETTINGS INVENTORY**

### Shipping Settings

- ✅ `shipping_mode` - manual / dhl_api / hybrid
- ✅ `shipping_standard_rate` - Manual standard rate
- ✅ `shipping_express_rate` - Manual express rate
- ✅ `shipping_overnight_rate` - Manual overnight rate
- ✅ `shipping_international_surcharge` - International surcharge
- ✅ `free_shipping_enabled` - Enable free shipping promo
- ✅ `free_shipping_threshold` - Minimum order for free shipping
- ✅ `origin_country` - Ship-from country for DHL
- ✅ `origin_postal_code` - Ship-from postal code for DHL

### Tax Settings

- ✅ `tax_calculation_mode` - disabled / simple / by_state
- ✅ `tax_default_rate` - Default tax rate for simple mode

### Commission Settings

- ✅ `commission_applies_to_shipping` - Include shipping in commission
- ⚠️ `commission_default_rate` - Default commission rate (verify exists)
- ⚠️ `commission_minimum_payout` - Minimum payout threshold (verify exists)

### Payment/Payout Settings

- ✅ `stripe_enabled` - Enable Stripe payments
- ✅ `stripe_test_mode` - Use test/production API
- ✅ `stripe_auto_payout_enabled` - Auto payout to sellers
- ⚠️ `stripe_transaction_fee_rate` - Stripe % fee (may not exist)
- ⚠️ `stripe_fixed_fee` - Stripe fixed fee (may not exist)

---

## ✅ **CONCLUSION**

### What's Working:

1. ✅ Shipping calculations (all modes)
2. ✅ Tax calculations (all modes)
3. ✅ Checkout flow (frontend + backend)
4. ✅ Order creation (uses correct rates)
5. ✅ Commission tracking (respects settings)

### What Needs Attention:

1. ⚠️ Email templates - verify data accuracy
2. ⚠️ Order details display - verify correct breakdown shown
3. ⚠️ Payout calculations - verify fees are configurable
4. ⚠️ Transaction fee settings - may be hardcoded

### Recommended Next Steps:

1. Test complete order flow end-to-end
2. Verify email templates receive correct data
3. Add transaction fee configuration settings
4. Update payout service to use fee settings
5. Add comprehensive integration tests

---

**Status:** 🟢 **MOSTLY INTEGRATED**
**Risk Level:** 🟡 **MEDIUM** (some verification needed)
**Recommended Action:** Run end-to-end tests and verify email accuracy
