# Gelato Webhook Setup Guide

## Overview

This guide covers how to configure webhooks from Gelato Print-on-Demand to NextPik for real-time order tracking and status updates.

---

## Prerequisites

- ✅ Gelato account with API access
- ✅ Gelato API Key configured in `.env`
- ✅ Gelato Store created
- ✅ Backend server running and accessible

---

## Step 1: Get Your Store ID

1. Log in to [Gelato Dashboard](https://dashboard.gelato.com)
2. Navigate to **Stores** section
3. Select your store
4. Copy the **Store ID** from the URL or store details (e.g., `store_abc123xyz`)

---

## Step 2: Update Environment Variables

Update `apps/api/.env` with your Store ID:

```bash
GELATO_STORE_ID=your_store_id_here
```

The webhook secret has already been generated:

```bash
GELATO_WEBHOOK_SECRET=8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529
```

---

## Step 3: Configure Webhook in Gelato

### Development Setup

1. Go to **Developer** → **Webhooks** in Gelato Dashboard
2. Click **Create Webhook**
3. Fill in the form:

#### **Webhook URL:**

```
http://localhost:4000/api/v1/webhooks/gelato
```

**Note:** For local development, you may need to use a tunnel service like:

- **ngrok:** `ngrok http 4000` → Use the provided HTTPS URL
- **Cloudflare Tunnel:** `cloudflared tunnel --url localhost:4000`
- **localtunnel:** `lt --port 4000`

Example with ngrok:

```bash
ngrok http 4000
# Use URL: https://abc123.ngrok.io/api/v1/webhooks/gelato
```

#### **Custom Header (Authentication):**

Add a custom header for webhook verification:

- **Header Name:** `x-webhook-secret`
- **Header Value:** `8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529`

#### **Events to Subscribe:**

**Required Events (Order Tracking):**

- ✅ `order_status_updated` - Main order status changes
- ✅ `order_item_status_updated` - Individual item updates
- ✅ `order_item_tracking_code_updated` - Tracking info
- ✅ `order_delivery_estimate_updated` - Delivery estimates

**Optional Events (Product Management):**

- ⬜ `store_product_template_created`
- ⬜ `store_product_template_updated`
- ⬜ `store_product_template_deleted`

### Production Setup

For production, use your production domain:

```
https://your-domain.com/api/v1/webhooks/gelato
```

**Important:** Ensure your production server:

- Has HTTPS enabled (required by most webhook providers)
- Is publicly accessible
- Has the same webhook secret configured

---

## Step 4: Test the Webhook

### Option 1: Use Gelato's Test Feature

Most webhook dashboards have a "Test" or "Send Test Event" button. Click it to verify your endpoint is working.

### Option 2: Run the Test Script

We've created a test script for you:

```bash
./test-gelato-webhook.sh
```

This will:

1. Test `order_status_updated` event
2. Test `order_item_tracking_code_updated` event
3. Test authentication (should reject invalid secret)

### Option 3: Manual cURL Test

```bash
curl -X POST "http://localhost:4000/api/v1/webhooks/gelato" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: 8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529" \
  -d '{
    "event": "order_status_updated",
    "id": "evt_test_001",
    "createdAt": "2026-02-20T12:00:00Z",
    "data": {
      "id": "gelato_order_123",
      "status": "shipped"
    }
  }'
```

Expected response:

```json
{
  "received": true,
  "processed": true,
  "podOrderId": "..."
}
```

---

## Webhook Event Reference

### Supported Events

| Event                              | Purpose                   | NextPik Action                                                        |
| ---------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `order_status_updated`             | Order status changed      | Updates POD order status, main order status, creates timeline entries |
| `order_item_status_updated`        | Item status changed       | Updates individual item status                                        |
| `order_item_tracking_code_updated` | Tracking info added       | Stores tracking number, URL, carrier                                  |
| `order_delivery_estimate_updated`  | Delivery estimate updated | Logged (no status change)                                             |

### Status Mappings

| Gelato Status       | NextPik POD Status | Main Order Status                    |
| ------------------- | ------------------ | ------------------------------------ |
| `created`, `passed` | `SUBMITTED`        | No change                            |
| `in_production`     | `IN_PRODUCTION`    | No change                            |
| `printed`           | `PRODUCED`         | No change                            |
| `shipped`           | `SHIPPED`          | `SHIPPED`                            |
| `delivered`         | `DELIVERED`        | `DELIVERED` (if all items delivered) |
| `cancelled`         | `CANCELLED`        | No change                            |
| `failed`            | `FAILED`           | No change                            |

### Payload Examples

#### Order Status Updated

```json
{
  "event": "order_status_updated",
  "id": "evt_abc123",
  "createdAt": "2026-02-20T12:00:00Z",
  "data": {
    "id": "gelato_order_456",
    "status": "shipped",
    "comment": "Order shipped via DHL"
  }
}
```

#### Tracking Code Updated

```json
{
  "event": "order_item_tracking_code_updated",
  "id": "evt_xyz789",
  "createdAt": "2026-02-20T12:00:00Z",
  "data": {
    "orderId": "gelato_order_456",
    "itemId": "item_123",
    "trackingCode": "1234567890",
    "trackingUrl": "https://track.dhl.com/1234567890",
    "carrier": "DHL"
  }
}
```

---

## Webhook Security

### How It Works

1. Gelato sends the webhook secret in the `x-webhook-secret` header
2. NextPik verifies it matches the configured `GELATO_WEBHOOK_SECRET`
3. Uses timing-safe comparison to prevent timing attacks
4. Rejects requests with invalid or missing secrets (401 Unauthorized)

### Code Reference

See `apps/api/src/gelato/gelato.service.ts`:

```typescript
verifyWebhookToken(token: string): boolean {
  if (!this.webhookSecret) {
    this.logger.warn('Webhook secret not configured - skipping verification');
    return true;
  }
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(this.webhookSecret)
    );
  } catch {
    return false;
  }
}
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check URL is accessible:**

   ```bash
   curl http://localhost:4000/api/v1/webhooks/gelato
   ```

2. **For local development, use a tunnel:**

   ```bash
   ngrok http 4000
   # Update Gelato webhook URL with ngrok URL
   ```

3. **Check backend logs:**
   ```bash
   # Logs show: "Received Gelato webhook: order_status_updated"
   ```

### 401 Unauthorized Errors

- Verify `GELATO_WEBHOOK_SECRET` in `.env` matches the header value in Gelato
- Ensure no extra spaces or quotes in the secret
- Restart backend after updating `.env`

### Events Not Processing

1. **Check webhook event logs in database:**

   ```sql
   SELECT * FROM "GelatoWebhookEvent" ORDER BY "createdAt" DESC LIMIT 10;
   ```

2. **Check for error messages:**

   ```sql
   SELECT * FROM "GelatoWebhookEvent" WHERE status = 'FAILED';
   ```

3. **Verify POD order exists:**
   ```sql
   SELECT * FROM "GelatoPodOrder" WHERE "gelatoOrderId" = 'gelato_order_123';
   ```

### Duplicate Events

Don't worry! Events are automatically deduplicated by `eventId`. Duplicate events are logged but not processed twice.

---

## Database Tables

### GelatoWebhookEvent

Stores all received webhook events:

```typescript
{
  id: string
  eventId: string          // Gelato's event ID (unique)
  eventType: string        // e.g., "order_status_updated"
  podOrderId?: string      // Linked POD order
  data: JSON               // Full webhook payload
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  errorMessage?: string
  processedAt?: Date
  createdAt: Date
}
```

### GelatoPodOrder

POD order tracking:

```typescript
{
  id: string
  orderId: string              // Main NextPik order
  orderItemId: string
  gelatoOrderId: string
  status: GelatoPodStatus      // SUBMITTED, IN_PRODUCTION, etc.
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  shippedAt?: Date
  deliveredAt?: Date
  webhookEvents: GelatoWebhookEvent[]  // All related events
}
```

---

## Monitoring

### View Webhook Activity

Check recent webhook events:

```bash
# In Prisma Studio (http://localhost:5555)
# Navigate to GelatoWebhookEvent table
# Filter by status or podOrderId
```

### API Endpoints

```
GET /gelato/pod-orders/:id          # Get POD order with webhook events
GET /gelato/pod-orders              # List all POD orders
POST /gelato/webhook-status         # Check webhook configuration
```

---

## Next Steps

1. ✅ Configure webhook URL in Gelato Dashboard
2. ✅ Test webhook with test script
3. ✅ Place a test order with POD product
4. ✅ Monitor webhook events in database
5. ✅ Verify status updates in NextPik order dashboard

---

## Support

For issues:

- Check backend logs: `pnpm dev:api`
- View webhook events in Prisma Studio
- Check Gelato dashboard webhook delivery logs
- Review `apps/api/src/gelato/gelato-orders.service.ts` for event handling logic

---

**Last Updated:** February 20, 2026
**Version:** 2.8.0 - Gelato Print-on-Demand Integration
