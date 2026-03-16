# 🚨 URGENT: Critical Checkout Issues Requiring Immediate Fix

**Date:** March 12, 2026
**Priority:** P0 - Blocking POD Feature Launch
**Estimated Fix Time:** 4-6 hours

---

## Quick Summary

The checkout process has **7 critical issues** that must be fixed before POD feature can go live. The most severe issue (#1) affects ALL products, not just POD.

---

## 🔴 Issue #1: Shipping Method Selection Ignored (AFFECTS ALL ORDERS)

**Impact:** User selects Express ($25) but is charged for Standard ($15) - or vice versa

**Root Cause:** Frontend doesn't send selected shipping method to backend

### Fix Code

**File 1:** `apps/web/src/hooks/use-checkout.ts` line 217

**BEFORE:**

```typescript
const orderResponse = await axios.post(`${API_URL}/orders`, {
  items: orderItems,
  shippingAddressId: state.shippingAddressId,
  paymentMethod: 'STRIPE',
  notes: '',
  idempotencyKey,
});
```

**AFTER:**

```typescript
const orderResponse = await axios.post(`${API_URL}/orders`, {
  items: orderItems,
  shippingAddressId: state.shippingAddressId,
  shippingMethodId: state.shippingMethod?.id, // ADD THIS
  paymentMethod: 'STRIPE',
  notes: '',
  idempotencyKey,
});
```

**File 2:** `apps/api/src/orders/dto/create-order.dto.ts`

**ADD:**

```typescript
@IsOptional()
@IsString()
shippingMethodId?: string;
```

**File 3:** `apps/api/src/orders/orders.service.ts` line 760-776

**BEFORE:**

```typescript
const shippingOptions = await this.shippingTaxService.calculateShippingOptions(...);
const selectedShipping = shippingOptions[0]; // ❌ Always first
let shipping = new Decimal(selectedShipping?.price || 15);
```

**AFTER:**

```typescript
const shippingOptions = await this.shippingTaxService.calculateShippingOptions(...);

// Use provided shipping method or default to standard
let selectedShipping = shippingOptions[0]; // Default

if (shippingMethodId) {
  const foundMethod = shippingOptions.find(opt => opt.id === shippingMethodId);
  if (foundMethod) {
    selectedShipping = foundMethod;
  } else {
    this.logger.warn(`Shipping method ${shippingMethodId} not found, using default`);
  }
}

let shipping = new Decimal(selectedShipping?.price || 15);
```

**Testing:**

1. Add product to cart
2. Go to checkout
3. Select "Express Shipping"
4. Complete payment
5. Verify order.shipping matches Express price

---

## 🔴 Issue #2: POD Products from Unconfigured Sellers Can Be Ordered

**Impact:** Buyer pays, but order cannot be fulfilled

**Root Cause:** No validation that seller has configured Gelato before allowing POD product in cart

### Fix Code

**File 1:** `apps/api/src/products/products.service.ts`

**ADD new method:**

```typescript
/**
 * Check if POD product can be fulfilled
 */
async validatePodFulfillment(productId: string): Promise<{
  canFulfill: boolean;
  reason?: string;
}> {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });

  if (product.fulfillmentType !== 'GELATO_POD') {
    return { canFulfill: true }; // Not a POD product
  }

  // Check if seller has Gelato configured
  const gelatoSettings = await this.prisma.sellerGelatoSettings.findUnique({
    where: { storeId: product.storeId },
  });

  if (!gelatoSettings?.isEnabled || !gelatoSettings?.isVerified) {
    return {
      canFulfill: false,
      reason: 'Seller has not configured print-on-demand service',
    };
  }

  return { canFulfill: true };
}
```

**File 2:** `apps/api/src/cart/cart.service.ts` - Update `addItem()` method

**ADD validation before adding to cart:**

```typescript
async addItem(userId: string, productId: string, ...) {
  // Existing product validation...

  // NEW: Check POD fulfillment
  const fulfillmentCheck = await this.productsService.validatePodFulfillment(productId);
  if (!fulfillmentCheck.canFulfill) {
    throw new BadRequestException(
      `Cannot add this item to cart: ${fulfillmentCheck.reason}. ` +
      `Please contact the seller for more information.`
    );
  }

  // Continue with add to cart logic...
}
```

**File 3:** `apps/web/src/components/products/add-to-cart-button.tsx`

**UPDATE error handling:**

```typescript
try {
  await addToCart(productId, quantity);
  toast.success('Added to cart');
} catch (error) {
  if (error.message.includes('not configured print-on-demand')) {
    toast.error('This product is currently unavailable', {
      description:
        'The seller is setting up their print-on-demand service. Please check back later.',
    });
  } else {
    toast.error(error.message || 'Failed to add to cart');
  }
}
```

**Testing:**

1. Create seller account WITHOUT Gelato config
2. Create POD product
3. Try to add to cart → Should REJECT
4. Configure Gelato credentials
5. Try again → Should SUCCEED

---

## 🔴 Issue #4: Partial Gelato Failures Not Handled

**Impact:** Payment captured but some items cannot be fulfilled

**Root Cause:** `submitAllPodItems()` continues even if some items fail

### Fix Code

**File:** `apps/api/src/gelato/gelato-orders.service.ts` line 332

**BEFORE:**

```typescript
async submitAllPodItems(orderId: string) {
  // Loops through items, some succeed, some fail
  // ❌ Returns mixed results
}
```

**AFTER:**

```typescript
async submitAllPodItems(orderId: string): Promise<{
  success: boolean;
  results: Array<{itemId: string; status: 'submitted' | 'skipped' | 'failed'; error?: string}>;
}> {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { product: { fulfillmentType: 'GELATO_POD' } },
        include: { product: { include: { store: true } } },
      },
    },
  });

  const results = [];
  let hasFailures = false;

  for (const item of order.items) {
    try {
      // Check seller configuration first
      const settings = await this.prisma.sellerGelatoSettings.findUnique({
        where: { storeId: item.product.storeId },
      });

      if (!settings?.isEnabled || !settings?.isVerified) {
        hasFailures = true;
        results.push({
          itemId: item.id,
          productName: item.product.name,
          status: 'skipped',
          error: 'Seller has not configured Gelato',
        });
        continue;
      }

      // Attempt submission
      const podOrder = await this.submitOrderToGelato(orderId, item.id);
      results.push({
        itemId: item.id,
        productName: item.product.name,
        status: 'submitted',
        gelatoOrderId: podOrder.gelatoOrderId,
      });
    } catch (error) {
      hasFailures = true;
      results.push({
        itemId: item.id,
        productName: item.product.name,
        status: 'failed',
        error: error.message,
      });
    }
  }

  // ✅ Return success only if ALL items submitted
  return {
    success: !hasFailures,
    results,
  };
}
```

**File:** `apps/api/src/orders/orders.service.ts` - Update `updateStatus()` method

**Line ~1180 (when transitioning to PROCESSING):**

**BEFORE:**

```typescript
if (status === 'PROCESSING') {
  const readiness = await this.gelatoOrdersService.validatePodReadiness(id);
  if (!readiness.ready) {
    throw new BadRequestException('POD items not ready', readiness.unreadyItems);
  }

  await this.gelatoOrdersService.submitAllPodItems(id);
}
```

**AFTER:**

```typescript
if (status === 'PROCESSING') {
  // Validate readiness first
  const readiness = await this.gelatoOrdersService.validatePodReadiness(id);
  if (!readiness.ready) {
    throw new BadRequestException(
      `Cannot process order: ${readiness.unreadyItems.length} item(s) cannot be fulfilled`,
      { unreadyItems: readiness.unreadyItems }
    );
  }

  // Attempt submission - MUST succeed for ALL items
  const submission = await this.gelatoOrdersService.submitAllPodItems(id);
  if (!submission.success) {
    const failedItems = submission.results.filter((r) => r.status !== 'submitted');
    throw new BadRequestException(
      `Cannot process order: ${failedItems.length} POD item(s) failed to submit to Gelato`,
      {
        failedItems,
        hint: 'Check seller Gelato configuration and try again',
      }
    );
  }

  this.logger.log(`✅ All ${submission.results.length} POD items submitted successfully`);
}
```

**Testing:**

1. Create order with 3 POD items from different sellers
2. Seller A: Gelato configured ✅
3. Seller B: Gelato NOT configured ❌
4. Try to move to PROCESSING → Should FAIL with clear error
5. Configure Seller B's Gelato
6. Try again → Should SUCCEED

---

## 🔴 Issue #5: No Pre-Checkout POD Validation

**Impact:** User doesn't know POD item is unfulfillable until after payment

### Quick Fix (UI Only)

**File:** `apps/web/src/components/products/product-card.tsx`

**ADD warning badge for POD products:**

```typescript
export function ProductCard({ product }: { product: Product }) {
  const isPOD = product.fulfillmentType === 'GELATO_POD';

  return (
    <div className="product-card">
      {/* Existing product image, name, price */}

      {isPOD && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-blue-600">Made to order • Ships in 5-7 days</span>
        </div>
      )}

      {/* Add to cart button */}
    </div>
  );
}
```

**File:** `apps/web/src/app/checkout/page.tsx`

**ADD warning before payment:**

```typescript
// Line ~640, inside payment step
{podItemCount > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="font-medium text-blue-900">Print-on-Demand Items</p>
        <p className="text-sm text-blue-700 mt-1">
          Your order contains {podItemCount} made-to-order {podItemCount === 1 ? 'item' : 'items'}.
          Production begins after payment and takes 5-7 business days, plus shipping time.
        </p>
      </div>
    </div>
  </div>
)}
```

**Calculate POD item count:**

```typescript
const podItemCount = items.filter((item) => item.product?.fulfillmentType === 'GELATO_POD').length;
```

---

## 📋 Quick Implementation Checklist

### Phase 1: Critical Fixes (Today)

- [ ] Issue #1: Add shipping method to order creation
- [ ] Issue #2: Block unconfigured POD sellers at add-to-cart
- [ ] Issue #4: Validate ALL POD items submit successfully
- [ ] Issue #5: Add POD warnings in UI

### Phase 2: Testing (Tomorrow)

- [ ] Manual test: Normal product checkout
- [ ] Manual test: POD product checkout (configured seller)
- [ ] Manual test: POD product checkout (unconfigured seller - should fail)
- [ ] Manual test: Mixed cart
- [ ] Verify shipping method selection works
- [ ] Verify POD order submission to Gelato

### Phase 3: Deploy

- [ ] Backend deployment (API)
- [ ] Frontend deployment (Web)
- [ ] Monitor logs for errors
- [ ] Test on production with real Gelato account

---

## 🔧 Database Changes Required

None! All fixes are code-only.

---

## ⏱️ Estimated Time

| Fix       | Time        | Difficulty |
| --------- | ----------- | ---------- |
| Issue #1  | 1 hour      | Easy       |
| Issue #2  | 2 hours     | Medium     |
| Issue #4  | 1.5 hours   | Medium     |
| Issue #5  | 30 min      | Easy       |
| **Total** | **5 hours** |            |

Plus 2-3 hours for testing = **~8 hours total**

---

## 📞 Next Steps

1. **Assign fixes** - Split between team members
2. **Create feature branch** - `fix/critical-checkout-issues`
3. **Implement fixes** - Use code snippets above
4. **Test locally** - All scenarios
5. **Deploy to staging** - Full regression test
6. **Deploy to production** - Monitor closely

---

**IMPORTANT:** Do NOT enable POD feature in production until all 4 issues are fixed and tested.

---

Generated: March 12, 2026
Priority: P0
Status: Awaiting Implementation
