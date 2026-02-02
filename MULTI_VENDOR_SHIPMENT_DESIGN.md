# Multi-Vendor Shipment Tracking - Design Document

**Date:** February 1, 2026
**Version:** 1.0
**Status:** 🔴 DESIGN PHASE - Awaiting Approval
**Priority:** HIGH - Critical for multi-vendor marketplace

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Proposed Solution](#proposed-solution)
4. [Database Schema Changes](#database-schema-changes)
5. [API Design](#api-design)
6. [Frontend Changes](#frontend-changes)
7. [Migration Strategy](#migration-strategy)
8. [Testing Plan](#testing-plan)
9. [Rollout Strategy](#rollout-strategy)
10. [Risk Assessment](#risk-assessment)

---

## 1. Problem Statement

### Current Limitations

**Scenario:** Customer orders 3 items from 2 different sellers:
- Item A (Handbag) from Seller 1 → Ships on Day 2
- Item B (Watch) from Seller 2 → Ships on Day 5
- Item C (Shoes) from Seller 2 → Ships on Day 5

**Current Behavior:**
- Order status is at **ORDER level** (single status for entire order)
- When Seller 1 ships Item A, admin must manually update order to SHIPPED
- But Items B & C haven't shipped yet (confusing for customer)
- Customer sees "Order Shipped" but only receives 1 of 3 items

**Problems:**
1. ❌ No visibility into partial shipments
2. ❌ Customers don't know which items are shipped vs pending
3. ❌ Sellers can't independently mark their items as shipped
4. ❌ Order stays "PROCESSING" until ALL sellers ship (blocks workflow)
5. ❌ Poor customer experience (unexpected partial deliveries)

### Business Requirements

1. **Track shipments per seller** (not per order)
2. **Allow sellers to ship independently** (without waiting for other sellers)
3. **Show customers real-time shipment status** per item/seller
4. **Maintain backward compatibility** with single-vendor orders
5. **Keep existing Delivery model** for order-level delivery confirmation
6. **Don't break existing admin workflows**

---

## 2. Current Architecture Analysis

### Database Models

#### Order Model (1:1 with Delivery)
```prisma
model Order {
  id          String      @id
  status      OrderStatus @default(PENDING)  // ← Single status for entire order
  items       OrderItem[]
  delivery    Delivery?   // ← 1:1 relationship
}
```

#### OrderItem Model
```prisma
model OrderItem {
  id        String  @id
  orderId   String
  productId String
  product   Product @relation(...)  // ← Links to Product → Store → Seller
  // ❌ No shipment tracking fields
}
```

#### Product Model
```prisma
model Product {
  id       String  @id
  storeId  String? // ← Links to seller's store
  store    Store?  @relation(...)
}
```

#### Delivery Model (Current - Order Level Only)
```prisma
model Delivery {
  id             String         @id
  orderId        String         @unique  // ← 1:1 with Order
  trackingNumber String?
  currentStatus  DeliveryStatus
  shippedAt      DateTime?
  // ❌ No seller-specific tracking
}
```

### Current Flow

```
Order Created (PENDING)
   ↓
Payment Confirmed (CONFIRMED)
   ↓
Admin Updates (PROCESSING)
   ↓
Admin Updates (SHIPPED) ← Only ONE status for ALL items
   ↓
Delivery Confirmed (DELIVERED)
```

**Issue:** In multi-vendor orders, sellers ship at different times but system treats as single shipment.

---

## 3. Proposed Solution

### Design Philosophy

**Approach:** Track shipments at **SELLER level** (middle ground between order-level and item-level)

**Why Seller-Level?**
- ✅ Simpler than item-level (don't need to track every single item)
- ✅ More granular than order-level (allows partial shipments)
- ✅ Aligns with business model (sellers ship their own items)
- ✅ Easier to implement and maintain
- ✅ Natural grouping (items from same seller ship together)

### Three-Tier Status Tracking

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Order Status (Existing - Keep for Compatibility)   │
│ - PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED        │
│ - Aggregate status based on all shipments                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Seller Shipments (NEW - Core of This Design)       │
│ - Track each seller's shipment independently                │
│ - Seller can mark their items as shipped                    │
│ - Has tracking number, carrier, shipped date                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: Delivery Confirmation (Existing - Keep)            │
│ - Order-level delivery confirmation after ALL items arrive │
│ - Triggers escrow release, payment capture                  │
└─────────────────────────────────────────────────────────────┘
```

### Order Status Logic (Aggregate)

```typescript
// Order status is calculated from seller shipments:

ALL shipments PENDING        → Order status: PROCESSING
SOME shipments SHIPPED       → Order status: PARTIALLY_SHIPPED (NEW!)
ALL shipments SHIPPED        → Order status: SHIPPED
ALL shipments DELIVERED      → Order status: DELIVERED
```

---

## 4. Database Schema Changes

### Option A: Seller-Level Shipment Tracking (RECOMMENDED)

**New Model:** `SellerShipment`

```prisma
model SellerShipment {
  id      String @id @default(cuid())
  orderId String
  storeId String  // Seller's store

  // Shipment Status
  status ShipmentStatus @default(PENDING)

  // Tracking Information
  trackingNumber String?
  carrier        String?  // DHL, FedEx, UPS, etc.
  trackingUrl    String?

  // Timestamps
  preparedAt DateTime?  // When seller marked as "preparing"
  shippedAt  DateTime?  // When seller marked as "shipped"
  deliveredAt DateTime? // When customer confirms this seller's items

  // Package Details
  packageWeight     String?
  packageDimensions String?
  shippingMethod    String? // Express, Standard, Economy

  // Estimated Dates
  estimatedShipDate     DateTime?
  estimatedDeliveryDate DateTime?

  // Notes
  sellerNotes  String? @db.Text  // Internal notes from seller
  customerNotes String? @db.Text // Customer-facing shipping notes

  // Metadata
  metadata Json?  // Additional data (proof of shipment, photos, etc.)

  // Relations
  order      Order            @relation(fields: [orderId], references: [id], onDelete: Cascade)
  store      Store            @relation(fields: [storeId], references: [id])
  items      ShipmentItem[]   // Links to which items are in this shipment
  events     ShipmentEvent[]  // Tracking events timeline

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([storeId])
  @@index([status])
  @@index([shippedAt])
  @@map("seller_shipments")
}

enum ShipmentStatus {
  PENDING      // Seller hasn't started
  PREPARING    // Seller is preparing items
  READY        // Ready to ship (packed)
  SHIPPED      // Package dispatched
  IN_TRANSIT   // In delivery network
  OUT_FOR_DELIVERY  // Out for final delivery
  DELIVERED    // Customer received
  FAILED       // Delivery failed
  RETURNED     // Returned to seller
}

// Link table: Which items are in which shipment
model ShipmentItem {
  id         String @id @default(cuid())
  shipmentId String
  itemId     String  // OrderItem ID
  quantity   Int     // Quantity in this shipment (for split shipments)

  shipment  SellerShipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  orderItem OrderItem      @relation(fields: [itemId], references: [id])

  @@unique([shipmentId, itemId])
  @@index([shipmentId])
  @@index([itemId])
  @@map("shipment_items")
}

// Shipment tracking events (like DHL tracking updates)
model ShipmentEvent {
  id         String   @id @default(cuid())
  shipmentId String

  // Event Data
  status      ShipmentStatus
  title       String   // "Package Shipped", "Out for Delivery"
  description String?  @db.Text
  location    String?  // City, facility name

  // Timing
  timestamp DateTime

  // Source
  source String?  // "SELLER", "CARRIER_API", "ADMIN", "SYSTEM"

  // Relations
  shipment SellerShipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([shipmentId])
  @@index([timestamp])
  @@map("shipment_events")
}
```

**Add to Order Model:**

```prisma
model Order {
  // ... existing fields

  // NEW: Multi-vendor shipment tracking
  shipments SellerShipment[]

  // KEEP: Existing delivery for backward compatibility
  delivery Delivery?
}
```

**Add to OrderItem Model:**

```prisma
model OrderItem {
  // ... existing fields

  // NEW: Link to shipment
  shipmentItems ShipmentItem[]
}
```

**Add to Store Model:**

```prisma
model Store {
  // ... existing fields

  // NEW: Seller's shipments
  shipments SellerShipment[]
}
```

### New Enum: OrderStatus Extension

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  PARTIALLY_SHIPPED  // NEW! Some sellers shipped, some haven't
  SHIPPED            // All sellers shipped
  DELIVERED
  CANCELLED
  REFUNDED
}
```

### Migration Notes

- **Backward Compatible:** Existing orders without `shipments` continue to work
- **Existing Delivery Model:** Keep for order-level delivery confirmation
- **Data Migration:** For existing orders, create one `SellerShipment` per store retroactively (migration script)

---

## 5. API Design

### 5.1 Seller Endpoints (NEW)

#### **Create Shipment (Seller marks items as shipped)**

```http
POST /api/v1/seller/orders/:orderId/shipments
Authorization: Bearer <seller_token>
```

**Request Body:**
```json
{
  "items": ["item_id_1", "item_id_2"],  // OrderItem IDs
  "trackingNumber": "1234567890",
  "carrier": "DHL",
  "shippingMethod": "Express",
  "estimatedDeliveryDate": "2026-02-10",
  "sellerNotes": "Packaged with care"
}
```

**Response:**
```json
{
  "success": true,
  "shipment": {
    "id": "shipment_123",
    "orderId": "order_456",
    "storeId": "store_789",
    "status": "SHIPPED",
    "trackingNumber": "1234567890",
    "carrier": "DHL",
    "trackingUrl": "https://dhl.com/track/1234567890",
    "shippedAt": "2026-02-05T10:00:00Z",
    "items": [
      {
        "id": "item_id_1",
        "name": "Italian Leather Handbag",
        "quantity": 1
      }
    ]
  }
}
```

**Business Logic:**
1. Verify seller owns the store for these items
2. Verify all items belong to seller's store
3. Create `SellerShipment` record with status `SHIPPED`
4. Create `ShipmentItem` records linking items to shipment
5. Create `ShipmentEvent` record: "Package Shipped"
6. Update order status if needed:
   - If ALL shipments shipped → Order status: `SHIPPED`
   - If SOME shipments shipped → Order status: `PARTIALLY_SHIPPED`
7. Send email to customer: "Part of your order has shipped"
8. Create order timeline entry

#### **Update Shipment (Seller updates tracking info)**

```http
PATCH /api/v1/seller/shipments/:shipmentId
Authorization: Bearer <seller_token>
```

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "trackingNumber": "9876543210",
  "estimatedDeliveryDate": "2026-02-12"
}
```

#### **Get My Shipments (Seller views all their shipments)**

```http
GET /api/v1/seller/shipments?status=PENDING&page=1&limit=20
Authorization: Bearer <seller_token>
```

**Response:**
```json
{
  "success": true,
  "shipments": [
    {
      "id": "shipment_123",
      "orderId": "order_456",
      "orderNumber": "LUX-1769937586339",
      "status": "PENDING",
      "items": [
        {
          "name": "Italian Leather Handbag",
          "quantity": 1,
          "image": "https://..."
        }
      ],
      "customer": {
        "name": "John Doe",
        "shippingAddress": "123 Main St, New York, NY"
      },
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### 5.2 Customer Endpoints (Enhanced)

#### **Get Order Details (Enhanced with shipment tracking)**

```http
GET /api/v1/orders/:orderId
Authorization: Bearer <customer_token>
```

**Response (Enhanced):**
```json
{
  "success": true,
  "order": {
    "id": "order_456",
    "orderNumber": "LUX-1769937586339",
    "status": "PARTIALLY_SHIPPED",  // ← NEW status!
    "total": 17297.09,
    "currency": "EUR",

    // NEW: Shipments array
    "shipments": [
      {
        "id": "shipment_123",
        "seller": {
          "storeName": "Luxury Bags Co",
          "storeId": "store_789"
        },
        "status": "SHIPPED",
        "trackingNumber": "1234567890",
        "carrier": "DHL",
        "trackingUrl": "https://dhl.com/track/1234567890",
        "shippedAt": "2026-02-05T10:00:00Z",
        "estimatedDeliveryDate": "2026-02-10",
        "items": [
          {
            "id": "item_1",
            "name": "Italian Leather Handbag",
            "quantity": 1,
            "image": "https://...",
            "price": 2382.60
          }
        ],
        "events": [
          {
            "status": "SHIPPED",
            "title": "Package Shipped",
            "description": "Your package has been shipped from Milan, Italy",
            "location": "Milan, IT",
            "timestamp": "2026-02-05T10:00:00Z"
          },
          {
            "status": "IN_TRANSIT",
            "title": "In Transit",
            "description": "Package is on its way",
            "location": "Paris, FR",
            "timestamp": "2026-02-06T14:30:00Z"
          }
        ]
      },
      {
        "id": "shipment_124",
        "seller": {
          "storeName": "Swiss Watches Inc",
          "storeId": "store_790"
        },
        "status": "PREPARING",  // ← Still pending!
        "items": [
          {
            "id": "item_2",
            "name": "Skeleton Automatic Reserve",
            "quantity": 1,
            "image": "https://...",
            "price": 11871.20
          }
        ],
        "estimatedShipDate": "2026-02-07"
      }
    ],

    // Existing fields...
    "items": [/* all items */],
    "timeline": [/* existing timeline */]
  }
}
```

#### **Track Shipment (Public - no auth required)**

```http
GET /api/v1/shipments/track/:trackingNumber
```

**Response:**
```json
{
  "success": true,
  "shipment": {
    "trackingNumber": "1234567890",
    "carrier": "DHL",
    "status": "IN_TRANSIT",
    "estimatedDeliveryDate": "2026-02-10",
    "events": [/* tracking events */]
  },
  "order": {
    "orderNumber": "LUX-1769937586339",
    "status": "PARTIALLY_SHIPPED"
  }
}
```

---

### 5.3 Admin Endpoints (Enhanced)

#### **Get Order Details (Admin view with all shipments)**

```http
GET /api/v1/admin/orders/:orderId
Authorization: Bearer <admin_token>
```

**Response:** Same as customer endpoint but includes:
- Seller internal notes
- Detailed shipment metadata
- Audit logs

#### **Update Shipment (Admin override)**

```http
PATCH /api/v1/admin/shipments/:shipmentId
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "DELIVERED",
  "deliveredAt": "2026-02-10T15:00:00Z",
  "notes": "Customer confirmed delivery"
}
```

---

## 6. Frontend Changes

### 6.1 Customer Order Details Page

**Current:**
```
Order Status: SHIPPED
Timeline: [PENDING → CONFIRMED → PROCESSING → SHIPPED]
```

**Enhanced:**
```
Order Status: PARTIALLY SHIPPED

┌─────────────────────────────────────────────────────┐
│ 📦 Shipment 1 of 2 - SHIPPED                        │
│ Seller: Luxury Bags Co                              │
│ ────────────────────────────────────────────────── │
│ Tracking: DHL 1234567890 [Track Package]           │
│ Shipped: Feb 5, 2026                                 │
│ Estimated Delivery: Feb 10, 2026                     │
│                                                       │
│ Items (1):                                           │
│ • Italian Leather Handbag (€2,382.60)               │
│                                                       │
│ Tracking Timeline:                                   │
│ ✅ Package Shipped - Milan, IT (Feb 5, 10:00 AM)   │
│ ✅ In Transit - Paris, FR (Feb 6, 2:30 PM)         │
│ 🚚 Out for Delivery - New York, US (Est. Feb 10)   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📦 Shipment 2 of 2 - PREPARING                      │
│ Seller: Swiss Watches Inc                           │
│ ────────────────────────────────────────────────── │
│ Status: Seller is preparing your items              │
│ Est. Ship Date: Feb 7, 2026                          │
│                                                       │
│ Items (1):                                           │
│ • Skeleton Automatic Reserve (€11,871.20)           │
│                                                       │
│ [Contact Seller]                                     │
└─────────────────────────────────────────────────────┘
```

### 6.2 Seller Dashboard - Orders Page

**New Section:** "Orders Ready to Ship"

```
┌────────────────────────────────────────────────┐
│ 📦 Orders Ready to Ship (3)                    │
├────────────────────────────────────────────────┤
│ Order LUX-1769937586339                        │
│ Customer: John Doe                             │
│ Items: 1 item (Italian Leather Handbag)       │
│ [Mark as Shipped]                              │
│────────────────────────────────────────────────│
│ Order LUX-1769937586340                        │
│ Customer: Jane Smith                           │
│ Items: 2 items (Watch, Bracelet)              │
│ [Mark as Shipped]                              │
└────────────────────────────────────────────────┘
```

### 6.3 Seller - Mark as Shipped Modal

```
┌─────────────────────────────────────────────────┐
│ Mark Items as Shipped                           │
├─────────────────────────────────────────────────┤
│                                                  │
│ Order: LUX-1769937586339                        │
│ Customer: John Doe                               │
│                                                  │
│ Items to Ship:                                  │
│ ☑ Italian Leather Handbag (€2,382.60)          │
│                                                  │
│ Tracking Number: [____________]                 │
│ Carrier: [DHL ▼]                                │
│ Shipping Method: [Express ▼]                   │
│ Est. Delivery Date: [Feb 10, 2026]             │
│                                                  │
│ Notes (optional):                               │
│ [Packaged with care. Includes gift wrap.]      │
│                                                  │
│         [Cancel]  [Mark as Shipped]             │
└─────────────────────────────────────────────────┘
```

### 6.4 Order Timeline Enhancement

**Current Timeline:**
```
• Order Placed (Feb 1, 11:19 AM)
• Payment Confirmed (Feb 1, 11:20 AM)
• Order Shipped (Feb 5, 10:00 AM)
```

**Enhanced Timeline:**
```
• Order Placed (Feb 1, 11:19 AM)
• Payment Confirmed (Feb 1, 11:20 AM)
• Shipment 1 Created - Luxury Bags Co (Feb 5, 10:00 AM)
  "1 item shipped via DHL"
• Shipment 1 In Transit (Feb 6, 2:30 PM)
  "Package passed through Paris, FR"
• Shipment 2 Created - Swiss Watches Inc (Feb 7, 9:00 AM)
  "1 item shipped via FedEx"
```

---

## 7. Migration Strategy

### Phase 1: Database Migration (Non-Breaking)

```bash
# Create new tables (ADDITIVE ONLY)
pnpm prisma migrate dev --name add_seller_shipments
```

**Migration Script:**
```typescript
// Migration: 20260201_add_seller_shipments.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingOrders() {
  console.log('Migrating existing orders to new shipment model...');

  // Find all orders with status SHIPPED or DELIVERED
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['SHIPPED', 'DELIVERED']
      }
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: true
            }
          }
        }
      },
      delivery: true
    }
  });

  for (const order of orders) {
    // Group items by store
    const itemsByStore = new Map<string, any[]>();

    for (const item of order.items) {
      if (!item.product.store) continue;

      const storeId = item.product.storeId!;
      if (!itemsByStore.has(storeId)) {
        itemsByStore.set(storeId, []);
      }
      itemsByStore.get(storeId)!.push(item);
    }

    // Create shipment for each store
    for (const [storeId, items] of itemsByStore) {
      const shipment = await prisma.sellerShipment.create({
        data: {
          orderId: order.id,
          storeId,
          status: order.status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED',
          trackingNumber: order.delivery?.trackingNumber,
          carrier: order.delivery?.carrier,
          shippedAt: order.delivery?.shippedAt || order.updatedAt,
          deliveredAt: order.status === 'DELIVERED' ? order.delivery?.shippedAt : null,
          metadata: {
            migratedFromOrderId: order.id,
            migratedAt: new Date().toISOString()
          }
        }
      });

      // Link items to shipment
      for (const item of items) {
        await prisma.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            itemId: item.id,
            quantity: item.quantity
          }
        });
      }

      // Create shipment event
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: shipment.status,
          title: 'Package Shipped',
          description: 'Migrated from existing order data',
          timestamp: shipment.shippedAt!,
          source: 'SYSTEM'
        }
      });
    }

    console.log(`✅ Migrated order ${order.orderNumber}`);
  }

  console.log('Migration complete!');
}

migrateExistingOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Phase 2: Backend Implementation (Backward Compatible)

**Service Layer:**
```typescript
// apps/api/src/shipments/shipments.service.ts

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private emailService: EmailService
  ) {}

  /**
   * Create shipment (seller marks items as shipped)
   */
  async createShipment(
    storeId: string,
    orderId: string,
    data: CreateShipmentDto
  ): Promise<SellerShipment> {
    // 1. Verify seller owns these items
    const items = await this.prisma.orderItem.findMany({
      where: {
        id: { in: data.itemIds },
        product: { storeId }
      },
      include: {
        product: { include: { store: true } }
      }
    });

    if (items.length !== data.itemIds.length) {
      throw new ForbiddenException('Some items do not belong to your store');
    }

    // 2. Create shipment
    const shipment = await this.prisma.sellerShipment.create({
      data: {
        orderId,
        storeId,
        status: ShipmentStatus.SHIPPED,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        shippingMethod: data.shippingMethod,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        sellerNotes: data.sellerNotes,
        shippedAt: new Date(),
      }
    });

    // 3. Link items to shipment
    for (const item of items) {
      await this.prisma.shipmentItem.create({
        data: {
          shipmentId: shipment.id,
          itemId: item.id,
          quantity: item.quantity
        }
      });
    }

    // 4. Create shipment event
    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.SHIPPED,
        title: 'Package Shipped',
        description: `Your package has been shipped via ${data.carrier}`,
        timestamp: new Date(),
        source: 'SELLER'
      }
    });

    // 5. Update order status
    await this.updateOrderStatus(orderId);

    // 6. Create order timeline entry
    const store = items[0].product.store!;
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'PROCESSING' as any,
        title: `Shipment Created - ${store.name}`,
        description: `${items.length} item(s) shipped via ${data.carrier}`,
        icon: 'package'
      }
    });

    // 7. Send email to customer
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (order) {
      await this.emailService.sendShipmentNotification({
        to: order.user.email,
        orderNumber: order.orderNumber,
        storeName: store.name,
        trackingNumber: data.trackingNumber,
        trackingUrl: this.generateTrackingUrl(data.carrier, data.trackingNumber),
        itemCount: items.length
      });
    }

    return shipment;
  }

  /**
   * Update order status based on shipments
   */
  private async updateOrderStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { store: true } }
          }
        },
        shipments: true
      }
    });

    if (!order) return;

    // Get unique stores in this order
    const uniqueStores = new Set(
      order.items
        .filter(item => item.product.store)
        .map(item => item.product.storeId!)
    );

    const totalStores = uniqueStores.size;
    const shippedStores = order.shipments.filter(s =>
      s.status === ShipmentStatus.SHIPPED ||
      s.status === ShipmentStatus.IN_TRANSIT ||
      s.status === ShipmentStatus.OUT_FOR_DELIVERY ||
      s.status === ShipmentStatus.DELIVERED
    ).length;

    let newStatus: OrderStatus;

    if (shippedStores === 0) {
      newStatus = OrderStatus.PROCESSING;
    } else if (shippedStores < totalStores) {
      newStatus = OrderStatus.PARTIALLY_SHIPPED;
    } else {
      newStatus = OrderStatus.SHIPPED;
    }

    if (order.status !== newStatus) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });
    }
  }
}
```

### Phase 3: Frontend Updates (Progressive Enhancement)

**Step 1:** Add shipment display to order details (read-only)
**Step 2:** Add "Mark as Shipped" button for sellers
**Step 3:** Add shipment tracking timeline
**Step 4:** Add email notifications

---

## 8. Testing Plan

### Unit Tests

```typescript
// shipments.service.spec.ts

describe('ShipmentsService', () => {
  describe('createShipment', () => {
    it('should create shipment for seller items only', async () => {
      // Test seller can only ship their own items
    });

    it('should update order status to PARTIALLY_SHIPPED', async () => {
      // Test multi-vendor order with partial shipment
    });

    it('should send email notification', async () => {
      // Test customer receives shipment email
    });
  });

  describe('updateOrderStatus', () => {
    it('should calculate PARTIALLY_SHIPPED correctly', async () => {
      // Test 2 sellers, 1 shipped, 1 pending
    });

    it('should calculate SHIPPED when all shipped', async () => {
      // Test all sellers shipped
    });
  });
});
```

### Integration Tests

```bash
# Test Scenarios

1. Single-Vendor Order (Backward Compatibility)
   - Create order with 1 seller
   - Seller marks as shipped
   - Order status → SHIPPED
   - Customer sees tracking

2. Multi-Vendor Order (Partial Shipment)
   - Create order with 2 sellers
   - Seller A ships → Order status: PARTIALLY_SHIPPED
   - Seller B ships → Order status: SHIPPED
   - Customer sees both shipments

3. Multi-Vendor Order (Sequential Shipment)
   - Seller A ships Day 1
   - Seller B ships Day 3
   - Seller C ships Day 5
   - Timeline shows all 3 shipments

4. Failed Delivery
   - Shipment marked FAILED
   - Order status remains PARTIALLY_SHIPPED
   - Seller can create new shipment

5. Migration Test
   - Run migration on test database
   - Verify existing shipped orders have shipments created
   - Verify shipment items linked correctly
```

---

## 9. Rollout Strategy

### Week 1: Backend Foundation (Feb 1-7)
- ✅ Schema design approved
- ✅ Database migration created
- ✅ Run migration on staging database
- ✅ Implement ShipmentsService
- ✅ Implement seller endpoints
- ✅ Write unit tests

### Week 2: API Integration (Feb 8-14)
- ✅ Implement admin endpoints
- ✅ Enhance order endpoints with shipment data
- ✅ Update webhook handlers (if needed)
- ✅ Write integration tests
- ✅ Test on staging environment

### Week 3: Frontend (Feb 15-21)
- ✅ Update order details page (customer view)
- ✅ Add shipment tracking timeline
- ✅ Implement seller "Mark as Shipped" modal
- ✅ Add seller shipments dashboard
- ✅ Update admin order management

### Week 4: Testing & Launch (Feb 22-28)
- ✅ End-to-end testing
- ✅ User acceptance testing (UAT)
- ✅ Performance testing
- ✅ Deploy to production
- ✅ Monitor for issues

---

## 10. Risk Assessment

### High Risk

**❌ Breaking Existing Orders**
- **Risk:** Migration fails or creates data inconsistencies
- **Mitigation:**
  - Test migration on copy of production database first
  - Run migration during low-traffic hours
  - Have rollback plan ready
  - Keep existing Delivery model as fallback

**❌ Performance Impact**
- **Risk:** Additional database queries slow down order loading
- **Mitigation:**
  - Use database indexes on `orderId`, `storeId`, `status`
  - Implement pagination for large shipment lists
  - Cache shipment data on frontend
  - Monitor query performance

### Medium Risk

**⚠️ Seller Confusion**
- **Risk:** Sellers don't understand new shipment flow
- **Mitigation:**
  - Clear UI instructions
  - Tutorial video
  - Email announcement to sellers
  - Support documentation

**⚠️ Customer Confusion (Partial Shipments)**
- **Risk:** Customers don't understand why order is "partially shipped"
- **Mitigation:**
  - Clear UI showing which items are shipped
  - Email notification for each shipment
  - FAQ section explaining multi-vendor orders

### Low Risk

**✅ Backward Compatibility**
- **Risk:** Single-vendor orders affected
- **Mitigation:**
  - System works same way for single-vendor
  - Migration creates shipments for existing orders
  - Existing Delivery model still works

---

## 11. Success Metrics

### Key Performance Indicators

1. **Adoption Rate:**
   - % of sellers using new shipment feature
   - Target: 80%+ within 2 weeks

2. **Customer Satisfaction:**
   - Reduction in "Where is my order?" support tickets
   - Target: 30% reduction

3. **Order Clarity:**
   - % of orders with accurate shipment tracking
   - Target: 95%+

4. **System Performance:**
   - Order detail page load time
   - Target: <500ms (no regression)

---

## 12. Open Questions (For Discussion)

### ❓ Question 1: Split Shipments from Same Seller?

**Scenario:** Seller has 3 items in order, ships 2 now and 1 later.

**Option A:** One shipment per seller (current design)
- ✅ Simpler implementation
- ❌ Can't handle split shipments

**Option B:** Allow multiple shipments per seller
- ✅ More flexible
- ❌ More complex

**Recommendation:** Start with Option A, add Option B if needed

---

### ❓ Question 2: Shipment Status vs Delivery Status?

**Current Design:**
- `ShipmentStatus`: PENDING, PREPARING, SHIPPED, IN_TRANSIT, DELIVERED
- `DeliveryStatus`: (existing, order-level)

**Question:** Should we consolidate or keep separate?

**Recommendation:** Keep separate - shipments are seller-level, delivery is order-level

---

### ❓ Question 3: Tracking Integration?

**Current:** Manual tracking numbers

**Future:** Auto-sync with DHL/FedEx APIs?

**Recommendation:** Start with manual, add API integration in Phase 2

---

### ❓ Question 4: Payment Capture Timing?

**Current:** Payment captured after ENTIRE order delivered

**Question:** Should we capture payment per shipment (as each seller's items are delivered)?

**Recommendation:** Keep current escrow model (capture after all items delivered) for simplicity

---

## 13. Approval Checklist

Before implementation, confirm:

- [ ] **Schema design approved** by team
- [ ] **Migration strategy approved** by DevOps
- [ ] **API design approved** by frontend team
- [ ] **UI/UX designs approved** by product team
- [ ] **Timeline approved** by project manager
- [ ] **Risk mitigation plan approved** by stakeholders

---

**Next Step:** Review this design document and provide feedback.

Once approved, implementation will begin with Phase 1 (Database Migration).

---

**Document Status:** 🟡 AWAITING APPROVAL
**Last Updated:** February 1, 2026
**Author:** Claude Code (AI Assistant)
**Review Required By:** Project Team
