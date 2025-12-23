# 🔐 Test Account Credentials

## Overview
This document contains all test account credentials for the Luxury E-commerce platform.
All accounts use the same password for easy testing: **Test@123**

---

## 📋 Complete Test Accounts

### 1. BUYER Role
```
Email:     buyer@test.com
Password:  Test@123
Role:      BUYER
Dashboard: http://localhost:3000/dashboard/buyer
```

### 2. CUSTOMER Role (Legacy)
```
Email:     customer@test.com
Password:  Test@123
Role:      CUSTOMER
Dashboard: http://localhost:3000/dashboard/buyer
```

### 3. SELLER Role
```
Email:     seller@test.com
Password:  Test@123
Role:      SELLER
Dashboard: http://localhost:3000/dashboard/seller
Products:  http://localhost:3000/seller/products
```

### 4. ADMIN Role
```
Email:     admin@test.com
Password:  Test@123
Role:      ADMIN
Dashboard: http://localhost:3000/admin/dashboard
```

### 5. SUPER_ADMIN Role
```
Email:     superadmin@test.com
Password:  Test@123
Role:      SUPER_ADMIN
Dashboard: http://localhost:3000/admin/dashboard
```

### 6. DELIVERY_PARTNER Role
```
Email:     delivery-partner@test.com
Password:  DeliveryTest@123
Role:      DELIVERY_PARTNER
Provider:  NextPik Express
Dashboard: http://localhost:3000/delivery-partner/dashboard
Deliveries: http://localhost:3000/delivery-partner/deliveries
Earnings:  http://localhost:3000/delivery-partner/earnings
```

---

## 🚚 Delivery System Test Data

### Delivery Providers
1. **FedEx International** - API integrated, worldwide shipping
2. **DHL Express** - API integrated, worldwide shipping
3. **UPS Worldwide** - API integrated, worldwide shipping
4. **NextPik Express** - Local partner, East Africa region

### Test Order with Delivery Tracking
After seeding, you'll have test orders with delivery tracking.
- View tracking: http://localhost:3000/track/{trackingNumber}
- View order details: http://localhost:3000/account/orders/{orderId}

---

## 🚀 Quick Reference

**Login URL:** http://localhost:3000/auth/login

**Standard Password:** Test@123
**Delivery Partner Password:** DeliveryTest@123

**Role Hierarchy:**
```
SUPER_ADMIN → ADMIN → SELLER → DELIVERY_PARTNER → BUYER/CUSTOMER
```

---

**Last Updated:** 2025-12-20
