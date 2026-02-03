# Price Calculation Guidelines for NextPik

**Purpose:** Prevent price inconsistencies and double-conversion bugs across the platform
**Created:** January 31, 2026
**Status:** Mandatory for all developers
**Last Updated:** January 31, 2026

---

## 🎯 Core Principle

> **Backend CALCULATES, Frontend DISPLAYS**
>
> The backend is the single source of truth for all price calculations. The frontend must never recalculate prices, totals, or perform currency conversions on values already converted by the backend.

---

## ✅ Golden Rules (MUST FOLLOW)

### Rule 1: Always Use Backend-Calculated Totals

```typescript
// ✅ CORRECT
const totals = cart.totals; // From backend API
<Price amount={totals.subtotal} fromCurrency={cart.currency} />

// ❌ WRONG - Frontend recalculating
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
```

**Why:** Backend has the correct locked prices and exchange rates. Recalculating on frontend introduces rounding errors and double conversion bugs.

---

### Rule 2: Always Use Locked Prices for Cart/Order Items

```typescript
// ✅ CORRECT - Use locked price from when item was added
<Price
  amount={item.priceAtAdd}
  fromCurrency={item.currencyAtAdd}
/>

// ❌ WRONG - Using current product price
<Price amount={item.price} />
```

**Why:** Product prices can change. Cart and order items must use the price that was locked when the item was added/ordered.

**Database Fields:**
- Cart items: `priceAtAdd`, `currencyAtAdd`
- Order items: `price` (locked at checkout), `currency` (from order)

---

### Rule 3: Always Specify fromCurrency for Price Component

```typescript
// ✅ CORRECT - Tell Price component the currency
<Price amount={355.30} fromCurrency="EUR" />

// ❌ WRONG - Defaults to USD, causes double conversion
<Price amount={355.30} />
```

**How Price Component Works:**
```typescript
export function Price({ amount, fromCurrency = 'USD' }: PriceProps) {
  // If fromCurrency === selectedCurrency, NO conversion happens
  // If fromCurrency !== selectedCurrency, converts to selectedCurrency
  const formatted = formatPrice(amount, fromCurrency);
  return <span>{formatted}</span>;
}
```

**Common Mistake:**
```typescript
// User has EUR selected
const eurPrice = 355.30; // Already in EUR

// ❌ WRONG - Omitting fromCurrency
<Price amount={eurPrice} />
// Price thinks it's USD, converts EUR → EUR: 355.30 * 0.836 = 297.03

// ✅ CORRECT
<Price amount={eurPrice} fromCurrency="EUR" />
// Price sees EUR → EUR, skips conversion, displays 355.30
```

---

### Rule 4: Never Recalculate Shipping on Frontend

```typescript
// ✅ CORRECT - Use cart's pre-calculated shipping
const shipping = totals.shipping;

// ❌ WRONG - Recalculating from USD
const shippingUSD = 10;
const shipping = convertPrice(shippingUSD, 'USD');
```

**Why:** Cart context has already calculated shipping in the locked currency with proper rounding. Recalculating causes 0.01 cent rounding differences.

---

### Rule 5: Use Consistent Rounding Everywhere

```typescript
// ✅ CORRECT - Round to 2 decimal places
const price = Math.round(amount * 100) / 100;

// ❌ WRONG - Inconsistent rounding
const price = amount.toFixed(2); // Returns string!
const price = Number(amount.toFixed(2)); // Better, but inconsistent method
```

**Standard Rounding Function:**
```typescript
export function roundPrice(amount: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier) / multiplier;
}
```

---

## 🔍 Common Scenarios & Correct Implementations

### Scenario 1: Displaying Cart Items

```typescript
// ✅ CORRECT
function CartItem({ item }: { item: CartItem }) {
  return (
    <div>
      <h3>{item.name}</h3>
      <Price
        amount={item.priceAtAdd ?? item.price}
        fromCurrency={item.currencyAtAdd ?? 'USD'}
      />
      <p>Quantity: {item.quantity}</p>
      <Price
        amount={(item.priceAtAdd ?? item.price) * item.quantity}
        fromCurrency={item.currencyAtAdd ?? 'USD'}
        className="font-bold"
      />
    </div>
  );
}
```

**Key Points:**
- Use `priceAtAdd` (locked price), fallback to `price` only if missing
- Use `currencyAtAdd` to prevent double conversion
- Calculate item total as `priceAtAdd * quantity` (not from backend subtotal)

---

### Scenario 2: Displaying Order Summary

```typescript
// ✅ CORRECT
function OrderSummary({ totals, cartCurrency }: Props) {
  return (
    <div>
      <div className="row">
        <span>Subtotal:</span>
        <Price amount={totals.subtotal} fromCurrency={cartCurrency} />
      </div>
      <div className="row">
        <span>Shipping:</span>
        <Price amount={totals.shipping} fromCurrency={cartCurrency} />
      </div>
      <div className="row">
        <span>Tax:</span>
        <Price amount={totals.tax} fromCurrency={cartCurrency} />
      </div>
      <div className="row">
        <span>Total:</span>
        <Price amount={totals.total} fromCurrency={cartCurrency} />
      </div>
    </div>
  );
}
```

**Key Points:**
- All totals come from backend (via `totals` prop)
- All use the same `cartCurrency` to prevent conversion
- No recalculation: `totals.total` already includes everything

---

### Scenario 3: Historical Orders (Critical!)

```typescript
// ✅ CORRECT - Use order's locked prices
function OrderHistory({ order }: { order: Order }) {
  return (
    <div>
      {order.items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          {/* Use order's locked price, NOT current product price */}
          <Price
            amount={item.price}
            fromCurrency={order.currency}
          />
          <span>Qty: {item.quantity}</span>
          <Price
            amount={item.total}
            fromCurrency={order.currency}
          />
        </div>
      ))}
      <div className="totals">
        <Price amount={order.subtotal} fromCurrency={order.currency} />
        <Price amount={order.shipping} fromCurrency={order.currency} />
        <Price amount={order.tax} fromCurrency={order.currency} />
        <Price amount={order.total} fromCurrency={order.currency} />
      </div>
    </div>
  );
}
```

**CRITICAL:**
- NEVER fetch current product prices for historical orders
- NEVER recalculate totals from `item.price * quantity`
- Use `order.currency` for all prices (the locked currency from checkout)
- Use `item.total` field if available (pre-calculated at checkout)

---

### Scenario 4: Admin Commission Calculations

```typescript
// ✅ CORRECT - Use order's locked values
async function calculateCommission(order: Order) {
  const commissionRate = await getCommissionRate(order.sellerId);

  // Use order's stored subtotal, NOT recalculated from items
  const subtotal = order.subtotal;
  const commission = subtotal * (commissionRate / 100);

  return roundPrice(commission);
}

// ❌ WRONG - Recalculating subtotal
async function calculateCommission(order: Order) {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity, // WRONG!
    0
  );
  // ...
}
```

**Why:** If product prices change after order, recalculating gives wrong commission. Always use order's locked subtotal.

---

## 🚫 Common Mistakes to Avoid

### Mistake 1: Frontend Recalculation

```typescript
// ❌ WRONG
const subtotal = cartItems.reduce((sum, item) => {
  return sum + item.price * item.quantity;
}, 0);

// ✅ CORRECT
const subtotal = cart.subtotal; // From backend
```

---

### Mistake 2: Omitting fromCurrency

```typescript
// ❌ WRONG - Defaults to USD
<Price amount={total} />

// ✅ CORRECT
<Price amount={total} fromCurrency={cartCurrency} />
```

---

### Mistake 3: Double Conversion

```typescript
// ❌ WRONG
const eurPrice = convertPrice(usdPrice, 'USD'); // $100 → €83.60
const displayPrice = convertPrice(eurPrice, 'EUR'); // €83.60 → €69.89 (WRONG!)

// ✅ CORRECT
const eurPrice = convertPrice(usdPrice, 'USD'); // $100 → €83.60
<Price amount={eurPrice} fromCurrency="EUR" /> // Displays €83.60 (no conversion)
```

---

### Mistake 4: Using Current Prices for Historical Data

```typescript
// ❌ WRONG - Fetching current price for old order
const product = await getProduct(orderItem.productId);
<Price amount={product.price} /> // Current price!

// ✅ CORRECT - Using order's locked price
<Price amount={orderItem.price} fromCurrency={order.currency} />
```

---

### Mistake 5: Inconsistent Rounding

```typescript
// ❌ WRONG
const cart = {
  subtotal: (item1.price * qty1 + item2.price * qty2).toFixed(2), // String!
  total: subtotal + shipping, // Number + String = NaN
};

// ✅ CORRECT
const cart = {
  subtotal: roundPrice(item1.price * qty1 + item2.price * qty2),
  shipping: roundPrice(shipping),
  total: roundPrice(subtotal + shipping),
};
```

---

## 🔧 Required Code Patterns

### Pattern 1: Fetching and Using Cart Data

```typescript
function CartPage() {
  const { items, totals, cartCurrency } = useCart();

  // ✅ Use totals from context (which got them from backend)
  // ❌ Never recalculate: items.reduce(...)

  return (
    <OrderSummary
      items={items}
      subtotal={totals.subtotal}
      shipping={totals.shipping}
      tax={totals.tax}
      total={totals.total}
      currency={cartCurrency}
    />
  );
}
```

---

### Pattern 2: Cart Context Implementation

```typescript
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [backendTotals, setBackendTotals] = useState<Totals | null>(null);

  const refreshCart = useCallback(async () => {
    const response = await fetch('/api/v1/cart', {
      headers: { 'X-Session-ID': sessionId }
    });
    const cart = await response.json();

    // ✅ Store backend totals - NEVER recalculate
    setBackendTotals({
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
    });

    // Store in localStorage for offline use
    localStorage.setItem('cart_backend_totals', JSON.stringify({
      subtotal: cart.subtotal,
      total: cart.total,
    }));

    setItems(cart.items);
  }, [sessionId]);

  const calculateTotals = useCallback((): Totals => {
    // ✅ Try to use backend totals first
    if (backendTotals) {
      return backendTotals;
    }

    // Fallback: Read from localStorage
    const stored = localStorage.getItem('cart_backend_totals');
    if (stored) {
      const { subtotal, total } = JSON.parse(stored);
      return { subtotal, total, shipping: 0, tax: 0 };
    }

    // Last resort: Calculate (only if no backend data)
    const subtotal = items.reduce((sum, item) => {
      const price = item.priceAtAdd ?? item.price;
      return sum + price * item.quantity;
    }, 0);

    return {
      subtotal: roundPrice(subtotal),
      total: roundPrice(subtotal),
      shipping: 0,
      tax: 0,
    };
  }, [backendTotals, items]);

  return (
    <CartContext.Provider value={{
      items,
      totals: calculateTotals(),
      cartCurrency: backendTotals?.currency ?? 'USD',
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}
```

---

## 📋 Review Checklist

Before submitting code that deals with prices, verify:

- [ ] No frontend recalculation of totals (`reduce` with prices)
- [ ] All `<Price>` components have `fromCurrency` specified
- [ ] Using locked prices (`priceAtAdd`, `currencyAtAdd`) for cart items
- [ ] Using locked prices (`item.price`, `order.currency`) for order items
- [ ] Backend totals used as source of truth
- [ ] No double currency conversion
- [ ] Consistent rounding (Math.round(x * 100) / 100)
- [ ] Historical orders use locked prices, not current product prices
- [ ] Commission calculations use order's locked subtotal
- [ ] No hardcoded currency symbols (use Price component)

---

## 🔎 Code Review Red Flags

If you see these patterns in a pull request, **request changes immediately:**

```typescript
// 🚨 RED FLAG 1: Frontend recalculation
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// 🚨 RED FLAG 2: Missing fromCurrency
<Price amount={total} />

// 🚨 RED FLAG 3: Converting already-converted price
const price = convertPrice(convertPrice(amount, 'USD'), 'EUR');

// 🚨 RED FLAG 4: Using current price for old order
const product = await getProduct(orderItem.productId);
return product.price; // Should use orderItem.price!

// 🚨 RED FLAG 5: Hardcoded currency symbol
<span>${amount.toFixed(2)}</span>

// 🚨 RED FLAG 6: String arithmetic
const total = Number(subtotal) + Number(shipping); // Why are these strings?

// 🚨 RED FLAG 7: Recalculating shipping
const shipping = convertPrice(10, 'USD'); // Should use cart.shipping!
```

---

## 🧪 Testing Guidelines

### Unit Tests

```typescript
describe('Cart Totals', () => {
  it('should use backend totals, not recalculate', () => {
    const { result } = renderHook(() => useCart());

    // Mock backend response
    mockBackendCart({
      subtotal: 355.30,
      total: 438.26,
      currency: 'EUR',
    });

    act(() => {
      result.current.refreshCart();
    });

    // ✅ Totals should match backend exactly
    expect(result.current.totals.subtotal).toBe(355.30);
    expect(result.current.totals.total).toBe(438.26);

    // ❌ Should NOT recalculate from items
    const recalculated = result.current.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    expect(result.current.totals.subtotal).not.toBe(recalculated);
  });
});
```

### Integration Tests

```typescript
describe('Checkout Flow', () => {
  it('should show identical totals across cart → checkout → payment', async () => {
    // Add item to cart
    await addToCart(productId);

    // Get cart totals
    const cartTotals = await getCartTotals();

    // Go to checkout
    await navigateToCheckout();
    const checkoutTotals = await getCheckoutTotals();

    // ✅ Should match exactly (no rounding differences)
    expect(checkoutTotals.total).toBe(cartTotals.total);

    // Proceed to payment
    await fillShippingAddress();
    await selectShippingMethod();
    const paymentTotals = await getPaymentTotals();

    // ✅ Should still match
    expect(paymentTotals.total).toBe(cartTotals.total);
  });
});
```

---

## 📚 Additional Resources

- **Main Documentation:** `/tmp/PRICE_STABILIZATION_FIX_DOCUMENTATION.md`
- **Comprehensive Docs:** `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md` (Section 12)
- **Price Component:** `apps/web/src/components/price.tsx`
- **Cart Context:** `apps/web/src/contexts/cart-context.tsx`
- **Currency Hook:** `apps/web/src/hooks/use-currency.ts`

---

## ❓ FAQ

**Q: When is it okay to recalculate prices on the frontend?**
A: Never for cart/checkout/orders. Only acceptable for:
- Product listing pages (showing current prices)
- Price calculators (estimating costs before adding to cart)
- Admin tools (with clear indication it's an estimate)

**Q: What if the backend total is missing?**
A: Use a fallback calculation with locked prices:
```typescript
const subtotal = backendTotals?.subtotal ?? items.reduce((sum, item) =>
  sum + (item.priceAtAdd ?? item.price) * item.quantity, 0
);
```

**Q: How do I handle different currencies for different sellers?**
A: Cart locks to ONE currency on first item. All items must use that currency's equivalent locked price (`priceAtAdd`). Multi-currency carts are not supported - users must checkout in one currency.

**Q: What about price changes during checkout?**
A: Prices are locked when added to cart (`priceAtAdd`). If product price changes, cart keeps the old price. This is intentional and correct behavior.

**Q: How to test for double conversion bugs?**
A: Add `console.log` with currency:
```typescript
console.log('Price:', amount, 'Currency:', fromCurrency);
```
If you see EUR value with `fromCurrency: 'USD'`, you have a double conversion bug.

---

**Document Version:** 1.0
**Mandatory Compliance:** Yes
**Last Reviewed:** January 31, 2026
**Next Review:** February 28, 2026
