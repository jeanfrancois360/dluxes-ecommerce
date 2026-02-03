# Payment Capture System - Review & Testing Guide

## 📊 Implementation Status

### ✅ Completed Features

#### 1. Payment Capture Strategy System
**Location:** `packages/database/prisma/seed-settings.ts`

**Settings Added:**
- `payment_capture_strategy`: 'ON_DELIVERY_WITH_FALLBACK'
  - Options: IMMEDIATE, ON_DELIVERY, ON_DELIVERY_WITH_FALLBACK, MANUAL
- `payment_auto_capture_day`: 6
  - Auto-capture fallback on Day 6 (before Stripe's 7-day authorization expiry)

#### 2. Payment Monitor Service (Background Job)
**Location:** `apps/api/src/payment/payment-monitor.service.ts`

**Features:**
- ✅ Cron job runs every 6 hours
- ✅ Finds uncaptured payments approaching expiry (Day 5+)
- ✅ Auto-captures payments on Day 6
- ✅ Comprehensive error handling and logging
- ✅ Dashboard statistics method

**Methods:**
```typescript
@Cron(CronExpression.EVERY_6_HOURS)
monitorUncapturedPayments() // Main monitoring job

getOrdersApproachingExpiry() // For admin dashboard
getUncapturedPaymentStats()  // Overview statistics
```

#### 3. Payment Capture Logic
**Location:** `apps/api/src/payment/payment.service.ts`

**New Methods:**
```typescript
capturePaymentWithStrategy(
  orderId: string,
  trigger: 'DELIVERY_CONFIRMED' | 'AUTO_FALLBACK' | 'MANUAL',
  userId?: string
): Promise<{ success: boolean; capturedAmount: number }>
```

**Features:**
- ✅ Checks if payment already captured (idempotent)
- ✅ Validates payment intent status
- ✅ Calls Stripe capture API
- ✅ Updates transaction metadata with capture timestamp and trigger
- ✅ Creates order timeline entry
- ✅ Comprehensive error handling

#### 4. Admin Monitoring Endpoints
**Location:** `apps/api/src/payment/payment.controller.ts`

**Endpoints:**

1. **Manual Capture**
   - `POST /payment/orders/:orderId/capture`
   - Guards: `JwtAuthGuard`, `RolesGuard`
   - Roles: `ADMIN`, `SUPER_ADMIN`
   - Purpose: Manually trigger payment capture

2. **Approaching Expiry Dashboard**
   - `GET /payment/monitoring/approaching-expiry`
   - Guards: `JwtAuthGuard`, `RolesGuard`
   - Roles: `ADMIN`, `SUPER_ADMIN`
   - Returns: Orders approaching 7-day expiry with:
     - `daysSincePaid`
     - `daysUntilExpiry`
     - `isUrgent` (1 day or less remaining)

3. **Statistics Overview**
   - `GET /payment/monitoring/stats`
   - Guards: `JwtAuthGuard`, `RolesGuard`
   - Roles: `ADMIN`, `SUPER_ADMIN`
   - Returns:
     - `totalUncaptured`: Total uncaptured payments
     - `approachingExpiry`: Count of orders in danger zone
     - `urgent`: Count of critical orders (1 day left)
     - `oldestOrder`: Most at-risk order

#### 5. Module Integration
**Location:** `apps/api/src/payment/payment.module.ts`

**Updates:**
- ✅ Added `PaymentMonitorService` to providers
- ✅ Exported for use in other modules
- ✅ Proper dependency injection

#### 6. Dependencies
- ✅ PDFKit installed (`pdfkit` + `@types/pdfkit`)
- ✅ @nestjs/schedule already available

---

## 🔧 Technical Details

### Payment Intent Flow

```
1. ORDER CREATED
   └─> Payment Intent created with capture_method: 'manual'
   └─> Status: 'requires_capture'

2. PAYMENT AUTHORIZED
   └─> Webhook: payment_intent.amount_capturable_updated
   └─> Order: paymentStatus = 'PAID'
   └─> Transaction: status = 'SUCCEEDED'
   └─> Funds NOT captured yet (held for 7 days max)

3. CAPTURE TRIGGERS (3 options)

   A. DELIVERY_CONFIRMED (Preferred)
   └─> Order delivered
   └─> capturePaymentWithStrategy(orderId, 'DELIVERY_CONFIRMED')
   └─> Funds captured immediately

   B. AUTO_FALLBACK (Safety Net)
   └─> Day 6 reached (payment still uncaptured)
   └─> Cron job triggers auto-capture
   └─> Prevents authorization expiry

   C. MANUAL (Admin Override)
   └─> Admin clicks "Capture Payment" button
   └─> POST /payment/orders/:orderId/capture
   └─> Immediate capture

4. PAYMENT CAPTURED
   └─> Stripe API: paymentIntents.capture()
   └─> Transaction: status = 'CAPTURED'
   └─> Metadata: capturedAt, captureTrigger, capturedBy
   └─> OrderTimeline: "Payment Captured via [trigger]"
```

### Database Queries

**Finding Uncaptured Payments:**
```typescript
WHERE:
  - paymentStatus IN ['PAID', 'AUTHORIZED']
  - status NOT IN ['DELIVERED', 'CANCELLED', 'REFUNDED']
  - paidAt <= (NOW - autoCaptureDay days)
  - paymentTransactions HAS:
      - status IN ['SUCCEEDED', 'REQUIRES_ACTION']
      - metadata.capturedAt IS NULL
```

---

## 🧪 Testing Guide

### Prerequisites

1. **Stripe Test Mode**
   - Ensure `stripe_test_mode` setting is `true`
   - Use test API keys

2. **Seed Settings**
   ```bash
   cd packages/database
   pnpm prisma db seed
   ```
   This adds the new payment capture settings

3. **Start Services**
   ```bash
   pnpm dev:api   # Backend on port 4000
   pnpm dev:web   # Frontend on port 3000
   ```

### Test Scenarios

#### **Test 1: Manual Capture (Admin)**

**Objective:** Verify admin can manually capture authorized payments

**Steps:**
1. Create test order with Stripe (use test card: `4242 4242 4242 4242`)
2. Verify order status: `CONFIRMED`, paymentStatus: `PAID`
3. Check transaction status should be `SUCCEEDED` (not `CAPTURED`)
4. Login as ADMIN
5. Call admin endpoint:
   ```bash
   curl -X POST http://localhost:4000/api/v1/payment/orders/ORDER_ID/capture \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```
6. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "success": true,
       "capturedAmount": 100.00
     }
   }
   ```
7. Verify in database:
   - PaymentTransaction.status = 'CAPTURED'
   - PaymentTransaction.metadata.capturedAt exists
   - PaymentTransaction.metadata.captureTrigger = 'MANUAL'
   - OrderTimeline has "Payment Captured" entry

**Database Check:**
```sql
SELECT
  o.orderNumber,
  o.paymentStatus,
  pt.status as transactionStatus,
  pt.metadata
FROM orders o
JOIN payment_transactions pt ON pt.orderId = o.id
WHERE o.id = 'ORDER_ID';
```

---

#### **Test 2: Approaching Expiry Dashboard**

**Objective:** Verify admin can see orders approaching authorization expiry

**Steps:**
1. Create test orders with different paid dates:
   ```sql
   -- Simulate old orders (for testing)
   UPDATE orders
   SET paidAt = NOW() - INTERVAL '6 days'
   WHERE id = 'TEST_ORDER_1';

   UPDATE orders
   SET paidAt = NOW() - INTERVAL '5 days'
   WHERE id = 'TEST_ORDER_2';
   ```

2. Call monitoring endpoint:
   ```bash
   curl http://localhost:4000/api/v1/payment/monitoring/approaching-expiry \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```

3. Expected response:
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "ORDER_ID",
         "orderNumber": "LUX-1234567890",
         "total": "100.00",
         "currency": "USD",
         "paidAt": "2026-01-26T...",
         "daysSincePaid": 6,
         "daysUntilExpiry": 1,
         "isUrgent": true,
         "user": {
           "email": "customer@test.com",
           "firstName": "Test",
           "lastName": "User"
         }
       }
     ]
   }
   ```

---

#### **Test 3: Statistics Overview**

**Objective:** Verify payment statistics are accurate

**Steps:**
1. Call stats endpoint:
   ```bash
   curl http://localhost:4000/api/v1/payment/monitoring/stats \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```

2. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "totalUncaptured": 10,
       "approachingExpiry": 3,
       "urgent": 1,
       "oldestOrder": {
         "id": "...",
         "orderNumber": "LUX-...",
         "daysSincePaid": 6,
         "daysUntilExpiry": 1
       }
     }
   }
   ```

---

#### **Test 4: Auto-Capture Cron Job (Simulated)**

**Objective:** Verify cron job captures payments approaching expiry

**Manual Trigger (for testing):**
```typescript
// In NestJS app context or testing framework
const paymentMonitorService = app.get(PaymentMonitorService);
await paymentMonitorService.monitorUncapturedPayments();
```

**Or via direct service call:**
1. Create test order with `paidAt` = 6 days ago
2. Ensure payment is uncaptured
3. Trigger cron manually (or wait 6 hours in production)
4. Check logs:
   ```
   [PaymentMonitorService] Starting uncaptured payment monitoring...
   [PaymentMonitorService] Found 1 orders requiring auto-capture fallback
   [PaymentMonitorService] Auto-captured 100.00 USD for order LUX-123
   [PaymentMonitorService] Auto-capture completed: 1 succeeded, 0 failed
   ```
5. Verify in database:
   - Transaction status = 'CAPTURED'
   - Metadata.captureTrigger = 'AUTO_FALLBACK'

---

#### **Test 5: Idempotency (Double Capture Prevention)**

**Objective:** Verify same payment can't be captured twice

**Steps:**
1. Capture payment once (use Test 1)
2. Try to capture again:
   ```bash
   curl -X POST http://localhost:4000/api/v1/payment/orders/ORDER_ID/capture \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```
3. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "success": true,
       "capturedAmount": 100.00
     }
   }
   ```
4. Check logs:
   ```
   [PaymentService] Payment already captured: pi_ABC123
   ```
5. Verify: No duplicate captures in Stripe dashboard

---

### Error Scenarios

#### **Error 1: Payment Not Capturable**

**Test:**
```bash
# Try to capture a fully paid order (auto-captured)
curl -X POST http://localhost:4000/api/v1/payment/orders/PAID_ORDER_ID/capture
```

**Expected:**
```json
{
  "success": false,
  "message": "Payment cannot be captured. Status: succeeded"
}
```

---

#### **Error 2: No Payment Found**

**Test:**
```bash
# Try to capture order without payment
curl -X POST http://localhost:4000/api/v1/payment/orders/INVALID_ID/capture
```

**Expected:**
```json
{
  "success": false,
  "message": "No capturable payment found for order"
}
```

---

## 📈 Monitoring in Production

### Admin Dashboard Integration

**Recommended UI Components:**

1. **Alert Widget**
   ```
   ⚠️ Urgent: 3 payments expiring in 24 hours
   📊 Total Uncaptured: 42 orders ($12,450.00)
   ```

2. **Approaching Expiry Table**
   | Order # | Customer | Amount | Days Left | Action |
   |---------|----------|--------|-----------|--------|
   | LUX-123 | John Doe | $150 | 1 day | [Capture Now] |
   | LUX-124 | Jane Smith | $200 | 2 days | [Capture Now] |

3. **Auto-Capture Logs**
   ```
   Feb 1, 2026 02:00 - Auto-captured 5 orders ($1,250)
   Jan 31, 2026 20:00 - Auto-captured 3 orders ($780)
   Jan 31, 2026 14:00 - No orders requiring capture
   ```

### Stripe Dashboard Verification

1. Navigate to: https://dashboard.stripe.com/test/payments
2. Filter by: Status = "Requires capture"
3. Verify count matches `/payment/monitoring/stats` totalUncaptured
4. Check individual payment intents:
   - Authorization hold time remaining
   - Metadata includes orderId

---

## 🐛 Known Limitations

### 1. PaymentTransactionStatus Enum
- No `AUTHORIZED` status in current enum
- Using `SUCCEEDED` for authorized payments
- Using `REQUIRES_ACTION` for 3D Secure holds
- Consider adding `AUTHORIZED` in future migration

### 2. Delivery Confirmation Integration
- **Not yet implemented** in this phase
- Placeholder in plan for Day 3
- Will trigger `DELIVERY_CONFIRMED` capture

### 3. Cron Job Timing
- Runs every 6 hours
- Not real-time monitoring
- Max delay: 6 hours before auto-capture
- Consider adding webhook listener for `payment_intent.canceled` (authorization expired)

---

## 🔒 Security Considerations

### Authorization
- All admin endpoints protected by `JwtAuthGuard` + `RolesGuard`
- Only `ADMIN` and `SUPER_ADMIN` roles can access
- Capture actions logged with userId

### Stripe API Safety
- Capture is idempotent (safe to retry)
- Error handling prevents partial captures
- Webhook signature verification in place

### Data Integrity
- Transaction status updates within Prisma transactions
- Order timeline creates audit trail
- Metadata preserves capture trigger and timestamp

---

## 📝 Next Steps (Day 3)

**Remaining Tasks:**
1. ✅ Seed database with new settings
2. ⏳ Run database migration (currently pending)
3. ⏳ Implement delivery confirmation capture trigger
4. ⏳ Add idempotency keys for duplicate order prevention
5. ⏳ Implement seller-specific totals
6. ⏳ Generate invoice PDF with PDFKit
7. ⏳ Create invoice email template
8. ⏳ Update webhook to send invoices

---

## ✅ Code Quality Verification

- **TypeScript Compilation:** ✅ No errors
- **Import Paths:** ✅ Corrected (PrismaService, SettingsService)
- **Enum Values:** ✅ Fixed (AUTHORIZED → SUCCEEDED)
- **Type Safety:** ✅ Proper casting for Stripe types
- **Dependencies:** ✅ All installed (PDFKit, @nestjs/schedule)
- **Module Exports:** ✅ PaymentMonitorService properly exported

---

## 📚 References

- **Stripe Capture Guide:** https://stripe.com/docs/payments/capture-later
- **Stripe Authorization Hold:** Max 7 days for most cards
- **NestJS Cron:** https://docs.nestjs.com/techniques/task-scheduling
- **Project Plan:** `/Users/jeanfrancoismunyaneza/.claude/plans/distributed-yawning-pebble.md`

---

**Last Updated:** February 1, 2026
**Implementation Phase:** Day 1-2 Complete ✅
**Next Phase:** Day 3 - Delivery Integration & Order Management
