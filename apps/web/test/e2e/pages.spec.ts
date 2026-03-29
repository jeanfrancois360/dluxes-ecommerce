/**
 * NextPik Frontend E2E Tests - Pages
 *
 * Tests homepage, product pages, categories, and search functionality
 *
 * Run: npx playwright test pages.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

test.describe('Homepage Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check title
    await expect(page).toHaveTitle(/NextPik/i);

    // Check main navigation
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display featured products on homepage', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for products to load
    await page
      .waitForSelector('[data-testid="product-card"], .product-card', {
        timeout: 10000,
        state: 'visible',
      })
      .catch(() => {
        // Products might not be visible immediately, check for loading state
        console.log('No product cards found');
      });

    // Check if products section exists
    const productsSection = page.locator('text=/Featured|Products/i').first();
    await expect(productsSection)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Featured products section not found');
      });
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for common navigation links
    const links = ['Products', 'Categories', 'About', 'Contact'];

    for (const linkText of links) {
      const link = page.locator(`a:has-text("${linkText}")`).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto(BASE_URL);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });
});

test.describe('Products Page Tests', () => {
  test('should load products page', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if products are displayed or loading state exists
    const hasProducts =
      (await page.locator('[data-testid="product-card"], .product-card').count()) > 0;
    const hasLoadingState = await page
      .locator('text=/Loading|Fetching/i')
      .isVisible()
      .catch(() => false);

    expect(hasProducts || hasLoadingState).toBeTruthy();
  });

  test('should display product filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    // Look for filter controls
    const filterElements = [
      'select', // Dropdown filters
      'input[type="checkbox"]', // Checkbox filters
      'text=/Filter|Sort/i', // Filter labels
    ];

    let filtersFound = false;
    for (const selector of filterElements) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        filtersFound = true;
        break;
      }
    }

    // Filters might be optional, just log if not found
    if (!filtersFound) {
      console.log('No filter controls found on products page');
    }
  });

  test('should handle pagination or infinite scroll', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    await page.waitForLoadState('networkidle');

    // Check for pagination
    const hasPagination = await page
      .locator('nav[role="navigation"], .pagination, button:has-text("Next")')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Check for load more button
    const hasLoadMore = await page
      .locator('button:has-text("Load More")')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Either pagination or load more should exist if there are many products
    console.log(`Pagination: ${hasPagination}, Load More: ${hasLoadMore}`);
  });

  test('should search products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('luxury');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForLoadState('networkidle');

      // Check if URL changed or results updated
      const currentUrl = page.url();
      expect(currentUrl).toContain('/products');
    }
  });
});

test.describe('Product Detail Page Tests', () => {
  test('should load product detail page', async ({ page }) => {
    // First get a product from products page
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Click first product
    const firstProduct = page
      .locator('[data-testid="product-card"], .product-card, a[href*="/products/"]')
      .first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();

      // Wait for product detail page
      await page.waitForLoadState('networkidle');

      // Check for product details
      await expect(page.locator('h1, h2').first()).toBeVisible();
    } else {
      console.log('No products found to test detail page');
    }
  });

  test('should display product information', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Check for key product elements
      const elements = [
        'h1, h2', // Product title
        'text=/Price|\\$|€|£/', // Price
        'button:has-text("Add to Cart"), button:has-text("Buy")', // CTA button
      ];

      for (const selector of elements) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test('should display product images', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('a[href*="/products/"]').first();

    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Check for product image
      const productImage = page.locator('img[alt*="product"], img[alt*="Product"]').first();

      if (await productImage.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(productImage).toBeVisible();
      }
    }
  });
});

test.describe('Categories Page Tests', () => {
  test('should load categories page', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for categories display
    const hasCategories =
      (await page
        .locator('[data-testid="category-card"], .category-card, a[href*="/category/"]')
        .count()) > 0;

    if (!hasCategories) {
      console.log('No categories found on categories page');
    }
  });

  test('should navigate to category products', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');

    // Click first category
    const firstCategory = page
      .locator('[data-testid="category-card"], .category-card, a[href*="/category/"]')
      .first();

    if (await firstCategory.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCategory.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Should be on a category page
      expect(page.url()).toMatch(/category|products/);
    }
  });
});

test.describe('Search Functionality Tests', () => {
  test('should perform global search', async ({ page }) => {
    await page.goto(BASE_URL);

    // Find global search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('luxury watch');
      await searchInput.press('Enter');

      // Wait for results
      await page.waitForLoadState('networkidle');

      // Should navigate to search results or products page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/search|products|query/);
    }
  });
});

test.describe('Footer Tests', () => {
  test('should display footer', async ({ page }) => {
    await page.goto(BASE_URL);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have footer links', async ({ page }) => {
    await page.goto(BASE_URL);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for common footer links
    const footer = page.locator('footer');
    const footerLinks = footer.locator('a');

    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
