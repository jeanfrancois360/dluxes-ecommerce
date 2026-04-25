# NextPik Frontend E2E Tests

End-to-end tests for NextPik using Playwright.

## Test Files

### 1. **pages.spec.ts** - Core Pages Testing

Tests homepage, product listings, product details, categories, and search functionality.

**Test Suites:**

- Homepage Tests (4 tests)
- Products Page Tests (4 tests)
- Product Detail Page Tests (3 tests)
- Categories Page Tests (2 tests)
- Search Functionality Tests (1 test)
- Footer Tests (2 tests)

**Total:** 16 tests

### 2. **auth.spec.ts** - Authentication Testing

Tests login, registration, logout, password reset, and session management.

**Test Suites:**

- Login Page Tests (5 tests)
- Registration Page Tests (4 tests)
- Logout Tests (1 test)
- Password Reset Tests (2 tests)
- Protected Routes Tests (2 tests)
- Session Persistence Tests (1 test)

**Total:** 15 tests

### 3. **cart.spec.ts** - Shopping Cart & Checkout

Tests cart operations, item management, checkout flow, and currency switching.

**Test Suites:**

- Cart Page Tests (3 tests)
- Add to Cart Tests (2 tests)
- Cart Item Management Tests (4 tests)
- Checkout Flow Tests (5 tests)
- Currency Switching Tests (1 test)
- Cart Persistence Tests (1 test)
- Promo Code Tests (2 tests)

**Total:** 18 tests

### 4. **seller-dashboard.spec.ts** - Seller Portal

Tests seller dashboard, product management, orders, analytics, and settings.

**Test Suites:**

- Seller Dashboard Access Tests (2 tests)
- Seller Dashboard Overview Tests (5 tests)
- Seller Products Management Tests (6 tests)
- Product Creation Form Tests (4 tests)
- Seller Orders Management Tests (5 tests)
- Seller Analytics Tests (3 tests)
- Seller Settings Tests (2 tests)
- Seller Payout Tests (3 tests)
- Gelato/Shipping Integration Tests (2 tests)

**Total:** 32 tests

## Running Tests

### Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all tests
cd apps/web
npx playwright test

# Run specific test file
npx playwright test pages.spec.ts
npx playwright test auth.spec.ts
npx playwright test cart.spec.ts
npx playwright test seller-dashboard.spec.ts

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test suite
npx playwright test -g "Homepage Tests"

# Run tests in parallel
npx playwright test --workers=4
```

### View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

### Debug Tests

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test pages.spec.ts:10 --debug
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL:** `http://localhost:3000`
- **Test Directory:** `./test/e2e`
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reporters:** HTML, List, JSON
- **Screenshots:** On failure only
- **Video:** Retain on failure
- **Trace:** On first retry

## Requirements

- Frontend server running on http://localhost:3000
- Backend API running on http://localhost:4000
- Database seeded with test data
- Playwright browsers installed (`npx playwright install`)

## Test Strategy

### Resilient Testing

Tests are designed to be resilient and handle various states:

- ✅ Graceful handling of missing elements (timeout with fallback)
- ✅ Checks for both authenticated and unauthenticated states
- ✅ Handles empty states (no products, no orders, etc.)
- ✅ Logs informational messages instead of hard failures for optional features
- ✅ Uses multiple selectors to find elements (data-testid, class names, text)

### What's NOT Tested

- Backend API directly (see `apps/api/test/agents/` for backend tests)
- Email verification flows (requires email provider)
- Payment processing (Stripe test mode only)
- External integrations (Gelato, EasyPost, etc.)

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    cd apps/web
    npx playwright install --with-deps chromium
    npx playwright test --project=chromium

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/your-page`);
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('button');

    // Act
    await element.click();

    // Assert
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for network idle** before assertions
3. **Handle timeouts gracefully** with `.catch(() => false)`
4. **Log informational messages** for optional features
5. **Test both positive and negative cases**
6. **Use page object model** for complex flows
7. **Avoid hard-coded waits** (use `waitForSelector` instead)

## Troubleshooting

### Tests Timing Out

- Increase timeout in playwright.config.ts
- Check if dev servers are running
- Verify network requests aren't blocked

### Element Not Found

- Check selector (inspect element in browser)
- Increase timeout for slow-loading elements
- Verify element is visible (not hidden by CSS)

### Authentication Issues

- Clear cookies between tests: `await page.context().clearCookies()`
- Use `test.skip()` for tests requiring authentication
- Create test fixtures for authenticated states

### Video/Screenshot Not Captured

- Check `playwright-report/` directory
- Ensure `video: 'retain-on-failure'` is set
- Only captures on test failure

## Test Coverage

| Area     | Coverage  | Notes                                      |
| -------- | --------- | ------------------------------------------ |
| Homepage | ✅ High   | All key elements tested                    |
| Products | ✅ High   | Listing, filtering, search tested          |
| Cart     | ✅ High   | Add, update, remove, checkout tested       |
| Auth     | ⚠️ Medium | Login/register tested, but not email flows |
| Seller   | ⚠️ Medium | Dashboard tested, requires auth            |
| Admin    | ❌ Low    | Not yet tested                             |
| Mobile   | ⚠️ Medium | Config ready, needs dedicated tests        |

## Next Steps

- [ ] Add admin dashboard tests
- [ ] Add mobile-specific interaction tests
- [ ] Add accessibility tests (axe-core integration)
- [ ] Add performance tests (Lighthouse integration)
- [ ] Add visual regression tests (Percy/Chromatic)
- [ ] Create test fixtures for common authenticated states
- [ ] Add API mocking for isolated frontend tests
