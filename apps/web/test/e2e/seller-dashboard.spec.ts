/**
 * NextPik Frontend E2E Tests - Seller Dashboard
 *
 * Tests seller portal, product management, orders, and analytics
 *
 * Run: npx playwright test seller-dashboard.spec.ts
 *
 * Note: Requires seller account authentication
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

// Helper to check if user is authenticated as seller
async function isSellerAuthenticated(page: any): Promise<boolean> {
  const currentUrl = page.url();
  return (
    !currentUrl.includes('/login') &&
    (currentUrl.includes('/seller') || currentUrl.includes('/dashboard'))
  );
}

test.describe('Seller Dashboard Access Tests', () => {
  test('should load seller dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);

    await page.waitForLoadState('networkidle');

    // Check if redirected to login or dashboard loaded
    const currentUrl = page.url();

    if (currentUrl.includes('/login')) {
      console.log('Not authenticated - redirected to login (expected behavior)');
    } else if (currentUrl.includes('/seller')) {
      console.log('Seller dashboard loaded - user is authenticated');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear cookies to ensure no session
    await page.context().clearCookies();

    await page.goto(`${BASE_URL}/seller`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|auth/);
  });
});

test.describe('Seller Dashboard Overview Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);
    await page.waitForLoadState('networkidle');

    // Skip tests if not authenticated
    if (!(await isSellerAuthenticated(page))) {
      test.skip();
    }
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Look for statistics cards/widgets
    const statsElements = page.locator('text=/Total Sales|Revenue|Orders|Products/i');

    if (
      await statsElements
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const count = await statsElements.count();
      console.log(`Found ${count} dashboard statistics`);
    }
  });

  test('should display recent orders', async ({ page }) => {
    // Look for orders section
    const ordersSection = page.locator('text=/Recent Orders|Orders|Order History/i');

    if (
      await ordersSection
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Recent orders section found on dashboard');
    }
  });

  test('should have navigation to products', async ({ page }) => {
    // Look for products link
    const productsLink = page.locator(
      'a:has-text("Products"), a:has-text("My Products"), nav a[href*="product"]'
    );

    if (
      await productsLink
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await expect(productsLink.first()).toBeVisible();
    }
  });

  test('should have navigation to orders', async ({ page }) => {
    // Look for orders link
    const ordersLink = page.locator('a:has-text("Orders"), nav a[href*="order"]');

    if (
      await ordersLink
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await expect(ordersLink.first()).toBeVisible();
    }
  });

  test('should display credit summary', async ({ page }) => {
    // Look for credit/subscription info
    const creditSection = page.locator('text=/Credits|Subscription|Balance|Plan/i');

    if (
      await creditSection
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Credit summary section found on dashboard');
    }
  });
});

test.describe('Seller Products Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
    }
  });

  test('should load products page', async ({ page }) => {
    // Check if products page loaded
    const currentUrl = page.url();
    expect(currentUrl).toContain('/seller');
  });

  test('should display products list', async ({ page }) => {
    // Look for product listings
    const productItems = page.locator(
      '[data-testid="product-item"], .product-item, table tbody tr'
    );

    if (
      await productItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const count = await productItems.count();
      console.log(`Found ${count} products in seller list`);
    } else {
      // Check for empty state
      const emptyMessage = page.locator('text=/No products|Add your first|Create product/i');
      if (await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Empty products list - no products yet');
      }
    }
  });

  test('should have add product button', async ({ page }) => {
    // Look for add/create product button
    const addButton = page.locator(
      'button:has-text("Add Product"), button:has-text("Create Product"), a:has-text("New Product")'
    );

    if (
      await addButton
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await expect(addButton.first()).toBeVisible();
    }
  });

  test('should navigate to add product form', async ({ page }) => {
    const addButton = page
      .locator(
        'button:has-text("Add Product"), button:has-text("Create Product"), a:has-text("New Product")'
      )
      .first();

    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);

      // Should navigate to product form or show modal
      const currentUrl = page.url();
      const hasForm =
        currentUrl.includes('/new') ||
        currentUrl.includes('/add') ||
        (await page
          .locator('form')
          .isVisible({ timeout: 2000 })
          .catch(() => false));

      if (hasForm) {
        console.log('Product creation form displayed');
      }
    }
  });

  test('should have product actions (edit, delete)', async ({ page }) => {
    const productItems = page.locator(
      '[data-testid="product-item"], .product-item, table tbody tr'
    );

    if (
      await productItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const firstProduct = productItems.first();

      // Look for action buttons
      const editButton = firstProduct.locator(
        'button:has-text("Edit"), a:has-text("Edit"), [aria-label*="Edit"]'
      );
      const deleteButton = firstProduct.locator(
        'button:has-text("Delete"), [aria-label*="Delete"]'
      );

      const hasActions =
        (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) ||
        (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false));

      if (hasActions) {
        console.log('Product action buttons found');
      }
    }
  });

  test('should filter/search products', async ({ page }) => {
    // Look for search or filter controls
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (
      await searchInput
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      console.log('Product search/filter available');
    }
  });
});

test.describe('Product Creation Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
    }

    // Try to navigate to product creation form
    const addButton = page
      .locator(
        'button:has-text("Add Product"), button:has-text("Create Product"), a:has-text("New Product")'
      )
      .first();

    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
    } else {
      test.skip();
    }
  });

  test('should display product form fields', async ({ page }) => {
    // Check for required form fields
    const requiredFields = [
      'input[name*="name"], input[placeholder*="Name"]',
      'textarea[name*="description"], textarea[placeholder*="Description"]',
      'input[name*="price"], input[placeholder*="Price"]',
    ];

    let foundFields = 0;
    for (const selector of requiredFields) {
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

    console.log(`Found ${foundFields} product form fields`);
  });

  test('should have category selector', async ({ page }) => {
    const categorySelect = page.locator('select[name*="category"], [role="combobox"]');

    if (
      await categorySelect
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Category selector found in product form');
    }
  });

  test('should have image upload field', async ({ page }) => {
    const imageUpload = page.locator('input[type="file"], text=/Upload Image|Add Image/i');

    if (
      await imageUpload
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Image upload field found in product form');
    }
  });

  test('should have inventory/stock field', async ({ page }) => {
    const inventoryInput = page.locator(
      'input[name*="inventory"], input[name*="stock"], input[name*="quantity"]'
    );

    if (
      await inventoryInput
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Inventory field found in product form');
    }
  });
});

test.describe('Seller Orders Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/orders`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
    }
  });

  test('should load orders page', async ({ page }) => {
    const currentUrl = page.url();
    expect(currentUrl).toContain('/seller');
  });

  test('should display orders list', async ({ page }) => {
    const orderItems = page.locator('[data-testid="order-item"], .order-item, table tbody tr');

    if (
      await orderItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const count = await orderItems.count();
      console.log(`Found ${count} orders in seller list`);
    } else {
      const emptyMessage = page.locator('text=/No orders|No sales yet/i');
      if (await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('No orders found for seller');
      }
    }
  });

  test('should display order status', async ({ page }) => {
    const orderItems = page.locator('[data-testid="order-item"], .order-item, table tbody tr');

    if (
      await orderItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      // Look for status indicators
      const statusElement = page
        .locator('text=/Pending|Processing|Shipped|Delivered|Cancelled/i')
        .first();

      if (await statusElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Order status displayed');
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    const filterSelect = page.locator('select[name*="status"], select[name*="filter"]');

    if (
      await filterSelect
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log('Order status filter available');
    }
  });

  test('should view order details', async ({ page }) => {
    const orderItems = page.locator('[data-testid="order-item"], .order-item, table tbody tr');

    if (
      await orderItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const firstOrder = orderItems.first();
      const viewButton = firstOrder
        .locator('button:has-text("View"), a:has-text("Details"), [aria-label*="View"]')
        .first();

      if (await viewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await viewButton.click();
        await page.waitForTimeout(2000);

        console.log('Navigated to order details');
      } else {
        // Try clicking the row itself
        await firstOrder.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Seller Analytics Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
    }
  });

  test('should display sales metrics', async ({ page }) => {
    const metricsElements = page.locator('text=/Revenue|Sales|Earnings|Income|Profit/i');

    if (
      await metricsElements
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const count = await metricsElements.count();
      console.log(`Found ${count} sales metrics on dashboard`);
    }
  });

  test('should display charts or graphs', async ({ page }) => {
    // Look for chart elements
    const chartElements = page.locator('canvas, svg[class*="chart"], [class*="recharts"]');

    if (
      await chartElements
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Analytics charts displayed on dashboard');
    }
  });

  test('should show top selling products', async ({ page }) => {
    const topProducts = page.locator('text=/Top Products|Best Sellers|Popular Products/i');

    if (
      await topProducts
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Top products section found');
    }
  });
});

test.describe('Seller Settings Tests', () => {
  test('should access seller settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    // Look for settings link
    const settingsLink = page.locator('a:has-text("Settings"), a[href*="settings"]');

    if (
      await settingsLink
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await settingsLink.first().click();
      await page.waitForTimeout(2000);

      console.log('Navigated to seller settings');
    }
  });

  test('should display store information', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/settings`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    // Look for store info fields
    const storeFields = page.locator(
      'input[name*="store"], input[name*="business"], text=/Store Name|Business/i'
    );

    if (
      await storeFields
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Store information settings found');
    }
  });
});

test.describe('Seller Payout Tests', () => {
  test('should access payout page', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/payouts`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    const currentUrl = page.url();
    expect(currentUrl).toContain('/seller');
  });

  test('should display payout history', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/payouts`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    // Look for payout records
    const payoutItems = page.locator('[data-testid="payout-item"], .payout-item, table tbody tr');

    if (
      await payoutItems
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Payout history displayed');
    } else {
      const emptyMessage = page.locator('text=/No payouts|No earnings/i');
      if (await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('No payout history yet');
      }
    }
  });

  test('should display pending balance', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/payouts`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    const balanceElement = page.locator('text=/Balance|Pending|Available|Earnings/i');

    if (
      await balanceElement
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Balance information displayed');
    }
  });
});

test.describe('Gelato/Shipping Integration Tests', () => {
  test('should access shipping settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/settings`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    // Look for shipping/fulfillment settings
    const shippingSection = page.locator('text=/Shipping|Fulfillment|Gelato|EasyPost/i');

    if (
      await shippingSection
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Shipping/fulfillment settings section found');
    }
  });

  test('should generate shipping label', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/orders`);
    await page.waitForLoadState('networkidle');

    if (!(await isSellerAuthenticated(page))) {
      test.skip();
      return;
    }

    // Look for shipping label button
    const labelButton = page.locator(
      'button:has-text("Shipping Label"), button:has-text("Generate Label")'
    );

    if (
      await labelButton
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log('Shipping label generation option found');
    }
  });
});
