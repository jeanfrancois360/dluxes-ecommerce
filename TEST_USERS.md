# NextPik Test User Accounts

All test accounts have been seeded into the database for development and testing purposes.

## Password for All Accounts

**Password:** `Password123!`

---

## Test Accounts by Role

### SUPER_ADMIN (1 user)

| Email | Name | Phone | Role | Store | Dashboard |
|-------|------|-------|------|-------|-----------|
| superadmin@nextpik.com | Super Admin | +250788000001 | SUPER_ADMIN | N/A | http://localhost:3000/admin/dashboard |

**Permissions:** Full platform access, system settings, user management, all admin capabilities.

---

### ADMIN (2 users)

| Email | Name | Phone | Role | Store | Dashboard |
|-------|------|-------|------|-------|-----------|
| admin1@nextpik.com | Admin One | +250788000002 | ADMIN | N/A | http://localhost:3000/admin/dashboard |
| admin2@nextpik.com | Admin Two | +250788000003 | ADMIN | N/A | http://localhost:3000/admin/dashboard |

**Permissions:** Platform administration, manage products, orders, users (limited system settings access).

---

### BUYER (3 users)

| Email | Name | Phone | Role | Preferred Currency | Dashboard |
|-------|------|-------|------|-------------------|-----------|
| buyer1@nextpik.com | Buyer One | +250788000010 | BUYER | USD | http://localhost:3000/dashboard/buyer |
| buyer2@nextpik.com | Buyer Two | +250788000011 | BUYER | EUR | http://localhost:3000/dashboard/buyer |
| buyer3@nextpik.com | Buyer Three | +250788000012 | BUYER | RWF | http://localhost:3000/dashboard/buyer |

**Permissions:** Browse products, add to cart, place orders, manage wishlist, write reviews.

---

### SELLER (3 users with Stores)

| Email | Name | Phone | Role | Store Name | Store Slug | Dashboard |
|-------|------|-------|------|------------|------------|-----------|
| seller1@nextpik.com | Seller One | +250788000020 | SELLER | Luxury Timepieces | luxury-timepieces | http://localhost:3000/seller/dashboard |
| seller2@nextpik.com | Seller Two | +250788000021 | SELLER | Elegant Jewelry Co | elegant-jewelry-co | http://localhost:3000/seller/dashboard |
| seller3@nextpik.com | Seller Three | +250788000022 | SELLER | Fashion Forward | fashion-forward | http://localhost:3000/seller/dashboard |

**Permissions:** Manage own products, view sales, create advertisements, track commissions and payouts.

**Note:** All seller stores are pre-approved (status: ACTIVE).

---

### DELIVERY_PARTNER (2 users)

| Email | Name | Phone | Role | Delivery Provider | Dashboard |
|-------|------|-------|------|------------------|-----------|
| deliverypartner1@nextpik.com | Delivery Partner One | +250788000030 | DELIVERY_PARTNER | NextPik Express | http://localhost:3000/delivery-partner/dashboard |
| deliverypartner2@nextpik.com | Delivery Partner Two | +250788000031 | DELIVERY_PARTNER | FedEx | http://localhost:3000/delivery-partner/dashboard |

**Permissions:** View assigned deliveries, update delivery status, upload delivery proof.

---

## Legacy Accounts (Also Available)

| Email | Name | Role | Notes |
|-------|------|------|-------|
| admin@nextpik.com | Root Admin | SUPER_ADMIN | Original root account |

---

## Quick Reference

### Login URL
http://localhost:3000/auth/login

### API Base URL
http://localhost:4000/api/v1

### Test All Roles Quickly

```bash
# SUPER_ADMIN
Email: superadmin@nextpik.com
Password: Password123!

# ADMIN
Email: admin1@nextpik.com
Password: Password123!

# BUYER
Email: buyer1@nextpik.com
Password: Password123!

# SELLER
Email: seller1@nextpik.com
Password: Password123!

# DELIVERY_PARTNER
Email: deliverypartner1@nextpik.com
Password: Password123!
```

---

## Delivery Providers in Database

| Provider | Type | Service Type | Countries | API Enabled |
|----------|------|--------------|-----------|-------------|
| FedEx | API_INTEGRATED | INTERNATIONAL | US, CA, UK, FR, DE, JP, AU, RW | Yes |
| UPS | API_INTEGRATED | INTERNATIONAL | US, CA, UK, FR, DE, JP, AU | Yes |
| DHL Express | API_INTEGRATED | INTERNATIONAL | US, CA, UK, FR, DE, JP, AU, RW, KE, UG | Yes |
| NextPik Express | PARTNER | LOCAL | RW, UG, KE | No |

---

## Sample Data Seeded

- **Users:** 12 test accounts (1 super admin, 2 admins, 3 buyers, 3 sellers, 2 delivery partners)
- **Stores:** 3 active seller stores
- **Products:** 29 luxury products across 4 categories
- **Categories:** Watches, Jewelry, Accessories, Fashion
- **Currencies:** 8 active currencies (USD, EUR, GBP, RWF, JPY, CHF, CAD, AUD)
- **System Settings:** 10 configuration settings (escrow, payout, audit, commission)
- **Delivery Providers:** 4 providers (FedEx, UPS, DHL, NextPik Express)

---

## Testing Workflows

### Buyer Flow
1. Login as `buyer1@nextpik.com`
2. Browse products at http://localhost:3000/products
3. Add products to cart
4. Checkout and create order
5. Track order status

### Seller Flow
1. Login as `seller1@nextpik.com`
2. Go to seller dashboard http://localhost:3000/seller/dashboard
3. Manage products http://localhost:3000/seller/products
4. Create new product
5. View sales and earnings

### Admin Flow
1. Login as `admin1@nextpik.com`
2. Access admin dashboard http://localhost:3000/admin/dashboard
3. Manage all products, orders, users
4. Configure system settings
5. Manage delivery providers

### Delivery Partner Flow
1. Login as `deliverypartner1@nextpik.com`
2. View assigned deliveries
3. Update delivery status
4. Upload delivery proof

---

## Notes

- All accounts have `emailVerified: true` and `isActive: true`
- All sellers have active stores with pre-approval
- All delivery partners are linked to specific providers
- Password for all accounts is `Password123!`
- Database name: `nextpik_ecommerce`
- Database user: `postgres`
- Database port: `5433`

---

*Last Updated: December 26, 2025*
*Database Seeded: December 26, 2025*
