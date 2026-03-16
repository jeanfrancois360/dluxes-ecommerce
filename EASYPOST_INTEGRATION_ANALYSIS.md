# ANALYSIS REPORT: NextPik Shipping Infrastructure

**Date:** March 13, 2026
**Purpose:** Pre-implementation analysis for EasyPost integration
**Status:** Phase 1 - Codebase Analysis Complete

---

## Executive Summary

NextPik implements a **sophisticated three-tier shipping architecture** supporting:

1. **DHL API Integration** - Real-time rate quotes and shipment tracking
2. **Gelato Print-on-Demand** - Per-seller multi-tenant POD fulfillment
3. **Zone-Based Manual Shipping** - Admin-configured rates with geographic targeting

The system uses a **cascade fallback pattern**: DHL API → Shipping Zones → Manual Settings, ensuring robust delivery options under all scenarios. **The infrastructure is production-ready for EasyPost integration** with minimal modifications needed—primarily adding EasyPost as a parallel carrier option within the existing cascade architecture.

---

## 1. Current Delivery System

### Database Models

#### Primary Delivery Tracking Model

```prisma
model Delivery {
  id                String
  orderId           String @unique

  // Provider & Assignment
  providerId        String?
  deliveryPartnerId String?
  assignedAt        DateTime?

  // Tracking
  trackingNumber    String? @unique
  carrier           String? @default("DHL")
  currentStatus     DeliveryStatus @default(PENDING_PICKUP)

  // DHL-Specific Fields
  dhlServiceType    String?           // EXPRESS, PARCEL, ECOMMERCE
  dhlTrackingData   Json?            // Full DHL API response cache
  dhlLastSyncedAt   DateTime?
  dhlEstimatedDelivery DateTime?

  // Addresses
  pickupAddress     Json              // Seller/warehouse
  deliveryAddress   Json              // Customer

  // Timeline
  pickupScheduledAt DateTime?
  pickedUpAt        DateTime?
  inTransitAt       DateTime?
  outForDeliveryAt  DateTime?
  deliveredAt       DateTime?
  expectedDeliveryDate DateTime?

  // Buyer Confirmation & Payout
  buyerConfirmed    Boolean @default(false)
  buyerConfirmedAt  DateTime?
  payoutReleased    Boolean @default(false)
  payoutReleasedAt  DateTime?

  // Relations
  auditLogs         DeliveryAuditLog[]
  trackingEvents    DeliveryTrackingEvent[]
}
```

**Location:** `packages/database/prisma/schema.prisma:3204-3302`

---

#### Multi-Vendor Shipment Tracking

```prisma
model SellerShipment {
  id              String @id
  orderId         String
  storeId         String
  shipmentNumber  String @unique      // SH-{timestamp}-{random}

  status          ShipmentStatus @default(PENDING)
  carrier         String?              // DHL, FedEx, UPS, etc.
  trackingNumber  String?
  trackingUrl     String?

  estimatedDelivery DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  shippingCost    Decimal?
  weight          Decimal?

  items           ShipmentItem[]
  events          ShipmentEvent[]
}
```

**Location:** `packages/database/prisma/schema.prisma:1329-1369`

---

### Shipping Zone Models

```prisma
model ShippingZone {
  id          String
  name        String              // "North America", "Europe"
  code        String @unique

  // Geographic Coverage
  countries   String[]            // ISO country codes
  states      String[]
  cities      String[]
  postalCodes String[]

  // Pricing
  baseFee              Decimal
  perKgFee             Decimal?
  freeShippingThreshold Decimal?

  // Delivery Estimates
  minDeliveryDays Int @default(3)
  maxDeliveryDays Int @default(7)

  priority   Int @default(0)     // Higher = more specific match

  rates      ShippingRate[]
}

model ShippingRate {
  id       String
  zoneId   String
  name     String              // "Standard", "Express"

  // Tiering
  minOrderValue Decimal?
  maxOrderValue Decimal?

  // Pricing
  rate       Decimal
  perKgRate  Decimal?

  // Delivery Time
  minDeliveryDays Int
  maxDeliveryDays Int
}
```

**Location:** `packages/database/prisma/schema.prisma:2589-2664`

---

### Order-Delivery Relationships

```prisma
model Order {
  delivery              Delivery?                     // One delivery per order
  deliveryConfirmation  DeliveryConfirmation?        // Buyer confirmation
  sellerShipments       SellerShipment[]             // Multi-vendor shipments
}
```

---

## 2. DHL Integration

### File Structure

```
apps/api/src/integrations/dhl/
├── dhl.module.ts                    # Module export
├── dhl-rates.service.ts             # Rate quote API
├── dhl-shipment.service.ts          # Create shipments & labels
├── dhl-tracking.service.ts          # Track shipments
└── dhl-sync.service.ts              # Webhook & async tracking
```

---

### Capabilities

#### DHL Rates Service

**Location:** `apps/api/src/integrations/dhl/dhl-rates.service.ts`

**Methods:**

- `getSimplifiedRates(request)` - Get DHL rate quotes
  - Returns products: Express Worldwide, Standard, Economy
  - Includes total price breakdown
  - Provides estimated delivery date and transit days

**Request Interface:**

```typescript
interface DhlRateRequest {
  originCountryCode: string;
  originPostalCode: string;
  destinationCountryCode: string;
  destinationPostalCode: string;
  weight: number; // KG
  length?: number; // CM
  width?: number;
  height?: number;
  plannedShippingDate?: string; // YYYY-MM-DD
}
```

**Response Interface:**

```typescript
interface DhlRateProduct {
  productName: string; // "DHL Express Worldwide"
  productCode: string; // P, U, K
  totalPrice: Array<{
    price: number;
    priceCurrency: string;
  }>;

  deliveryCapabilities: {
    estimatedDeliveryDateAndTime?: string;
    totalTransitDays?: number;
  };
}
```

---

#### DHL Shipment Service

**Location:** `apps/api/src/integrations/dhl/dhl-shipment.service.ts`

**Methods:**

- `createShipment(request)` - Create shipment and generate label
  - Returns tracking number
  - Returns base64 PDF/PNG label
  - Returns tracking URL

**Request Interface:**

```typescript
interface DhlShipmentRequest {
  shipperAddress: DhlAddress;
  receiverAddress: DhlAddress;
  packages: DhlPackage[];
  productCode: string; // P, U, K
  plannedShippingDate: string;
  description: string; // Customs
  labelFormat?: 'PDF' | 'PNG' | 'ZPL';
}
```

**Response Interface:**

```typescript
interface DhlShipmentResponse {
  shipmentTrackingNumber: string;
  trackingUrl: string;
  packages: Array<{
    trackingNumber: string;
  }>;
  documents: Array<{
    typeCode: string;
    content: string; // Base64 encoded
    format: string;
  }>;
  estimatedDeliveryDate?: string;
}
```

---

#### DHL Tracking Service

**Location:** `apps/api/src/integrations/dhl/dhl-tracking.service.ts`

**Functionality:**

- Polls DHL Track API for shipment status
- Stores events in `DeliveryTrackingEvent` model
- Maps DHL codes (`PU`, `IT`, `OK`) to `DeliveryStatus` enum
- Caches results in `dhlTrackingData` field

---

### Trigger Mechanism

**Current State:** DHL is used via **hybrid mode cascade**:

```typescript
// From shipping-tax.service.ts
async calculateShippingOptions(address, items, subtotal) {
  const shippingMode = await this.settingsService.get('shipping_mode');

  // Try DHL API first if mode allows
  if (shippingMode === 'dhl_api' || shippingMode === 'hybrid') {
    try {
      const dhlOptions = await this.calculateDhlShippingOptions(...);
      if (dhlOptions.length > 0) {
        if (shippingMode === 'dhl_api') {
          return dhlOptions;  // DHL-only mode
        } else {
          // Hybrid: merge with fallback
          const fallback = await this.getZonesOrManualRates(...);
          return [...dhlOptions, ...fallback];
        }
      }
    } catch (error) {
      // Fall through to zones/manual
    }
  }

  // Fallback to zones or manual
  return await this.getZonesOrManualRates(...);
}
```

**Location:** `apps/api/src/orders/shipping-tax.service.ts:51-79`

---

### Settings

```javascript
{
  key: 'shipping_mode',
  value: 'hybrid',  // 'manual', 'dhl_api', 'hybrid'
  description: 'Shipping Mode'
}

{
  key: 'dhl_api_environment',
  value: 'sandbox',  // 'sandbox' or 'production'
}
```

**Important:** DHL API keys are stored in `.env` file:

```bash
DHL_API_KEY=your_key
DHL_API_SECRET=your_secret
```

---

## 3. Gelato Integration

### Architecture: Per-Seller Multi-Tenant (v2.9.0)

**Design:** Each seller MUST configure their own Gelato account. No platform fallback.

---

### File Structure

```
apps/api/src/gelato/
├── gelato.module.ts
├── gelato.service.ts                          # Core API
├── gelato-orders.service.ts                   # Order submission & webhooks
├── gelato-products.service.ts                 # Catalog sync
├── seller-gelato-settings.service.ts          # Per-seller encryption
├── seller-gelato-settings.controller.ts       # Seller dashboard
├── gelato.controller.ts                       # Admin
└── gelato-webhook.controller.ts               # Webhooks
```

---

### Shipping Handling

**Gelato handles shipping entirely:**

1. Seller configures Gelato account in dashboard
2. Seller creates product with `fulfillmentType: GELATO_POD`
3. Customer orders POD product
4. System submits order to **seller's Gelato account**
5. Gelato produces + ships directly to customer
6. Gelato sends tracking updates via webhook

**Key Point:** Gelato POD products are **separate from standard shipping**. When an order contains both POD and regular products:

- POD items → Gelato fulfillment
- Regular items → DHL/EasyPost/Manual shipping

---

### Product Identification

```prisma
enum FulfillmentType {
  SELF_FULFILLED          // Seller ships (default)
  GELATO_POD              // Gelato handles
}

model Product {
  fulfillmentType    FulfillmentType @default(SELF_FULFILLED)
  gelatoProductUid   String?         // Gelato catalog product
  gelatoTemplateId   String?
  designFileUrl      String?
  printAreas         Json?
  baseCost           Float?
  markupPercentage   Float?
}
```

---

### Gelato Database Model

```sql
CREATE TABLE "seller_gelato_settings" (
  id TEXT PRIMARY KEY,
  storeId TEXT UNIQUE NOT NULL,
  gelatoApiKey TEXT,                    -- AES-256-GCM encrypted
  gelatoStoreId TEXT,
  gelatoWebhookSecret TEXT,             -- AES-256-GCM encrypted
  isEnabled BOOLEAN DEFAULT false,
  isVerified BOOLEAN DEFAULT false,
  webhookUrl TEXT                       -- Auto-generated per seller
);
```

**Migration:** `packages/database/prisma/migrations/20260312084142_add_seller_gelato_settings/`

---

### Settings

**Environment Variables:**

```bash
ENCRYPTION_KEY=<32-byte-base64-key>  # For encrypting API keys
GELATO_API_URL=https://api.gelato.com/v4
```

**Per-Seller Configuration:**

- Sellers enter credentials in `/seller/gelato-settings`
- API keys encrypted with AES-256-GCM before storage
- Unique webhook URL generated: `/webhooks/gelato/:base64(storeId)`

---

## 4. Checkout Shipping Flow

### Frontend UI

**Location:** `apps/web/src/components/checkout/shipping-method.tsx`

**Features:**

- Displays dynamic shipping options from backend
- Shows carrier logos (USPS, FedEx, UPS, DHL)
- Indicates free shipping eligibility
- Shows estimated delivery dates
- Supports multiple currencies

**Component Interface:**

```typescript
interface ShippingMethodProps {
  selectedMethod?: string;
  onSelect: (methodId: string) => void;
  subtotal: number;
  shippingOptions?: ShippingMethod[];
  isLoadingOptions?: boolean;
  currency?: string;
}

interface ShippingMethod {
  id: string;
  name: string; // "DHL Express", "Standard"
  description?: string;
  price: number;
  estimatedDays: string | number;
  carrier?: string; // "DHL", "USPS", etc.
}
```

---

### Backend Rate Calculation

**Location:** `apps/api/src/orders/shipping-tax.service.ts:51-130`

**Cascade Logic:**

```typescript
async calculateShippingOptions(address, items, subtotal) {
  // TIER 1: Try DHL API (if enabled)
  if (shippingMode === 'dhl_api' || shippingMode === 'hybrid') {
    const dhlOptions = await calculateDhlShippingOptions(...);
    if (dhlOptions.length > 0) {
      if (shippingMode === 'dhl_api') return dhlOptions;
      return [...dhlOptions, ...fallbackOptions];  // Hybrid
    }
  }

  // TIER 2: Try Shipping Zones
  const zoneOptions = await shippingService.getShippingOptions(...);
  if (zoneOptions && zoneOptions.length > 0) {
    return zoneOptions;
  }

  // TIER 3: Manual Settings (final fallback)
  return calculateManualShippingOptions(...);
}
```

**Manual Options:**

- Standard: `shipping_standard_rate` (default $9.99)
- Express: `shipping_express_rate` (default $19.99)
- Overnight: `shipping_overnight_rate` (default $29.99)
- International Surcharge: `shipping_international_surcharge` (default $15.00)

---

### Order Creation Flow

**DTO:** `apps/api/src/orders/dto/create-order.dto.ts`

```typescript
export class CreateOrderDto {
  shippingAddressId: string;
  billingAddressId?: string;
  items: OrderItemDto[];
  shippingMethodId?: string; // Selected method
  paymentMethod?: PaymentMethod;
  currency?: string;
  idempotencyKey?: string;
}
```

**Order Service Methods:**

```typescript
// Get options for checkout page
async getShippingOptions(addressId: string, items: any[])

// Calculate tax
async calculateTax(addressId: string, subtotal: number)

// Create order with selected shipping
async create(userId: string, createOrderDto: CreateOrderDto)
```

---

## 5. Seller Shipping Tools

### Current Capabilities

**Seller Order Dashboard:**

- View orders by status
- View order details with customer address
- Mark orders as shipped (manual)

**Location:** `apps/web/src/app/seller/orders/`

---

### Missing for EasyPost

**Label Generation:**

- ❌ No "Create Shipping Label" button
- ❌ No label PDF download
- ❌ No carrier selection UI

**Shipment Creation:**

- ❌ No automated carrier selection on order confirmation
- ❌ No "Ship with EasyPost" workflow
- ❌ No rate comparison (EasyPost vs DHL)

**Tracking:**

- ✅ Tracking number field exists in `SellerShipment`
- ❌ No automatic sync from EasyPost webhooks
- ❌ No tracking timeline display

---

## 6. Delivery Settings

| Key                                | Default Value | Description                            |
| ---------------------------------- | ------------- | -------------------------------------- |
| `shipping_mode`                    | `'hybrid'`    | `'manual'`, `'dhl_api'`, `'hybrid'`    |
| `shipping_standard_rate`           | `9.99`        | Standard shipping rate (USD)           |
| `shipping_express_rate`            | `19.99`       | Express shipping rate (USD)            |
| `shipping_overnight_rate`          | `29.99`       | Overnight shipping rate (USD)          |
| `shipping_international_surcharge` | `15.0`        | International surcharge (USD)          |
| `free_shipping_enabled`            | `true`        | Enable free shipping                   |
| `free_shipping_threshold`          | `200`         | Min order for free shipping (USD)      |
| `dhl_api_environment`              | `'sandbox'`   | `'sandbox'` or `'production'`          |
| `tax_calculation_mode`             | `'by_state'`  | `'disabled'`, `'simple'`, `'by_state'` |

**Location:** `packages/database/prisma/seed-settings.ts:699-814`

---

## 7. Webhook Infrastructure

### Existing Webhook Handlers

| Service               | Endpoint                                  | Purpose                   |
| --------------------- | ----------------------------------------- | ------------------------- |
| **Stripe**            | `POST /payment/webhook`                   | Payment status updates    |
| **Gelato Platform**   | `POST /webhooks/gelato`                   | Platform webhook (legacy) |
| **Gelato Per-Seller** | `POST /webhooks/gelato/:sellerIdentifier` | Seller-specific webhooks  |

---

### Webhook Pattern to Follow

**Gelato Webhook Example:**

```typescript
@Controller('webhooks/gelato')
export class GelatoWebhookController {
  @Post(':sellerIdentifier')
  async handleSellerWebhook(
    @Param('sellerIdentifier') sellerIdentifier: string,
    @Headers('x-webhook-secret') webhookSecret: string,
    @Body() body: any
  ) {
    // 1. Decode seller identifier
    const storeId = Buffer.from(sellerIdentifier, 'base64').toString('utf-8');

    // 2. Load seller credentials
    const settings = await this.sellerGelatoSettingsService.findByStoreId(storeId);

    // 3. Verify webhook secret (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(webhookSecret),
      Buffer.from(settings.gelatoWebhookSecret)
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    // 4. Process event
    await this.gelatoOrdersService.processWebhookEvent(body);

    return { received: true };
  }
}
```

**Location:** `apps/api/src/gelato/gelato-webhook.controller.ts`

---

### Recommended EasyPost Webhook Pattern

**Endpoint:** `POST /webhooks/easypost`

**Key Steps:**

1. Verify EasyPost HMAC signature (if enabled)
2. Parse `tracker.status` event
3. Update `Delivery` or `SellerShipment` status
4. Store event in `DeliveryTrackingEvent`
5. Return `200 OK` quickly

---

## 8. Conflict Analysis

### DHL Overlap

**Status:** ⚠️ **Potential Overlap**

**Issue:** Both DHL and EasyPost can provide DHL labels:

- DHL Direct API: Direct integration
- EasyPost: Aggregated DHL via EasyPost

**Recommendation:**

- Use **EasyPost for DHL** (unless seller has direct DHL account)
- Keep DHL Direct API as fallback for high-volume sellers
- Add setting: `prefer_easypost_for_dhl` (default `true`)

---

### Gelato Coexistence

**Status:** ✅ **No Conflict**

**Reasoning:**

- Gelato handles POD products (`fulfillmentType: GELATO_POD`)
- EasyPost handles physical products (`fulfillmentType: SELF_FULFILLED`)
- Orders can contain both:
  - POD items → Gelato
  - Physical items → EasyPost/DHL

**Implementation:**

```typescript
async createShipment(orderId: string) {
  const order = await prisma.order.findUnique({
    include: { items: { include: { product: true } } }
  });

  // Separate POD and physical items
  const podItems = order.items.filter(
    item => item.product.fulfillmentType === 'GELATO_POD'
  );

  const physicalItems = order.items.filter(
    item => item.product.fulfillmentType === 'SELF_FULFILLED'
  );

  // Submit POD items to Gelato
  for (const item of podItems) {
    await this.gelatoOrdersService.submitOrderToGelato(orderId, item.id);
  }

  // Ship physical items via EasyPost
  if (physicalItems.length > 0) {
    await this.easypostShipmentService.createShipment(orderId, physicalItems);
  }
}
```

---

### Naming Conflicts

**Status:** ✅ **No Conflicts**

**Analysis:**

- `/shipping/*` - Currently used for zones/settings (admin config)
- `/delivery/*` - Currently used for delivery partner assignments
- `/easypost/*` - Available for EasyPost endpoints
- `/integrations/easypost/*` - Preferred internal structure

**Recommended Structure:**

```
apps/api/src/integrations/easypost/
├── easypost.module.ts
├── easypost-rates.service.ts
├── easypost-shipment.service.ts
├── easypost-tracking.service.ts
└── easypost-webhook.controller.ts
```

---

## 9. Recommended EasyPost Architecture

### Integration Pattern

**Approach:** Add EasyPost as a **parallel carrier provider** in the cascade system.

```typescript
// shipping-tax.service.ts (proposed changes)
async calculateShippingOptions(address, items, subtotal) {
  const shippingMode = await this.settingsService.get('shipping_mode');
  const allOptions = [];

  // TIER 1: Try EasyPost (NEW - highest priority)
  if (shippingMode === 'easypost_api' || shippingMode === 'hybrid') {
    try {
      const easypostOptions = await this.easypostRatesService.getRates(...);
      allOptions.push(...easypostOptions);
    } catch (error) {
      this.logger.warn('EasyPost rate fetch failed', error);
    }
  }

  // TIER 2: Try DHL Direct API (if enabled)
  if (shippingMode === 'dhl_api' || shippingMode === 'hybrid') {
    try {
      const dhlOptions = await this.dhlRatesService.getSimplifiedRates(...);
      allOptions.push(...dhlOptions);
    } catch (error) {
      this.logger.warn('DHL rate fetch failed', error);
    }
  }

  // Return multi-carrier options if any found
  if (allOptions.length > 0) {
    return this.deduplicateAndSort(allOptions);  // Remove duplicates, sort by price
  }

  // TIER 3: Shipping Zones
  const zoneOptions = await this.shippingService.getShippingOptions(...);
  if (zoneOptions && zoneOptions.length > 0) {
    return zoneOptions;
  }

  // TIER 4: Manual Settings (final fallback)
  return this.calculateManualShippingOptions(...);
}
```

---

### New Shipping Modes

**Proposed Values for `shipping_mode` setting:**

| Value                   | Behavior                                        |
| ----------------------- | ----------------------------------------------- |
| `'manual'`              | Use configured rates only                       |
| `'zones'`               | Use shipping zones only                         |
| `'dhl_api'`             | DHL Direct API only                             |
| `'easypost_api'`        | EasyPost only (NEW)                             |
| `'hybrid'`              | EasyPost + DHL + Zones + Manual (all available) |
| `'easypost_dhl_hybrid'` | EasyPost + DHL only (NEW - recommended)         |

**Recommended Default:** `'hybrid'` for maximum flexibility.

---

### Multi-Carrier Rate Shopping

**Logic:**

1. Fetch rates from all enabled carriers (EasyPost, DHL)
2. Deduplicate carriers (prefer EasyPost for common carriers)
3. Sort by price (cheapest first)
4. Return top 3-5 options to customer

**Example Output:**

```typescript
[
  {
    id: 'easypost_usps_priority',
    name: 'USPS Priority Mail',
    carrier: 'USPS',
    price: 8.99,
    estimatedDays: '2-3',
    provider: 'easypost',
  },
  {
    id: 'easypost_fedex_ground',
    name: 'FedEx Ground',
    carrier: 'FedEx',
    price: 12.5,
    estimatedDays: '3-5',
    provider: 'easypost',
  },
  {
    id: 'dhl_express',
    name: 'DHL Express Worldwide',
    carrier: 'DHL',
    price: 45.0,
    estimatedDays: '1-2',
    provider: 'dhl_direct',
  },
];
```

---

## 10. Database Schema Additions Needed

### New Tables

#### 1. `EasyPostShipment` (Optional - if not using existing `SellerShipment`)

```prisma
model EasyPostShipment {
  id                String @id @default(cuid())
  orderId           String
  storeId           String?

  // EasyPost References
  easypostShipmentId String @unique    // EasyPost shipment ID
  easypostTrackerId  String?           // EasyPost tracker ID

  // Carrier Info
  carrier           String              // USPS, FedEx, UPS, etc.
  service           String              // Priority, Ground, etc.
  trackingCode      String?
  trackingUrl       String?

  // Label
  labelUrl          String?             // PDF label URL
  labelFormat       String?             // PDF, PNG, ZPL

  // Costs (in cents)
  listRate          Int                 // Carrier's list price
  retailRate        Int                 // Retail rate
  easypostRate      Int                 // Discounted EasyPost rate
  currency          String @default("USD")

  // Status
  status            EasyPostShipmentStatus @default(PRE_TRANSIT)

  // Dates
  estimatedDelivery DateTime?
  createdAt         DateTime @default(now())
  purchasedAt       DateTime?
  deliveredAt       DateTime?

  // Relations
  order             Order @relation(fields: [orderId])
  trackingEvents    EasyPostTrackingEvent[]
}

enum EasyPostShipmentStatus {
  PRE_TRANSIT
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  AVAILABLE_FOR_PICKUP
  RETURN_TO_SENDER
  FAILURE
  CANCELLED
  ERROR
}
```

---

#### 2. `EasyPostTrackingEvent`

```prisma
model EasyPostTrackingEvent {
  id                    String @id @default(cuid())
  shipmentId            String

  // Event Data
  status                String              // EasyPost status code
  statusDetail          String?
  message               String?
  description           String?

  // Location
  city                  String?
  state                 String?
  country               String?
  zip                   String?

  // Source
  source                String?             // USPS, FedEx, UPS
  carrierCode           String?

  // Timing
  datetime              DateTime            // Event timestamp
  createdAt             DateTime @default(now())

  // Raw Data
  rawEventData          Json?               // Full EasyPost event

  // Relations
  shipment              EasyPostShipment @relation(fields: [shipmentId])
}
```

---

### Existing Table Modifications

#### Option A: Add EasyPost Fields to `Delivery`

```prisma
model Delivery {
  // ... existing fields ...

  // EasyPost Fields (NEW)
  easypostShipmentId String? @unique
  easypostTrackerId  String?
  easypostLabelUrl   String?
  easypostRate       Decimal?

  // ... rest of model ...
}
```

#### Option B: Use `SellerShipment` for EasyPost (RECOMMENDED)

**Recommended:** Reuse existing `SellerShipment` model since it already has:

- ✅ `carrier` field
- ✅ `trackingNumber` field
- ✅ `trackingUrl` field
- ✅ `status` enum with appropriate values
- ✅ `shippingCost` field
- ✅ `events` relation

**Add New Fields:**

```prisma
model SellerShipment {
  // ... existing fields ...

  // EasyPost Integration (NEW)
  easypostShipmentId String? @unique
  easypostTrackerId  String?
  labelUrl          String?           // PDF label
  labelFormat       String?           // PDF, PNG, ZPL
  listRate          Decimal?
  retailRate        Decimal?
  easypostRate      Decimal?          // Discounted rate

  // ... rest of model ...
}
```

---

## 11. Files to Create

### Backend Services

```
apps/api/src/integrations/easypost/
├── easypost.module.ts                       # Module definition
├── easypost-rates.service.ts                # Rate fetching
├── easypost-shipment.service.ts             # Label creation
├── easypost-tracking.service.ts             # Tracking sync
├── easypost-webhook.controller.ts           # Webhook handler
├── interfaces/
│   └── easypost-api.interface.ts           # TypeScript interfaces
├── dto/
│   ├── create-easypost-shipment.dto.ts
│   ├── easypost-rate-request.dto.ts
│   └── easypost-webhook.dto.ts
└── constants/
    └── easypost.constants.ts               # API URLs, constants
```

---

### Seller Dashboard Components

```
apps/web/src/app/seller/shipments/
├── page.tsx                                 # Shipments list
├── [id]/
│   └── page.tsx                            # Shipment details
└── create/
    └── page.tsx                            # Create shipment

apps/web/src/components/seller/
├── shipment-list.tsx                       # Shipments table
├── shipment-details.tsx                    # Tracking timeline
├── create-shipment-form.tsx                # Multi-carrier rate selection
└── print-label-button.tsx                  # Download/print label
```

---

### Database Migration

```
packages/database/prisma/migrations/
└── [timestamp]_add_easypost_integration/
    └── migration.sql
```

---

### Tests

```
apps/api/src/integrations/easypost/
├── easypost-rates.service.spec.ts
├── easypost-shipment.service.spec.ts
├── easypost-tracking.service.spec.ts
└── easypost-webhook.controller.spec.ts
```

---

## 12. Files to Modify

### Backend

| File                                          | Changes                                                 |
| --------------------------------------------- | ------------------------------------------------------- |
| `apps/api/src/orders/shipping-tax.service.ts` | Add EasyPost to cascade logic                           |
| `apps/api/src/orders/orders.service.ts`       | Auto-create shipment on order confirmation              |
| `apps/api/src/app.module.ts`                  | Import `EasyPostModule`                                 |
| `packages/database/prisma/schema.prisma`      | Add `EasyPostShipment` model or modify `SellerShipment` |
| `packages/database/prisma/seed-settings.ts`   | Add EasyPost settings                                   |
| `.env.example`                                | Add `EASYPOST_API_KEY`                                  |

---

### Frontend

| File                                                   | Changes                        |
| ------------------------------------------------------ | ------------------------------ |
| `apps/web/src/components/checkout/shipping-method.tsx` | Support EasyPost carrier logos |
| `apps/web/src/app/seller/orders/[id]/page.tsx`         | Add "Create Shipment" button   |
| `apps/web/src/app/admin/settings/page.tsx`             | Add EasyPost settings tab      |

---

## 13. Risk Assessment

### High Risk

1. **Payment Integration** ⚠️
   - EasyPost charges for label purchases
   - Need billing account verification
   - Production API key security critical
   - **Mitigation:** Use test mode extensively, add cost alerts

2. **Multi-Carrier Data Consistency** ⚠️
   - Different carriers use different tracking codes
   - Status mapping complexity
   - **Mitigation:** Create comprehensive status mapping table

3. **Webhook Reliability** ⚠️
   - Missed webhooks = stale tracking
   - Duplicate webhook handling
   - **Mitigation:** Implement idempotency, periodic polling fallback

---

### Medium Risk

1. **Performance Impact** ⚙️
   - Multiple carrier API calls during checkout
   - **Mitigation:** Implement rate caching (5-10 min TTL)

2. **Cascade Logic Complexity** ⚙️
   - EasyPost + DHL + Zones = complex fallback
   - **Mitigation:** Comprehensive unit tests, clear logging

3. **International Customs** ⚙️
   - EasyPost requires customs info for international
   - **Mitigation:** Add customs fields to order creation

---

### Low Risk

1. **Database Schema Changes** ✅
   - Adding fields to existing models is safe
   - **Mitigation:** Create migration, test rollback

2. **Frontend UI Updates** ✅
   - Non-breaking changes to checkout UI
   - **Mitigation:** Feature flag for gradual rollout

---

## 14. Questions for Clarification

### EasyPost Account & Billing

1. **Who pays for shipping labels?**
   - Platform (NextPik) pays, then charges sellers?
   - Sellers have individual EasyPost accounts (like Gelato)?
   - **Recommendation:** Platform account for simplicity (like DHL)

2. **How to handle EasyPost fees?**
   - Pass exact cost to customer?
   - Add platform markup?
   - Include in commission calculation?

---

### Seller Workflow

3. **When should shipment be created?**
   - Automatically on order confirmation?
   - Manually by seller (button click)?
   - Hybrid (auto-create, seller confirms)?
   - **Recommendation:** Manual creation for seller control

4. **Should sellers choose carrier?**
   - Show multiple options and let seller pick?
   - Auto-select cheapest?
   - Customer chooses at checkout (current)?
   - **Recommendation:** Customer chooses at checkout (existing pattern)

---

### Multi-Vendor Orders

5. **How to handle split shipments?**
   - Order has items from Seller A + Seller B
   - Each seller ships separately?
   - Calculate shipping per seller?
   - **Recommendation:** Separate `SellerShipment` per seller (existing model supports this)

6. **Mixed fulfillment orders?**
   - Order has POD item (Gelato) + physical item (EasyPost)
   - Two tracking numbers?
   - **Recommendation:** Yes, separate tracking per fulfillment type

---

### Technical Decisions

7. **Use existing `SellerShipment` model or create `EasyPostShipment`?**
   - **Recommendation:** Use `SellerShipment` + add EasyPost fields (less complexity)

8. **Shipping mode preference?**
   - Default to `'hybrid'` (EasyPost + DHL + Zones)?
   - Admin configurable?
   - **Recommendation:** `'hybrid'` with admin override

9. **Rate caching strategy?**
   - Cache duration: 5 min? 10 min?
   - Cache key: address + weight?
   - **Recommendation:** 10 min cache with Redis

---

### Integration Scope

10. **Phase 1 features?**
    - Rate quotes only?
    - Rate quotes + label creation?
    - Rate quotes + labels + tracking?
    - **Recommendation:** Full integration (rates + labels + tracking)

11. **Support carrier accounts?**
    - Allow sellers to use their own UPS/FedEx accounts via EasyPost?
    - Platform account only?
    - **Recommendation:** Platform account initially, carrier accounts Phase 2

---

## 15. Key Files Summary

| Component                | File Path                                               | Purpose                     |
| ------------------------ | ------------------------------------------------------- | --------------------------- |
| **Shipping Service**     | `apps/api/src/shipping/shipping.service.ts`             | Zone-based rate calculation |
| **Shipping Controller**  | `apps/api/src/shipping/shipping.controller.ts`          | API endpoints               |
| **Shipping Tax Service** | `apps/api/src/orders/shipping-tax.service.ts`           | Cascade shipping + tax      |
| **DHL Rates**            | `apps/api/src/integrations/dhl/dhl-rates.service.ts`    | DHL API rate quotes         |
| **DHL Shipment**         | `apps/api/src/integrations/dhl/dhl-shipment.service.ts` | Create shipments & labels   |
| **DHL Tracking**         | `apps/api/src/integrations/dhl/dhl-tracking.service.ts` | Track shipments             |
| **DHL Module**           | `apps/api/src/integrations/dhl/dhl.module.ts`           | DHL exports                 |
| **Gelato Service**       | `apps/api/src/gelato/gelato.service.ts`                 | Core Gelato API             |
| **Gelato Orders**        | `apps/api/src/gelato/gelato-orders.service.ts`          | Order submission & webhooks |
| **Gelato Webhook**       | `apps/api/src/gelato/gelato-webhook.controller.ts`      | Webhook handling            |
| **Seller Gelato**        | `apps/api/src/gelato/seller-gelato-settings.service.ts` | Per-seller encryption       |
| **Delivery Service**     | `apps/api/src/delivery/delivery.service.ts`             | Delivery management         |
| **Database Schema**      | `packages/database/prisma/schema.prisma`                | All models                  |
| **Settings Seed**        | `packages/database/prisma/seed-settings.ts`             | Initial settings            |
| **Zone Seed**            | `packages/database/prisma/seed-shipping-zones.ts`       | Initial zones               |
| **Checkout Component**   | `apps/web/src/components/checkout/shipping-method.tsx`  | Frontend shipping UI        |

---

## Final Recommendations

### Immediate Next Steps

1. **Set up EasyPost test account** - Get API keys for sandbox
2. **Create database migration** - Add EasyPost fields to `SellerShipment`
3. **Implement EasyPost services** - Rates, shipment, tracking (parallel to DHL pattern)
4. **Update cascade logic** - Add EasyPost to `ShippingTaxService`
5. **Add seller shipment UI** - Create/view/print labels

### Architecture Decision

**Recommended Approach:**

- Use **platform EasyPost account** (like DHL)
- Reuse **`SellerShipment` model** (add EasyPost fields)
- Implement **hybrid cascade mode** (EasyPost + DHL + fallbacks)
- **Manual label creation** by sellers (button-triggered)
- **Automatic tracking sync** via webhooks + polling

---

**Analysis Complete.** Ready to proceed with Phase 2: Implementation Plan. 🚀
