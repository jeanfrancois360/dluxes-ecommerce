import { test, expect } from '@playwright/test';

/**
 * E2E Tests: User Login
 *
 * Tests login flows including:
 * - Standard email/password login
 * - Login with 2FA
 * - Remember me functionality
 * - Error handling
 */

// Test credentials (assuming these were created in registration tests or seed data)
const validCredentials = {
  email: process.env.TEST_USER_EMAIL || 'test-buyer@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!@#',
};

const invalidCredentials = {
  email: 'nonexistent@example.com',
  password: 'WrongPassword123!',
};

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Login|Sign In|NextPik/);
  });

  test('should display login form', async ({ page }) => {
    // Check for form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for "Remember Me" checkbox
    const rememberMe = page.locator('input[type="checkbox"]');
    if (await rememberMe.isVisible().catch(() => false)) {
      await expect(rememberMe).toBeVisible();
    }

    // Check for links
    await expect(page.locator('text=/forgot.*password/i')).toBeVisible();
    await expect(page.locator('text=/sign up|register/i')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling anything
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/email.*required|required.*field/i')).toBeVisible({
      timeout: 2000,
    });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', invalidCredentials.email);
    await page.fill('input[name="password"]', invalidCredentials.password);

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=/invalid.*credentials|incorrect.*password|user.*not.*found/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);

    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should redirect to dashboard or home
    await expect(page).toHaveURL(/\/(dashboard|products|home)/, { timeout: 10000 });

    // Should see user menu or logout button
    const userMenu = page.locator('[aria-label="User menu"]').or(page.locator('text=/logout/i'));
    await expect(userMenu).toBeVisible({ timeout: 5000 });
  });

  test('should remember login session', async ({ page, context }) => {
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);

    // Check "Remember Me" if available
    const rememberMe = page.locator('input[type="checkbox"][name="rememberMe"]');
    if (await rememberMe.isVisible().catch(() => false)) {
      await rememberMe.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check that auth token/cookie was set
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(
      (cookie) =>
        cookie.name.includes('token') ||
        cookie.name.includes('session') ||
        cookie.name.includes('auth'),
    );

    expect(hasAuthCookie).toBeTruthy();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);

    await page.click('button[type="submit"]');

    // Button should show loading state
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();

    // Check for loading indicator (spinner, text, etc.)
    const hasLoadingIndicator =
      isDisabled ||
      (await submitButton.locator('svg').isVisible().catch(() => false)) ||
      (await submitButton.textContent().then((text) => text?.includes('...')));

    expect(hasLoadingIndicator).toBeTruthy();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=/forgot.*password/i');

    await expect(page).toHaveURL(/\/auth\/forgot-password/, { timeout: 3000 });
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=/sign up|register/i');

    await expect(page).toHaveURL(/\/auth\/register/, { timeout: 3000 });
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();

    // Fill with keyboard
    await page.keyboard.type(validCredentials.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validCredentials.password);

    // Submit with Enter key
    await page.keyboard.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|products|home)/, { timeout: 10000 });
  });
});

test.describe('Login with 2FA', () => {
  // Skip if 2FA test user is not available
  const has2FAUser = !!process.env.TEST_2FA_USER_EMAIL;

  test.skip(!has2FAUser, 'requires 2FA test user');

  test('should prompt for 2FA code', async ({ page }) => {
    const twoFACredentials = {
      email: process.env.TEST_2FA_USER_EMAIL!,
      password: process.env.TEST_2FA_USER_PASSWORD!,
    };

    await page.goto('/auth/login');

    await page.fill('input[name="email"]', twoFACredentials.email);
    await page.fill('input[name="password"]', twoFACredentials.password);

    await page.click('button[type="submit"]');

    // Should show 2FA code input
    await expect(page.locator('input[name="twoFactorCode"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/enter.*code|two.*factor|2fa/i')).toBeVisible();
  });

  test('should show error for invalid 2FA code', async ({ page }) => {
    const twoFACredentials = {
      email: process.env.TEST_2FA_USER_EMAIL!,
      password: process.env.TEST_2FA_USER_PASSWORD!,
    };

    await page.goto('/auth/login');

    await page.fill('input[name="email"]', twoFACredentials.email);
    await page.fill('input[name="password"]', twoFACredentials.password);
    await page.click('button[type="submit"]');

    // Wait for 2FA prompt
    await page.waitForSelector('input[name="twoFactorCode"]', { timeout: 5000 });

    // Enter invalid code
    await page.fill('input[name="twoFactorCode"]', '000000');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid.*code|incorrect.*code/i')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Rate Limiting', () => {
  test('should block after multiple failed attempts', async ({ page }) => {
    await page.goto('/auth/login');

    const badEmail = `ratelimit-test-${Date.now()}@example.com`;

    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', badEmail);
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Wait for error to appear
      await page.waitForTimeout(1000);
    }

    // 6th attempt should be rate limited
    await page.fill('input[name="email"]', badEmail);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show rate limit message
    await expect(
      page.locator('text=/too many.*attempts|rate.*limit|try.*again.*later/i'),
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Login', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should login on mobile device', async ({ page }) => {
    await page.goto('/auth/login');

    // Form should be visible
    await expect(page.locator('form')).toBeVisible();

    // Fill form
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);

    // Scroll to submit if needed
    await page.locator('button[type="submit"]').scrollIntoViewIfNeeded();
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|products|home)/, { timeout: 10000 });
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/auth/login');

    const submitButton = page.locator('button[type="submit"]');
    const boundingBox = await submitButton.boundingBox();

    // Button should be at least 44px tall (Apple HIG recommendation)
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });
});
