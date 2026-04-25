# EasyPost Shipping Integration

**Date:** March 18, 2026
**Version:** 2.9.0
**Status:** ✅ Production Ready

---

## Overview

EasyPost is integrated as the **primary shipping provider** for NextPik, providing:

- **Multi-carrier rate comparison** (USPS, UPS, FedEx, DHL, Canada Post, Australia Post)
- **Automated label generation** (PDF, PNG, ZPL, EPL2 formats)
- **Real-time package tracking** with webhook updates
- **Address verification** for accurate delivery
- **Return label generation** for customer returns
- **Label refund management** for unused labels

### How It Works

1. **Seller** selects an order ready to ship
2. Clicks **"Get Shipping Label"** on order details page
3. EasyPost fetches rates from all configured carriers
4. Seller chooses preferred rate (cheapest, fastest, or by carrier)
5. Label is purchased and stored in database
6. PDF label is available for download
7. Tracking updates received via webhooks
8. Order status auto-updates based on delivery progress

---

## Architecture

### Shipping Cascade (4-Tier Fallback)

```
Order Checkout
    ↓
1. EasyPost (TIER 1) ⭐ Primary
    ↓ (if disabled/error)
2. DHL Express API (TIER 2)
    ↓ (if not configured)
3. Shipping Zones (TIER 3) - Database rates
    ↓ (if no zones)
4. Manual Rates (TIER 4) - System settings
```

**Priority:** EasyPost is checked first when enabled (`easypost_enabled = true`)

### Backend Structure

```
apps/api/src/integrations/easypost/
├── dto/
│   ├── address.dto.ts          # Address validation
│   ├── parcel.dto.ts           # Package dimensions
│   ├── get-rates.dto.ts        # Rate request
│   ├── purchase-label.dto.ts  # Label purchase
│   └── customs-info.dto.ts     # International shipping
├── easypost.service.ts         # Core client management
├── easypost-rates.service.ts   # Rate comparison
├── easypost-shipment.service.ts # Label management
├── easypost-tracking.service.ts # Tracking updates
├── easypost-address.service.ts  # Address verification
├── easypost.controller.ts       # API endpoints
├── easypost-webhook.controller.ts # Webhook handler
└── easypost.module.ts          # NestJS module
```

### Frontend Components

```
apps/web/src/
├── components/
│   ├── seller/
│   │   └── easypost-label-button.tsx  # Label generation modal
│   └── settings/
│       └── easypost-settings.tsx      # Admin configuration
└── hooks/
    └── use-easypost-tracking.ts       # Tracking data hook
```

---

## Database Schema

### Tables Added (Migration: `20260315000000_add_easypost_integration`)

#### 1. EasyPostShipment

```prisma
model EasyPostShipment {
  id                  String   @id @default(cuid())
  orderId             String
  easypostShipmentId  String   @unique  // EasyPost shipment ID

  // Tracking
  trackingNumber      String?
  carrier             String?
  service             String?

  // Labels
  labelPdfUrl         String?
  labelPngUrl         String?
  labelZplUrl         String?
  labelEpl2Url        String?

  // Costs
  selectedRateId      String
  rateAmount          Float
  rateCurrency        String   @default("USD")

  // Status
  status              EasyPostShipmentStatus @default(PENDING)
  refundStatus        EasyPostRefundStatus?

  // Metadata
  fromAddress         Json
  toAddress           Json
  parcel              Json
  customsInfo         Json?

  // Delivery tracking
  estimatedDelivery   DateTime?
  actualDelivery      DateTime?

  // Relations
  order               Order    @relation(fields: [orderId], references: [id])
  trackingEvents      EasyPostTrackingEvent[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

#### 2. EasyPostTrackingEvent

```prisma
model EasyPostTrackingEvent {
  id                String   @id @default(cuid())
  shipmentId        String

  // Tracking data
  status            String
  statusDetail      String?
  message           String?
  city              String?
  state             String?
  country           String?
  zipCode           String?

  // Timestamps
  occurredAt        DateTime
  createdAt         DateTime @default(now())

  // Relations
  shipment          EasyPostShipment @relation(fields: [shipmentId], references: [id])
}
```

#### 3. EasyPostWebhookLog

```prisma
model EasyPostWebhookLog {
  id           String   @id @default(cuid())
  eventId      String   @unique  // Idempotency key
  eventType    String
  description  String
  result       String?
  payload      Json
  createdAt    DateTime @default(now())
}
```

### Enums

```prisma
enum EasyPostShipmentStatus {
  PENDING
  RATED
  PURCHASED
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  ERROR
  REFUNDED
}

enum EasyPostRefundStatus {
  SUBMITTED
  REFUNDED
  REJECTED
}
```

---

## System Settings

### EasyPost Configuration (7 settings)

```typescript
{
  easypost_enabled: true,                    // Enable/disable integration
  easypost_api_key: "EZTK...",               // Test or production API key
  easypost_test_mode: true,                  // Use test environment
  easypost_webhook_secret: "whsec_...",      // Webhook signature verification
  easypost_default_label_format: "PDF",      // PNG, ZPL, EPL2
  easypost_address_verification: true,       // Enable address validation
  easypost_default_carriers: ["USPS", "UPS", "FedEx"]  // Preferred carriers
}
```

### Origin Address Settings (3 settings)

```typescript
{
  origin_street1: "388 Townsend St",    // Warehouse address
  origin_city: "San Francisco",
  origin_state: "CA"
}
```

**Note:** Other origin fields use existing settings:

- `origin_postal_code`
- `origin_country`
- `origin_company_name`

---

## API Endpoints

### Shipping Rates

**POST** `/api/v1/easypost/rates`
Get all available shipping rates

```typescript
Request Body:
{
  fromAddress: {
    street1: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    name?: string
  },
  toAddress: { ... },
  parcel: {
    length: number,
    width: number,
    height: number,
    weight: number
  },
  customsInfo?: { ... }
}

Response:
{
  success: true,
  data: {
    easypostShipmentId: string,
    rates: [
      {
        id: string,
        carrier: "USPS",
        service: "Priority Mail",
        rate: "12.34",
        currency: "USD",
        deliveryDays: 2,
        deliveryDate: "2026-03-20",
        deliveryDateGuaranteed: false
      },
      ...
    ]
  }
}
```

**POST** `/api/v1/easypost/rates/lowest`
Get the lowest rate (optionally filtered by carrier/service)

```typescript
Query Params:
- carriers: string (comma-separated, e.g., "USPS,UPS")
- services: string (comma-separated, e.g., "Priority,Express")
```

---

### Label Management

**POST** `/api/v1/easypost/purchase`
Purchase a shipping label

```typescript
Request Body:
{
  orderId: string,
  sellerId: string,
  easypostShipmentId: string,
  rateId: string
}

Response:
{
  success: true,
  data: {
    id: string,  // Database shipment ID
    trackingNumber: string,
    carrier: string,
    service: string,
    labelPdfUrl: string,
    labelPngUrl: string,
    estimatedDelivery: string,
    status: "PURCHASED"
  }
}
```

**POST** `/api/v1/easypost/return-label`
Create a return label (from customer back to seller)

**POST** `/api/v1/easypost/refund/:shipmentId`
Refund an unused shipping label

**POST** `/api/v1/easypost/convert/:shipmentId`
Convert label format (PDF ↔ ZPL ↔ EPL2)

```typescript
Request Body:
{
  format: "PDF" | "ZPL" | "EPL2"
}
```

---

### Shipment Information

**GET** `/api/v1/easypost/shipment/:id`
Get shipment details by database ID

**GET** `/api/v1/easypost/order/:orderId/shipments`
Get all shipments for an order

---

### Tracking

**GET** `/api/v1/easypost/tracking/:shipmentId`
Get tracking information (combines DB + EasyPost API)

```typescript
Response:
{
  success: true,
  data: {
    trackingNumber: string,
    carrier: string,
    status: string,
    estimatedDelivery: string,
    publicUrl: string,
    events: [
      {
        status: "in_transit",
        statusDetail: "arrived_at_facility",
        message: "Package arrived at USPS facility",
        city: "Los Angeles",
        state: "CA",
        country: "US",
        occurredAt: "2026-03-18T10:30:00Z"
      },
      ...
    ]
  }
}
```

**POST** `/api/v1/easypost/tracker`
Create a tracker for external tracking number (not from EasyPost)

---

### Address Verification

**POST** `/api/v1/easypost/verify-address`
Validate and standardize an address

```typescript
Request Body:
{
  street1: string,
  street2?: string,
  city: string,
  state: string,
  zip: string,
  country: string
}

Query Params:
- strict: boolean (default: false)

Response:
{
  success: true,
  data: {
    valid: true,
    verifications: {
      delivery: {
        success: true,
        errors: [],
        details: {
          latitude: 37.7749,
          longitude: -122.4194,
          timeZone: "America/Los_Angeles"
        }
      }
    },
    // Standardized address
    street1: "388 TOWNSEND ST",
    city: "SAN FRANCISCO",
    state: "CA",
    zip: "94107-1670"
  }
}
```

---

### Webhooks

**POST** `/webhooks/easypost`
Handle EasyPost webhook events

**Supported Events:**

- `tracker.created` - New tracker created
- `tracker.updated` - Tracking status changed
- `refund.successful` - Label refund approved
- `refund.rejected` - Label refund denied

**Security:** HMAC SHA256 signature verification

**Webhook URL:** `https://api.nextpik.com/webhooks/easypost`

---

### Test Endpoint

**GET** `/api/v1/easypost/test`
Test EasyPost API connection (no auth required)

```typescript
Response:
{
  success: true,
  message: "EasyPost API connection successful ✅",
  data: {
    testMode: true,
    testAddressId: "adr_...",
    apiKeyFormat: "Valid EasyPost test key"
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/api
pnpm add @easypost/api
```

### 2. Environment Variables

Add to `apps/api/.env`:

```env
EASYPOST_API_KEY=EZTK...  # Get from https://easypost.com
EASYPOST_TEST_MODE=true
EASYPOST_WEBHOOK_SECRET=whsec_...  # Optional, for webhook verification
```

### 3. Database Migration

```bash
cd packages/database
pnpm prisma migrate deploy
```

### 4. Seed Settings

```bash
node packages/database/seed-easypost.js
```

Or manually via Prisma Studio:

```bash
pnpm prisma:studio
```

Add the 7 EasyPost settings listed in "System Settings" section above.

### 5. Configure Origin Address

In Admin Dashboard → Settings:

- Set `origin_street1`, `origin_city`, `origin_state`
- Existing settings: `origin_postal_code`, `origin_country`, `origin_company_name`

### 6. Configure Webhook (Production)

1. Go to EasyPost Dashboard → Webhooks
2. Add webhook URL: `https://api.nextpik.com/webhooks/easypost`
3. Subscribe to events: `tracker.created`, `tracker.updated`, `refund.*`
4. Copy webhook secret to `EASYPOST_WEBHOOK_SECRET` environment variable

---

## Testing Guide

### Quick Test (12 minutes)

#### 1. Verify Settings (2 min)

1. Go to: `http://localhost:3000/admin/settings`
2. Click: **"EasyPost Shipping"** tab
3. Verify settings loaded correctly
4. Click: **"Save Settings"**
5. ✅ Expect: "EasyPost settings saved successfully"

#### 2. Test Connection (1 min)

```bash
curl http://localhost:4000/api/v1/easypost/test
```

✅ Expect: `{ "success": true, "message": "EasyPost API connection successful ✅" }`

#### 3. Get Shipping Rates (3 min)

1. Go to: `http://localhost:3000/seller/orders`
2. Click on any PROCESSING order with shipping address
3. Scroll to: **"Create Shipment"** section
4. Click: **"Get Shipping Label"**
5. ✅ Expect: Modal opens with loading spinner
6. ✅ Wait 5-10 seconds for rates to load
7. ✅ Expect: Rate cards displayed (USPS, UPS, FedEx)

#### 4. Purchase Label (3 min)

1. Click on any rate card to select it
2. ✅ Expect: Card highlights with blue border
3. Click: **"Purchase Label"** button
4. ✅ Wait 3-5 seconds for purchase
5. ✅ Expect: Success screen with:
   - Tracking number
   - Estimated delivery date
   - Download PDF button
   - Track Package button

#### 5. Download Label (1 min)

1. Click: **"Download Label (PDF)"**
2. ✅ Expect: PDF downloads with shipping label

#### 6. Verify Database (2 min)

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.easypostShipment.findMany({
  orderBy: { createdAt: 'desc' },
  take: 1
}).then(shipments => {
  if (shipments.length > 0) {
    console.log('✅ Shipment Created!');
    console.log('Tracking:', shipments[0].trackingNumber);
    console.log('Carrier:', shipments[0].carrier);
    console.log('Label URL:', shipments[0].labelPdfUrl);
  } else {
    console.log('❌ No shipment found');
  }
  prisma.\$disconnect();
});
"
```

---

## Deployment

### Production Environment Variables

```env
EASYPOST_API_KEY=EZAK...  # Production API key (EZAK, not EZTK)
EASYPOST_TEST_MODE=false
EASYPOST_WEBHOOK_SECRET=whsec_...
```

### Production Checklist

- [ ] Switch to production API key (`EZAK...`)
- [ ] Set `EASYPOST_TEST_MODE=false`
- [ ] Configure production webhook URL
- [ ] Test with real addresses
- [ ] Verify webhook signature validation works
- [ ] Test label refunds
- [ ] Test return labels
- [ ] Monitor webhook logs in database

### Migration Deployment

```bash
# On production server
cd packages/database
pnpm prisma migrate deploy

# Seed settings
node packages/database/seed-easypost.js
```

---

## Troubleshooting

### Issue: "Failed to update setting (404)"

**Cause:** EasyPost settings not seeded in database

**Solution:**

```bash
cd packages/database
node seed-easypost.js
```

### Issue: "Unauthorized" when getting rates

**Cause:** Not logged in as SELLER or ADMIN

**Solution:** Login with correct role

### Issue: No rates returned

**Causes:**

1. Invalid API key
2. EasyPost disabled (`easypost_enabled = false`)
3. Missing origin address settings
4. Invalid destination address

**Debug:**

1. Check browser console for error messages
2. Test API connection: `curl http://localhost:4000/api/v1/easypost/test`
3. Verify settings in Admin Dashboard
4. Check backend logs for API errors

### Issue: Address fields missing

**Fixed in commit:** `5935cc1`

**Database fields:**

- `street` (NOT `address1`)
- `state` (NOT `province`)
- `zipCode` (NOT `postalCode`)

### Issue: Webhook signature verification fails

**Cause:** `EASYPOST_WEBHOOK_SECRET` not set or incorrect

**Solution:**

1. Get webhook secret from EasyPost Dashboard
2. Add to `.env` file
3. Restart backend server

---

## Frontend Usage

### Admin: Configure EasyPost

1. Navigate to **Admin → Settings**
2. Click **"EasyPost Shipping"** tab
3. Configure:
   - Enable EasyPost
   - API Key
   - Test Mode
   - Default Carriers
   - Label Format
4. Click **"Save Settings"**

### Seller: Generate Shipping Label

1. Go to **Seller → Orders**
2. Click on order with status **PROCESSING**
3. Scroll to **"Create Shipment"** section
4. Click **"Get Shipping Label"**
5. Review rates from multiple carriers
6. Select preferred rate
7. Click **"Purchase Label"**
8. Download PDF label
9. Print and attach to package

### Customer: Track Package

1. Go to **My Orders**
2. Click on order
3. View tracking information
4. Click tracking number to open carrier website

---

## Security Considerations

### API Key Storage

- API keys stored in environment variables (not database)
- Never exposed to frontend
- Use test keys in development (`EZTK...`)
- Use production keys in production (`EZAK...`)

### Webhook Security

- HMAC SHA256 signature verification
- Idempotency via `eventId` (prevents duplicate processing)
- Webhook logs stored for audit trail

### Authorization

- Only SELLER and ADMIN can purchase labels
- Sellers can only purchase labels for their own orders
- Address verification prevents invalid shipments

### Rate Limiting

- Recommended: Add rate limiting to `/easypost/rates` endpoint
- Prevents abuse of EasyPost API
- Protects against cost spikes

---

## Cost Considerations

### EasyPost Pricing

- **Rate fetching:** Free (unlimited)
- **Label purchase:** Carrier cost + EasyPost fee (~$0.05-0.10)
- **Address verification:** $0.0033 per verification
- **Tracking:** Free (included with label)

### NextPik Settings

- `easypost_address_verification` - Disable to save $0.0033/shipment
- `easypost_default_carriers` - Limit carriers to reduce API calls
- Rate caching - Cache rates for 15 minutes (future enhancement)

---

## Monitoring

### Database Queries

```sql
-- Total shipments created
SELECT COUNT(*) FROM "EasyPostShipment";

-- Shipments by status
SELECT status, COUNT(*) FROM "EasyPostShipment" GROUP BY status;

-- Recent tracking events
SELECT * FROM "EasyPostTrackingEvent" ORDER BY "occurredAt" DESC LIMIT 10;

-- Webhook logs (last 24 hours)
SELECT * FROM "EasyPostWebhookLog" WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Recommended Alerts

- High number of ERROR status shipments
- Failed webhook deliveries
- Refund rejections
- Address verification failures

---

## Roadmap

### Future Enhancements

- [ ] **Rate Caching** - Cache rates for 15 minutes to reduce API calls
- [ ] **Batch Label Printing** - Print multiple labels at once
- [ ] **Smart Box Selection** - Auto-select box size based on product dimensions
- [ ] **Insurance Options** - Offer shipping insurance for high-value items
- [ ] **Delivery Confirmations** - Signature required, adult signature
- [ ] **Pickup Scheduling** - Schedule carrier pickups via EasyPost
- [ ] **Multi-package Shipments** - Split large orders into multiple packages
- [ ] **Carbon Offset** - Offer carbon-neutral shipping option

---

## Support

### Documentation

- **EasyPost API Docs:** https://docs.easypost.com
- **EasyPost Dashboard:** https://easypost.com/dashboard
- **NextPik CLAUDE.md:** See EasyPost section for quick reference

### Test API Key

Get a free test API key at: https://easypost.com/signup

**Test Mode Features:**

- Free rate fetching
- Free label purchases (no charges)
- Test tracking numbers
- All carriers available

---

## Files Reference

### Backend

```
apps/api/src/integrations/easypost/
├── dto/
│   ├── address.dto.ts
│   ├── parcel.dto.ts
│   ├── get-rates.dto.ts
│   ├── purchase-label.dto.ts
│   ├── customs-info.dto.ts
│   └── index.ts
├── easypost.service.ts
├── easypost-rates.service.ts
├── easypost-shipment.service.ts
├── easypost-tracking.service.ts
├── easypost-address.service.ts
├── easypost.controller.ts
├── easypost-webhook.controller.ts
└── easypost.module.ts
```

### Frontend

```
apps/web/src/
├── components/
│   ├── seller/
│   │   └── easypost-label-button.tsx
│   └── settings/
│       └── easypost-settings.tsx
└── hooks/
    └── use-easypost-tracking.ts
```

### Database

```
packages/database/
├── prisma/
│   ├── schema.prisma  (EasyPost models)
│   ├── migrations/
│   │   └── 20260315000000_add_easypost_integration/
│   │       └── migration.sql
│   └── seed-settings.ts  (EasyPost settings)
└── seed-easypost.js  (Standalone seeder)
```

---

**Last Updated:** March 18, 2026
**Maintained By:** NextPik Engineering Team
