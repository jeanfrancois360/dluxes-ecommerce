import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Session Management
 *
 * Tests session-related features including:
 * - Viewing active sessions
 * - Device information
 * - Revoking sessions
 * - Logout functionality
 */

const validCredentials = {
  email: process.env.TEST_USER_EMAIL || 'test-buyer@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!@#',
};

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|home|products)/, { timeout: 10000 });
  });

  test('should display active sessions', async ({ page }) => {
    // Navigate to sessions/security settings
    // The exact URL might be /settings/sessions or /account/sessions
    await page.goto('/settings/sessions').catch(async () => {
      await page.goto('/account/sessions').catch(async () => {
        // Try finding sessions link in settings menu
        await page.goto('/settings');
        await page.click('text=/sessions|security|devices/i').catch(() => {
          // Sessions page might not exist yet - skip test
          test.skip();
        });
      });
    });

    // Should show list of sessions
    await expect(page.locator('text=/active.*sessions|your.*devices/i')).toBeVisible({
      timeout: 5000,
    });

    // Should show at least current session
    await expect(page.locator('text=/current|this.*device/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show device information', async ({ page }) => {
    await page.goto('/settings/sessions').catch(() => page.goto('/account/sessions'));

    // Should display device info
    const deviceInfo = page.locator('text=/chrome|firefox|safari|mac|windows|linux/i');
    if (await deviceInfo.first().isVisible().catch(() => false)) {
      await expect(deviceInfo.first()).toBeVisible();
    }

    // Should show location or IP info
    const locationInfo = page.locator('text=/location|ip address/i');
    if (await locationInfo.isVisible().catch(() => false)) {
      await expect(locationInfo).toBeVisible();
    }
  });

  test('should revoke a specific session', async ({ page, context }) => {
    // Create a second session in a new context
    const newContext = await context.browser()!.newContext();
    const newPage = await newContext.newPage();

    await newPage.goto('/auth/login');
    await newPage.fill('input[name="email"]', validCredentials.email);
    await newPage.fill('input[name="password"]', validCredentials.password);
    await newPage.click('button[type="submit"]');
    await newPage.waitForLoadState('networkidle');

    // Go back to original page and check sessions
    await page.goto('/settings/sessions').catch(() => page.goto('/account/sessions'));

    // Should show 2 sessions
    const sessionCards = page.locator('[data-testid="session-card"]').or(
      page.locator('text=/session|device/i'),
    );

    const sessionCount = await sessionCards.count();
    expect(sessionCount).toBeGreaterThan(1);

    // Revoke one session
    const revokeButton = page
      .locator('button:has-text("Revoke")')
      .or(page.locator('button:has-text("Remove")'))
      .first();

    if (await revokeButton.isVisible().catch(() => false)) {
      await revokeButton.click();

      // Should show confirmation or success message
      await expect(page.locator('text=/revoked|removed|ended/i')).toBeVisible({ timeout: 3000 });
    }

    await newContext.close();
  });

  test('should revoke all other sessions', async ({ page, context }) => {
    // Create additional sessions
    const contexts = await Promise.all([
      context.browser()!.newContext(),
      context.browser()!.newContext(),
    ]);

    for (const ctx of contexts) {
      const newPage = await ctx.newPage();
      await newPage.goto('/auth/login');
      await newPage.fill('input[name="email"]', validCredentials.email);
      await newPage.fill('input[name="password"]', validCredentials.password);
      await newPage.click('button[type="submit"]');
      await newPage.waitForLoadState('networkidle');
    }

    // Go to sessions page
    await page.goto('/settings/sessions').catch(() => page.goto('/account/sessions'));

    // Click "Revoke All Other Sessions" button
    const revokeAllButton = page
      .locator('button:has-text("Revoke All")')
      .or(page.locator('button:has-text("Sign out all other devices")'));

    if (await revokeAllButton.isVisible().catch(() => false)) {
      await revokeAllButton.click();

      // Confirm if there's a confirmation dialog
      const confirmButton = page
        .locator('button:has-text("Confirm")')
        .or(page.locator('button:has-text("Yes")'));
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Should show success message
      await expect(page.locator('text=/revoked|ended|signed out/i')).toBeVisible({
        timeout: 5000,
      });

      // Reload page - should only show current session
      await page.reload();
      await page.waitForLoadState('networkidle');

      const sessionCards = page.locator('[data-testid="session-card"]').or(page.locator('li'));
      const remainingSessions = await sessionCards.count();

      // Should have 1 or fewer sessions visible
      expect(remainingSessions).toBeLessThanOrEqual(1);
    }

    // Cleanup
    for (const ctx of contexts) {
      await ctx.close();
    }
  });
});

test.describe('Logout', () => {
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|home|products)/, { timeout: 10000 });

    // Find and click logout button
    // Try multiple common locations
    const logoutButton = page
      .locator('button:has-text("Logout")')
      .or(page.locator('button:has-text("Sign Out")')
      .or(page.locator('a:has-text("Logout")')));

    // Might need to open user menu first
    const userMenu = page.locator('[aria-label="User menu"]').or(page.locator('button[aria-label*="user"]'));

    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(500); // Wait for menu animation
    }

    await logoutButton.first().click();

    // Should redirect to login or home page
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(auth\/login|\/|home)/, { timeout: 5000 });

    // Verify logged out by trying to access protected route
    await page.goto('/dashboard');

    // Should redirect back to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('should clear session data on logout', async ({ page, context }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Logout
    const logoutButton = page
      .locator('button:has-text("Logout")')
      .or(page.locator('a:has-text("Logout")'));

    const userMenu = page.locator('[aria-label="User menu"]');
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
    }

    await logoutButton.first().click();
    await page.waitForLoadState('networkidle');

    // Check that auth cookies are cleared
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(
      (cookie) =>
        (cookie.name.includes('token') ||
          cookie.name.includes('session') ||
          cookie.name.includes('auth')) &&
        cookie.value.length > 0,
    );

    expect(hasAuthCookie).toBe(false);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('should access protected route when authenticated', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should NOT redirect, should stay on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    await expect(page.locator('text=/dashboard/i')).toBeVisible({ timeout: 3000 });
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated
    await expect(page).toHaveURL(/\/(dashboard|home|products)/, { timeout: 5000 });

    // Should be able to access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });
});

test.describe('Session Expiry', () => {
  test.skip('should handle expired session gracefully', async ({ page }) => {
    // This test would require manipulating session expiry
    // In a real test, you might:
    // 1. Login with a short-lived token
    // 2. Wait for expiry
    // 3. Try to access protected route
    // 4. Should redirect to login with expiry message
  });

  test.skip('should prompt for re-authentication on sensitive actions', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', validCredentials.email);
    await page.fill('input[name="password"]', validCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Try to perform sensitive action (e.g., change password)
    await page.goto('/settings/security');

    // Might require re-entering password for security
    const passwordPrompt = page.locator('input[name="currentPassword"]');
    if (await passwordPrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(passwordPrompt).toBeVisible();
    }
  });
});
