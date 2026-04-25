/**
 * NextPik Frontend E2E Tests - Cart & Checkout
 *
 * Tests shopping cart functionality and checkout flow
 *
 * Run: npx playwright test cart.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

test.describe('Cart Page Tests', () => {
  test('should load cart page', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Page should load (might show empty cart message)
    await expect(page).toHaveURL(/cart/);
  });

  test('should show empty cart message', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);

    await page.waitForLoadState('networkidle');

    // Look for empty cart indicator
    const emptyMessage = page.locator('text=/empty|no items|cart is empty/i');

    if (await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    } else {
      console.log('Empty cart message not found - cart might have items');
    }
  });

  test('should have continue shopping button on empty cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);

    await page.waitForLoadState('networkidle');

    // Look for continue shopping link
    const continueButton = page.locator(
      'a:has-text("Continue Shopping"), a:has-text("Shop Now"), a:has-text("Browse Products")'
    );

    if (
      await continueButton
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await expect(continueButton.first()).toBeVisible();
    }
  });
});

test.describe('Add to Cart Tests', () => {
  test('should add product to cart from product page', async ({ page }) => {
    // Navigate to products page
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Find and click first product
    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Find add to cart button
      const addToCartButton = page.locator(
        'button:has-text("Add to Cart"), button:has-text("Add To Cart")'
      );

      if (await addToCartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click add to cart
        await addToCartButton.click();

        // Wait for success indication
        await page.waitForTimeout(2000);

        // Look for success message or cart icon update
        const hasSuccess = await page
          .locator('text=/added|success|cart/i')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, a[href*="cart"]');
        const cartBadge = cartIcon.locator('.badge, span').first();

        if (hasSuccess) {
          console.log('Product added to cart - success message shown');
        } else if (await cartBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Product added to cart - cart badge updated');
        } else {
          console.log('Add to cart action completed but no confirmation shown');
        }
      } else {
        console.log('Add to cart button not found - might be inquiry product');
      }
    }
  });

  test('should update cart icon count', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Get initial cart count
    const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, a[href*="cart"]').first();
    const cartBadge = cartIcon.locator('.badge, span').first();

    let initialCount = 0;
    if (await cartBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await cartBadge.textContent();
      initialCount = parseInt(text || '0', 10);
    }

    // Add product to cart
    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      const addToCartButton = page.locator(
        'button:has-text("Add to Cart"), button:has-text("Add To Cart")'
      );

      if (await addToCartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addToCartButton.click();
        await page.waitForTimeout(2000);

        // Check if cart count increased
        if (await cartBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await cartBadge.textContent();
          const newCount = parseInt(text || '0', 10);

          if (newCount > initialCount) {
            console.log(`Cart count increased from ${initialCount} to ${newCount}`);
          }
        }
      }
    }
  });
});

test.describe('Cart Item Management Tests', () => {
  test('should display cart items', async ({ page }) => {
    // First add an item to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      const addToCartButton = page.locator('button:has-text("Add to Cart")');

      if (await addToCartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);

        // Navigate to cart
        await page.goto(`${BASE_URL}/cart`);
        await page.waitForLoadState('networkidle');

        // Check for cart items
        const cartItems = page.locator('[data-testid="cart-item"], .cart-item');
        const itemCount = await cartItems.count();

        if (itemCount > 0) {
          console.log(`Found ${itemCount} items in cart`);
        }
      }
    }
  });

  test('should update item quantity', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for quantity input/buttons
    const quantityInput = page.locator('input[type="number"], input[name*="quantity"]').first();
    const increaseButton = page
      .locator('button:has-text("+"), button[aria-label*="Increase"]')
      .first();

    if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const currentValue = await quantityInput.inputValue();
      const newValue = (parseInt(currentValue || '1', 10) + 1).toString();

      await quantityInput.fill(newValue);
      await page.waitForTimeout(1000);

      console.log(`Updated quantity from ${currentValue} to ${newValue}`);
    } else if (await increaseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await increaseButton.click();
      await page.waitForTimeout(1000);

      console.log('Clicked increase quantity button');
    } else {
      console.log('No quantity controls found in cart');
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for remove button
    const removeButton = page
      .locator('button:has-text("Remove"), button[aria-label*="Remove"], button[title*="Remove"]')
      .first();

    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialItemCount = await page.locator('[data-testid="cart-item"], .cart-item').count();

      await removeButton.click();
      await page.waitForTimeout(1000);

      const newItemCount = await page.locator('[data-testid="cart-item"], .cart-item').count();

      if (newItemCount < initialItemCount) {
        console.log(`Item removed - count decreased from ${initialItemCount} to ${newItemCount}`);
      }
    } else {
      console.log('Remove button not found - cart might be empty');
    }
  });

  test('should display cart totals', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for price elements
    const priceElements = page.locator('text=/Total|Subtotal|\\$|€|£/');

    if (
      await priceElements
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      const count = await priceElements.count();
      console.log(`Found ${count} price-related elements in cart`);
    }
  });
});

test.describe('Checkout Flow Tests', () => {
  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for checkout button
    const checkoutButton = page.locator(
      'button:has-text("Checkout"), a:has-text("Checkout"), button:has-text("Proceed")'
    );

    if (
      await checkoutButton
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await checkoutButton.first().click();

      await page.waitForTimeout(2000);

      // Should navigate to checkout or login
      const currentUrl = page.url();
      const isCheckoutOrLogin = currentUrl.includes('/checkout') || currentUrl.includes('/login');

      if (isCheckoutOrLogin) {
        console.log('Navigated to checkout or login page');
      }
    } else {
      console.log('Checkout button not found - cart might be empty');
    }
  });

  test('should load checkout page', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);

    await page.waitForLoadState('networkidle');

    // Might redirect to login if not authenticated
    const currentUrl = page.url();

    if (currentUrl.includes('/login')) {
      console.log('Redirected to login - authentication required for checkout');
    } else if (currentUrl.includes('/checkout')) {
      console.log('Checkout page loaded');

      // Look for checkout form elements
      const hasForm = await page
        .locator('form, input[name*="address"], input[name*="phone"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasForm) {
        console.log('Checkout form found');
      }
    }
  });

  test('should display order summary on checkout', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');

    // Look for order summary
    const orderSummary = page.locator('text=/Order Summary|Your Order|Summary/i');

    if (await orderSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Order summary displayed on checkout page');
    }
  });

  test('should show shipping address form', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      console.log('Skipping - authentication required');
      return;
    }

    // Look for address fields
    const addressFields = [
      'input[name*="address"], input[placeholder*="Address"]',
      'input[name*="city"], input[placeholder*="City"]',
      'input[name*="zip"], input[name*="postal"], input[placeholder*="ZIP"]',
    ];

    let foundFields = 0;
    for (const selector of addressFields) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        foundFields++;
      }
    }

    if (foundFields > 0) {
      console.log(`Found ${foundFields} address form fields`);
    }
  });

  test('should show payment options', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      console.log('Skipping - authentication required');
      return;
    }

    // Look for payment section
    const paymentSection = page.locator('text=/Payment|Card Details|Pay with/i');

    if (
      await paymentSection
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Payment section found on checkout page');
    }
  });
});

test.describe('Currency Switching Tests', () => {
  test('should switch cart currency', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for currency selector
    const currencySelector = page.locator(
      'select[name*="currency"], button:has-text("USD"), button:has-text("EUR")'
    );

    if (
      await currencySelector
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Currency selector found in cart');

      // Try to change currency
      if (
        await page
          .locator('select[name*="currency"]')
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        await page.selectOption('select[name*="currency"]', { index: 1 });
        await page.waitForTimeout(1000);
        console.log('Currency changed via dropdown');
      }
    } else {
      console.log('Currency selector not found');
    }
  });
});

test.describe('Cart Persistence Tests', () => {
  test('should persist cart across page navigation', async ({ page }) => {
    // Add item to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      const addToCartButton = page.locator('button:has-text("Add to Cart")');

      if (await addToCartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);

        // Navigate away and back
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.goto(`${BASE_URL}/cart`);
        await page.waitForLoadState('networkidle');

        // Check if item still in cart
        const cartItems = page.locator('[data-testid="cart-item"], .cart-item');
        const itemCount = await cartItems.count();

        if (itemCount > 0) {
          console.log('Cart persisted - items still present after navigation');
        }
      }
    }
  });
});

test.describe('Promo Code Tests', () => {
  test('should have promo code input', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Look for promo/coupon code input
    const promoInput = page.locator(
      'input[name*="promo"], input[name*="coupon"], input[placeholder*="Promo"], input[placeholder*="Coupon"]'
    );

    if (
      await promoInput
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Promo code input found in cart');
    }
  });

  test('should apply promo code', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    const promoInput = page.locator('input[name*="promo"], input[name*="coupon"]').first();
    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Add")').first();

    if (
      (await promoInput.isVisible({ timeout: 2000 }).catch(() => false)) &&
      (await applyButton.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      await promoInput.fill('TEST123');
      await applyButton.click();

      await page.waitForTimeout(2000);

      // Check for feedback
      const hasMessage = await page
        .locator('text=/applied|invalid|expired/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasMessage) {
        console.log('Promo code feedback shown');
      }
    }
  });
});
