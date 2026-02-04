# E2E Testing with Playwright

This directory contains end-to-end tests for the NextPik authentication system using Playwright.

## Prerequisites

1. **Install browsers** (first time only):
   ```bash
   npx playwright install
   ```

2. **Start the development servers**:
   - Backend API: `pnpm dev:api` (must be running on http://localhost:4000)
   - Frontend: `pnpm dev:web` (must be running on http://localhost:3000)

   Or use the monorepo dev script from the root:
   ```bash
   pnpm dev
   ```

## Running Tests

### Run all tests (headless)
```bash
pnpm test:e2e
```

### Run tests with UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
pnpm test:e2e:headed
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
pnpm test:e2e auth-registration.spec.ts
```

### Run tests on specific browser
```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### View test report
```bash
pnpm test:e2e:report
```

## Test Files

- **auth-registration.spec.ts** - User registration flows (buyer/seller)
- **auth-login.spec.ts** - Login flows including 2FA and rate limiting
- **auth-password-reset.spec.ts** - Password reset request and reset flows
- **auth-sessions.spec.ts** - Session management and logout

## Test Coverage

### Registration Tests (12 tests)
- Form validation (email format, password strength)
- Buyer registration
- Seller registration with store creation
- Duplicate email prevention
- Loading states
- Mobile responsiveness
- Accessibility

### Login Tests (10 tests)
- Form display and validation
- Successful login
- Invalid credentials handling
- Remember me functionality
- Loading states
- 2FA flows
- Rate limiting
- Keyboard navigation
- Mobile login

### Password Reset Tests (10 tests)
- Request password reset
- Email validation
- Security (no user enumeration)
- Reset with token
- Password strength validation
- Password confirmation matching
- Token validation (invalid, expired)
- Mobile responsiveness

### Session Management Tests (8 tests)
- View active sessions
- Device information display
- Revoke specific session
- Revoke all other sessions
- Logout functionality
- Protected route access
- Session persistence
- Auth state clearing

**Total: 40+ E2E tests**

## Environment Variables

Create a `.env.test` file in the `apps/web` directory:

```env
# Test user credentials (optional - tests will create users dynamically)
TEST_USER_EMAIL=test-buyer@example.com
TEST_USER_PASSWORD=TestPassword123!@#

# 2FA test user (optional)
TEST_2FA_USER_EMAIL=test-2fa@example.com
TEST_2FA_USER_PASSWORD=TestPassword123!@#

# Playwright settings
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## CI/CD Integration

The tests are configured to run in CI environments with:
- Automatic retry on failure (2 retries)
- Sequential execution (no parallel tests)
- HTML report generation
- Screenshots and videos on failure

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          pnpm dev:api &
          pnpm dev:web &
          sleep 30

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Use Test Helpers
Reuse functions from `e2e/helpers/auth.helper.ts`:

```typescript
import { login, logout, register } from './helpers/auth.helper';

test('my test', async ({ page }) => {
  await login(page, 'user@example.com', 'password');
  // Your test logic
  await logout(page);
});
```

### 2. Generate Unique Test Data
```typescript
import { generateTestEmail } from './helpers/auth.helper';

const email = generateTestEmail('buyer'); // buyer-1234567890-123@example.com
```

### 3. Use Page Object Pattern
For complex pages, create page objects:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

### 4. Wait for Network Idle
```typescript
await page.waitForLoadState('networkidle');
```

### 5. Use Explicit Timeouts
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

## Troubleshooting

### Tests fail with "page.goto: Navigation timeout"
- Ensure dev servers are running
- Check that services are accessible at the configured URLs
- Increase timeout in `playwright.config.ts`

### "Element not found" errors
- Add explicit waits: `await page.waitForSelector('selector')`
- Use more specific selectors
- Check if element is in a different viewport (mobile vs desktop)

### Tests pass locally but fail in CI
- Install system dependencies: `npx playwright install-deps`
- Use `--project=chromium` for consistency
- Increase timeouts for slower CI environments

### Authentication state not persisting
- Check cookie configuration in `playwright.config.ts`
- Ensure cookies have correct `domain` and `path`
- Verify auth tokens are being set correctly

## Debugging Tips

1. **Use Playwright Inspector**:
   ```bash
   pnpm test:e2e:debug
   ```

2. **Pause test execution**:
   ```typescript
   await page.pause();
   ```

3. **Take screenshots**:
   ```typescript
   await page.screenshot({ path: 'screenshot.png' });
   ```

4. **Log page content**:
   ```typescript
   console.log(await page.content());
   ```

5. **Watch network requests**:
   ```typescript
   page.on('request', request => console.log(request.url()));
   page.on('response', response => console.log(response.status()));
   ```

## Maintenance

- Update selectors if UI changes
- Add new tests for new features
- Keep test data isolated (use unique emails)
- Clean up test data after runs
- Update browser versions regularly: `npx playwright install`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Configuration](https://playwright.dev/docs/ci)
