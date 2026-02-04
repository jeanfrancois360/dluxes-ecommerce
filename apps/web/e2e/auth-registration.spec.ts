import { test, expect } from '@playwright/test';

/**
 * E2E Tests: User Registration
 *
 * Tests buyer and seller registration flows including:
 * - Form validation
 * - Duplicate email prevention
 * - Store creation for sellers
 * - Email verification
 */

// Generate unique email for each test run to avoid conflicts
const timestamp = Date.now();
const testBuyer = {
  email: `buyer-e2e-${timestamp}@example.com`,
  password: 'TestPassword123!@#',
  firstName: 'Test',
  lastName: 'Buyer',
  phone: '+1234567890',
};

const testSeller = {
  email: `seller-e2e-${timestamp}@example.com`,
  password: 'TestPassword123!@#',
  firstName: 'Test',
  lastName: 'Seller',
  phone: '+9876543210',
  storeName: `Test Store ${timestamp}`,
};

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Register|Sign Up|NextPik/);
  });

  test('should display registration form with all fields', async ({ page }) => {
    // Check for form fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();

    // Check for role selection (buyer/seller)
    await expect(page.locator('text=Buyer')).toBeVisible();
    await expect(page.locator('text=Seller')).toBeVisible();

    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testBuyer.password);
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/.*valid.*email.*/i')).toBeVisible({ timeout: 3000 });
  });

  test('should validate password strength', async ({ page }) => {
    // Fill weak password
    await page.fill('input[name="email"]', testBuyer.email);
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);

    // Should show password strength indicator or error
    const weakIndicator = page.locator('text=/.*weak.*|.*at least.*/i');
    await expect(weakIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should register a new buyer successfully', async ({ page }) => {
    // Select Buyer role
    await page.click('text=Buyer');

    // Fill form
    await page.fill('input[name="email"]', testBuyer.email);
    await page.fill('input[name="password"]', testBuyer.password);
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);
    await page.fill('input[name="phone"]', testBuyer.phone);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for loading to finish
    await page.waitForLoadState('networkidle');

    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/\/(dashboard|products|home)/, { timeout: 10000 });

    // Alternatively, check for success message
    const successMessage = page.locator('text=/.*success.*registered.*/i');
    if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should register a seller with store creation', async ({ page }) => {
    // Select Seller role
    await page.click('text=Seller');

    // Store name field should appear
    await expect(page.locator('input[name="storeName"]')).toBeVisible({ timeout: 2000 });

    // Fill form
    await page.fill('input[name="email"]', testSeller.email);
    await page.fill('input[name="password"]', testSeller.password);
    await page.fill('input[name="firstName"]', testSeller.firstName);
    await page.fill('input[name="lastName"]', testSeller.lastName);
    await page.fill('input[name="phone"]', testSeller.phone);
    await page.fill('input[name="storeName"]', testSeller.storeName);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for loading
    await page.waitForLoadState('networkidle');

    // Should redirect to seller dashboard or show success with store info
    await expect(page).toHaveURL(/\/(dashboard|seller)/, { timeout: 10000 });

    // Check for store creation confirmation
    const storeMessage = page.locator(`text=/${testSeller.storeName}|store.*ready/i`);
    if (await storeMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(storeMessage).toBeVisible();
    }
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Try to register with the same buyer email again
    await page.click('text=Buyer');

    await page.fill('input[name="email"]', testBuyer.email);
    await page.fill('input[name="password"]', testBuyer.password);
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/.*already.*exists.*|.*email.*taken.*/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.click('text=Buyer');

    await page.fill('input[name="email"]', `buyer-loading-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testBuyer.password);
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);

    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');

    // Button should be disabled or show loading
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    const hasLoadingText = await submitButton.textContent().then((text) => text?.includes('...'));

    expect(isDisabled || hasLoadingText).toBeTruthy();
  });

  test('should have accessible form labels', async ({ page }) => {
    // Check that all inputs have associated labels or aria-labels
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('aria-label', /.+/);

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);

    // Or check for visible labels
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();
  });
});

test.describe('Mobile Registration', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/auth/register');

    // Form should be visible and properly sized
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Inputs should be touch-friendly (min 44px height)
    const emailInput = page.locator('input[name="email"]');
    const boundingBox = await emailInput.boundingBox();

    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should allow registration on mobile device', async ({ page }) => {
    await page.goto('/auth/register');

    await page.click('text=Buyer');

    // Fill form on mobile
    await page.fill('input[name="email"]', `mobile-buyer-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testBuyer.password);
    await page.fill('input[name="firstName"]', testBuyer.firstName);
    await page.fill('input[name="lastName"]', testBuyer.lastName);

    // Scroll to submit button if needed
    await page.locator('button[type="submit"]').scrollIntoViewIfNeeded();
    await page.click('button[type="submit"]');

    // Should successfully register
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|products|home)/, { timeout: 10000 });
  });
});
