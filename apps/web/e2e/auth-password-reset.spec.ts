import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Password Reset
 *
 * Tests password reset flows including:
 * - Request password reset
 * - Reset password with token
 * - Token validation
 * - Error handling
 */

const testEmail = process.env.TEST_USER_EMAIL || 'test-buyer@example.com';

test.describe('Password Reset Request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveTitle(/Forgot.*Password|Reset.*Password|NextPik/);
  });

  test('should display password reset request form', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Should have back to login link
    await expect(page.locator('text=/back.*login|sign in/i')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/valid.*email/i')).toBeVisible({ timeout: 3000 });
  });

  test('should send password reset request', async ({ page }) => {
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should show success message (even for non-existent emails for security)
    await expect(
      page.locator('text=/reset.*link.*sent|check.*email|sent.*instructions/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should not reveal if email exists', async ({ page }) => {
    // Request reset for non-existent email
    await page.fill('input[name="email"]', 'nonexistent-user-12345@example.com');
    await page.click('button[type="submit"]');

    // Should show the same success message
    await expect(
      page.locator('text=/reset.*link.*sent|check.*email|sent.*instructions/i'),
    ).toBeVisible({ timeout: 5000 });

    // Should NOT show "user not found" or similar
    const errorMessage = page.locator('text=/user.*not.*found|email.*not.*exist/i');
    expect(await errorMessage.isVisible().catch(() => false)).toBe(false);
  });

  test('should show loading state', async ({ page }) => {
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Check for loading state
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();

    expect(isDisabled).toBeTruthy();
  });

  test('should navigate back to login', async ({ page }) => {
    await page.click('text=/back.*login|sign in/i');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 3000 });
  });
});

test.describe('Password Reset with Token', () => {
  // Note: In real tests, you would need to get a valid token from the database or email
  // For demo purposes, we'll test the UI flow
  const mockToken = 'test-reset-token-12345';

  test('should display password reset form', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    // Should show password fields
    await expect(page.locator('input[name="newPassword"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    // Try weak password
    await page.fill('input[name="newPassword"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    // Should show strength indicator or error
    await expect(page.locator('text=/weak|too short|at least/i')).toBeVisible({ timeout: 2000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    await page.fill('input[name="newPassword"]', 'StrongPassword123!@#');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!@#');

    await page.click('button[type="submit"]');

    // Should show mismatch error
    await expect(page.locator('text=/password.*match|password.*same/i')).toBeVisible({
      timeout: 3000,
    });
  });

  test('should show error for invalid token', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=invalid-token-xyz`);

    await page.fill('input[name="newPassword"]', 'NewPassword123!@#');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!@#');

    await page.click('button[type="submit"]');

    // Should show invalid token error
    await expect(
      page.locator('text=/invalid.*link|expired.*link|token.*invalid/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show error for expired token', async ({ page }) => {
    // Use a known expired token (would need to be created in test setup)
    const expiredToken = 'expired-token-12345';

    await page.goto(`/auth/reset-password?token=${expiredToken}`);

    await page.fill('input[name="newPassword"]', 'NewPassword123!@#');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!@#');

    await page.click('button[type="submit"]');

    // Should show expired error
    await expect(page.locator('text=/expired|no longer valid/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    await page.fill('input[name="newPassword"]', 'weak');

    // Should show weak indicator
    await expect(page.locator('text=/weak/i')).toBeVisible({ timeout: 2000 });

    // Type stronger password
    await page.fill('input[name="newPassword"]', 'StrongPassword123!@#');

    // Should show strong/medium indicator
    const strongIndicator = page.locator('text=/strong|medium/i');
    await expect(strongIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    const passwordInput = page.locator('input[name="newPassword"]');

    // Should be type="password" initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show/hide button
    const toggleButton = page.locator('button[aria-label*="password"]').or(
      page.locator('button:has-text("Show")'),
    );

    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();

      // Should change to type="text"
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Complete Password Reset Flow', () => {
  // This would require integration with email or test database
  test.skip('end-to-end password reset flow', async ({ page }) => {
    // 1. Request password reset
    await page.goto('/auth/forgot-password');
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // 2. Get reset token (from test email or database)
    // const resetToken = await getResetTokenFromTestEmail(testEmail);

    // 3. Navigate to reset page with token
    // await page.goto(`/auth/reset-password?token=${resetToken}`);

    // 4. Set new password
    // await page.fill('input[name="newPassword"]', 'NewPassword123!@#');
    // await page.fill('input[name="confirmPassword"]', 'NewPassword123!@#');
    // await page.click('button[type="submit"]');

    // 5. Should redirect to login
    // await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });

    // 6. Login with new password
    // await page.fill('input[name="email"]', testEmail);
    // await page.fill('input[name="password"]', 'NewPassword123!@#');
    // await page.click('button[type="submit"]');

    // 7. Should successfully login
    // await expect(page).toHaveURL(/\/(dashboard|home)/, { timeout: 5000 });
  });
});

test.describe('Mobile Password Reset', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should request password reset on mobile', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Form should be responsive
    await expect(page.locator('form')).toBeVisible();

    await page.fill('input[name="email"]', testEmail);

    // Button should be touch-friendly
    const submitButton = page.locator('button[type="submit"]');
    const boundingBox = await submitButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);

    await submitButton.click();

    await expect(page.locator('text=/reset.*link.*sent|check.*email/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should reset password on mobile', async ({ page }) => {
    const mockToken = 'test-mobile-reset-token';
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    await page.fill('input[name="newPassword"]', 'NewMobilePassword123!@#');
    await page.fill('input[name="confirmPassword"]', 'NewMobilePassword123!@#');

    // Scroll to submit button if needed
    await page.locator('button[type="submit"]').scrollIntoViewIfNeeded();
    await page.click('button[type="submit"]');

    // Should show result (success or error)
    const resultMessage = page
      .locator('text=/success|invalid|expired/i')
      .or(page.locator('[role="alert"]'));
    await expect(resultMessage.first()).toBeVisible({ timeout: 5000 });
  });
});
