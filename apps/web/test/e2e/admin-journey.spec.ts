/**
 * NextPik Admin Journey E2E Tests
 *
 * Auth strategy:
 * - beforeAll: Get API token once (avoids rate limiting from 8 browser logins)
 * - injectAdminAuth: Sets BOTH cookie (for Next.js middleware) AND localStorage
 *   (for client-side auth context). Must use addInitScript to set localStorage
 *   before page scripts run — otherwise the auth context clears the cookie and
 *   redirects to login before the URL assertion fires.
 */

import { test, expect, request as playwrightRequest } from '@playwright/test';

const ADMIN_EMAIL = 'admin@nextpik.com';
const ADMIN_PASSWORD = 'Password123!';
const API_URL = 'http://localhost:4000/api/v1';
const TOKEN_COOKIE = 'nextpik_ecommerce_access_token';

let adminToken: string;

test.describe.serial('Admin Journey', () => {
  test.beforeAll(async () => {
    const apiContext = await playwrightRequest.newContext();
    const response = await apiContext.post(`${API_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const data = await response.json();
    adminToken = data.accessToken || data.access_token || data.token;
    if (!adminToken) throw new Error(`Admin login failed: ${JSON.stringify(data)}`);
    await apiContext.dispose();
  });

  /**
   * Inject admin auth into page.
   * Sets BOTH:
   *  1. Cookie (nextpik_ecommerce_access_token) — read by Next.js middleware server-side
   *  2. localStorage['auth_token'] — read by client-side auth context
   *
   * addInitScript ensures localStorage is set before React scripts run,
   * preventing the auth context from clearing the cookie and redirecting to login.
   */
  async function injectAdminAuth(page: any) {
    const token = adminToken;
    // Expiry: 7 days from now (milliseconds, as stored by auth-utils setTokenExpiry)
    const expiryMs = (Date.now() + 7 * 24 * 3600 * 1000).toString();

    // Set localStorage BEFORE any page script runs via addInitScript.
    // This prevents the auth context from treating the session as expired and
    // calling refreshToken() → which hits 404 → which calls clearAllAuthData()
    // → which deletes the cookie → which causes the login redirect.
    await page.addInitScript(
      ({
        lsKey,
        expiryKey,
        cookieKey,
        tokenValue,
        expiry,
      }: {
        lsKey: string;
        expiryKey: string;
        cookieKey: string;
        tokenValue: string;
        expiry: string;
      }) => {
        localStorage.setItem(lsKey, tokenValue);
        localStorage.setItem(expiryKey, expiry); // prevents isTokenExpired() from returning true
        document.cookie = `${cookieKey}=${tokenValue}; path=/; max-age=604800; SameSite=Lax`;
      },
      {
        lsKey: 'auth_token',
        expiryKey: 'nextpik_ecommerce_token_expiry',
        cookieKey: TOKEN_COOKIE,
        tokenValue: token,
        expiry: expiryMs,
      }
    );
    // Set cookie via Playwright context for server-side middleware
    await page.context().addCookies([
      {
        name: TOKEN_COOKIE,
        value: token,
        url: 'http://localhost:3000',
      },
    ]);
  }

  test('A1: Admin dashboard loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A2: Admin products page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/products');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2, table, [class*="Table"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('A3: Admin orders page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/orders');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2, table, [class*="Table"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('A4: Admin users/customers page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/customers');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2, table, [class*="Table"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('A5: Admin settings page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/settings');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A6: Admin categories page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/categories');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A7: Admin commissions page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/commissions');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('A8: Admin currencies page loads', async ({ page }) => {
    await injectAdminAuth(page);
    await page.goto('/admin/currencies');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});
