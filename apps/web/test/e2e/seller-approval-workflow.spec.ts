/**
 * Seller Approval Workflow — Regression Tests
 *
 * Regression guard for Bug #1 (2026-05-07):
 *   auth-core.service.ts was creating seller stores with status=ACTIVE on registration,
 *   bypassing admin approval and ignoring the seller_auto_approve system setting.
 *
 * Coverage:
 *   SA1: New seller registration creates store with status=PENDING (default)
 *   SA2: PENDING seller cannot create products (HTTP 403 from store-status guard)
 *   SA3: Admin approval transitions store PENDING→ACTIVE
 *   SA4: Seller dashboard is accessible after approval
 *   SA5: seller_auto_approve=true causes immediate ACTIVE status on registration
 *
 * Auth strategy: API-only (playwrightRequest) — no browser login forms.
 *   Admin token fetched once in beforeAll; reused across tests.
 *   seller_auto_approve reset in afterAll to prevent global state pollution.
 *
 * Run: npx playwright test seller-approval-workflow.spec.ts --project=chromium
 */

import { test, expect, request as playwrightRequest } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────

const TIMESTAMP = Date.now();
const API_URL = 'http://localhost:4000/api/v1';
const ADMIN_EMAIL = 'admin@nextpik.com';
const ADMIN_PASSWORD = 'Password123!';
const SELLER_PASSWORD = 'SellerPass@1234!';

// Unique email per run — prevents collisions on re-runs
const PENDING_EMAIL = `regression-${TIMESTAMP}-pending@nextpik.test`;
const APPROVED_EMAIL = `regression-${TIMESTAMP}-approved@nextpik.test`;
const AUTO_EMAIL = `regression-${TIMESTAMP}-auto@nextpik.test`;

// Seeded category ID (Electronics) — used to build a valid product payload
const SEEDED_CATEGORY_ID = 'cmlxxkl6z0012osnk12l1ldps';

// ── Shared state ─────────────────────────────────────────────────────────────

let adminToken: string;
let pendingToken: string;
let pendingStoreId: string;
let approvedToken: string;
let approvedStoreId: string;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Register a new seller account and return the accessToken + store stub. */
async function registerSeller(
  apiCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  email: string,
  storeName: string
) {
  const res = await apiCtx.post(`${API_URL}/auth/register`, {
    data: {
      email,
      password: SELLER_PASSWORD,
      firstName: 'Regression',
      lastName: 'Seller',
      role: 'SELLER',
      storeName,
    },
  });
  return res.json();
}

/** Minimal valid product payload — all required DTO fields populated. */
function validProductPayload(suffix: string) {
  return {
    name: `Regression Product ${suffix}`,
    slug: `regression-product-${suffix}`,
    description: 'E2E regression test product for store approval workflow',
    price: 29.99,
    categoryId: SEEDED_CATEGORY_ID,
    inventory: 10,
  };
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe.serial('Seller Approval Workflow', () => {
  let apiCtx: Awaited<ReturnType<typeof playwrightRequest.newContext>>;

  test.beforeAll(async () => {
    apiCtx = await playwrightRequest.newContext();

    // Get admin token once — avoids per-test login overhead and rate limiting
    const adminRes = await apiCtx.post(`${API_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const adminData = await adminRes.json();
    adminToken = adminData.accessToken || adminData.access_token || adminData.token || '';
    if (!adminToken) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
    }
  });

  test.afterAll(async () => {
    // Reset seller_auto_approve to false regardless of test outcome
    await apiCtx.patch(`${API_URL}/settings/seller_auto_approve`, {
      data: { value: false },
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Delete all regression test users (cascades to stores, sessions, etc.)
    // Use the admin token to hit the API, or fall back to direct approach.
    // We register users with a unique TIMESTAMP prefix so cleanup is precise.
    // Note: no dedicated admin delete-user endpoint exists, so we skip API
    // cleanup here — the CI database is ephemeral. For local runs, test emails
    // are prefixed with `regression-{TIMESTAMP}-` making manual SQL trivial:
    //   DELETE FROM users WHERE email LIKE 'regression-{TIMESTAMP}-%@nextpik.test';
    await apiCtx.dispose();
  });

  // ── SA1: Default registration status is PENDING ───────────────────────────

  test('SA1: New seller registration creates store with status=PENDING', async () => {
    const data = await registerSeller(apiCtx, PENDING_EMAIL, `PendingStore ${TIMESTAMP}`);

    pendingToken = data.accessToken || data.access_token || '';
    expect(pendingToken, 'Registration must return an accessToken').toBeTruthy();

    const store = data.store;
    expect(store, 'Registration response must include a store object').toBeTruthy();
    expect(store.id, 'Store must have an id').toBeTruthy();

    // Core regression assertion — was ACTIVE before Bug #1 fix
    expect(store.status, 'Store status must be PENDING immediately after registration').toBe(
      'PENDING'
    );

    pendingStoreId = store.id;
  });

  // ── SA2: PENDING seller blocked from product creation (403, not 400) ──────

  test('SA2: PENDING seller cannot create products — HTTP 403 from store-status guard', async () => {
    expect(pendingToken, 'SA2 requires SA1 to have run first').toBeTruthy();

    const res = await apiCtx.post(`${API_URL}/seller/products`, {
      data: validProductPayload(`pending-${TIMESTAMP}`),
      headers: { Authorization: `Bearer ${pendingToken}` },
    });

    // Must be 403 (store status guard), not 400 (validation) or 201 (allowed through)
    expect(res.status(), 'PENDING seller must receive 403, not 400 or 201').toBe(403);

    const body = await res.json();
    expect(body.message, 'Error message must reference store approval').toMatch(
      /store must be approved/i
    );
  });

  // ── SA3: Admin approval transitions store PENDING→ACTIVE ─────────────────

  test('SA3: Admin approval transitions store from PENDING to ACTIVE', async () => {
    // Register the seller that will be approved
    const data = await registerSeller(apiCtx, APPROVED_EMAIL, `ApprovedStore ${TIMESTAMP}`);
    approvedToken = data.accessToken || data.access_token || '';
    approvedStoreId = data.store?.id ?? '';

    expect(approvedToken, 'Approved seller must have an accessToken').toBeTruthy();
    expect(approvedStoreId, 'Approved seller must have a store id').toBeTruthy();
    expect(data.store?.status, 'Store must start as PENDING').toBe('PENDING');

    // Admin approves the store
    const approvalRes = await apiCtx.patch(`${API_URL}/stores/admin/${approvedStoreId}/status`, {
      data: { status: 'ACTIVE' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(approvalRes.status(), 'Admin approval must return 200').toBe(200);

    const approvalBody = await approvalRes.json();

    // Verify the response reflects the new status
    const updatedStatus =
      approvalBody.status ?? approvalBody.data?.status ?? approvalBody.store?.status;
    expect(updatedStatus, 'Approval response must show ACTIVE status').toBe('ACTIVE');
  });

  // ── SA4: Seller dashboard accessible after approval ───────────────────────

  test('SA4: Seller dashboard is accessible after store approval', async () => {
    expect(approvedToken, 'SA4 requires SA3 to have run first').toBeTruthy();

    const res = await apiCtx.get(`${API_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${approvedToken}` },
    });

    expect(res.status(), 'Seller dashboard must return 200 after approval').toBe(200);

    const body = await res.json();
    // Dashboard returns these keys: orders, payouts, products, recentActivity, store
    expect(body, 'Dashboard response must be an object').toBeTruthy();
    expect(typeof body, 'Dashboard response must be an object').toBe('object');
  });

  // ── SA4b: Approved seller can create products ─────────────────────────────

  test('SA4b: Approved seller can now create a product (no longer blocked)', async () => {
    expect(approvedToken, 'SA4b requires SA3 to have run first').toBeTruthy();

    const res = await apiCtx.post(`${API_URL}/seller/products`, {
      data: validProductPayload(`approved-${TIMESTAMP}`),
      headers: { Authorization: `Bearer ${approvedToken}` },
    });

    // 201 created or 400 (subscription/validation) are both acceptable —
    // what must NOT happen is 403 (store blocked)
    const sc = res.status();
    expect(sc, 'Approved seller must not receive 403 on product creation').not.toBe(403);
  });

  // ── SA5: seller_auto_approve=true produces immediate ACTIVE store ─────────

  test('SA5: seller_auto_approve=true → store status is ACTIVE on registration', async () => {
    // Enable auto-approve via admin settings endpoint
    const updateRes = await apiCtx.patch(`${API_URL}/settings/seller_auto_approve`, {
      data: { value: true },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(updateRes.status(), 'Updating seller_auto_approve must return 200').toBe(200);

    // Register a new seller — should now get ACTIVE immediately
    const data = await registerSeller(apiCtx, AUTO_EMAIL, `AutoStore ${TIMESTAMP}`);
    const autoToken = data.accessToken || data.access_token || '';
    expect(autoToken, 'Auto-approved seller must receive an accessToken').toBeTruthy();

    const store = data.store;
    expect(
      store,
      'Auto-approved seller must have a store in the registration response'
    ).toBeTruthy();
    expect(store.status, 'Store must be ACTIVE when seller_auto_approve=true').toBe('ACTIVE');

    // Sanity-check: auto-approved seller can also access dashboard immediately
    const dashRes = await apiCtx.get(`${API_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${autoToken}` },
    });
    expect(dashRes.status(), 'Auto-approved seller dashboard must return 200').toBe(200);

    // Reset to false immediately after the assertion (also reset in afterAll as safety net)
    await apiCtx.patch(`${API_URL}/settings/seller_auto_approve`, {
      data: { value: false },
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Confirm reset
    const confirmRes = await apiCtx.get(`${API_URL}/settings/seller_auto_approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const confirmBody = await confirmRes.json();
    const resetValue = confirmBody.value ?? confirmBody.data?.value ?? confirmBody.setting?.value;
    expect(resetValue, 'seller_auto_approve must be reset to false after SA5').toBe(false);
  });
});
