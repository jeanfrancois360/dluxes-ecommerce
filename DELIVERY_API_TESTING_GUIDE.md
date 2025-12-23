# 🧪 Delivery API Testing Guide

**Last Updated:** December 22, 2025

This guide provides complete instructions for testing all delivery-related API endpoints using Postman, Thunder Client, or curl.

---

## 📋 Table of Contents

1. [Setup & Authentication](#setup--authentication)
2. [Admin Delivery Endpoints](#admin-delivery-endpoints)
3. [Buyer Delivery Endpoints](#buyer-delivery-endpoints)
4. [Delivery Company Endpoints](#delivery-company-endpoints)
5. [General Delivery Endpoints](#general-delivery-endpoints)
6. [Complete Test Scenarios](#complete-test-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Setup & Authentication

### Base URL
```
http://localhost:4000/api/v1
```

### Required Headers
All authenticated endpoints require:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### Getting an Auth Token

**Admin Login:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@nextpik.com",
  "password": "Admin@123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@nextpik.com",
    "role": "ADMIN"
  }
}
```

Save the `access_token` and use it in subsequent requests.

---

## Admin Delivery Endpoints

### 1. Assign Delivery to Order

Assigns a delivery company to an order and creates a delivery record with tracking number.

**Endpoint:** `POST /admin/deliveries/assign`
**Auth:** ADMIN, SUPER_ADMIN
**Body:**
```json
{
  "orderId": "clx123...",
  "providerId": "clx456...",
  "driverId": "clx789...",  // Optional
  "expectedDeliveryDate": "2025-12-30T00:00:00Z",  // Optional
  "notes": "Handle with care - fragile items"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Delivery assigned successfully",
  "data": {
    "id": "clxabc...",
    "trackingNumber": "TRK1703345678XYZ",
    "orderId": "clx123...",
    "providerId": "clx456...",
    "currentStatus": "PENDING_PICKUP",
    "deliveryFee": 15.00,
    "partnerCommission": 3.75,
    "platformFee": 2.50,
    "expectedDeliveryDate": "2025-12-30T00:00:00Z",
    "createdAt": "2025-12-22T10:30:00Z",
    "provider": {
      "id": "clx456...",
      "name": "FedEx Express"
    },
    "order": {
      "orderNumber": "ORD-2025-001",
      "total": 1500.00
    }
  }
}
```

**Error Responses:**
```json
// Order not found
{
  "success": false,
  "message": "Order not found"
}

// Order already has delivery
{
  "success": false,
  "message": "Order already has a delivery assigned"
}

// Provider not active
{
  "success": false,
  "message": "Delivery provider is not active"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/deliveries/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "clx123...",
    "providerId": "clx456...",
    "expectedDeliveryDate": "2025-12-30T00:00:00Z"
  }'
```

---

### 2. Release Payout for Delivery

Manually releases payout after buyer confirmation. Automatically triggers escrow release.

**Endpoint:** `POST /admin/deliveries/:id/release-payout`
**Auth:** ADMIN, SUPER_ADMIN
**Params:** `id` - Delivery ID
**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payout released successfully",
  "data": {
    "id": "clxabc...",
    "trackingNumber": "TRK1703345678XYZ",
    "currentStatus": "DELIVERED",
    "buyerConfirmed": true,
    "buyerConfirmedAt": "2025-12-28T14:00:00Z",
    "payoutReleased": true,
    "payoutReleasedAt": "2025-12-28T15:00:00Z",
    "payoutReleasedBy": "admin-user-id",
    "partnerCommission": 3.75
  }
}
```

**Error Responses:**
```json
// Delivery not delivered yet
{
  "success": false,
  "message": "Delivery must be marked as delivered first"
}

// Buyer hasn't confirmed
{
  "success": false,
  "message": "Buyer must confirm receipt before payout can be released"
}

// Payout already released
{
  "success": false,
  "message": "Payout has already been released for this delivery"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/deliveries/clxabc123/release-payout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 3. Get All Deliveries (Admin)

Retrieves all deliveries with optional filters and pagination.

**Endpoint:** `GET /admin/deliveries`
**Auth:** ADMIN, SUPER_ADMIN
**Query Params:**
- `status` - Filter by delivery status (PENDING_PICKUP, DELIVERED, etc.)
- `providerId` - Filter by delivery provider
- `buyerConfirmed` - Filter by buyer confirmation (true/false)
- `payoutReleased` - Filter by payout status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example Request:**
```
GET /admin/deliveries?status=DELIVERED&buyerConfirmed=true&payoutReleased=false&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "trackingNumber": "TRK1703345678XYZ",
      "currentStatus": "DELIVERED",
      "buyerConfirmed": true,
      "payoutReleased": false,
      "deliveryFee": 15.00,
      "partnerCommission": 3.75,
      "createdAt": "2025-12-20T10:00:00Z",
      "deliveredAt": "2025-12-27T16:30:00Z",
      "order": {
        "orderNumber": "ORD-2025-001",
        "total": 1500.00,
        "status": "DELIVERED",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      },
      "provider": {
        "name": "FedEx Express",
        "type": "COURIER"
      },
      "deliveryPartner": {
        "firstName": "Mike",
        "lastName": "Driver",
        "email": "mike@fedex.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/deliveries?status=DELIVERED&buyerConfirmed=true&payoutReleased=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get Delivery Statistics

Retrieves KPIs for admin dashboard.

**Endpoint:** `GET /admin/deliveries/statistics`
**Auth:** ADMIN, SUPER_ADMIN
**Query Params:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 12,
    "inTransit": 25,
    "delivered": 100,
    "awaitingConfirmation": 8,
    "awaitingPayout": 15,
    "payoutReleased": 77
  }
}
```

**Description of KPIs:**
- `total` - Total deliveries in system
- `pending` - PENDING_PICKUP or PICKUP_SCHEDULED status
- `inTransit` - PICKED_UP, IN_TRANSIT, or OUT_FOR_DELIVERY status
- `delivered` - DELIVERED status
- `awaitingConfirmation` - Delivered but buyer hasn't confirmed
- `awaitingPayout` - Buyer confirmed but admin hasn't released payout
- `payoutReleased` - Payout has been released

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/deliveries/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Audit Logs for Delivery

Retrieves complete audit trail for a delivery.

**Endpoint:** `GET /admin/deliveries/:id/audit-logs`
**Auth:** ADMIN, SUPER_ADMIN
**Params:** `id` - Delivery ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Audit logs endpoint - to be implemented",
  "data": []
}
```

*Note: This endpoint is a placeholder. Full implementation will return audit log entries.*

---

## Buyer Delivery Endpoints

### 1. Get Delivery by Order

Retrieves delivery information for a specific order.

**Endpoint:** `GET /deliveries/order/:orderId`
**Auth:** Any authenticated user (validated by ownership)
**Params:** `orderId` - Order ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "trackingNumber": "TRK1703345678XYZ",
    "currentStatus": "DELIVERED",
    "buyerConfirmed": false,
    "deliveredAt": "2025-12-27T16:30:00Z",
    "expectedDeliveryDate": "2025-12-27T00:00:00Z",
    "provider": {
      "id": "clx456...",
      "name": "FedEx Express",
      "logo": "https://...",
      "phone": "+250 788 123 456"
    },
    "deliveryAddress": {
      "name": "John Doe",
      "address1": "123 Main St",
      "city": "Kigali",
      "country": "Rwanda"
    },
    "proofOfDeliveryUrl": "https://storage.../proof.jpg"
  }
}
```

**Error Response:**
```json
// Order not found or user doesn't own it
{
  "success": false,
  "message": "Delivery not found"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/deliveries/order/clxorder123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Buyer Confirms Delivery

Buyer confirms they received the delivery.

**Endpoint:** `POST /deliveries/:id/buyer-confirm`
**Auth:** BUYER, CUSTOMER (validated by order ownership)
**Params:** `id` - Delivery ID
**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Delivery confirmed successfully",
  "data": {
    "id": "clx123...",
    "trackingNumber": "TRK1703345678XYZ",
    "currentStatus": "DELIVERED",
    "buyerConfirmed": true,
    "buyerConfirmedAt": "2025-12-27T17:00:00Z",
    "payoutReleased": false
  }
}
```

**Error Responses:**
```json
// User doesn't own the order
{
  "success": false,
  "message": "Unauthorized"
}

// Delivery not marked as delivered yet
{
  "success": false,
  "message": "Delivery must be marked as delivered before confirmation"
}

// Already confirmed
{
  "success": false,
  "message": "Delivery has already been confirmed"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:4000/api/v1/deliveries/clx123/buyer-confirm \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Delivery Company Endpoints

### 1. Get Company Deliveries

Get all deliveries assigned to your delivery company.

**Endpoint:** `GET /delivery-company/deliveries`
**Auth:** DELIVERY_PROVIDER_ADMIN
**Query Params:**
- `status` - Filter by status
- `dateFrom` - Filter by start date
- `dateTo` - Filter by end date
- `country` - Filter by delivery country
- `page` - Page number
- `limit` - Items per page

**Success Response (200):**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  },
  "provider": {
    "id": "clx456...",
    "name": "FedEx Express"
  }
}
```

---

### 2. Get Company Statistics

Get KPIs for your delivery company.

**Endpoint:** `GET /delivery-company/statistics`
**Auth:** DELIVERY_PROVIDER_ADMIN

**Success Response (200):**
```json
{
  "provider": {
    "id": "clx456...",
    "name": "FedEx Express",
    "logo": "https://..."
  },
  "kpis": {
    "totalAssigned": 150,
    "pendingPickup": 10,
    "inTransit": 25,
    "delivered": 115,
    "averageRating": 4.8,
    "totalEarnings": 562.50,
    "averageDeliveryTime": 3.2,
    "deliveryRate": 76.67
  }
}
```

---

### 3. Assign Delivery to Driver

Assign a delivery to one of your company's drivers.

**Endpoint:** `POST /delivery-company/deliveries/:id/assign-driver`
**Auth:** DELIVERY_PROVIDER_ADMIN
**Params:** `id` - Delivery ID
**Body:**
```json
{
  "driverId": "clx789..."
}
```

**Success Response (200):**
```json
{
  "id": "clx123...",
  "trackingNumber": "TRK1703345678XYZ",
  "deliveryPartnerId": "clx789...",
  "assignedAt": "2025-12-22T12:00:00Z",
  "deliveryPartner": {
    "firstName": "Mike",
    "lastName": "Driver",
    "email": "mike@fedex.com"
  }
}
```

---

### 4. Get Company Drivers

Get all drivers in your delivery company.

**Endpoint:** `GET /delivery-company/drivers`
**Auth:** DELIVERY_PROVIDER_ADMIN

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "clx789...",
      "firstName": "Mike",
      "lastName": "Driver",
      "email": "mike@fedex.com",
      "phone": "+250 788 999 888",
      "stats": {
        "totalAssigned": 50,
        "activeDeliveries": 3,
        "deliveredCount": 47,
        "averageRating": 4.9
      },
      "deliveryAssignments": [
        {
          "id": "clx...",
          "currentStatus": "IN_TRANSIT",
          "trackingNumber": "TRK..."
        }
      ]
    }
  ],
  "provider": {
    "id": "clx456...",
    "name": "FedEx Express"
  }
}
```

---

## General Delivery Endpoints

### 1. Track Delivery (Public)

Track a delivery by tracking number - no authentication required.

**Endpoint:** `GET /deliveries/track/:trackingNumber`
**Auth:** None (public)
**Params:** `trackingNumber` - Tracking number

**Success Response (200):**
```json
{
  "trackingNumber": "TRK1703345678XYZ",
  "currentStatus": "IN_TRANSIT",
  "expectedDeliveryDate": "2025-12-27T00:00:00Z",
  "statusHistory": [
    {
      "status": "PENDING_PICKUP",
      "timestamp": "2025-12-20T10:00:00Z"
    },
    {
      "status": "PICKED_UP",
      "timestamp": "2025-12-21T09:30:00Z"
    },
    {
      "status": "IN_TRANSIT",
      "timestamp": "2025-12-22T08:00:00Z"
    }
  ],
  "provider": {
    "name": "FedEx Express",
    "phone": "+250 788 123 456"
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:4000/api/v1/deliveries/track/TRK1703345678XYZ
```

---

## Complete Test Scenarios

### Scenario 1: Complete Delivery Flow (Happy Path)

**Step 1: Admin assigns delivery to order**
```bash
POST /admin/deliveries/assign
{
  "orderId": "ORDER_ID",
  "providerId": "FEDEX_PROVIDER_ID"
}
# Response: Delivery created with tracking number, status: PENDING_PICKUP
```

**Step 2: Company admin assigns driver**
```bash
POST /delivery-company/deliveries/DELIVERY_ID/assign-driver
{
  "driverId": "DRIVER_ID"
}
# Response: Driver assigned
```

**Step 3: Driver updates status to picked up**
```bash
PUT /deliveries/DELIVERY_ID/status
{
  "status": "PICKED_UP",
  "notes": "Package picked up from warehouse"
}
# Response: Status updated
```

**Step 4: Driver updates status to delivered**
```bash
PUT /deliveries/DELIVERY_ID/status
{
  "status": "DELIVERED",
  "notes": "Package delivered to customer"
}
# Response: Status updated, buyer can now confirm
```

**Step 5: Buyer confirms receipt**
```bash
POST /deliveries/DELIVERY_ID/buyer-confirm
# Response: Delivery confirmed, ready for payout
```

**Step 6: Admin releases payout**
```bash
POST /admin/deliveries/DELIVERY_ID/release-payout
# Response: Payout released, escrow released
```

---

### Scenario 2: Admin Views Dashboard

**Step 1: Get statistics**
```bash
GET /admin/deliveries/statistics
# Shows all KPIs
```

**Step 2: Get deliveries awaiting payout**
```bash
GET /admin/deliveries?buyerConfirmed=true&payoutReleased=false
# Shows all deliveries ready for payout
```

**Step 3: Release payout for each**
```bash
POST /admin/deliveries/:id/release-payout
# For each delivery in the list
```

---

### Scenario 3: Buyer Checks Order Delivery

**Step 1: Buyer views order details**
```bash
GET /deliveries/order/ORDER_ID
# Shows delivery info, tracking number, status
```

**Step 2: Buyer tracks delivery publicly**
```bash
GET /deliveries/track/TRACKING_NUMBER
# Shows current location/status
```

**Step 3: When delivered, buyer confirms**
```bash
POST /deliveries/DELIVERY_ID/buyer-confirm
# Confirms receipt
```

---

### Scenario 4: Company Admin Manages Deliveries

**Step 1: View all company deliveries**
```bash
GET /delivery-company/deliveries?status=PENDING_PICKUP
# Shows deliveries needing pickup
```

**Step 2: Check driver availability**
```bash
GET /delivery-company/drivers
# Shows all drivers and active deliveries
```

**Step 3: Assign to available driver**
```bash
POST /delivery-company/deliveries/:id/assign-driver
{
  "driverId": "..."
}
```

**Step 4: Monitor statistics**
```bash
GET /delivery-company/statistics
# Shows company KPIs
```

---

## Troubleshooting

### Common Errors

**401 Unauthorized**
- Check that Authorization header is present
- Verify token is not expired
- Ensure token format is `Bearer YOUR_TOKEN`

**403 Forbidden**
- User role doesn't have permission for this endpoint
- Check that user has ADMIN, SUPER_ADMIN, or appropriate role

**404 Not Found**
- Delivery/Order/Provider ID doesn't exist
- Check that IDs are correct
- Ensure entities are created before referencing

**400 Bad Request - Order already has delivery**
- Each order can only have one delivery
- Check if delivery already exists: `GET /deliveries/order/:orderId`

**400 Bad Request - Delivery must be marked as delivered**
- Status must be DELIVERED before buyer can confirm
- Update status first: `PUT /deliveries/:id/status` with `status: "DELIVERED"`

**400 Bad Request - Buyer must confirm receipt**
- Payout can only be released after buyer confirmation
- Buyer must call: `POST /deliveries/:id/buyer-confirm`

---

## Testing Checklist

### Admin Endpoints
- [ ] Assign delivery to order
- [ ] Assign delivery with optional driver
- [ ] Assign delivery with expected date
- [ ] Release payout after buyer confirmation
- [ ] Get all deliveries with no filters
- [ ] Get deliveries filtered by status
- [ ] Get deliveries filtered by buyer confirmed
- [ ] Get deliveries filtered by payout released
- [ ] Get delivery statistics

### Buyer Endpoints
- [ ] Get delivery by order ID
- [ ] Buyer confirms delivery
- [ ] Buyer can't confirm before delivered status
- [ ] Buyer can't confirm someone else's order

### Company Endpoints
- [ ] Get all company deliveries
- [ ] Filter deliveries by status
- [ ] Filter deliveries by date range
- [ ] Get company statistics
- [ ] Assign delivery to driver
- [ ] Get all company drivers
- [ ] View driver stats

### Public Endpoints
- [ ] Track delivery by tracking number (no auth)
- [ ] Invalid tracking number returns 404

### Error Scenarios
- [ ] Unauthorized access returns 401
- [ ] Wrong role returns 403
- [ ] Invalid IDs return 404
- [ ] Duplicate operations return 400

---

## API Response Format

All endpoints follow this consistent format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"  // Optional
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Postman Collection

A Postman collection with all these requests pre-configured is available at:
`/postman/delivery-api-collection.json`

Import this collection into Postman for easy testing.

---

**Testing Status:** Ready for API endpoint testing ✅
**Next Step:** Test all endpoints, then proceed to frontend development
