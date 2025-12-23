# Stock Alert Improvements

## Overview

Enhanced the checkout flow to provide clear, user-friendly alerts when products have insufficient stock. Users now receive detailed error messages showing exactly which items are unavailable and how many are in stock.

---

## ✨ What Was Implemented

### 1. **Enhanced Stock Validation**

**File**: `apps/web/src/hooks/use-checkout.ts` (lines 168-201)

Before creating an order, the system now:
1. Validates stock for **all items** in the cart
2. Collects **all stock errors** (not just the first one)
3. Provides **detailed availability information**

#### Single Item Error
```
Insufficient stock: Skeleton Automatic Reserve: Out of stock
```

#### Multiple Items Error
```
Insufficient stock for 3 item(s):
• Skeleton Automatic Reserve: Out of stock
• Diamond Tennis Bracelet: Only 2 items available
• Royal Pilot Heritage: Unable to verify stock availability
```

### 2. **Multi-line Toast Support**

**File**: `apps/web/src/components/toast-listener.tsx` (line 160)

Enhanced the toast notification component to properly display multi-line messages:
- Added `whitespace-pre-line` CSS class to preserve line breaks
- Multi-item stock errors now display as a formatted list
- Each item appears on its own line with a bullet point

### 3. **Extended Toast Duration**

**File**: `apps/web/src/app/checkout/page.tsx` (lines 143-145)

Stock errors display longer to give users time to read all items:
- **Normal errors**: 5 seconds
- **Stock errors**: 8 seconds (60% longer)
- Automatically detected by checking for "Insufficient stock" in message

---

## 🔍 Technical Implementation

### Stock Validation Flow

```typescript
// Step 1: Validate stock for all items
const stockErrors: string[] = [];

for (const item of cartItems) {
  try {
    const stockResponse = await axios.get(
      `${API_URL}/inventory/status/${item.productId}`,
      { params: item.variantId ? { variantId: item.variantId } : undefined }
    );

    const stockData = stockResponse.data;

    if (stockData.quantity < item.quantity) {
      const available = stockData.quantity > 0
        ? `Only ${stockData.quantity} ${stockData.quantity === 1 ? 'item' : 'items'} available`
        : 'Out of stock';
      stockErrors.push(`${item.name}: ${available}`);
    }
  } catch (err: any) {
    console.error(`Error checking stock for ${item.name}:`, err);
    stockErrors.push(`${item.name}: Unable to verify stock availability`);
  }
}

// Step 2: Throw detailed error if any stock issues
if (stockErrors.length > 0) {
  const errorMessage = stockErrors.length === 1
    ? `Insufficient stock: ${stockErrors[0]}`
    : `Insufficient stock for ${stockErrors.length} item(s):\n${stockErrors.map(e => `• ${e}`).join('\n')}`;
  throw new Error(errorMessage);
}
```

### Error Message Formatting

| Scenario | Error Message Format |
|----------|---------------------|
| **Single item, out of stock** | `Insufficient stock: {Product Name}: Out of stock` |
| **Single item, low stock** | `Insufficient stock: {Product Name}: Only {X} items available` |
| **Multiple items** | Multi-line list with bullet points showing each item's status |
| **API error** | `{Product Name}: Unable to verify stock availability` |

---

## 📱 User Experience

### Before Enhancement
- Generic error: "Failed to initialize checkout"
- User doesn't know which item is out of stock
- Must manually check cart to identify the problem
- Short toast duration for all errors

### After Enhancement
- **Specific error**: Lists exact products with stock issues
- **Clear availability**: Shows how many items are available
- **All items shown**: If multiple items have issues, all are listed
- **Longer display**: Stock errors show for 8 seconds (vs 5 seconds)
- **Easy to read**: Multi-line format with bullet points

---

## 🧪 Testing the Implementation

### Test Case 1: Single Out-of-Stock Item

1. Set a product inventory to 0:
```sql
UPDATE products
SET inventory = 0, status = 'OUT_OF_STOCK'
WHERE slug = 'skeleton-automatic-reserve';
```

2. Add the product to cart
3. Proceed to checkout
4. Complete shipping address
5. **Expected Result**: Toast displays:
```
Insufficient stock: Skeleton Automatic Reserve: Out of stock
```

### Test Case 2: Single Low-Stock Item

1. Set a product inventory to 2:
```sql
UPDATE products
SET inventory = 2, status = 'ACTIVE'
WHERE slug = 'diamond-tennis-bracelet';
```

2. Add 5 of that product to cart
3. Proceed to checkout
4. **Expected Result**: Toast displays:
```
Insufficient stock: Diamond Tennis Bracelet: Only 2 items available
```

### Test Case 3: Multiple Items with Stock Issues

1. Set multiple products with different stock levels:
```sql
UPDATE products SET inventory = 0 WHERE slug = 'skeleton-automatic-reserve';
UPDATE products SET inventory = 2 WHERE slug = 'diamond-tennis-bracelet';
UPDATE products SET inventory = 1 WHERE slug = 'royal-pilot-heritage';
```

2. Add all three to cart (quantity > available)
3. Proceed to checkout
4. **Expected Result**: Toast displays:
```
Insufficient stock for 3 item(s):
• Skeleton Automatic Reserve: Out of stock
• Diamond Tennis Bracelet: Only 2 items available
• Royal Pilot Heritage: Only 1 item available
```

### Test Case 4: Toast Display Duration

1. Create a stock error
2. **Expected**: Toast displays for **8 seconds** (instead of 5)
3. **Verify**: User has time to read all items in multi-line errors

---

## 🔧 Quick Commands

### Check Product Inventory
```bash
docker exec luxury-postgres psql -U postgres -d luxury_ecommerce -c "
SELECT name, slug, inventory, status
FROM products
WHERE status = 'ACTIVE'
ORDER BY inventory ASC
LIMIT 20;
"
```

### Set Product Out of Stock (for testing)
```bash
docker exec luxury-postgres psql -U postgres -d luxury_ecommerce -c "
UPDATE products
SET inventory = 0, status = 'OUT_OF_STOCK'
WHERE slug = 'skeleton-automatic-reserve';
"
```

### Set Product Low Stock (for testing)
```bash
docker exec luxury-postgres psql -U postgres -d luxury_ecommerce -c "
UPDATE products
SET inventory = 2, status = 'ACTIVE'
WHERE slug = 'diamond-tennis-bracelet';
"
```

### Restore Inventory
```bash
docker exec luxury-postgres psql -U postgres -d luxury_ecommerce -c "
UPDATE products
SET inventory = 50, status = 'ACTIVE'
WHERE inventory < 10;
"
```

---

## 📊 Error Message Examples

### Example 1: Single Item
```
Title: Checkout Error
Message: Insufficient stock: Skeleton Automatic Reserve: Out of stock
Duration: 8 seconds
```

### Example 2: Multiple Items
```
Title: Checkout Error
Message:
Insufficient stock for 3 item(s):
• Skeleton Automatic Reserve: Out of stock
• Diamond Tennis Bracelet: Only 2 items available
• Royal Pilot Heritage: Only 1 item available
Duration: 8 seconds
```

### Example 3: Network Error
```
Title: Checkout Error
Message:
Insufficient stock for 1 item(s):
• Skeleton Automatic Reserve: Unable to verify stock availability
Duration: 8 seconds
```

---

## 🎯 Key Features

### ✅ Comprehensive Validation
- Checks **every item** in cart before creating order
- Validates against **real-time inventory** via API
- Handles **network errors** gracefully

### ✅ Clear Communication
- **Product names** clearly displayed
- **Exact availability** shown (e.g., "Only 2 items available")
- **Out of stock** explicitly stated
- **Error handling** for API failures

### ✅ User-Friendly Display
- **Multi-line support** in toast notifications
- **Bullet points** for easy scanning
- **Longer duration** for complex messages
- **Professional formatting**

### ✅ Prevents Order Failures
- **Early validation** before payment processing
- **Returns to shipping** step automatically
- **Prevents inventory overselling**
- **Better user experience**

---

## 🚀 Benefits

### For Users
1. **Know exactly what's wrong** - No guessing which item is unavailable
2. **See all issues at once** - Don't have to fix items one by one
3. **Understand availability** - Know if item is completely out or just low stock
4. **Easy to fix** - Can adjust cart quantities or remove items

### For Business
1. **Reduce abandoned carts** - Clear errors help users complete checkout
2. **Prevent overselling** - Real-time validation before order creation
3. **Better support** - Users can self-service without contacting support
4. **Professional image** - Polished error handling shows quality

---

## 📝 Files Modified

| File | Purpose | Changes |
|------|---------|---------|
| `apps/web/src/hooks/use-checkout.ts` | Stock validation | Added comprehensive stock checking with detailed error messages |
| `apps/web/src/components/toast-listener.tsx` | Toast UI | Added `whitespace-pre-line` for multi-line support |
| `apps/web/src/app/checkout/page.tsx` | Error handling | Extended toast duration for stock errors (8s vs 5s) |

---

## 🔮 Future Enhancements

### Potential Improvements
1. **Real-time stock updates** - Show stock levels on product cards
2. **Cart warnings** - Alert users before checkout if stock is low
3. **Auto-adjust quantities** - Offer to reduce quantities to available stock
4. **Email notifications** - Notify when out-of-stock items are restocked
5. **Reserved stock** - Hold inventory during checkout process
6. **Wishlist integration** - Move unavailable items to wishlist

### Analytics
- Track which products frequently run out of stock
- Monitor checkout abandonment due to stock issues
- Identify peak times for stock depletion
- Calculate reorder points based on demand

---

## ✅ Summary

### What Changed
- ✅ Added comprehensive stock validation for all cart items
- ✅ Enhanced error messages with specific product details
- ✅ Implemented multi-line toast support with proper formatting
- ✅ Extended toast display duration for stock errors
- ✅ Improved user experience with clear, actionable feedback

### Impact
- **Better UX** - Users know exactly what's wrong and how to fix it
- **Fewer Errors** - Real-time validation prevents order failures
- **Clear Communication** - Professional error messages build trust
- **Easy Testing** - Simple SQL commands to test various scenarios

---

**The checkout now provides world-class stock validation and user feedback!** ✨

Users will always know which items are unavailable and can take immediate action to complete their purchase.
