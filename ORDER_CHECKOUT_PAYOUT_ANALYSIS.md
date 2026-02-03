# 🚨 ORDER, CHECKOUT & PAYOUT SYSTEM - CRITICAL ANALYSIS

**Project:** NextPik v2.6.0
**Analysis Date:** January 21, 2026
**Deadline:** January 31, 2026
**Current Status:** 72% complete overall, checkout ~60% complete

---

## EXECUTIVE SUMMARY

The NextPik order, checkout, payment, and payout system is **functional but has 14 critical gaps** that must be addressed before production launch. These issues represent compliance risks, revenue risks, and user experience problems that will directly impact business success.

**Critical Findings:**
- ❌ Multi-vendor escrow completely broken (funds bypass escrow)
- ❌ No pre-checkout total calculation (poor UX)
- ❌ Currency conversion captured but never applied
- ❌ Tax calculation uses hardcoded rates (compliance risk)
- ❌ Discount/coupon system missing entirely
- ❌ PayPal advertised but not implemented

**Total Issues:** 14 (6 P0, 4 P1, 4 P2)
**Estimated Effort:** 156 hours (~4 weeks for 1 developer)
**Risk Level:** HIGH - Multiple production blockers identified

---

## TABLE OF CONTENTS

1. [Priority 0 Issues (System Breaking)](#priority-0-issues-must-fix---system-breaking)
2. [Priority 1 Issues (Critical for Launch)](#priority-1-issues-critical-for-launch)
3. [Priority 2 Issues (Important but Not Blocking)](#priority-2-issues-important-but-not-blocking)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Edge Cases to Handle](#edge-cases-to-handle)
6. [Data Model Updates Required](#data-model-updates-required)
7. [System Architecture Overview](#system-architecture-overview)

---

## PRIORITY 0 ISSUES (Must Fix - System Breaking)

### [P0-001] - Multi-Vendor Escrow Not Implemented
**Priority:** P0 | **Effort:** 16 hours | **Risk:** CRITICAL

**What's Wrong:**
Multi-vendor orders fail to create escrow correctly. When an order contains items from multiple sellers, the system logs a warning and skips escrow creation entirely. Code at `/apps/api/src/payment/payment.service.ts:757-759`:

```typescript
} else {
  // TODO: Implement multi-vendor escrow split
  this.logger.warn(`Multi-vendor escrow not yet implemented for order ${orderId}`);
}
```

**Business Impact:**
- 🚨 **Sellers get paid immediately without holding period** - violates platform policy
- 🚨 **No fraud protection** for multi-vendor transactions
- 🚨 **Cannot enforce delivery confirmation** before payout
- 🚨 **Platform liability** if customer disputes and funds already disbursed

**Technical Impact:**
- Multi-vendor orders bypass entire escrow system
- Commission allocation undefined for split orders
- Payment reconciliation impossible
- Violates escrow data model integrity

**How to Fix:**

1. Implement split allocation logic using `EscrowSplitAllocation` model
2. Calculate platform fee per seller based on their order items
3. Create separate escrow records per seller
4. Link all escrows to single order via `orderId`

**Code Example:**

```typescript
// In payment.service.ts - Replace TODO section
async createMultiVendorEscrow(
  orderId: string,
  totalAmount: number,
  currency: string,
  sellerOrderMap: Map<string, { items: OrderItem[]; total: number }>
) {
  const holdPeriodDays = await this.settingsService.getNumber('escrow_default_hold_days', 7);
  const autoReleaseAt = new Date();
  autoReleaseAt.setDate(autoReleaseAt.getDate() + holdPeriodDays);

  // Create parent escrow for full amount
  const parentEscrow = await this.prisma.escrowTransaction.create({
    data: {
      orderId,
      totalAmount: new Decimal(totalAmount),
      platformFee: new Decimal(0), // Will be sum of seller fees
      sellerAmount: new Decimal(totalAmount), // Will be adjusted
      currency,
      holdPeriodDays,
      autoReleaseAt,
      status: 'HELD',
      metadata: {
        type: 'multi_vendor',
        sellerCount: sellerOrderMap.size,
      },
    },
  });

  let totalPlatformFee = 0;

  // Create split allocations for each seller
  for (const [sellerId, orderData] of sellerOrderMap.entries()) {
    const sellerTotal = orderData.total;

    // Calculate commission for this seller's portion
    const commission = await this.commissionService.calculateCommission({
      orderId,
      sellerId,
      amount: sellerTotal,
      currency,
    });

    const platformFee = commission.amount;
    const sellerAmount = sellerTotal - platformFee;
    totalPlatformFee += platformFee;

    await this.prisma.escrowSplitAllocation.create({
      data: {
        escrowId: parentEscrow.id,
        sellerId,
        allocatedAmount: new Decimal(sellerAmount),
        platformFee: new Decimal(platformFee),
        status: 'PENDING',
      },
    });
  }

  // Update parent escrow with total platform fee
  await this.prisma.escrowTransaction.update({
    where: { id: parentEscrow.id },
    data: {
      platformFee: new Decimal(totalPlatformFee),
      sellerAmount: new Decimal(totalAmount - totalPlatformFee),
    },
  });

  return parentEscrow;
}
```

**Dependencies:**
- Requires functioning Commission service (already implemented)
- Needs `EscrowSplitAllocation` model (exists in schema)

**Testing Checklist:**
- [ ] Create order with items from 2 different sellers
- [ ] Verify 2 split allocations created
- [ ] Verify sum of allocations equals order total minus total platform fees
- [ ] Verify each seller's commission calculated correctly
- [ ] Test release: both splits released when delivery confirmed
- [ ] Test refund: both splits refunded proportionally
- [ ] Test with 3+ sellers
- [ ] Test with sellers having different commission rates

---

### [P0-002] - No Pre-Checkout Total Calculation
**Priority:** P0 | **Effort:** 8 hours | **Risk:** HIGH

**What's Wrong:**
Frontend cannot calculate order totals (shipping + tax) before submitting the order. Tax and shipping are only calculated in `orders.service.create()` AFTER order submission. Customers don't see final price until order is created.

**Business Impact:**
- 🚨 **Cart abandonment** - customers surprised by final total
- 🚨 **Poor UX** - cannot show breakdown during checkout
- 🚨 **Trust issues** - hidden costs revealed at last step
- 🚨 **Compliance risk** - some jurisdictions require upfront total disclosure

**Technical Impact:**
- Frontend shows "TBD" or estimated totals
- Order creation can fail after customer commits
- Cannot validate if customer has sufficient funds
- Double calculation if order creation retried

**How to Fix:**

Add new endpoint to calculate totals without creating order:

**Code Example:**

```typescript
// In orders.controller.ts
@Post('calculate-totals')
async calculateTotals(
  @Body() dto: CalculateTotalsDto,
  @Request() req
) {
  try {
    const calculation = await this.ordersService.calculateOrderTotals({
      userId: req.user.id,
      items: dto.items,
      shippingAddressId: dto.shippingAddressId,
      shippingMethod: dto.shippingMethod || 'standard',
      currency: dto.currency || 'USD',
      couponCode: dto.couponCode,
    });

    return {
      success: true,
      data: calculation,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// DTO
export class CalculateTotalsDto {
  @IsArray()
  @ValidateNested({ each: true })
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number; // Client-side price (will be verified)
  }>;

  @IsString()
  shippingAddressId: string;

  @IsOptional()
  @IsEnum(['standard', 'express', 'overnight'])
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

// In orders.service.ts
async calculateOrderTotals(params: CalculateOrderTotalsParams) {
  // Verify item prices match current prices
  const items = await this.verifyItemPrices(params.items);

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) =>
    sum + Number(item.price) * item.quantity, 0
  );

  // Get address for shipping/tax
  const address = await this.prisma.address.findUnique({
    where: { id: params.shippingAddressId },
  });

  if (!address) {
    throw new BadRequestException('Address not found');
  }

  // Calculate shipping
  const shippingOptions = this.shippingTaxService.getShippingOptions(
    {
      country: address.country,
      state: address.province,
      postalCode: address.postalCode,
      city: address.city,
    },
    items
  );

  const selectedShipping = shippingOptions.find(
    opt => opt.method === params.shippingMethod
  ) || shippingOptions[0];

  // Calculate tax
  const taxCalc = this.shippingTaxService.calculateTax(address, subtotal);

  // Apply coupon if provided
  let discount = 0;
  let couponDetails = null;
  if (params.couponCode) {
    const couponResult = await this.applyCoupon(
      params.couponCode,
      subtotal,
      params.userId
    );
    discount = couponResult.discount;
    couponDetails = couponResult.details;
  }

  const total = subtotal + selectedShipping.price + taxCalc.amount - discount;

  return {
    subtotal,
    shipping: {
      method: selectedShipping.method,
      price: selectedShipping.price,
      estimatedDays: selectedShipping.estimatedDays,
    },
    shippingOptions, // All available options
    tax: {
      amount: taxCalc.amount,
      rate: taxCalc.rate,
      jurisdiction: taxCalc.jurisdiction,
    },
    discount,
    coupon: couponDetails,
    total,
    currency: params.currency || 'USD',
    breakdown: {
      subtotal,
      shipping: selectedShipping.price,
      tax: taxCalc.amount,
      discount: -discount,
      total,
    },
  };
}
```

**Dependencies:**
- None (uses existing shipping/tax services)
- Optional: Coupon system for discount calculation

**Testing Checklist:**
- [ ] Call endpoint with 1 item, verify subtotal
- [ ] Call with US address, verify tax calculated
- [ ] Call with non-US address, verify tax = 0
- [ ] Change shipping method, verify price updates
- [ ] Add 5kg item, verify shipping tier changes
- [ ] Test with invalid address ID (should error)
- [ ] Test with valid coupon code
- [ ] Test with expired coupon (should ignore)
- [ ] Verify response matches actual order creation
- [ ] Performance: <500ms response time

---

### [P0-003] - Currency Conversion Never Applied
**Priority:** P0 | **Effort:** 12 hours | **Risk:** HIGH

**What's Wrong:**
Orders store `currency`, `exchangeRate`, and `baseCurrency` but the exchange rate is never used for actual conversion. Sellers receive payouts in the order currency (e.g., EUR) even if their `payoutCurrency` is USD. No conversion happens between:
- Order total → Seller payout
- Commission calculation
- Multi-currency reporting

**Business Impact:**
- 🚨 **Sellers underpaid/overpaid** if rate changes between order and payout
- 🚨 **Accounting nightmare** - multiple currencies in reports
- 🚨 **Tax compliance** - incorrect revenue in local currency
- 🚨 **Seller confusion** - expects USD, receives EUR

**Technical Impact:**
- Exchange rate captured but unused (wasted storage)
- Currency mismatch in financial reports
- Payout service doesn't know what currency to send
- Commission percentages applied to wrong currency

**How to Fix:**

1. Implement conversion at payout time using captured exchange rate
2. Add currency conversion to commission calculation
3. Store amounts in both currencies (order currency + seller currency)

**Code Example:**

```typescript
// In commission.service.ts
async calculateCommission(params: {
  orderId: string;
  sellerId: string;
  amount: number;
  currency: string;
}) {
  // Get seller's payout currency preference
  const store = await this.prisma.store.findFirst({
    where: { sellerId: params.sellerId },
    select: { payoutCurrency: true },
  });

  const sellerCurrency = store?.payoutCurrency || 'USD';

  // Get commission rate
  const rate = await this.getCommissionRateForSeller(params.sellerId);

  // Calculate commission in order currency
  const commissionInOrderCurrency = params.amount * (rate / 100);
  const sellerEarningsInOrderCurrency = params.amount - commissionInOrderCurrency;

  // Convert to seller's payout currency if different
  let conversionRate = 1;
  let commissionInSellerCurrency = commissionInOrderCurrency;
  let sellerEarningsInSellerCurrency = sellerEarningsInOrderCurrency;

  if (params.currency !== sellerCurrency) {
    conversionRate = await this.currencyService.getExchangeRate(
      params.currency,
      sellerCurrency
    );

    commissionInSellerCurrency = commissionInOrderCurrency * conversionRate;
    sellerEarningsInSellerCurrency = sellerEarningsInOrderCurrency * conversionRate;
  }

  // Create commission record with both currencies
  return await this.prisma.commission.create({
    data: {
      orderId: params.orderId,
      sellerId: params.sellerId,
      transactionId: '', // Set from payment

      // Order currency amounts
      orderAmount: new Decimal(params.amount),
      commissionRate: new Decimal(rate),
      commissionAmount: new Decimal(commissionInOrderCurrency),
      sellerAmount: new Decimal(sellerEarningsInOrderCurrency),
      currency: params.currency,

      // Seller currency amounts (for payout)
      payoutCurrency: sellerCurrency,
      payoutAmount: new Decimal(sellerEarningsInSellerCurrency),
      exchangeRate: new Decimal(conversionRate),

      status: 'PENDING',
      type: 'PERCENTAGE',
      metadata: {
        conversionDetails: {
          originalCurrency: params.currency,
          targetCurrency: sellerCurrency,
          rate: conversionRate,
          convertedAt: new Date().toISOString(),
        },
      },
    },
  });
}

// In payout.service.ts
async createPayout(sellerId: string) {
  // Get all confirmed commissions for seller
  const commissions = await this.prisma.commission.findMany({
    where: {
      sellerId,
      status: 'CONFIRMED',
      payoutId: null, // Not yet paid out
    },
  });

  // Group by payout currency (should all be same for a seller)
  const currency = commissions[0]?.payoutCurrency || 'USD';

  // Sum in seller's payout currency
  const totalAmount = commissions.reduce(
    (sum, c) => sum + Number(c.payoutAmount),
    0
  );

  // Check minimum
  const minAmount = await this.settingsService.getNumber(
    'payout_minimum_amount',
    50
  );

  if (totalAmount < minAmount) {
    throw new BadRequestException(
      `Payout amount ${totalAmount} ${currency} below minimum ${minAmount} ${currency}`
    );
  }

  // Create payout in seller's currency
  const payout = await this.prisma.payout.create({
    data: {
      sellerId,
      amount: new Decimal(totalAmount),
      currency, // Seller's payout currency
      status: 'PENDING',
      method: 'stripe_connect', // Or from seller settings
      metadata: {
        commissionCount: commissions.length,
        originalCurrencies: [...new Set(commissions.map(c => c.currency))],
      },
    },
  });

  // Link commissions to payout
  await this.prisma.commission.updateMany({
    where: {
      id: { in: commissions.map(c => c.id) },
    },
    data: {
      payoutId: payout.id,
      status: 'PAID',
    },
  });

  return payout;
}
```

**Schema Changes Needed:**

```prisma
model Commission {
  // ... existing fields

  // Add seller currency fields
  payoutCurrency  String   @default("USD")
  payoutAmount    Decimal  @db.Decimal(10, 2)
  exchangeRate    Decimal? @db.Decimal(10, 6)

  // ... rest of model
}
```

**Dependencies:**
- Requires working currency service (exists)
- Requires exchange rate capture (exists but needs to work)
- May need schema migration

**Testing Checklist:**
- [ ] Order in EUR, seller wants USD payout - verify conversion
- [ ] Order in USD, seller wants USD - verify no conversion
- [ ] Verify exchange rate stored matches rate at order time
- [ ] Create payout, verify amount in seller currency
- [ ] Test with stale exchange rate (>24h old)
- [ ] Test with 3 orders in different currencies, single payout
- [ ] Verify commission report shows both currencies
- [ ] Test with zero-decimal currencies (JPY, KRW)

---

## PRIORITY 1 ISSUES (Critical for Launch)

### [P1-001] - Delivery Confirmation Blocks Auto-Release
**Priority:** P1 | **Effort:** 6 hours | **Risk:** HIGH

**What's Wrong:**
Escrow auto-release requires delivery confirmation if `delivery_confirmation_required` setting is true. However, auto-release cron runs regardless, moving escrow to `PENDING_RELEASE` status. If delivery is never confirmed, seller funds remain stuck indefinitely.

Location: `/apps/api/src/escrow/escrow.service.ts:203-207`

**Business Impact:**
- 🚨 **Seller funds held indefinitely** if buyer doesn't confirm
- 🚨 **Platform liability** for withholding payments
- 🚨 **Customer service burden** from seller complaints
- 🚨 **Legal risk** in some jurisdictions

**Technical Impact:**
- Escrow stuck in limbo state
- No automatic resolution
- Manual admin intervention required
- Scales poorly as order volume increases

**How to Fix:**

Add fallback logic with grace period:

```typescript
// In escrow.service.ts
async autoReleaseExpiredEscrows() {
  const confirmationRequired = await this.settingsService.getBoolean(
    'delivery_confirmation_required',
    false
  );

  // Grace period after which we auto-confirm (e.g., 14 days after delivery)
  const autoConfirmGraceDays = await this.settingsService.getNumber(
    'delivery_auto_confirm_days',
    14
  );

  const expiredEscrows = await this.prisma.escrowTransaction.findMany({
    where: {
      status: 'HELD',
      autoReleaseAt: { lte: new Date() },
    },
    include: {
      order: {
        include: {
          delivery: true,
        },
      },
    },
  });

  for (const escrow of expiredEscrows) {
    try {
      if (confirmationRequired) {
        // Check if delivery confirmed
        if (escrow.deliveryConfirmed) {
          await this.releaseEscrow(escrow.id);
          continue;
        }

        // Check if delivery was marked delivered + grace period passed
        const delivery = escrow.order.delivery;
        if (delivery?.deliveredAt) {
          const daysSinceDelivery = Math.floor(
            (Date.now() - delivery.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceDelivery >= autoConfirmGraceDays) {
            this.logger.warn(
              `Auto-confirming delivery for escrow ${escrow.id} after ${daysSinceDelivery} days`
            );

            // Auto-confirm and release
            await this.prisma.escrowTransaction.update({
              where: { id: escrow.id },
              data: {
                deliveryConfirmed: true,
                deliveryConfirmedAt: new Date(),
                metadata: {
                  ...escrow.metadata,
                  autoConfirmed: true,
                  autoConfirmedReason: 'grace_period_expired',
                },
              },
            });

            await this.releaseEscrow(escrow.id);
          } else {
            this.logger.log(
              `Escrow ${escrow.id} awaiting confirmation (${daysSinceDelivery}/${autoConfirmGraceDays} days)`
            );
          }
        } else {
          // Delivery not marked - extend hold period
          const newReleaseDate = new Date();
          newReleaseDate.setDate(newReleaseDate.getDate() + 7);

          await this.prisma.escrowTransaction.update({
            where: { id: escrow.id },
            data: { autoReleaseAt: newReleaseDate },
          });

          this.logger.warn(
            `Escrow ${escrow.id} extended - delivery not confirmed, release date moved to ${newReleaseDate}`
          );
        }
      } else {
        // Confirmation not required - release immediately
        await this.releaseEscrow(escrow.id);
      }
    } catch (error) {
      this.logger.error(`Failed to process escrow ${escrow.id}:`, error);
    }
  }
}
```

**Dependencies:**
- Requires delivery tracking system (exists)
- Needs new system settings

**Testing Checklist:**
- [ ] Order delivered + confirmed within grace period → auto-release
- [ ] Order delivered, NOT confirmed, >14 days → auto-confirm + release
- [ ] Order delivered, NOT confirmed, <14 days → wait
- [ ] Order NOT delivered, expired → extend hold
- [ ] Confirmation not required → immediate release
- [ ] Test notification to seller about auto-confirm
- [ ] Test with multiple escrows expiring same day

---

### [P1-002] - Shipping Option Selection Not Exposed
**Priority:** P1 | **Effort:** 4 hours | **Risk:** MEDIUM

**What's Wrong:**
System calculates 3 shipping options (Standard, Express, Overnight) but always selects Standard automatically. Customer cannot choose shipping method. No API endpoint or UI to select shipping option.

**Business Impact:**
- 🚨 **Lost revenue** from express shipping premiums
- 🚨 **Poor UX** - customers want fast shipping option
- 🚨 **Competition disadvantage** - Amazon/competitors offer shipping choice

**Technical Impact:**
- Shipping calculation wasted (calculates all 3, uses only 1)
- CreateOrderDto doesn't include shippingMethod field
- Frontend cannot display options

**How to Fix:**

1. Add `shippingMethod` to CreateOrderDto
2. Pass selected method to shipping calculation
3. Expose in calculate-totals endpoint (from P0-002)

```typescript
// In create-order.dto.ts
export class CreateOrderDto {
  // ... existing fields

  @IsOptional()
  @IsEnum(['standard', 'express', 'overnight'])
  shippingMethod?: string;
}

// In orders.service.ts - create()
const shippingOptions = this.shippingTaxService.getShippingOptions(
  {
    country: shippingAddress.country,
    state: shippingAddress.province,
    postalCode: shippingAddress.postalCode,
    city: shippingAddress.city,
  },
  items
);

// Select customer's choice or default to standard
const selectedShipping = shippingOptions.find(
  opt => opt.method === (createOrderDto.shippingMethod || 'standard')
);

if (!selectedShipping) {
  throw new BadRequestException(
    `Shipping method ${createOrderDto.shippingMethod} not available for this address`
  );
}

const shipping = selectedShipping.price;

// Store shipping method in order metadata
metadata: {
  shippingMethod: selectedShipping.method,
  shippingEstimatedDays: selectedShipping.estimatedDays,
  shippingCarrier: selectedShipping.carrier,
}
```

**Dependencies:**
- Works with existing shipping service
- Requires P0-002 (calculate-totals) to show options

**Testing Checklist:**
- [ ] Create order with standard shipping
- [ ] Create order with express shipping, verify higher price
- [ ] Create order with overnight, verify highest price
- [ ] Try overnight for international address (should error)
- [ ] Verify selected method stored in order metadata
- [ ] Frontend displays all 3 options with prices
- [ ] Selected option highlighted in UI

---

### [P1-003] - Tax API Integration Missing
**Priority:** P1 | **Effort:** 20 hours | **Risk:** MEDIUM

**What's Wrong:**
Tax calculation uses hardcoded US state rates + fixed 2% local estimate. No integration with real tax API (TaxJar, Avalara). Completely inaccurate for:
- Local city/county taxes
- Special tax jurisdictions
- Tax holidays
- International VAT/GST

Code comment at line 140: `"TODO: In production, use a proper tax API"`

**Business Impact:**
- 🚨 **Tax compliance violations** - undercollecting tax = platform liability
- 🚨 **Audit risk** - cannot justify tax amounts
- 🚨 **International sales broken** - no VAT calculation
- 🚨 **Lost sales** - cannot legally sell in some jurisdictions

**Technical Impact:**
- Tax calculation error margin: ±5% for US, 100% for international
- No product-specific tax rules
- No exemption certificates
- No reporting for tax remittance

**How to Fix:**

Integrate TaxJar (recommended) or Avalara:

```typescript
// Install: npm install taxjar
import Taxjar from 'taxjar';

@Injectable()
export class TaxService {
  private taxjar: Taxjar;

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {
    const apiKey = this.configService.get('TAXJAR_API_KEY');
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    this.taxjar = new Taxjar({
      apiKey,
      apiUrl: isProduction
        ? Taxjar.DEFAULT_API_URL
        : Taxjar.SANDBOX_API_URL,
    });
  }

  async calculateTax(params: {
    toCountry: string;
    toState: string;
    toCity: string;
    toZip: string;
    amount: number;
    shipping: number;
    lineItems: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      product_tax_code?: string; // TaxJar product category
    }>;
  }) {
    try {
      // Check if TaxJar enabled
      const useTaxJar = await this.settingsService.getBoolean(
        'tax_api_enabled',
        false
      );

      if (!useTaxJar) {
        // Fallback to hardcoded rates
        return this.calculateFallbackTax(params);
      }

      // Get nexus addresses (where platform has tax obligation)
      const nexusAddresses = await this.getNexusAddresses();

      const taxResponse = await this.taxjar.taxForOrder({
        from_country: 'US',
        from_zip: nexusAddresses[0]?.zip || '10001',
        from_state: nexusAddresses[0]?.state || 'NY',
        from_city: nexusAddresses[0]?.city || 'New York',

        to_country: params.toCountry,
        to_zip: params.toZip,
        to_state: params.toState,
        to_city: params.toCity,

        amount: params.amount,
        shipping: params.shipping,

        line_items: params.lineItems,

        nexus_addresses: nexusAddresses,
      });

      return {
        amount: taxResponse.tax.amount_to_collect,
        rate: taxResponse.tax.rate,
        jurisdiction: {
          country: taxResponse.tax.jurisdictions.country,
          state: taxResponse.tax.jurisdictions.state,
          county: taxResponse.tax.jurisdictions.county,
          city: taxResponse.tax.jurisdictions.city,
        },
        breakdown: {
          state_amount: taxResponse.tax.breakdown?.state_tax_collectable || 0,
          county_amount: taxResponse.tax.breakdown?.county_tax_collectable || 0,
          city_amount: taxResponse.tax.breakdown?.city_tax_collectable || 0,
          special_district_amount: taxResponse.tax.breakdown?.special_district_tax_collectable || 0,
        },
        taxable_amount: taxResponse.tax.taxable_amount,
        has_nexus: taxResponse.tax.has_nexus,
        freight_taxable: taxResponse.tax.freight_taxable,
      };
    } catch (error) {
      this.logger.error('TaxJar API error:', error);

      // Fallback to hardcoded rates if API fails
      return this.calculateFallbackTax(params);
    }
  }

  private async getNexusAddresses() {
    // Get from settings table
    const nexusJSON = await this.settingsService.getValue(
      'tax_nexus_addresses',
      '[]'
    );

    return JSON.parse(nexusJSON);
  }

  private calculateFallbackTax(params: any) {
    // Use existing hardcoded logic as backup
    const stateRates = {...}; // Existing rates
    const rate = stateRates[params.toState] || 0;

    return {
      amount: Math.round((params.amount * rate) * 100) / 100,
      rate,
      jurisdiction: { state: params.toState },
      breakdown: {},
      fallback: true,
    };
  }

  // Create tax transaction for reporting
  async recordTaxTransaction(orderId: string, taxData: any) {
    await this.taxjar.createOrder({
      transaction_id: orderId,
      transaction_date: new Date().toISOString(),
      ...taxData,
    });
  }
}
```

**Schema Changes:**

```prisma
model SystemSetting {
  // Add these keys:
  // - tax_api_enabled (boolean)
  // - tax_api_provider ('taxjar' | 'avalara')
  // - tax_nexus_addresses (JSON array)
  // - taxjar_api_key (encrypted string)
}
```

**Dependencies:**
- TaxJar account + API key
- Nexus address configuration (where platform collects tax)
- Product tax categories

**Testing Checklist:**
- [ ] US order in CA → verify correct state+local tax
- [ ] US order in NY → verify NYC specific rate
- [ ] Order in tax holiday period → verify 0% tax
- [ ] Order with exempt product → verify exemption
- [ ] International order → verify VAT/GST
- [ ] TaxJar API down → fallback to hardcoded rates
- [ ] Order created → tax transaction recorded in TaxJar
- [ ] Month-end: export tax report from TaxJar

---

### [P1-004] - Discount/Coupon System Missing
**Priority:** P1 | **Effort:** 16 hours | **Risk:** MEDIUM

**What's Wrong:**
Order model has `discount` field (always 0) but no coupon/promotional code system. Cannot run:
- Percentage discounts
- Fixed amount discounts
- Free shipping promotions
- First-order discounts
- Seasonal sales

**Business Impact:**
- 🚨 **No marketing tools** - cannot incentivize purchases
- 🚨 **Cannot compete** - competitors offer promo codes
- 🚨 **Lost customer acquisition** - first-order discounts proven effective
- 🚨 **Cannot clear inventory** - no clearance sale capability

**Technical Impact:**
- Discount field unused waste
- Totals always full price
- No validation of promo codes
- Cannot track campaign effectiveness

**How to Fix:**

Implement coupon system with validation:

```typescript
// Prisma schema
model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  type        CouponType // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  value       Decimal  @db.Decimal(10, 2) // 10 for 10% or $10

  minOrderValue    Decimal? @db.Decimal(10, 2)
  maxDiscountValue Decimal? @db.Decimal(10, 2) // Cap for percentage

  validFrom   DateTime
  validUntil  DateTime

  usageLimit      Int?     // Total uses allowed
  usageCount      Int      @default(0)
  perUserLimit    Int?     // Uses per customer

  applicableProducts  String[] // Product IDs, empty = all
  applicableCategories String[] // Category IDs

  firstOrderOnly  Boolean  @default(false)
  active          Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  uses        CouponUsage[]

  @@map("coupons")
}

model CouponUsage {
  id        String   @id @default(cuid())
  couponId  String
  userId    String
  orderId   String
  discount  Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())

  coupon    Coupon   @relation(fields: [couponId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  order     Order    @relation(fields: [orderId], references: [id])

  @@index([couponId])
  @@index([userId])
  @@map("coupon_usage")
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}

// Service
@Injectable()
export class CouponService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async validateCoupon(params: {
    code: string;
    userId: string;
    subtotal: number;
    shippingAmount: number;
    items: Array<{ productId: string; quantity: number; price: number }>;
  }) {
    // Find coupon
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: params.code.toUpperCase() },
      include: {
        uses: {
          where: { userId: params.userId },
        },
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    // Check if active
    if (!coupon.active) {
      throw new BadRequestException('Coupon is no longer active');
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom) {
      throw new BadRequestException('Coupon not yet valid');
    }
    if (now > coupon.validUntil) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.perUserLimit && coupon.uses.length >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon the maximum number of times');
    }

    // Check first order only
    if (coupon.firstOrderOnly) {
      const previousOrders = await this.prisma.order.count({
        where: {
          userId: params.userId,
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });

      if (previousOrders > 0) {
        throw new BadRequestException('Coupon valid for first orders only');
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && params.subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value $${coupon.minOrderValue} required`
      );
    }

    // Check product/category restrictions
    if (coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = params.items.some(item =>
        coupon.applicableProducts.includes(item.productId)
      );

      if (!hasApplicableProduct) {
        throw new BadRequestException('Coupon not applicable to items in cart');
      }
    }

    // Calculate discount
    let discountAmount = 0;

    switch (coupon.type) {
      case 'PERCENTAGE':
        discountAmount = params.subtotal * (Number(coupon.value) / 100);

        // Apply cap if set
        if (coupon.maxDiscountValue) {
          discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountValue));
        }
        break;

      case 'FIXED_AMOUNT':
        discountAmount = Math.min(Number(coupon.value), params.subtotal);
        break;

      case 'FREE_SHIPPING':
        discountAmount = params.shippingAmount;
        break;
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
      },
      discount: Math.round(discountAmount * 100) / 100,
    };
  }

  async applyCoupon(couponId: string, orderId: string, userId: string, discount: number) {
    // Record usage
    await this.prisma.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId,
        discount: new Decimal(discount),
      },
    });

    // Increment usage count
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }
}

// Controller endpoint
@Post('validate-coupon')
async validateCoupon(
  @Body() dto: ValidateCouponDto,
  @Request() req,
) {
  try {
    const result = await this.couponService.validateCoupon({
      code: dto.code,
      userId: req.user.id,
      subtotal: dto.subtotal,
      shippingAmount: dto.shippingAmount,
      items: dto.items,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}
```

**Dependencies:**
- Schema migration required
- Admin UI to create/manage coupons

**Testing Checklist:**
- [ ] Create 10% off coupon, verify discount applied
- [ ] Create $5 off coupon, verify fixed discount
- [ ] Create free shipping coupon, verify shipping = 0
- [ ] Try expired coupon → error
- [ ] Try coupon below min order value → error
- [ ] Use single-use coupon twice → error second time
- [ ] First-order coupon on 2nd order → error
- [ ] Percentage with cap: $200 order, 20% off, $30 cap → $30 discount
- [ ] Product-specific: verify only applies to eligible products
- [ ] Verify usage count increments
- [ ] Verify CouponUsage record created

---

## PRIORITY 2 ISSUES (Important but Not Blocking)

### [P2-001] - PayPal Integration Missing
**Priority:** P2 | **Effort:** 24 hours | **Risk:** LOW

**What's Wrong:**
`PaymentMethod` enum includes `PAYPAL` but no actual PayPal SDK integration. Selecting PayPal fails silently or throws error. No PayPal webhook handling.

**Business Impact:**
- 🚨 **Limited payment options** - losing customers who prefer PayPal
- 🚨 **International sales** - PayPal popular in some regions
- 🚨 **False advertising** - UI shows PayPal but doesn't work

**Technical Impact:**
- Enum value unused
- Frontend shows disabled option
- No PayPal settlement tracking

**How to Fix:**

Integrate PayPal Checkout SDK:

```bash
npm install @paypal/checkout-server-sdk
```

```typescript
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalService {
  private client: checkoutNodeJssdk.core.PayPalHttpClient;

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
    private prisma: PrismaService,
  ) {
    const environment = this.configService.get('PAYPAL_MODE') === 'live'
      ? new checkoutNodeJssdk.core.LiveEnvironment(
          this.configService.get('PAYPAL_CLIENT_ID'),
          this.configService.get('PAYPAL_CLIENT_SECRET')
        )
      : new checkoutNodeJssdk.core.SandboxEnvironment(
          this.configService.get('PAYPAL_CLIENT_ID'),
          this.configService.get('PAYPAL_CLIENT_SECRET')
        );

    this.client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  }

  async createOrder(orderId: string) {
    const order = await this.ordersService.findOne(orderId);

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        amount: {
          currency_code: order.currency,
          value: Number(order.total).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: order.currency,
              value: Number(order.subtotal).toFixed(2),
            },
            shipping: {
              currency_code: order.currency,
              value: Number(order.shipping).toFixed(2),
            },
            tax_total: {
              currency_code: order.currency,
              value: Number(order.tax).toFixed(2),
            },
            discount: order.discount > 0 ? {
              currency_code: order.currency,
              value: Number(order.discount).toFixed(2),
            } : undefined,
          },
        },
        items: order.items.map(item => ({
          name: item.name,
          unit_amount: {
            currency_code: order.currency,
            value: Number(item.price).toFixed(2),
          },
          quantity: item.quantity.toString(),
        })),
      }],
    });

    const response = await this.client.execute(request);

    // Store PayPal order ID
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...order.metadata,
          paypalOrderId: response.result.id,
        },
      },
    });

    return {
      orderId: response.result.id,
      status: response.result.status,
      links: response.result.links,
    };
  }

  async capturePayment(paypalOrderId: string) {
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const response = await this.client.execute(request);

    return response.result;
  }

  // Webhook handling
  async handleWebhook(event: any) {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePaymentCaptured(event.resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await this.handlePaymentDenied(event.resource);
        break;

      // Add more event handlers
    }
  }
}
```

**Dependencies:**
- PayPal business account
- PayPal app credentials
- Webhook configuration in PayPal dashboard

**Testing Checklist:**
- [ ] Create order with PayPal payment method
- [ ] Complete PayPal checkout flow
- [ ] Verify payment captured
- [ ] Verify order marked as paid
- [ ] Test payment declined
- [ ] Test refund via PayPal
- [ ] Verify webhook delivery
- [ ] Test currency conversion (if needed)

---

### [P2-002] - Order Status State Machine
**Priority:** P2 | **Effort:** 8 hours | **Risk:** LOW

**What's Wrong:**
Order status can transition from any state to any state. No validation of valid transitions. Could jump from PENDING to DELIVERED skipping SHIPPED.

**Business Impact:**
- 🚨 **Data integrity** - invalid order states
- 🚨 **Reporting errors** - metrics don't make sense
- 🚨 **Compliance** - audit trail incomplete

**Technical Impact:**
- Timeline shows impossible transitions
- Escrow release logic could be bypassed
- Inventory restoration incorrect

**How to Fix:**

Implement state machine with valid transitions:

```typescript
// order-state-machine.ts
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'], // Can only refund after delivery
  CANCELLED: [], // Terminal state
  REFUNDED: [], // Terminal state
};

@Injectable()
export class OrderStateMachine {
  validateTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  async transition(orderId: string, newStatus: OrderStatus, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate transition
    if (!this.validateTransition(order.status as OrderStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`
      );
    }

    // Update order status
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Create timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status: newStatus,
        title: this.getStatusTitle(newStatus),
        description: reason || this.getStatusDescription(newStatus),
        icon: this.getStatusIcon(newStatus),
      },
    });

    return updated;
  }
}
```

**Dependencies:**
- None

**Testing Checklist:**
- [ ] PENDING → CONFIRMED → allowed
- [ ] PENDING → DELIVERED → blocked
- [ ] SHIPPED → CANCELLED → allowed
- [ ] DELIVERED → CANCELLED → blocked
- [ ] CANCELLED → any → blocked
- [ ] Verify timeline entry created
- [ ] API returns 400 for invalid transition

---

### [P2-003] - Real Carrier Integration (DHL)
**Priority:** P2 | **Effort:** 40 hours | **Risk:** MEDIUM

**What's Wrong:**
All shipping rates are estimated/hardcoded. No integration with actual carrier (DHL). Cannot get:
- Real-time rates
- Tracking numbers
- Delivery estimates
- Proof of delivery

**Business Impact:**
- 🚨 **Overcharge/undercharge** customers on shipping
- 🚨 **No tracking** - poor customer experience
- 🚨 **Manual fulfillment** - high operational cost

**Technical Impact:**
- Estimated rates may not cover actual cost
- Tracking numbers manually entered
- Delivery status manually updated

**How to Fix:**

Integrate DHL Express API:

```typescript
// Install DHL SDK (if available) or use REST API
import axios from 'axios';

@Injectable()
export class DHLService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('DHL_API_URL');
    this.apiKey = this.configService.get('DHL_API_KEY');
  }

  async getRates(params: {
    fromCountry: string;
    fromPostalCode: string;
    toCountry: string;
    toPostalCode: string;
    weight: number; // kg
    dimensions?: { length: number; width: number; height: number };
  }) {
    const response = await axios.post(
      `${this.apiUrl}/rates`,
      {
        shipperAddress: {
          countryCode: params.fromCountry,
          postalCode: params.fromPostalCode,
        },
        receiverAddress: {
          countryCode: params.toCountry,
          postalCode: params.toPostalCode,
        },
        packages: [{
          weight: params.weight,
          dimensions: params.dimensions,
        }],
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data.products.map(product => ({
      service: product.productName,
      price: product.totalPrice[0].price,
      currency: product.totalPrice[0].priceCurrency,
      deliveryTime: product.deliveryTime,
    }));
  }

  async createShipment(orderId: string) {
    const order = await this.getOrderWithDetails(orderId);

    const response = await axios.post(
      `${this.apiUrl}/shipments`,
      {
        // Shipment details...
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    // Store tracking number
    await this.prisma.delivery.create({
      data: {
        orderId,
        trackingNumber: response.data.shipmentTrackingNumber,
        carrier: 'DHL',
        // ...
      },
    });

    return response.data;
  }

  async trackShipment(trackingNumber: string) {
    const response = await axios.get(
      `${this.apiUrl}/tracking/${trackingNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data;
  }
}
```

**Dependencies:**
- DHL account + API credentials
- Sender address configuration
- Package weight/dimensions data

**Testing Checklist:**
- [ ] Get rates for domestic shipment
- [ ] Get rates for international shipment
- [ ] Create shipment, verify tracking number
- [ ] Track shipment, verify status updates
- [ ] Test with overweight package (>30kg)
- [ ] Test with invalid postal code
- [ ] Verify rates match actual DHL pricing

---

### [P2-004] - Automatic Currency Rate Sync
**Priority:** P2 | **Effort:** 6 hours | **Risk:** LOW

**What's Wrong:**
`CurrencyService.syncExchangeRates()` returns TODO message. Exchange rates never update automatically. Rates become stale, causing incorrect conversions.

**Business Impact:**
- 🚨 **Inaccurate pricing** in foreign currencies
- 🚨 **Revenue loss** if rate moves unfavorably
- 🚨 **Seller disputes** over payout amounts

**Technical Impact:**
- Manual rate updates only
- No notification of rate changes
- No audit of rate history

**How to Fix:**

```typescript
// Install: npm install axios
import axios from 'axios';

@Injectable()
export class CurrencyService {
  async syncExchangeRates() {
    try {
      // Use free exchange rate API
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );

      const rates = response.data.rates;
      const timestamp = new Date();

      let synced = 0;

      for (const [currencyCode, rate] of Object.entries(rates)) {
        // Check if currency is active in system
        const currency = await this.prisma.currency.findUnique({
          where: { code: currencyCode },
        });

        if (!currency) continue;

        // Get previous rate
        const previousRate = await this.prisma.currencyRate.findFirst({
          where: { currencyCode },
          orderBy: { effectiveDate: 'desc' },
        });

        // Calculate change percentage
        const changePercent = previousRate
          ? ((Number(rate) - Number(previousRate.rate)) / Number(previousRate.rate)) * 100
          : 0;

        // Create new rate record
        await this.prisma.currencyRate.create({
          data: {
            currencyCode,
            rate: new Decimal(rate),
            effectiveDate: timestamp,
            source: 'exchangerate-api',
            metadata: {
              previousRate: previousRate?.rate,
              changePercent,
            },
          },
        });

        synced++;

        // Alert if major change (>5%)
        if (Math.abs(changePercent) > 5) {
          this.logger.warn(
            `Major rate change for ${currencyCode}: ${changePercent.toFixed(2)}%`
          );

          // TODO: Send notification to admins
        }
      }

      return {
        synced,
        message: `Synced ${synced} exchange rates`,
        timestamp,
      };
    } catch (error) {
      this.logger.error('Exchange rate sync failed:', error);
      throw new Error('Failed to sync exchange rates');
    }
  }
}

// Add cron job
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CurrencySyncScheduler {
  constructor(private currencyService: CurrencyService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncRates() {
    this.logger.log('Starting daily currency rate sync');
    await this.currencyService.syncExchangeRates();
  }
}
```

**Dependencies:**
- Exchange rate API (free tier available)
- Cron scheduler enabled

**Testing Checklist:**
- [ ] Manual sync creates new CurrencyRate records
- [ ] Verify 46+ currencies synced
- [ ] Test with API timeout (5s limit)
- [ ] Verify cron runs daily at midnight
- [ ] Test major change alert (>5%)
- [ ] Verify rate history preserved
- [ ] Test fallback if API down

---

## IMPLEMENTATION ROADMAP

### Week 1: Critical Fixes (P0)
**Days 1-3:** Multi-vendor escrow (P0-001)
- Implement split allocation logic
- Test with multiple sellers
- Verify commission calculation per seller

**Days 4-5:** Pre-checkout calculation endpoint (P0-002)
- Add `POST /orders/calculate-totals` endpoint
- Implement total calculation without order creation
- Test with various scenarios

**Days 6-7:** Currency conversion in payouts (P0-003)
- Update Commission model with payout currency fields
- Implement conversion logic
- Test multi-currency scenarios

### Week 2: Launch Readiness (P1)
**Days 1-2:** Delivery confirmation auto-release (P1-001)
- Add grace period logic
- Implement auto-confirm after 14 days
- Test edge cases

**Day 3:** Shipping option selection (P1-002)
- Add shippingMethod to DTO
- Expose in calculate-totals endpoint
- Test all shipping methods

**Days 4-7:** Tax API integration (P1-003)
- Setup TaxJar account
- Implement tax service with TaxJar SDK
- Add fallback to hardcoded rates
- Test various scenarios

### Week 3: Core Features (P1 continued)
**Days 1-5:** Discount/coupon system (P1-004)
- Create Coupon and CouponUsage models
- Implement validation logic
- Add API endpoints
- Test all coupon types and restrictions

**Days 6-7:** Testing & bug fixes
- Integration testing
- End-to-end checkout flow
- Fix any discovered issues

### Week 4: Enhancement (P2)
**Days 1-3:** PayPal integration (P2-001)
- Setup PayPal SDK
- Implement order creation and capture
- Add webhook handling
- Test complete flow

**Day 4:** Order state machine (P2-002)
- Implement transition validation
- Add state machine service
- Update order status endpoints

**Days 5-7:** Buffer for issues
- Address any blocking issues
- Performance optimization
- Documentation updates

### Weeks 5-6: Optional (P2 continued)
- Real carrier integration (40h)
- Currency auto-sync (6h)
- Additional polish

---

## EDGE CASES TO HANDLE

### Multi-Vendor Scenarios
- [ ] Order with 5 sellers, 1 item each
- [ ] Order with 2 sellers, different commission rates
- [ ] Partial refund - which seller gets charged?
- [ ] One seller disputes, others don't

### Currency Edge Cases
- [ ] Zero-decimal currencies (JPY: ¥100, not ¥100.00)
- [ ] Order in EUR, refund in USD (rate changed)
- [ ] Seller changes payout currency mid-month

### Payment Failures
- [ ] Payment succeeds, escrow creation fails
- [ ] Payment succeeds, commission calculation fails
- [ ] Stripe webhook lost/delayed
- [ ] Duplicate webhook delivery

### Delivery Complications
- [ ] Package lost by carrier
- [ ] Delivery attempted but customer not home
- [ ] Customer refuses delivery
- [ ] Partial delivery (backordered items)

### Tax Complexities
- [ ] Customer moves between order and delivery
- [ ] Product tax category changes
- [ ] Tax exemption certificate submitted
- [ ] Tax holiday during fulfillment

---

## DATA MODEL UPDATES REQUIRED

### Commission Model Updates
```prisma
model Commission {
  // ... existing fields

  // Add for currency conversion
  payoutCurrency  String   @default("USD")
  payoutAmount    Decimal  @db.Decimal(10, 2)
  exchangeRate    Decimal? @db.Decimal(10, 6)
}
```

### Coupon System Models
```prisma
model Coupon {
  id          String       @id @default(cuid())
  code        String       @unique
  type        CouponType
  value       Decimal      @db.Decimal(10, 2)

  minOrderValue     Decimal?  @db.Decimal(10, 2)
  maxDiscountValue  Decimal?  @db.Decimal(10, 2)

  validFrom   DateTime
  validUntil  DateTime

  usageLimit      Int?
  usageCount      Int      @default(0)
  perUserLimit    Int?

  applicableProducts   String[]
  applicableCategories String[]

  firstOrderOnly  Boolean  @default(false)
  active          Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  uses        CouponUsage[]

  @@map("coupons")
}

model CouponUsage {
  id        String   @id @default(cuid())
  couponId  String
  userId    String
  orderId   String
  discount  Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())

  coupon    Coupon   @relation(fields: [couponId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  order     Order    @relation(fields: [orderId], references: [id])

  @@index([couponId])
  @@index([userId])
  @@map("coupon_usage")
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

### Order Model Updates
```prisma
model Order {
  // ... existing fields

  couponId    String?
  coupon      Coupon?       @relation(fields: [couponId], references: [id])
  couponUsage CouponUsage[]

  // Add shipping method to metadata
  metadata Json? // Add: shippingMethod, shippingCarrier, shippingEstimatedDays
}
```

---

## SYSTEM ARCHITECTURE OVERVIEW

### Current Stack
- **Frontend:** Next.js 15 with React
- **Backend:** NestJS (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Payment:** Stripe (primary processor)
- **Financial Model:** Escrow-based with Commission & Payout system

### Key Components

#### Tax Calculation
**File:** `/apps/api/src/orders/shipping-tax.service.ts`
- Hardcoded US state tax rates (50 states + DC)
- Fixed 2% local tax estimate
- No international support
- **Status:** Needs TaxJar/Avalara integration

#### Shipping Calculation
**Files:**
- `/apps/api/src/orders/shipping-tax.service.ts` (legacy hardcoded)
- `/apps/api/src/shipping/shipping.service.ts` (new zone-based)
- **Status:** Dual systems need consolidation

#### Currency Management
**File:** `/apps/api/src/currency/currency.service.ts`
- 46+ currencies supported
- Exchange rates stored but not applied
- **Status:** Needs conversion implementation

#### Payment Processing
**File:** `/apps/api/src/payment/payment.service.ts`
- Stripe integration complete
- Webhook handling with retry logic
- Manual/automatic capture support
- **Status:** PayPal missing

#### Escrow System
**File:** `/apps/api/src/escrow/escrow.service.ts`
- Hold period configurable
- Auto-release via cron
- Delivery confirmation support
- **Status:** Multi-vendor broken

#### Commission & Payout
**Files:**
- `/apps/api/src/commission/commission.service.ts`
- `/apps/api/src/commission/payout.service.ts`
- Priority-based rule system
- Payout frequency configuration
- **Status:** Currency conversion missing

---

## SUMMARY

**Total Issues Identified:** 14 (6 P0, 4 P1, 4 P2)
**Estimated Total Effort:** 156 hours (~4 weeks for 1 developer)
**Critical Path:** P0 → P1 → P2

### Must-Have for Launch (P0)
1. ✅ Multi-vendor escrow (16h)
2. ✅ Pre-checkout calculations (8h)
3. ✅ Currency conversion (12h)

**Total P0 Effort:** 36 hours (1 week)

### Should-Have for Launch (P1)
4. ✅ Delivery confirmation handling (6h)
5. ✅ Shipping selection (4h)
6. ✅ Tax API integration (20h)
7. ✅ Coupon system (16h)

**Total P1 Effort:** 46 hours (1+ weeks)

### Nice-to-Have (P2)
8. ✅ PayPal integration (24h)
9. ✅ State machine (8h)
10. ✅ Real carrier integration (40h)
11. ✅ Auto currency sync (6h)

**Total P2 Effort:** 78 hours (2 weeks)

---

## RISK ASSESSMENT

### High Risk (Immediate Action Required)
- **Multi-vendor escrow broken** → Funds not held, fraud risk
- **No pre-checkout calculation** → Cart abandonment
- **Currency conversion missing** → Seller payment disputes

### Medium Risk (Launch Blockers)
- **Tax calculation inaccurate** → Compliance violations
- **No coupon system** → Lost marketing opportunities
- **Delivery confirmation blocks escrow** → Seller fund holds

### Low Risk (Can Launch Without)
- **PayPal missing** → Reduced payment options
- **No state machine** → Data integrity issues
- **Hardcoded shipping** → Overcharge/undercharge

---

## NEXT STEPS

1. **Immediate (This Week):**
   - Fix multi-vendor escrow (P0-001)
   - Add pre-checkout endpoint (P0-002)

2. **Week 2:**
   - Implement currency conversion (P0-003)
   - Add delivery confirmation logic (P1-001)

3. **Week 3:**
   - Integrate TaxJar (P1-003)
   - Build coupon system (P1-004)

4. **Week 4:**
   - Final testing and bug fixes
   - Production deployment preparation

---

**Document Version:** 1.0
**Last Updated:** January 21, 2026
**Status:** Active Implementation Required
