# 🧪 Quick Test Guide - Escrow & Settings System

**Status**: ✅ All systems operational
**Base URL**: `http://localhost:4000/api/v1`

---

## 📋 Prerequisites

1. ✅ Server running on port 4000
2. ✅ Database migrated and connected
3. ✅ User accounts created (buyer, seller, admin)
4. ✅ JWT tokens obtained via `/auth/login`

---

## 🔐 Authentication

**Get JWT Token**:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**Use token in subsequent requests**:
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🏦 Escrow Endpoints

### 1. Seller: Get Escrow Summary

**Endpoint**: `GET /escrow/my-summary`
**Auth**: Required (SELLER role)

```bash
curl http://localhost:4000/api/v1/escrow/my-summary \
  -H "Authorization: Bearer SELLER_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalEscrow": "5000.00",
    "heldAmount": "2000.00",
    "pendingRelease": "1500.00",
    "releasedAmount": "1500.00",
    "transactionCount": 15,
    "currency": "USD"
  }
}
```

---

### 2. Seller: Get All Escrow Transactions

**Endpoint**: `GET /escrow/my-escrows`
**Auth**: Required (SELLER role)

```bash
curl http://localhost:4000/api/v1/escrow/my-escrows \
  -H "Authorization: Bearer SELLER_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "escrow_123",
      "orderId": "order_456",
      "totalAmount": "500.00",
      "platformFee": "50.00",
      "sellerAmount": "450.00",
      "status": "HELD",
      "deliveryConfirmed": false,
      "autoReleaseAt": "2025-12-07T00:00:00Z",
      "createdAt": "2025-11-30T12:00:00Z"
    }
  ]
}
```

---

### 3. Buyer: Confirm Delivery

**Endpoint**: `POST /escrow/confirm-delivery/:orderId`
**Auth**: Required (BUYER role)

```bash
curl -X POST http://localhost:4000/api/v1/escrow/confirm-delivery/order_456 \
  -H "Authorization: Bearer BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Package received in good condition"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "escrow_123",
    "status": "PENDING_RELEASE",
    "deliveryConfirmed": true,
    "deliveryConfirmedAt": "2025-11-30T12:30:00Z"
  },
  "message": "Delivery confirmed. Seller payment will be released after hold period."
}
```

---

### 4. Admin: Get All Escrows

**Endpoint**: `GET /escrow/admin/all`
**Auth**: Required (ADMIN role)

```bash
curl http://localhost:4000/api/v1/escrow/admin/all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "escrow_123",
      "orderId": "order_456",
      "sellerId": "seller_789",
      "totalAmount": "500.00",
      "status": "HELD",
      "createdAt": "2025-11-30T12:00:00Z",
      "seller": {
        "id": "seller_789",
        "email": "seller@example.com",
        "firstName": "John"
      },
      "order": {
        "orderNumber": "ORD-2025-001"
      }
    }
  ]
}
```

---

### 5. Admin: Get Escrow Statistics

**Endpoint**: `GET /escrow/admin/stats`
**Auth**: Required (ADMIN role)

```bash
curl http://localhost:4000/api/v1/escrow/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalEscrow": "50000.00",
    "heldAmount": "20000.00",
    "pendingReleaseAmount": "15000.00",
    "releasedAmount": "10000.00",
    "refundedAmount": "5000.00",
    "totalTransactions": 150,
    "averageEscrowAmount": "333.33",
    "currency": "USD",
    "byStatus": {
      "HELD": 60,
      "PENDING_RELEASE": 45,
      "RELEASED": 30,
      "REFUNDED": 15
    }
  }
}
```

---

### 6. Admin: Release Escrow Manually

**Endpoint**: `POST /escrow/admin/:escrowId/release`
**Auth**: Required (ADMIN role)

```bash
curl -X POST http://localhost:4000/api/v1/escrow/admin/escrow_123/release \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "escrow_123",
    "status": "RELEASED",
    "releasedAt": "2025-11-30T12:45:00Z"
  },
  "message": "Escrow released successfully"
}
```

---

### 7. Admin: Refund Escrow

**Endpoint**: `POST /escrow/admin/:escrowId/refund`
**Auth**: Required (ADMIN role)

```bash
curl -X POST http://localhost:4000/api/v1/escrow/admin/escrow_123/refund \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Order cancelled by buyer"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "escrow_123",
    "status": "REFUNDED",
    "refundedAt": "2025-11-30T12:50:00Z",
    "refundReason": "Order cancelled by buyer"
  },
  "message": "Escrow refunded successfully"
}
```

---

### 8. Admin: Trigger Auto-Release

**Endpoint**: `POST /escrow/admin/auto-release`
**Auth**: Required (ADMIN role)

```bash
curl -X POST http://localhost:4000/api/v1/escrow/admin/auto-release \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "releasedCount": 5,
    "releasedIds": ["escrow_123", "escrow_456", "escrow_789"]
  },
  "message": "Auto-release completed successfully"
}
```

---

## ⚙️ Settings Endpoints

### 1. Public: Get Public Settings

**Endpoint**: `GET /settings/public`
**Auth**: Not required

```bash
curl http://localhost:4000/api/v1/settings/public
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "key": "site_name",
      "value": "Luxury E-commerce",
      "valueType": "STRING",
      "category": "general"
    },
    {
      "key": "escrow_hold_days",
      "value": 7,
      "valueType": "NUMBER",
      "category": "payment"
    }
  ]
}
```

---

### 2. Get Setting by Key

**Endpoint**: `GET /settings/:key`
**Auth**: Required

```bash
curl http://localhost:4000/api/v1/settings/escrow_hold_days \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "setting_123",
    "key": "escrow_hold_days",
    "value": 7,
    "valueType": "NUMBER",
    "label": "Escrow Hold Period (Days)",
    "description": "Number of days to hold funds after delivery confirmation",
    "category": "payment",
    "isPublic": true,
    "isEditable": true
  }
}
```

---

### 3. Admin: Get All Settings

**Endpoint**: `GET /settings`
**Auth**: Required (ADMIN role)

```bash
curl http://localhost:4000/api/v1/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "setting_123",
      "key": "escrow_hold_days",
      "value": 7,
      "valueType": "NUMBER",
      "category": "payment",
      "isPublic": true,
      "createdAt": "2025-11-30T12:00:00Z"
    }
  ]
}
```

---

### 4. Admin: Create Setting

**Endpoint**: `POST /settings`
**Auth**: Required (ADMIN role)

```bash
curl -X POST http://localhost:4000/api/v1/settings \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max_order_value",
    "value": 100000,
    "valueType": "NUMBER",
    "label": "Maximum Order Value",
    "description": "Maximum allowed order value in USD",
    "category": "orders",
    "isPublic": false,
    "isEditable": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "setting_456",
    "key": "max_order_value",
    "value": 100000,
    "valueType": "NUMBER",
    "category": "orders"
  },
  "message": "Setting created successfully"
}
```

---

### 5. Admin: Update Setting

**Endpoint**: `PATCH /settings/:key`
**Auth**: Required (ADMIN role)

```bash
curl -X PATCH http://localhost:4000/api/v1/settings/escrow_hold_days \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 10,
    "reason": "Increasing hold period for better fraud protection"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "setting_123",
    "key": "escrow_hold_days",
    "value": 10,
    "oldValue": 7
  },
  "message": "Setting updated successfully"
}
```

---

### 6. Admin: Get Setting Audit Log

**Endpoint**: `GET /settings/:key/audit`
**Auth**: Required (ADMIN role)

```bash
curl http://localhost:4000/api/v1/settings/escrow_hold_days/audit \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_789",
      "settingKey": "escrow_hold_days",
      "oldValue": 7,
      "newValue": 10,
      "changedBy": "admin_123",
      "changedByEmail": "admin@example.com",
      "action": "UPDATE",
      "reason": "Increasing hold period for better fraud protection",
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-11-30T13:00:00Z",
      "canRollback": true
    }
  ]
}
```

---

### 7. Admin: Rollback Setting

**Endpoint**: `POST /settings/rollback`
**Auth**: Required (ADMIN role)

```bash
curl -X POST http://localhost:4000/api/v1/settings/rollback \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auditLogId": "audit_789"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "settingKey": "escrow_hold_days",
    "currentValue": 7,
    "previousValue": 10,
    "rolledBackAt": "2025-11-30T13:30:00Z"
  },
  "message": "Setting rolled back successfully"
}
```

---

### 8. Admin: Delete Setting

**Endpoint**: `DELETE /settings/:key`
**Auth**: Required (ADMIN role)

```bash
curl -X DELETE http://localhost:4000/api/v1/settings/max_order_value \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

---

## 🧪 Complete Test Flow

### Scenario: Complete Order with Escrow

**Step 1: Create Order** (existing endpoint)
```bash
# POST /api/v1/orders
# Creates order with items
```

**Step 2: Process Payment** (existing endpoint)
```bash
# POST /api/v1/payment/create-intent
# Payment is processed
```

**Step 3: Escrow Created Automatically** ✅ NEW
```
# Escrow transaction created with status: HELD
# Funds held in escrow
# Auto-release date set to 7 days from now
```

**Step 4: Buyer Confirms Delivery** ✅ NEW
```bash
curl -X POST http://localhost:4000/api/v1/escrow/confirm-delivery/order_456 \
  -H "Authorization: Bearer BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Received in good condition"}'
```

**Step 5: Status Changes** ✅ NEW
```
# Escrow status: HELD → PENDING_RELEASE
# Hold period starts (7 days)
```

**Step 6: Auto-Release After Hold Period** ✅ NEW
```
# After 7 days (or manual admin release)
# Escrow status: PENDING_RELEASE → RELEASED
# Funds transferred to seller
```

---

## 🎯 Testing Checklist

### Escrow Testing
- [ ] Seller can view escrow summary
- [ ] Seller can view all escrow transactions
- [ ] Buyer can confirm delivery
- [ ] Admin can view all escrows
- [ ] Admin can view escrow statistics
- [ ] Admin can manually release escrow
- [ ] Admin can refund escrow
- [ ] Admin can trigger auto-release

### Settings Testing
- [ ] Public can view public settings (no auth)
- [ ] Authenticated user can view setting by key
- [ ] Admin can view all settings
- [ ] Admin can create new setting
- [ ] Admin can update setting
- [ ] Admin can view audit log
- [ ] Admin can rollback setting change
- [ ] Admin can delete setting

---

## 🚨 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Ensure JWT token is valid and included in Authorization header

### Issue: 403 Forbidden
**Solution**: Ensure user has correct role (BUYER, SELLER, ADMIN)

### Issue: 404 Not Found
**Solution**: Check endpoint URL and ensure server is running on port 4000

### Issue: Escrow not created
**Solution**: Check that payment was successful first. Escrow requires valid order + payment.

### Issue: Cannot rollback setting
**Solution**: Check that `canRollback` is true in audit log entry

---

## 📊 Expected Database State After Testing

**After running all tests, you should have**:
- EscrowTransaction records with various statuses
- SettingsAuditLog records showing all changes
- SystemSetting records for configured settings
- DeliveryConfirmation records for confirmed orders

---

## ✅ Success Criteria

All tests pass if:
1. ✅ All endpoints return 200/201 status codes
2. ✅ Response format matches expected JSON structure
3. ✅ Database records created correctly
4. ✅ Audit logs created for settings changes
5. ✅ Escrow status transitions work correctly
6. ✅ Rollback functionality works

---

**Happy Testing!** 🧪

If you encounter any issues, check:
1. Server logs at the terminal
2. Database connection
3. JWT token validity
4. User roles and permissions
