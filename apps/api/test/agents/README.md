# Backend Test Agents

Automated test agents for NextPik API endpoints using Axios.

## Available Agents

### 1. **cart-order.agent.ts** (733 lines)

Tests cart operations, order creation, and payment verification.

**Endpoints Tested:**

- `GET /cart` - Get cart (empty and with items)
- `POST /cart/items` - Add item to cart
- `PATCH /cart/items/:id` - Update cart item quantity
- `PATCH /cart/currency` - Update cart currency
- `DELETE /cart/items/:id` - Remove cart item
- `DELETE /cart` - Clear cart
- `POST /orders/calculate` - Calculate order totals
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order details
- `POST /payment/create-intent` - Create payment intent
- **Payment Amount Verification** - Ensures payment intent matches order total

**Tests:** 14 total

### 2. **referral.agent.ts** (546 lines)

Tests referral code generation, validation, leaderboard, and admin analytics.

**Endpoints Tested:**

- `GET /referral/settings` - Get public referral settings
- `POST /referral/generate` - Generate referral code
- `GET /referral/summary` - Get user referral summary
- `GET /referral/validate/:code` - Validate referral code (valid and invalid)
- `GET /referral/history` - Get referral history
- `GET /referral/leaderboard` - Get top referrers leaderboard
- `GET /referral/admin/all` - Get all referrals (Admin)
- `GET /referral/admin/statistics` - Get referral statistics (Admin)
- `GET /referral/admin/top-referrers` - Get top referrers with full details (Admin)
- `GET /referral/admin/settings` - Get full referral settings (Admin)

**Tests:** 11 total (7 user + 4 admin)

### 3. **seller.agent.ts** (344 lines)

Tests seller-specific operations, products, orders, and payouts.

**Endpoints Tested:**

- `GET /seller/dashboard` - Seller dashboard stats
- `GET /seller/products` - Seller's products
- `GET /seller/orders` - Seller's orders
- `GET /subscription/seller/credit-summary` - Seller credit summary
- `GET /payout/seller/history` - Seller payout history
- Unauthorized access tests

**Tests:** 7 total

### 4. **admin.agent.ts** (591 lines)

Tests admin dashboard, user management, and system-wide analytics.

**Endpoints Tested:**

- `GET /admin/dashboard/stats` - Admin dashboard statistics
- `GET /admin/dashboard/revenue` - Revenue analytics
- `GET /admin/dashboard/orders-by-status` - Order status breakdown
- `GET /admin/dashboard/top-products` - Top selling products
- `GET /admin/dashboard/customer-growth` - Customer growth metrics
- `GET /admin/dashboard/recent-orders` - Recent orders
- `GET /admin/orders` - All orders
- `GET /admin/users` - All users
- `GET /payout/admin/stats` - Payout statistics
- `GET /subscription/plans` - Subscription plans
- `GET /referral/admin/stats` - Referral statistics
- Authorization tests

**Tests:** 13 total

### 5. **shipping.agent.ts** (397 lines)

Tests shipping provider health checks and shipping configuration settings.

**Endpoints Tested:**

- `GET /easypost/health` - EasyPost health check
- `GET /easypost/test` - EasyPost connection test
- `GET /sendcloud/health` - SendCloud health check
- `GET /easyship/health` - EasyShip health check
- `GET /dhl/health` - DHL health check
- `GET /settings/public` - Verify shipping settings exist
- `GET /settings/public` - Verify origin address settings
- `GET /settings/public` - Verify EasyPost settings

**Tests:** 8 total

### 6. **settings.agent.ts** (12K)

Tests system settings, currency rates, and configuration endpoints.

**Endpoints Tested:**

- `GET /settings/public` - Public settings
- `GET /settings/public` - Verify required settings exist
- `GET /currency/rates` - Currency exchange rates
- `GET /currency/convert` - Currency conversion
- `GET /settings/public` - Tax settings verification
- `GET /settings/public` - Payment settings verification
- `GET /settings/public` - Escrow settings verification
- `GET /settings/public` - Commission settings verification

**Tests:** 8 total

## Other Existing Agents

- **auth.agent.ts** (408 lines) - Authentication flows (registration, login, 2FA)
- **product.agent.ts** (582 lines) - Product CRUD and filtering

## Shared Types

Located in `test/types/test-result.ts`:

- `TestResult` - Individual test result
- `AgentTestResults` - Summary of all tests for an agent
- `TestContext` - Test execution context with tokens

## Usage Example

```typescript
import {
  AuthAgent,
  SellerAgent,
  AdminAgent,
  ShippingAgent,
  SettingsAgent,
  CartOrderAgent,
  ReferralAgent,
} from './agents';

// Create tokens object
const tokens = {
  buyerToken: 'your-buyer-token',
  sellerToken: 'your-seller-token',
  adminToken: 'your-admin-token',
};

// Initialize agents
const authAgent = new AuthAgent(tokens);
const sellerAgent = new SellerAgent(tokens);
const adminAgent = new AdminAgent(tokens);
const shippingAgent = new ShippingAgent(tokens);
const settingsAgent = new SettingsAgent(tokens);

// Run all tests
const authResults = await authAgent.runAll();
const sellerResults = await sellerAgent.runAll();
const adminResults = await adminAgent.runAll();
const shippingResults = await shippingAgent.runAll();
const settingsResults = await settingsAgent.runAll();

// Process results
function printResults(results: TestResult[]) {
  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘';
    console.log(`${icon} ${result.test} (${result.duration}ms)`);
    if (result.message) console.log(`  ${result.message}`);
    if (result.error) console.error(`  Error:`, result.error);
  });
}

printResults(authResults);
printResults(sellerResults);
printResults(adminResults);
printResults(shippingResults);
printResults(settingsResults);
```

## Features

- **Axios-based** - Uses Axios for HTTP requests
- **Token authentication** - Accepts access tokens in constructor
- **Comprehensive testing** - Tests all CRUD operations and edge cases
- **Detailed results** - Returns status, duration, errors, and details
- **Admin support** - Optional admin token for admin-only endpoints
- **Session management** - Cart agent uses unique session IDs
- **Amount verification** - Cart agent verifies payment amounts match order totals
- **No external dependencies** - Only requires axios (already installed)

## Test Result Structure

```typescript
interface TestResult {
  name: string; // Test name
  status: 'PASS' | 'FAIL' | 'SKIP'; // Test status
  duration: number; // Duration in milliseconds
  error?: string; // Error message if failed
  details?: any; // Additional test details
}
```

## Running Tests

### Quick Start: Run All Tests

The easiest way to run all backend tests is using the master test runner:

```bash
cd apps/api
npx ts-node test/agents/run-all-agents.ts
```

This will:

1. Run AuthAgent first to obtain test tokens (buyer, seller, admin)
2. Run remaining 7 agents in parallel with shared tokens
3. Generate comprehensive test report with statistics

**Requirements:**

- Backend server running on http://localhost:4000
- Database seeded with test data
- All environment variables configured

### Manual Test Execution

1. **Ensure servers are running:**

   ```bash
   cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik
   pnpm dev:api  # Backend on port 4000
   ```

2. **Create a test runner:**

   ```typescript
   // test-runner.ts
   import { CartOrderAgent } from './agents/cart-order.agent';
   import { ReferralAgent } from './agents/referral.agent';

   async function main() {
     const results = await cartAgent.runAll();
     // Process results...
   }

   main();
   ```

3. **Run with ts-node:**
   ```bash
   npx ts-node test-runner.ts
   ```

### Master Test Runner (run-all-agents.ts)

The master test runner orchestrates all 8 backend test agents:

**Features:**

- Sequential auth execution (runs first to get tokens)
- Parallel execution of remaining 7 agents
- Comprehensive error handling with Promise.allSettled()
- Detailed test report with:
  - Per-agent results and duration
  - Total statistics (passed/failed/warnings/skipped)
  - Success rate percentage
  - Color-coded terminal output

**Exit Codes:**

- `0` - All tests passed
- `1` - Some tests failed or fatal error occurred

**Example Output:**

```
================================================================================
NEXTPIK BACKEND TEST REPORT
================================================================================

Auth Agent
Duration: 1234ms

  PASS Register buyer account (234ms)
  PASS Login with valid credentials (156ms)
  FAIL Magic link verification (89ms) - Invalid token

Product Agent
Duration: 2345ms
...

================================================================================
TEST SUMMARY
================================================================================
Total Tests:    69
Passed:         65
Failed:         4
Warnings:       0
Skipped:        0
Success Rate:   94.20%
Total Duration: 15234ms (15.23s)
================================================================================
✓ ALL TESTS PASSED
================================================================================
```

## Notes

- All agents use `validateStatus: () => true` to prevent throwing on non-2xx responses
- Tests are designed to run independently and clean up after themselves
- Some tests may be skipped if dependencies fail (e.g., no product available)
- Admin tests require admin token to be provided in constructor
- Cart tests use unique session IDs to avoid conflicts between parallel runs
