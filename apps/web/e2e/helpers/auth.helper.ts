import { Page, expect } from '@playwright/test';

/**
 * Authentication Test Helpers
 *
 * Reusable functions for authentication E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'BUYER' | 'SELLER';
}

/**
 * Login with credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Try to find logout button in common locations
  const userMenu = page.locator('[aria-label="User menu"]').or(page.locator('button[aria-label*="user"]'));

  if (await userMenu.isVisible().catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(500);
  }

  const logoutButton = page
    .locator('button:has-text("Logout")')
    .or(page.locator('button:has-text("Sign Out")'))
    .or(page.locator('a:has-text("Logout")'));

  await logoutButton.first().click();
  await page.waitForLoadState('networkidle');
}

/**
 * Register a new user
 */
export async function register(page: Page, user: TestUser) {
  await page.goto('/auth/register');

  // Select role
  if (user.role === 'SELLER') {
    await page.click('text=Seller');
  } else {
    await page.click('text=Buyer');
  }

  // Fill form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  if (user.firstName) {
    await page.fill('input[name="firstName"]', user.firstName);
  }

  if (user.lastName) {
    await page.fill('input[name="lastName"]', user.lastName);
  }

  if (user.phone) {
    await page.fill('input[name="phone"]', user.phone);
  }

  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Try to access a protected route
  await page.goto('/dashboard');

  // If redirected to login, not authenticated
  if (page.url().includes('/auth/login')) {
    return false;
  }

  // If dashboard loads, authenticated
  return page.url().includes('/dashboard');
}

/**
 * Wait for API request to complete
 */
export async function waitForApiRequest(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    return (
      (typeof urlPattern === 'string' && response.url().includes(urlPattern)) ||
      (urlPattern instanceof RegExp && urlPattern.test(response.url()))
    );
  });
}

/**
 * Get auth token from cookies
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(
    (cookie) =>
      cookie.name.includes('token') || cookie.name.includes('session') || cookie.name.includes('auth'),
  );

  return authCookie?.value || null;
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Fill form field with validation
 */
export async function fillFieldWithValidation(
  page: Page,
  fieldName: string,
  value: string,
  shouldValidate: boolean = true,
) {
  const input = page.locator(`input[name="${fieldName}"]`);
  await input.fill(value);

  if (shouldValidate) {
    // Blur to trigger validation
    await input.blur();
    await page.waitForTimeout(500); // Wait for validation
  }
}

/**
 * Expect form error message
 */
export async function expectFormError(page: Page, errorPattern: string | RegExp) {
  const errorMessage = page.locator(`text=${errorPattern}`);
  await expect(errorMessage).toBeVisible({ timeout: 3000 });
}

/**
 * Expect success message
 */
export async function expectSuccessMessage(page: Page, messagePattern: string | RegExp) {
  const successMessage = page.locator(`text=${messagePattern}`);
  await expect(successMessage).toBeVisible({ timeout: 5000 });
}

/**
 * Click button and wait for loading
 */
export async function clickAndWaitForLoading(page: Page, buttonSelector: string) {
  const button = page.locator(buttonSelector);
  await button.click();

  // Wait for button to become disabled (loading state)
  await expect(button).toBeDisabled({ timeout: 1000 }).catch(() => {
    // If button doesn't disable, just wait a bit
    return page.waitForTimeout(500);
  });
}

/**
 * Navigate to protected route
 */
export async function navigateToProtectedRoute(page: Page, route: string) {
  await page.goto(route);

  // Should not redirect to login if authenticated
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 3000 });
}

/**
 * Setup authenticated state (faster than logging in each time)
 */
export async function setupAuthState(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: 'auth_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clear all auth state
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
