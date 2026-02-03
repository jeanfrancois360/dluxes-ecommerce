# Stripe Transaction Fee Implementation Plan

## Executive Summary

**Critical Finding:** The system currently does NOT deduct Stripe/PayPal transaction fees from seller earnings!

### Current Calculation:
```
Seller Earnings = Order Amount - Platform Commission
                = €14,405.79 - €1,440.58 (10%)
                = €12,965.21
```

### Correct Calculation Should Be:
```
Seller Earnings = Order Amount - Platform Commission - Stripe Fee
                = €14,405.79 - €1,440.58 (10%) - €417.77 (2.9%)
                = €12,547.44
```

**Difference:** €417.77 per this order! 💰

---

## Platform Fee Confirmation

✅ **Platform commission rate is NOT hardcoded!**

The system correctly fetches from `global_commission_rate` setting (default: 10%).

Location: `apps/api/src/seller/seller.service.ts:428`

```typescript
const setting = await this.settingsService.getSetting('global_commission_rate');
if (setting && setting.value) {
  commissionRate = new Decimal(Number(setting.value));
}
```

---

## Stripe Fee Structure

**Stripe Europe:**
- 2.9% + €0.30 per successful card charge
- 1.5% + €0.30 for European cards

**Stripe US:**
- 2.9% + $0.30 per successful charge

**PayPal:**
- 3.49% + fixed fee

---

## Implementation Plan

### Phase 1: Database Schema (STARTED ✓)

**Changes Made to schema.prisma:**

#### 1. PaymentTransaction Model
```prisma
model PaymentTransaction {
  // ... existing fields

  // NEW FIELDS:
  stripeBalanceTransactionId String? // For retrieving fee information
  processingFeeAmount   Decimal? @db.Decimal(10, 2) // Total fee
  processingFeePercent  Decimal? @db.Decimal(5, 4)  // e.g., 0.0290 for 2.9%
  processingFeeFixed    Decimal? @db.Decimal(10, 2) // e.g., 0.30
  netAmount             Decimal? @db.Decimal(10, 2) // After fees
}
```

#### 2. EscrowTransaction Model
```prisma
model EscrowTransaction {
  // ... existing fields

  totalAmount         Decimal @db.Decimal(10, 2) // Seller's portion
  platformFee         Decimal @db.Decimal(10, 2) // Commission
  paymentProcessingFee Decimal @default(0) @db.Decimal(10, 2) // NEW!
  sellerAmount        Decimal @db.Decimal(10, 2) // Net (after all fees)
}
```

### Phase 2: Migration (BLOCKED - Needs Resolution)

**Issue:** Migration drift detected.

Database has tables/columns not in migration history:
- admin_notes, credit_balances, email_otps, product_inquiries, etc.
- 100+ new product columns (vehicle, real estate, digital, etc.)

**Resolution Options:**

**Option A: Reset Database (Development Only)**
```bash
cd packages/database
npx prisma migrate reset  # Drops all data!
npx prisma migrate dev --name add_payment_processing_fees
npx prisma db seed        # Restore seed data
```

**Option B: Manual SQL Migration (Recommended for Production)**
```sql
-- Add to PaymentTransaction table
ALTER TABLE payment_transactions
ADD COLUMN "stripeBalanceTransactionId" TEXT,
ADD COLUMN "processingFeeAmount" DECIMAL(10,2),
ADD COLUMN "processingFeePercent" DECIMAL(5,4),
ADD COLUMN "processingFeeFixed" DECIMAL(10,2),
ADD COLUMN "netAmount" DECIMAL(10,2);

-- Add to EscrowTransaction table
ALTER TABLE escrow_transactions
ADD COLUMN "paymentProcessingFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
```

**Option C: Force Migration (Ignore Drift)**
```bash
cd packages/database
# Create migration SQL file manually
npx prisma migrate resolve --applied add_payment_processing_fees
```

### Phase 3: Retrieve Stripe Fees from API

**File:** `apps/api/src/payment/payment.service.ts`

**Add method to fetch balance transaction:**

```typescript
/**
 * Retrieve Stripe fee information from balance transaction
 */
private async getStripeProcessingFees(
  chargeId: string
): Promise<{ feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal }> {
  try {
    const stripe = await this.getStripeClient();

    // Get charge details
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ['balance_transaction'],
    });

    if (!charge.balance_transaction || typeof charge.balance_transaction === 'string') {
      this.logger.warn(`No balance transaction found for charge ${chargeId}`);
      return this.getEstimatedFees(charge.amount, charge.currency);
    }

    const balanceTransaction = charge.balance_transaction;
    const feeAmount = new Decimal(balanceTransaction.fee).div(100); // Convert cents to dollars

    // Calculate percentage and fixed fee (reverse engineer from total)
    const chargeAmount = new Decimal(balanceTransaction.amount).div(100);

    // Stripe fee structure: fee = (amount × percent) + fixed
    // For 2.9% + 0.30: fee = (amount × 0.029) + 0.30
    const estimatedPercent = new Decimal(0.029); // 2.9%
    const estimatedFixed = new Decimal(0.30);

    // Verify it matches (approximately)
    const calculatedFee = chargeAmount.mul(estimatedPercent).add(estimatedFixed);

    if (feeAmount.sub(calculatedFee).abs().lessThan(0.05)) {
      // Match! Use standard rates
      return {
        feeAmount,
        feePercent: estimatedPercent,
        feeFixed: estimatedFixed,
      };
    }

    // Different rate structure - calculate from actual
    const feePercent = feeAmount.sub(0.30).div(chargeAmount);

    return {
      feeAmount,
      feePercent,
      feeFixed: new Decimal(0.30),
    };
  } catch (error) {
    this.logger.error(`Failed to retrieve Stripe fees for charge ${chargeId}:`, error);
    throw error;
  }
}

/**
 * Get estimated fees when balance transaction unavailable
 */
private getEstimatedFees(
  amountInCents: number,
  currency: string
): { feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal } {
  const amount = new Decimal(amountInCents).div(100);

  // Standard Stripe rates by currency
  const rates = {
    EUR: { percent: 0.029, fixed: 0.30 },
    USD: { percent: 0.029, fixed: 0.30 },
    GBP: { percent: 0.029, fixed: 0.20 },
  };

  const rate = rates[currency.toUpperCase()] || rates.USD;
  const feePercent = new Decimal(rate.percent);
  const feeFixed = new Decimal(rate.fixed);
  const feeAmount = amount.mul(feePercent).add(feeFixed);

  return { feeAmount, feePercent, feeFixed };
}
```

**Update webhook handler to store fees:**

```typescript
// In handlePaymentSuccess() method
private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, webhookEventId: string) {
  // ... existing code ...

  // Get processing fees
  let processingFees = null;
  if (paymentIntent.latest_charge) {
    try {
      processingFees = await this.getStripeProcessingFees(
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id
      );
    } catch (error) {
      this.logger.warn('Could not retrieve exact Stripe fees, using estimates');
      processingFees = this.getEstimatedFees(
        paymentIntent.amount,
        paymentIntent.currency
      );
    }
  }

  // Update transaction with fee information
  await this.prisma.paymentTransaction.update({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      processingFeeAmount: processingFees?.feeAmount,
      processingFeePercent: processingFees?.feePercent,
      processingFeeFixed: processingFees?.feeFixed,
      netAmount: new Decimal(paymentIntent.amount)
        .div(100)
        .sub(processingFees?.feeAmount || 0),
    },
  });

  // ... rest of webhook logic ...
}
```

### Phase 4: Update Seller Earnings Calculation

**File:** `apps/api/src/seller/seller.service.ts`

**Update calculateSellerOrderTotals method:**

```typescript
private async calculateSellerOrderTotals(order: any) {
  // ... existing calculation ...

  // Calculate seller's gross total (before any fees)
  const sellerTotal = sellerSubtotal
    .plus(sellerShipping)
    .plus(sellerTax)
    .minus(sellerDiscount);

  // Get platform commission rate
  let commissionRate = new Decimal(10);
  try {
    const setting = await this.settingsService.getSetting('global_commission_rate');
    if (setting && setting.value) {
      commissionRate = new Decimal(Number(setting.value));
    }
  } catch (error) {
    this.logger.warn('Commission rate not found, using default 10%');
  }

  // Calculate platform commission
  const platformCommission = sellerTotal.mul(commissionRate).div(100);

  // Get payment processing fees (Stripe/PayPal)
  let paymentProcessingFee = new Decimal(0);

  if (order.transactions && order.transactions.length > 0) {
    // Get fees from actual payment transaction
    const transaction = order.transactions.find(
      (t: any) => t.status === 'SUCCEEDED' || t.status === 'CAPTURED'
    );

    if (transaction?.processingFeeAmount) {
      // Use actual fees from Stripe
      const totalProcessingFee = new Decimal(transaction.processingFeeAmount);

      // Allocate proportionally to this seller
      const orderTotal = new Decimal(order.total);
      const proportion = sellerTotal.div(orderTotal);
      paymentProcessingFee = totalProcessingFee.mul(proportion);

      this.logger.log(
        `Using actual Stripe fee: ${totalProcessingFee.toFixed(2)} ` +
        `(seller portion: ${paymentProcessingFee.toFixed(2)})`
      );
    } else {
      // Estimate if not yet retrieved
      paymentProcessingFee = this.estimateProcessingFee(sellerTotal, order.currency);
      this.logger.log(
        `Estimated Stripe fee: ${paymentProcessingFee.toFixed(2)} ` +
        `(will update with actual after webhook)`
      );
    }
  }

  // Calculate net earnings (what seller actually receives)
  const netEarnings = sellerTotal
    .minus(platformCommission)
    .minus(paymentProcessingFee);

  return {
    subtotal: sellerSubtotal.toNumber(),
    shipping: sellerShipping.toNumber(),
    tax: sellerTax.toNumber(),
    discount: sellerDiscount.toNumber(),
    total: sellerTotal.toNumber(), // Gross total
    platformCommission: platformCommission.toNumber(),
    commissionRate: commissionRate.toNumber(),
    paymentProcessingFee: paymentProcessingFee.toNumber(), // NEW!
    processingFeeRate: 2.9, // NEW! (or get from settings)
    netEarnings: netEarnings.toNumber(), // Amount seller receives
    itemCount: order.items.length,
    proportion: proportion.toNumber(),
  };
}

/**
 * Estimate processing fee when actual not yet available
 */
private estimateProcessingFee(amount: Decimal, currency: string): Decimal {
  // Standard Stripe rates
  const rates: Record<string, { percent: number; fixed: number }> = {
    EUR: { percent: 2.9, fixed: 0.30 },
    USD: { percent: 2.9, fixed: 0.30 },
    GBP: { percent: 2.9, fixed: 0.20 },
  };

  const rate = rates[currency.toUpperCase()] || rates.USD;
  const percentFee = amount.mul(rate.percent).div(100);
  const totalFee = percentFee.add(rate.fixed);

  return totalFee;
}
```

### Phase 5: Update Frontend Display

**File:** `apps/web/src/app/seller/orders/[id]/page.tsx`

```typescript
{/* Earnings Card */}
<div className="bg-white rounded-xl shadow-sm p-6">
  <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
    <CreditCard className="w-5 h-5" />
    Your Earnings
  </h2>
  <div className="space-y-3">
    <div className="flex justify-between">
      <span className="text-neutral-600">Payment Status</span>
      <StatusBadge status={order.paymentStatus} type="payment" />
    </div>

    <div className="border-t pt-3 mt-3 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">Order Amount (Your Portion)</span>
        <span className="text-black">
          {formatCurrency(sellerTotals.total, order.currency)}
        </span>
      </div>

      {sellerTotals.platformCommission !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">
            Platform Fee ({sellerTotals.commissionRate || 10}%)
          </span>
          <span className="text-red-600">
            -{formatCurrency(sellerTotals.platformCommission, order.currency)}
          </span>
        </div>
      )}

      {sellerTotals.paymentProcessingFee !== undefined &&
       sellerTotals.paymentProcessingFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">
            Payment Processing Fee (
            {sellerTotals.processingFeeRate || 2.9}% + {
              order.currency === 'EUR' ? '€0.30' :
              order.currency === 'GBP' ? '£0.20' :
              '$0.30'
            })
          </span>
          <span className="text-red-600">
            -{formatCurrency(sellerTotals.paymentProcessingFee, order.currency)}
          </span>
        </div>
      )}

      <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
        <span className="text-black">Net Earnings</span>
        <span className="text-green-600">
          {formatCurrency(
            sellerTotals.netEarnings !== undefined
              ? sellerTotals.netEarnings
              : sellerTotals.total,
            order.currency
          )}
        </span>
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        Amount you'll receive after all fees
      </p>
    </div>
  </div>
</div>
```

### Phase 6: Update TypeScript Interfaces

**File:** `apps/web/src/lib/api/seller.ts`

```typescript
export interface SellerOrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number; // Gross total
  platformCommission?: number;
  commissionRate?: number;
  paymentProcessingFee?: number; // NEW!
  processingFeeRate?: number;    // NEW!
  netEarnings?: number; // Amount after ALL fees
  itemCount: number;
  proportion: number;
}
```

---

## Example Calculation

**For order €14,405.79:**

| Item | Amount |
|------|---------|
| **Order Amount** (seller's portion) | €14,405.79 |
| **Platform Commission** (10%) | -€1,440.58 |
| **Stripe Fee** (2.9% + €0.30) | -€417.77 |
| **Net Earnings** (seller receives) | **€12,547.44** |

**Breakdown of Stripe Fee:**
- 2.9% × €14,405.79 = €417.77
- Fixed fee: €0.30
- **Total:** €417.77 + €0.30 = **€418.07**

---

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Stripe balance_transaction retrieval working
- [ ] Payment webhook stores processing fees
- [ ] Seller earnings calculation includes Stripe fees
- [ ] Frontend displays all fee breakdowns
- [ ] Multi-vendor orders split fees correctly
- [ ] Refunds adjust fees appropriately
- [ ] PayPal fees handled (if supported)
- [ ] Admin can view fee reports
- [ ] Historical orders show estimates if fees not stored

---

## Next Steps

1. **Resolve migration drift** (choose Option A, B, or C above)
2. **Apply schema changes** to add fee tracking fields
3. **Implement Stripe fee retrieval** in payment webhook
4. **Update seller service** to calculate fees
5. **Update frontend** to display fees
6. **Test with real Stripe transactions**
7. **Monitor fee accuracy** in production

---

## Important Notes

- **Stripe fees vary by country** and card type (2.9% is standard EU/US)
- **European cards** charged to EU accounts: 1.5% + €0.30
- **International cards**: Higher rates apply
- **PayPal fees**: 3.49% + fixed fee (higher than Stripe)
- Always retrieve **actual fees from balance_transaction** when possible
- Use **estimates only as fallback** before webhook completes

---

**Generated:** February 1, 2026
**Status:** Schema changes ready, migration blocked by drift
