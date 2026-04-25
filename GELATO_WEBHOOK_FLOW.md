# Gelato Webhook Flow

## 🔄 How Webhooks Work

```
┌─────────────────────────────────────────────────────────────────┐
│                    GELATO PRINT-ON-DEMAND                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Event Occurs
                              │    (Order status changes, etc.)
                              ▼
                    ┌──────────────────┐
                    │  Gelato Webhook  │
                    │     Service      │
                    └──────────────────┘
                              │
                              │ 2. HTTP POST Request
                              │    Headers:
                              │      - x-webhook-secret: <secret>
                              │    Body:
                              │      - event, id, data
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NEXTPIK API                             │
│  Endpoint: /api/v1/webhooks/gelato                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Verify Secret
                              ▼
                    ┌──────────────────┐
                    │ GelatoWebhook    │
                    │   Controller     │
                    └──────────────────┘
                              │
                              │ 4. Validate & Process
                              ▼
                    ┌──────────────────┐
                    │  GelatoOrders    │
                    │    Service       │
                    └──────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Update   │  │  Create  │  │ Trigger  │
        │ POD      │  │ Timeline │  │ Escrow   │
        │ Status   │  │  Entry   │  │ Release  │
        └──────────┘  └──────────┘  └──────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    Database      │
                    │  - GelatoPod     │
                    │    Order         │
                    │  - Order         │
                    │  - Escrow        │
                    │  - Timeline      │
                    └──────────────────┘
```

## 📊 Event Processing Flow

### 1. Order Status Updated

```
Gelato Event: order_status_updated
    ├─ status: "shipped"
    └─ data.id: gelato_order_123

NextPik Processing:
    ├─ Find GelatoPodOrder by gelatoOrderId
    ├─ Update status: SHIPPED
    ├─ Set shippedAt: now()
    ├─ Update main Order status: SHIPPED
    └─ Create OrderTimeline entry
```

### 2. Tracking Code Updated

```
Gelato Event: order_item_tracking_code_updated
    ├─ trackingCode: "1234567890"
    ├─ trackingUrl: "https://..."
    └─ carrier: "DHL"

NextPik Processing:
    ├─ Update GelatoPodOrder:
    │   ├─ trackingNumber
    │   ├─ trackingUrl
    │   └─ carrier
    ├─ Set status: SHIPPED
    └─ Create OrderTimeline with tracking info
```

### 3. Order Delivered

```
Gelato Event: order_status_updated
    └─ status: "delivered"

NextPik Processing:
    ├─ Update GelatoPodOrder status: DELIVERED
    ├─ Check if all items delivered
    │   ├─ YES → Update Order status: DELIVERED
    │   └─ Create OrderTimeline
    └─ Trigger Escrow Release:
        ├─ Set status: PENDING_RELEASE
        ├─ Set autoReleaseAt: +7 days
        └─ Create DeliveryConfirmation
```

## 🔐 Security Flow

```
1. Gelato sends request
   └─ Header: x-webhook-secret: <secret>

2. NextPik receives request
   └─ Extract header value

3. Verify using timing-safe comparison
   ├─ crypto.timingSafeEqual(received, configured)
   │
   ├─ MATCH ✅
   │   └─ Process event
   │
   └─ NO MATCH ❌
       └─ Return 401 Unauthorized
```

## 🗄️ Database Updates

### Tables Modified by Webhooks

```
GelatoWebhookEvent (always)
    ├─ Store raw event payload
    ├─ Track processing status
    └─ Link to POD order

GelatoPodOrder (status updates)
    ├─ status
    ├─ productionStatus
    ├─ trackingNumber
    ├─ trackingUrl
    ├─ carrier
    ├─ shippedAt
    └─ deliveredAt

Order (on shipped/delivered)
    └─ status

OrderTimeline (on shipped/delivered)
    ├─ status
    ├─ title
    ├─ description
    └─ metadata (tracking info)

EscrowTransaction (on delivered)
    ├─ status → PENDING_RELEASE
    ├─ deliveryConfirmed → true
    ├─ deliveryConfirmedAt
    └─ autoReleaseAt

DeliveryConfirmation (on delivered)
    ├─ confirmedBy: 'GELATO_WEBHOOK'
    ├─ confirmationType: COURIER_CONFIRMED
    └─ actualDeliveryDate
```

## ⚡ Webhook Event Deduplication

```
Incoming Event
    └─ Extract eventId

Check Database
    ├─ Event exists with status PROCESSED?
    │   └─ YES → Skip (return "duplicate")
    │
    └─ NO or status != PROCESSED
        └─ Proceed with processing
```

## 🔄 Status State Machine

```
GelatoPodOrder Status Flow:

PENDING
    ↓
SUBMITTED (created/passed)
    ↓
IN_PRODUCTION (in_production)
    ↓
PRODUCED (printed)
    ↓
SHIPPED (shipped)
    ↓
DELIVERED (delivered)

Alternative paths:
SUBMITTED → CANCELLED (cancelled)
SUBMITTED → FAILED (failed)
```

## 📱 Real-World Example

### Scenario: Customer Orders Custom T-Shirt

```
1. Customer places order on NextPik
   └─ OrderItem created with POD product

2. Admin/Seller submits to Gelato
   └─ GelatoPodOrder created (status: SUBMITTED)

3. Gelato webhook: "in_production"
   └─ GelatoPodOrder → IN_PRODUCTION

4. Gelato webhook: "printed"
   └─ GelatoPodOrder → PRODUCED

5. Gelato webhook: "shipped" + tracking
   ├─ GelatoPodOrder → SHIPPED
   ├─ Order → SHIPPED
   ├─ OrderTimeline created
   └─ Tracking info saved

6. Gelato webhook: "delivered"
   ├─ GelatoPodOrder → DELIVERED
   ├─ Order → DELIVERED
   ├─ EscrowTransaction → PENDING_RELEASE
   │   └─ Auto-release in 7 days
   └─ Customer receives product ✅
```

---

## 🧪 Testing Flow

```bash
# 1. Start backend
pnpm dev:api

# 2. Start ngrok tunnel (for local testing)
ngrok http 4000
# Copy HTTPS URL: https://abc123.ngrok.io

# 3. Configure in Gelato
URL: https://abc123.ngrok.io/api/v1/webhooks/gelato
Header: x-webhook-secret: <secret>

# 4. Test webhook
./test-gelato-webhook.sh

# 5. Or trigger from Gelato dashboard
Click "Test Webhook" button

# 6. Check logs
Backend logs: "Received Gelato webhook: ..."

# 7. Check database
pnpm prisma:studio
→ GelatoWebhookEvent table
```

---

## 🚨 Error Handling

### Event Not Found in Database

```
Webhook arrives for unknown order
    ├─ Create GelatoWebhookEvent (status: FAILED)
    ├─ Set errorMessage: "POD order not found"
    └─ Return { processed: false, reason: 'order_not_found' }
```

### Processing Error

```
Exception during event processing
    ├─ Update GelatoWebhookEvent (status: FAILED)
    ├─ Set errorMessage: exception.message
    ├─ Log error
    └─ Return { received: true, error: message }
```

### Duplicate Event

```
Event already processed
    ├─ Check: eventId exists AND status = PROCESSED
    ├─ Log: "Duplicate webhook event - skipping"
    └─ Return { processed: false, reason: 'duplicate' }
```

---

**See Also:**

- `GELATO_WEBHOOK_SETUP.md` - Full setup guide
- `GELATO_QUICK_START.md` - Quick checklist
- `apps/api/src/gelato/gelato-orders.service.ts` - Implementation
