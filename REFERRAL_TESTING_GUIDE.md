# Referral System - End-to-End Testing Guide

## ✅ Integration Verification Status

**Last Verified:** 2026-03-29
**Status:** ✅ All systems operational
**TypeScript Errors:** 0
**Build Time:** 119ms (Full Turbo)

---

## Pre-Testing Checklist

### 1. Environment Setup

```bash
# Ensure all dependencies are installed
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate deploy

# Seed referral settings (if not already seeded)
pnpm prisma:seed
```

### 2. Start Services

```bash
# Terminal 1: Start backend
cd apps/api
pnpm dev
# Backend should be running on http://localhost:4000

# Terminal 2: Start frontend
cd apps/web
pnpm dev
# Frontend should be running on http://localhost:3000
```

### 3. Verify Services

```bash
# Check backend health
curl http://localhost:4000/api/v1/health

# Check frontend
curl http://localhost:3000
```

---

## Test Scenarios

### Scenario 1: User Registration with Referral Code

**Objective:** Verify new users can register with a referral code

**Steps:**

1. Open browser to `http://localhost:3000/auth/register?ref=TESTCODE123`
2. **Expected:** Blue banner appears: "Referral code applied: TESTCODE123"
3. Fill in registration form:
   - Email: testuser@example.com
   - Password: TestPassword123!
   - First Name: Test
   - Last Name: User
   - Account Type: BUYER
4. Click "Create Account"
5. **Expected:** Registration succeeds, user is logged in

**Backend Verification:**

```sql
-- Check if referral was created
SELECT * FROM referrals
WHERE "referredId" = (SELECT id FROM "User" WHERE email = 'testuser@example.com');

-- Check if user has referredById set
SELECT email, "referredById" FROM "User"
WHERE email = 'testuser@example.com';
```

---

### Scenario 2: Generate Referral Code

**Objective:** Verify users can generate their own referral code

**Prerequisites:** User must be logged in

**Steps:**

1. Login as a user
2. Navigate to `http://localhost:3000/dashboard/buyer`
3. Scroll to "Referral Program" section
4. **Expected:** See "You don't have a referral code yet" message
5. Click "Generate Referral Code"
6. **Expected:** 8-character code appears (e.g., "ABCD1234")
7. **Expected:** Copy and WhatsApp share buttons appear

**Backend Verification:**

```sql
-- Check if code was created
SELECT * FROM referral_codes
WHERE "userId" = 'YOUR_USER_ID';
```

**API Test:**

```bash
# Get JWT token from browser DevTools > Application > Cookies
TOKEN="your_jwt_token"

curl -X POST http://localhost:4000/api/v1/referral/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "code": "ABCD1234",
#   "shareUrl": "http://localhost:3000/auth/register?ref=ABCD1234"
# }
```

---

### Scenario 3: Copy Referral Link

**Objective:** Verify copy-to-clipboard functionality

**Prerequisites:** User has a referral code

**Steps:**

1. Navigate to dashboard with referral code visible
2. Click "Copy Link" button
3. **Expected:** Button shows checkmark briefly
4. Paste clipboard contents
5. **Expected:** URL is `http://localhost:3000/auth/register?ref=YOUR_CODE`

---

### Scenario 4: WhatsApp Share

**Objective:** Verify WhatsApp sharing

**Prerequisites:** User has a referral code

**Steps:**

1. Click "WhatsApp" button
2. **Expected:** New tab/window opens with WhatsApp Web
3. **Expected:** Message is pre-filled:

   ```
   Join NextPik and get $10.00 off your first order! Use my referral code: ABCD1234

   http://localhost:3000/auth/register?ref=ABCD1234
   ```

---

### Scenario 5: Buyer Qualification (First Order)

**Objective:** Verify buyer referral reward is granted after first order

**Prerequisites:**

- User A has referral code: REFER123
- User B registered with REFER123
- User B has never placed an order

**Steps:**

1. Login as User B
2. Add products to cart (total ≥ $25)
3. Complete checkout and payment
4. **Expected:** Order status becomes PAID/CONFIRMED
5. Wait 2-3 seconds for background job

**Backend Verification:**

```sql
-- Check if referral was qualified
SELECT status, "rewardAmount", "qualifiedAt", "paidAt"
FROM referrals
WHERE "referredId" = 'USER_B_ID';
-- Expected: status = 'PAID', paidAt is set

-- Check if User A received store credit
SELECT email, "storeCredit", "totalReferrals"
FROM "User"
WHERE id = 'USER_A_ID';
-- Expected: storeCredit increased by $10.00, totalReferrals = 1
```

**API Test:**

```bash
# Check User A's referral summary
curl -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:4000/api/v1/referral/summary

# Expected response includes:
# {
#   "paid": {
#     "count": 1,
#     "amount": 10.00
#   },
#   "storeCredit": 10.00,
#   "totalReferrals": 1
# }
```

---

### Scenario 6: Seller Qualification (First Product)

**Objective:** Verify seller referral reward after first product creation

**Prerequisites:**

- User A has referral code: REFER456
- User C registered as SELLER with REFER456
- User C has never created a product

**Steps:**

1. Login as User C (seller)
2. Navigate to `/seller/products/new`
3. Create a new product (fill all required fields)
4. Submit product creation
5. **Expected:** Product is created successfully
6. Wait 2-3 seconds for background job

**Backend Verification:**

```sql
-- Check if referral was qualified
SELECT status, "rewardAmount", "qualifiedAt", "paidAt"
FROM referrals
WHERE "referredId" = 'USER_C_ID' AND "referredUserRole" = 'SELLER';
-- Expected: status = 'PAID', paidAt is set

-- Check if User A received store credit
SELECT email, "storeCredit", "totalReferrals"
FROM "User"
WHERE id = 'USER_A_ID';
-- Expected: storeCredit increased by $50.00, totalReferrals = 2
```

---

### Scenario 7: Referral Dashboard Stats

**Objective:** Verify user can see their referral earnings

**Prerequisites:** User has made some referrals

**Steps:**

1. Login as user with referrals
2. Navigate to `/dashboard/buyer`
3. Scroll to "Referral Program" section
4. **Expected:** See three stat cards:
   - **Pending**: Yellow card, shows potential earnings
   - **Qualified**: Green card, shows qualified amount
   - **Paid**: Blue card, shows earned rewards
5. **Expected:** "Available Store Credit" shows total balance
6. **Expected:** Stats match backend data

**API Test:**

```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/v1/referral/summary
```

---

### Scenario 8: Admin Dashboard

**Objective:** Verify admin can view all referrals

**Prerequisites:** Login as ADMIN or SUPER_ADMIN

**Steps:**

1. Navigate to `/admin/referrals`
2. **Expected:** See dashboard with:
   - 4 stat cards (Total Referrals, Total Rewards, Buyers, Sellers)
   - Status breakdown (5 statuses)
   - Filter dropdowns (Status, Role)
   - Paginated table with referrals
3. Test filters:
   - Select "Status: Paid" → Table updates
   - Select "Role: BUYER" → Table filters to buyers only
   - Click "Clear Filters" → Resets to all
4. Test pagination:
   - Click "Next" → Goes to page 2
   - Click page number → Jumps to that page

**API Test:**

```bash
# Get admin statistics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:4000/api/v1/referral/admin/statistics

# Get all referrals (paginated)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:4000/api/v1/referral/admin/all?page=1&limit=20"

# Get filtered referrals
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:4000/api/v1/referral/admin/all?status=PAID&role=BUYER"
```

---

### Scenario 9: Leaderboard

**Objective:** Verify public leaderboard shows top referrers

**Steps:**

1. Navigate to `/dashboard/buyer` (as any user)
2. Look for leaderboard section (if implemented in UI)
3. **Expected:** See top 10 referrers with anonymized emails

**API Test:**

```bash
curl http://localhost:4000/api/v1/referral/leaderboard?limit=10

# Expected response:
# {
#   "success": true,
#   "data": [
#     {
#       "rank": 1,
#       "name": "John D.",
#       "email": "joh***@***",
#       "totalReferrals": 15,
#       "code": "ABCD1234"
#     }
#   ]
# }
```

---

### Scenario 10: Validation Edge Cases

**Objective:** Verify system handles edge cases correctly

**Test Cases:**

#### A. Invalid Referral Code

```bash
curl http://localhost:4000/api/v1/referral/validate/INVALID999

# Expected: { "success": true, "valid": false }
```

#### B. Expired Referral Code

1. Create referral code
2. Update database to set expiration in past:
   ```sql
   UPDATE referral_codes
   SET "expiresAt" = NOW() - INTERVAL '1 day'
   WHERE code = 'TESTCODE';
   ```
3. Try to use code
4. **Expected:** Code validation fails

#### C. Self-Referral Prevention

1. User A has code: REF123
2. User A tries to register new account with REF123
3. **Expected:** Referral is created but never qualifies (silent fail)

#### D. Second Order (Should Not Qualify)

1. User B already used referral and placed first order
2. User B places second order
3. **Expected:** No new referral reward granted

#### E. Minimum Order Value

1. User places order with total < $25
2. **Expected:** Referral stays PENDING, not qualified

---

## API Endpoint Testing Checklist

### Public Endpoints (No Auth)

- [ ] `GET /api/v1/referral/settings` - Returns public settings
- [ ] `GET /api/v1/referral/validate/:code` - Validates referral code

### User Endpoints (Requires Auth)

- [ ] `POST /api/v1/referral/generate` - Generates referral code
- [ ] `GET /api/v1/referral/summary` - Returns user summary
- [ ] `GET /api/v1/referral/history` - Returns paginated history
- [ ] `GET /api/v1/referral/leaderboard` - Returns top referrers

### Admin Endpoints (Requires ADMIN/SUPER_ADMIN)

- [ ] `GET /api/v1/referral/admin/all` - Returns all referrals
- [ ] `GET /api/v1/referral/admin/statistics` - Returns statistics
- [ ] `GET /api/v1/referral/admin/top-referrers` - Returns full leaderboard
- [ ] `GET /api/v1/referral/admin/settings` - Returns all settings
- [ ] `POST /api/v1/referral/admin/grant-reward/:id` - Manual reward grant

---

## Database Verification Queries

```sql
-- 1. Check all referral codes
SELECT u.email, rc.code, rc."isActive", rc."usageCount", rc."createdAt"
FROM referral_codes rc
JOIN "User" u ON u.id = rc."userId"
ORDER BY rc."createdAt" DESC;

-- 2. Check all referrals
SELECT
  r.status,
  r."referredUserRole",
  r."rewardAmount",
  referrer.email as referrer_email,
  referred.email as referred_email,
  r."createdAt",
  r."qualifiedAt",
  r."paidAt"
FROM referrals r
JOIN "User" referrer ON referrer.id = r."referrerId"
JOIN "User" referred ON referred.id = r."referredId"
ORDER BY r."createdAt" DESC;

-- 3. Check store credit balances
SELECT email, "storeCredit", "totalReferrals", role
FROM "User"
WHERE "storeCredit" > 0
ORDER BY "storeCredit" DESC;

-- 4. Referral statistics
SELECT
  status,
  "referredUserRole",
  COUNT(*) as count,
  SUM("rewardAmount") as total_rewards
FROM referrals
GROUP BY status, "referredUserRole"
ORDER BY status, "referredUserRole";

-- 5. Find pending referrals waiting for first order
SELECT
  r.id,
  referred.email as user_email,
  r."createdAt",
  EXTRACT(DAY FROM NOW() - r."createdAt") as days_pending,
  (SELECT COUNT(*) FROM "Order" WHERE "userId" = r."referredId" AND "paymentStatus" = 'PAID') as order_count
FROM referrals r
JOIN "User" referred ON referred.id = r."referredId"
WHERE r.status = 'PENDING' AND r."referredUserRole" = 'BUYER'
ORDER BY r."createdAt" DESC;
```

---

## Common Issues & Solutions

### Issue 1: Referral Not Qualifying After Order

**Symptoms:** User placed order but referral still PENDING

**Debug Steps:**

1. Check order payment status:
   ```sql
   SELECT id, "orderNumber", "paymentStatus", status, total
   FROM "Order"
   WHERE "userId" = 'USER_ID';
   ```
2. Check backend logs for errors:
   ```bash
   # Look for: "Referral buyer qualification check failed"
   grep "referral" apps/api/logs/*.log
   ```
3. Manually trigger qualification (if needed):
   ```bash
   curl -X POST http://localhost:4000/api/v1/referral/admin/grant-reward/REFERRAL_ID \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

### Issue 2: Code Generation Fails

**Symptoms:** "Generate Referral Code" button doesn't work

**Debug Steps:**

1. Check browser console for errors
2. Verify JWT token is valid:
   ```bash
   # Decode token
   echo "JWT_TOKEN" | cut -d '.' -f2 | base64 -d | jq
   ```
3. Check backend logs
4. Test API directly:
   ```bash
   curl -v -X POST http://localhost:4000/api/v1/referral/generate \
     -H "Authorization: Bearer TOKEN"
   ```

### Issue 3: Frontend Not Showing Data

**Symptoms:** Dashboard shows loading spinner indefinitely

**Debug Steps:**

1. Open browser DevTools > Network tab
2. Check if API calls are being made
3. Check if API returns valid data
4. Verify SWR cache:
   ```javascript
   // In browser console
   localStorage.getItem('swr-cache');
   ```
5. Clear cache and reload:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

## Performance Testing

### Load Test: Code Generation

```bash
# Generate 100 codes concurrently
for i in {1..100}; do
  curl -X POST http://localhost:4000/api/v1/referral/generate \
    -H "Authorization: Bearer TOKEN" &
done
wait

# Check for duplicates
SELECT code, COUNT(*) as count
FROM referral_codes
GROUP BY code
HAVING COUNT(*) > 1;
# Expected: No results (all codes unique)
```

### Load Test: Summary Endpoint

```bash
# 1000 requests
ab -n 1000 -c 10 \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/v1/referral/summary
```

---

## Success Criteria

### ✅ All Tests Pass When:

1. Users can register with referral codes
2. Referral codes are auto-generated on registration
3. Users can generate and share codes
4. Copy link and WhatsApp share work
5. Buyer referrals qualify after first order ($25+)
6. Seller referrals qualify after first product
7. Store credit is correctly updated
8. Dashboard shows accurate stats
9. Admin can view all referrals with filters
10. All API endpoints return correct data
11. TypeScript compiles with 0 errors
12. No console errors in browser
13. Database constraints are enforced
14. Edge cases are handled gracefully

---

## Automated Test Command

```bash
# Run comprehensive verification
./verify-referral-integration.sh

# Run end-to-end tests (requires running servers)
./test-referral-system.sh
```

---

## Support

If you encounter issues:

1. Check this guide for solutions
2. Review backend logs: `apps/api/logs/`
3. Check browser console for frontend errors
4. Verify database migrations are applied
5. Ensure all environment variables are set
6. Run `pnpm type-check` to catch TypeScript errors

**Version:** v2.11.0
**Last Updated:** 2026-03-29
**Status:** Production Ready ✅
