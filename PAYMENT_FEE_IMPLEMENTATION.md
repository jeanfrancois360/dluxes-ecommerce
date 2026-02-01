# Payment Processing Fee Implementation (Stripe + PayPal)

## Executive Summary

**CRITICAL FINDING:** The system supports **BOTH Stripe AND PayPal** but does NOT deduct transaction fees from either!

### Supported Payment Methods:
1. **STRIPE** - 2.9% + €0.30
2. **PAYPAL** - 3.49% + fixed fee **(19% higher than Stripe!)**
3. **CREDIT_CARD** - Processed via Stripe (2.9%)
4. **BANK_TRANSFER** - Manual (no processor fees)

### Current vs Correct Calculation:

**Example: €14,405.79 order**

| Payment Method | Current (Wrong ❌) | Should Be (Correct ✅) |
|----------------|-------------------|------------------------|
| **Stripe** | €12,965.21 | €12,547.44 (-€417.77 fee) |
| **PayPal** | €12,965.21 | €12,462.44 (-€502.76 fee) |
| **Difference** | **SAME** (wrong!) | **€85.32 more with PayPal!** |

---

## Fee Structure Comparison

### Stripe Fees
- **Europe:** 2.9% + €0.30 per charge
- **European Cards (EEA):** 1.5% + €0.30 (lower!)
- **US:** 2.9% + $0.30
- **International Cards:** 3.9% + fixed fee

### PayPal Fees
- **Standard:** 3.49% + fixed fee
- **International:** 4.49% + fixed fee
- **Currency Conversion:** Additional 3-4%
- **Micropayments:** 5% + $0.05 (for small transactions)

**Fixed Fees by Currency:**
- EUR: €0.35
- USD: $0.30
- GBP: £0.30

---

## Architecture: Payment-Processor-Agnostic System

### Design Principles:
1. ✅ **Single source of truth:** `PaymentTransaction.processingFeeAmount`
2. ✅ **Processor-specific retrieval:** Different APIs for Stripe vs PayPal
3. ✅ **Fallback estimates:** When actual fees unavailable
4. ✅ **Audit trail:** Store breakdown for reconciliation

---

## Database Schema (Multi-Processor Support)

### PaymentTransaction Model
```prisma
model PaymentTransaction {
  id      String @id @default(cuid())
  orderId String
  userId  String

  // Payment Processor Information
  paymentMethod              PaymentMethod // STRIPE, PAYPAL, CREDIT_CARD, BANK_TRANSFER

  // Stripe-specific
  stripePaymentIntentId      String? @unique
  stripeChargeId             String?
  stripeBalanceTransactionId String? // For fee retrieval

  // PayPal-specific
  paypalOrderId   String? // Stored in metadata currently
  paypalCaptureId String? // Stored in metadata currently

  // Universal Processing Fee Fields
  processingFeeAmount   Decimal? @db.Decimal(10, 2) // Total fee (works for ANY processor)
  processingFeePercent  Decimal? @db.Decimal(5, 4)  // e.g., 0.0349 for 3.49%
  processingFeeFixed    Decimal? @db.Decimal(10, 2) // e.g., 0.35 for €0.35
  netAmount             Decimal? @db.Decimal(10, 2) // Amount after fees

  // Metadata for processor-specific data
  metadata Json?
}
```

### EscrowTransaction Model
```prisma
model EscrowTransaction {
  totalAmount          Decimal @db.Decimal(10, 2) // Seller's order portion
  platformFee          Decimal @db.Decimal(10, 2) // Platform commission (10%)
  paymentProcessingFee Decimal @default(0) @db.Decimal(10, 2) // Stripe/PayPal fee
  sellerAmount         Decimal @db.Decimal(10, 2) // Net after ALL fees
  currency             String  @default("USD")
}
```

---

## Implementation

### Step 1: Retrieve Stripe Fees

**File:** `apps/api/src/payment/payment.service.ts`

```typescript
/**
 * Retrieve actual Stripe fee from balance_transaction
 */
private async getStripeProcessingFees(
  chargeId: string
): Promise<{ feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal }> {
  try {
    const stripe = await this.getStripeClient();

    // Get charge with expanded balance_transaction
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ['balance_transaction'],
    });

    if (!charge.balance_transaction || typeof charge.balance_transaction === 'string') {
      this.logger.warn(`No balance transaction for charge ${chargeId}, using estimates`);
      return this.estimateStripeFees(charge.amount, charge.currency);
    }

    const balanceTransaction = charge.balance_transaction;

    // Fee is in cents
    const feeAmount = new Decimal(balanceTransaction.fee).div(100);
    const chargeAmount = new Decimal(balanceTransaction.amount).div(100);

    // Extract fee details from balance_transaction.fee_details
    let feePercent = new Decimal(0.029); // Default 2.9%
    let feeFixed = new Decimal(0.30);

    if (balanceTransaction.fee_details) {
      for (const detail of balanceTransaction.fee_details) {
        if (detail.type === 'stripe_fee') {
          // Stripe fee = (amount × rate) + fixed
          // We have total fee, reverse-calculate
          const estimatedPercentFee = chargeAmount.mul(feePercent);
          feeFixed = feeAmount.sub(estimatedPercentFee);
        }
      }
    }

    this.logger.log(
      `Stripe fee retrieved: ${feeAmount.toFixed(2)} ` +
      `(${feePercent.mul(100).toFixed(2)}% + ${feeFixed.toFixed(2)})`
    );

    return { feeAmount, feePercent, feeFixed };
  } catch (error) {
    this.logger.error(`Failed to retrieve Stripe fees for ${chargeId}:`, error);
    throw error;
  }
}

/**
 * Estimate Stripe fees when actual unavailable
 */
private estimateStripeFees(
  amountInCents: number,
  currency: string
): { feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal } {
  const amount = new Decimal(amountInCents).div(100);

  const rates: Record<string, { percent: number; fixed: number }> = {
    EUR: { percent: 2.9, fixed: 0.30 },
    USD: { percent: 2.9, fixed: 0.30 },
    GBP: { percent: 2.9, fixed: 0.20 },
  };

  const rate = rates[currency.toUpperCase()] || rates.USD;
  const feePercent = new Decimal(rate.percent).div(100);
  const feeFixed = new Decimal(rate.fixed);
  const feeAmount = amount.mul(feePercent).add(feeFixed);

  this.logger.log(`Estimated Stripe fee: ${feeAmount.toFixed(2)} for ${amount} ${currency}`);

  return { feeAmount, feePercent, feeFixed };
}

/**
 * Update webhook handler to store Stripe fees
 */
private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, webhookEventId: string) {
  // ... existing code ...

  // Get Stripe processing fees
  let processingFees = null;
  if (paymentIntent.latest_charge) {
    try {
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge.id;

      processingFees = await this.getStripeProcessingFees(chargeId);
    } catch (error) {
      this.logger.warn('Could not retrieve exact fees, using estimates');
      processingFees = this.estimateStripeFees(
        paymentIntent.amount,
        paymentIntent.currency
      );
    }
  }

  // Store fees in transaction
  await this.prisma.paymentTransaction.update({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      stripeBalanceTransactionId: typeof paymentIntent.latest_charge !== 'string'
        ? paymentIntent.latest_charge?.balance_transaction
        : undefined,
      processingFeeAmount: processingFees?.feeAmount,
      processingFeePercent: processingFees?.feePercent,
      processingFeeFixed: processingFees?.feeFixed,
      netAmount: new Decimal(paymentIntent.amount)
        .div(100)
        .sub(processingFees?.feeAmount || 0),
    },
  });

  this.logger.log(
    `Stripe fees stored: ${processingFees?.feeAmount.toFixed(2)} for intent ${paymentIntent.id}`
  );

  // ... rest of webhook logic ...
}
```

### Step 2: Retrieve PayPal Fees

**File:** `apps/api/src/payment/paypal.service.ts`

**Update captureOrder method:**

```typescript
async captureOrder(paypalOrderId: string): Promise<{ success: boolean; orderId: string; transactionId: string }> {
  const client = this.getClient();

  try {
    // ... existing code to find transaction ...

    // Capture the order
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const response = await client.execute(request);
    const captureResult = response.result;

    const capture = captureResult.purchase_units[0].payments.captures[0];
    const isSuccess = capture.status === 'COMPLETED';

    if (isSuccess) {
      // Extract PayPal fees from seller_receivable_breakdown
      let processingFeeAmount = new Decimal(0);
      let processingFeePercent = new Decimal(0.0349); // Default 3.49%
      let processingFeeFixed = new Decimal(0.35); // Default €0.35

      if (capture.seller_receivable_breakdown) {
        const breakdown = capture.seller_receivable_breakdown;

        // PayPal fee structure:
        // gross_amount = net_amount + paypal_fee
        const grossAmount = new Decimal(breakdown.gross_amount.value);
        const netAmount = new Decimal(breakdown.net_amount.value);
        const paypalFee = new Decimal(breakdown.paypal_fee.value);

        processingFeeAmount = paypalFee;

        // Reverse-calculate percentage and fixed fee
        // fee = (gross × percent) + fixed
        // Solve for percent and fixed
        const currency = breakdown.gross_amount.currency_code;
        const fixedFees: Record<string, number> = {
          EUR: 0.35,
          USD: 0.30,
          GBP: 0.30,
        };

        processingFeeFixed = new Decimal(fixedFees[currency] || 0.30);
        processingFeePercent = paypalFee
          .sub(processingFeeFixed)
          .div(grossAmount);

        this.logger.log(
          `PayPal fees extracted: ${paypalFee.toFixed(2)} ` +
          `(${processingFeePercent.mul(100).toFixed(2)}% + ${processingFeeFixed.toFixed(2)})`
        );
      } else {
        // Estimate if breakdown not available
        const amount = new Decimal(capture.amount.value);
        processingFeeAmount = this.estimatePayPalFees(amount, capture.amount.currency_code);

        this.logger.warn(
          `PayPal seller_receivable_breakdown not available, estimated fee: ${processingFeeAmount.toFixed(2)}`
        );
      }

      // Update transaction with PayPal fees
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.SUCCEEDED,
          processingFeeAmount,
          processingFeePercent,
          processingFeeFixed,
          netAmount: new Decimal(capture.amount.value).sub(processingFeeAmount),
          metadata: {
            ...(transaction.metadata as object),
            captureId: capture.id,
            captureStatus: capture.status,
            capturedAt: new Date().toISOString(),
            sellerReceivableBreakdown: capture.seller_receivable_breakdown, // Store for audit
          },
        },
      });

      // ... rest of existing code ...
    }
  } catch (error) {
    // ... existing error handling ...
  }
}

/**
 * Estimate PayPal fees
 */
private estimatePayPalFees(amount: Decimal, currency: string): Decimal {
  const rates: Record<string, { percent: number; fixed: number }> = {
    EUR: { percent: 3.49, fixed: 0.35 },
    USD: { percent: 3.49, fixed: 0.30 },
    GBP: { percent: 3.49, fixed: 0.30 },
  };

  const rate = rates[currency.toUpperCase()] || rates.USD;
  const feePercent = new Decimal(rate.percent).div(100);
  const feeFixed = new Decimal(rate.fixed);
  const feeAmount = amount.mul(feePercent).add(feeFixed);

  return feeAmount;
}
```

### Step 3: Unified Seller Earnings Calculation

**File:** `apps/api/src/seller/seller.service.ts`

```typescript
private async calculateSellerOrderTotals(order: any) {
  // ... existing calculation for sellerTotal ...

  // Get platform commission
  let commissionRate = new Decimal(10);
  try {
    const setting = await this.settingsService.getSetting('global_commission_rate');
    if (setting && setting.value) {
      commissionRate = new Decimal(Number(setting.value));
    }
  } catch (error) {
    this.logger.warn('Using default 10% commission');
  }

  const platformCommission = sellerTotal.mul(commissionRate).div(100);

  // Get payment processing fees (Stripe OR PayPal OR other)
  let paymentProcessingFee = new Decimal(0);
  let processingFeeRate = 0;
  let paymentProcessor = 'Unknown';

  if (order.transactions && order.transactions.length > 0) {
    const transaction = order.transactions.find(
      (t: any) => t.status === 'SUCCEEDED' || t.status === 'CAPTURED'
    );

    if (transaction) {
      paymentProcessor = transaction.paymentMethod;

      if (transaction.processingFeeAmount) {
        // Use actual fees from Stripe/PayPal
        const totalProcessingFee = new Decimal(transaction.processingFeeAmount);

        // Allocate proportionally if multi-vendor order
        const orderTotal = new Decimal(order.total);
        const proportion = sellerTotal.div(orderTotal);
        paymentProcessingFee = totalProcessingFee.mul(proportion);

        // Get rate for display
        if (transaction.processingFeePercent) {
          processingFeeRate = Number(transaction.processingFeePercent) * 100;
        }

        this.logger.log(
          `${paymentProcessor} fee (actual): ${paymentProcessingFee.toFixed(2)} ` +
          `(${processingFeeRate.toFixed(2)}%)`
        );
      } else {
        // Estimate based on payment method
        paymentProcessingFee = this.estimateProcessingFee(
          sellerTotal,
          order.currency,
          transaction.paymentMethod
        );

        processingFeeRate = transaction.paymentMethod === 'PAYPAL' ? 3.49 : 2.9;

        this.logger.log(
          `${paymentProcessor} fee (estimated): ${paymentProcessingFee.toFixed(2)}`
        );
      }
    }
  }

  // Calculate net earnings (after ALL fees)
  const netEarnings = sellerTotal
    .minus(platformCommission)
    .minus(paymentProcessingFee);

  return {
    subtotal: sellerSubtotal.toNumber(),
    shipping: sellerShipping.toNumber(),
    tax: sellerTax.toNumber(),
    discount: sellerDiscount.toNumber(),
    total: sellerTotal.toNumber(),
    platformCommission: platformCommission.toNumber(),
    commissionRate: commissionRate.toNumber(),
    paymentProcessingFee: paymentProcessingFee.toNumber(),
    processingFeeRate,
    paymentProcessor, // "STRIPE", "PAYPAL", etc.
    netEarnings: netEarnings.toNumber(),
    itemCount: order.items.length,
    proportion: proportion.toNumber(),
  };
}

/**
 * Estimate processing fee when actual not yet available
 */
private estimateProcessingFee(
  amount: Decimal,
  currency: string,
  paymentMethod: string
): Decimal {
  // Different rates for different processors
  const stripeRates: Record<string, { percent: number; fixed: number }> = {
    EUR: { percent: 2.9, fixed: 0.30 },
    USD: { percent: 2.9, fixed: 0.30 },
    GBP: { percent: 2.9, fixed: 0.20 },
  };

  const paypalRates: Record<string, { percent: number; fixed: number }> = {
    EUR: { percent: 3.49, fixed: 0.35 },
    USD: { percent: 3.49, fixed: 0.30 },
    GBP: { percent: 3.49, fixed: 0.30 },
  };

  const rates = paymentMethod === 'PAYPAL' ? paypalRates : stripeRates;
  const rate = rates[currency.toUpperCase()] || rates.USD;

  const feePercent = new Decimal(rate.percent).div(100);
  const feeFixed = new Decimal(rate.fixed);
  const feeAmount = amount.mul(feePercent).add(feeFixed);

  return feeAmount;
}
```

### Step 4: Frontend Display (Multi-Processor)

**File:** `apps/web/src/app/seller/orders/[id]/page.tsx`

```tsx
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

    {sellerTotals.paymentProcessor && (
      <div className="flex justify-between text-xs">
        <span className="text-neutral-500">Payment Method</span>
        <span className="text-neutral-600 font-mono">
          {sellerTotals.paymentProcessor}
        </span>
      </div>
    )}

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
            {sellerTotals.paymentProcessor === 'PAYPAL' ? 'PayPal' : 'Stripe'} Fee
            {sellerTotals.processingFeeRate > 0 && (
              <> ({sellerTotals.processingFeeRate.toFixed(2)}%)</>
            )}
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

---

## Example Calculation: Same Order, Different Processors

**Order Amount:** €14,405.79 (seller's portion)

### Via Stripe:
```
Order Amount:     €14,405.79
Platform Fee (10%):  -€1,440.58
Stripe Fee (2.9%):     -€417.77
─────────────────────────────
Net Earnings:     €12,547.44
```

### Via PayPal:
```
Order Amount:     €14,405.79
Platform Fee (10%):  -€1,440.58
PayPal Fee (3.49%):    -€502.76  ⚠️ €85 MORE!
─────────────────────────────
Net Earnings:     €12,462.44
```

**Seller loses €85.32 more with PayPal!**

---

## Migration Strategy

Same as before - need to resolve drift first. See `STRIPE_FEE_IMPLEMENTATION.md` for options.

---

## Testing Checklist

- [ ] Stripe fee retrieval from balance_transaction
- [ ] PayPal fee retrieval from seller_receivable_breakdown
- [ ] Multi-vendor order proportional fee allocation
- [ ] Frontend displays correct processor name
- [ ] Fee calculations accurate for both processors
- [ ] Historical orders show estimates when no fees stored
- [ ] Bank transfer shows no processing fees

---

## Important Notes

### Stripe Variations:
- EEA cards: 1.5% + €0.30 (cheaper!)
- International: 3.9% + fixed
- Currency conversion: +1%

### PayPal Variations:
- Micropayments: 5% + $0.05
- International: 4.49% + fixed
- Currency conversion: +3-4%
- Monthly volume discounts available

### Recommendation:
- **Encourage Stripe** (lower fees)
- **Show fee comparison** at checkout
- **Consider absorbing** part of PayPal's higher fees

---

**Generated:** February 1, 2026
**Status:** Multi-processor design complete, schema ready, migration blocked
