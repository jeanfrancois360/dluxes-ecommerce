# NextPik Test Credentials
**Last Updated:** January 18, 2026
**Database:** nextpik_ecommerce
**Standard Password:** `Password123!` (for all seeded accounts)

---

## 🔐 User Credentials by Role

### ADMIN Users
**Access:** Full platform management, settings, users, all stores, reports

| Email | Password | Email Verified | Status |
|-------|----------|----------------|--------|
| `admin1@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `admin2@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `testadmin@nextpik.com` | `Password123!` | ✅ Yes | Active |

**Recommended for testing:** `admin1@nextpik.com`

---

### SELLER Users
**Access:** Can sell products, manage own store, view own orders and payouts

| Email | Password | Email Verified | Status |
|-------|----------|----------------|--------|
| `seller1@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `seller2@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `seller3@nextpik.com` | `Password123!` | ✅ Yes | Active |

**Recommended for testing:** `seller1@nextpik.com`

---

### BUYER Users
**Access:** Can purchase products, manage cart, view orders, write reviews

| Email | Password | Email Verified | Status |
|-------|----------|----------------|--------|
| `buyer1@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `buyer2@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `buyer3@nextpik.com` | `Password123!` | ✅ Yes | Active |

**Recommended for testing:** `buyer1@nextpik.com`

---

### DELIVERY_PARTNER Users
**Access:** Can view assigned deliveries, update delivery status, manage earnings

| Email | Password | Email Verified | Status |
|-------|----------|----------------|--------|
| `deliverypartner1@nextpik.com` | `Password123!` | ✅ Yes | Active |
| `deliverypartner2@nextpik.com` | `Password123!` | ✅ Yes | Active |

**Recommended for testing:** `deliverypartner1@nextpik.com`

---

## 🚀 Quick Login Commands

### Admin Login
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@nextpik.com","password":"Password123!"}' | jq '.'
```

### Seller Login
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@nextpik.com","password":"Password123!"}' | jq '.'
```

### Buyer Login
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@nextpik.com","password":"Password123!"}' | jq '.'
```

### Delivery Partner Login
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deliverypartner1@nextpik.com","password":"Password123!"}' | jq '.'
```

---

## 🌐 Frontend Login URLs

### Admin Portal
```
http://localhost:3000/auth/login?returnUrl=/admin
Email: admin1@nextpik.com
Password: Password123!
```

### Seller Portal
```
http://localhost:3000/auth/login?returnUrl=/seller
Email: seller1@nextpik.com
Password: Password123!
```

### Buyer Account
```
http://localhost:3000/auth/login
Email: buyer1@nextpik.com
Password: Password123!
```

### Delivery Partner Portal
```
http://localhost:3000/auth/login?returnUrl=/delivery-partner
Email: deliverypartner1@nextpik.com
Password: Password123!
```

---

## 📊 User Database Stats

```sql
-- Count users by role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
```

**Current Distribution:**
- ADMIN: 3 users
- SELLER: 3 users
- BUYER: 17+ users (including test accounts)
- DELIVERY_PARTNER: 2 users

---

## 🔧 Testing Workflows

### Complete Purchase Flow
1. **Login as Buyer:** `buyer1@nextpik.com`
2. Browse products at `http://localhost:3000/products`
3. Add to cart
4. Checkout with Stripe test card: `4242 4242 4242 4242`
5. View order in buyer account

### Seller Management Flow
1. **Login as Seller:** `seller1@nextpik.com`
2. Go to `http://localhost:3000/seller`
3. Create/manage products
4. View orders
5. Check payout status

### Admin Management Flow
1. **Login as Admin:** `admin1@nextpik.com`
2. Go to `http://localhost:3000/admin`
3. Manage all users, stores, products
4. Configure system settings
5. View platform analytics

### Delivery Flow
1. **Login as Delivery Partner:** `deliverypartner1@nextpik.com`
2. Go to `http://localhost:3000/delivery-partner`
3. View assigned deliveries
4. Update delivery status
5. Track earnings

---

## 🧪 Stripe Test Cards

For testing payments with any buyer account:

| Card Number | Description | Use Case |
|-------------|-------------|----------|
| `4242 4242 4242 4242` | Successful payment | Normal checkout |
| `4000 0025 0000 3155` | Requires authentication | 3D Secure testing |
| `4000 0000 0000 9995` | Declined card | Error handling |
| `4000 0000 0000 0002` | Declined - insufficient funds | Error handling |

**Card Details:**
- Any future expiry date (e.g., `12/26`)
- Any 3-digit CVC (e.g., `123`)
- Any postal code (e.g., `12345`)

---

## 🔑 API Token Usage

After logging in via API, you'll receive an access token:

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin1@nextpik.com",
    "role": "ADMIN"
  }
}
```

**Use the token in subsequent requests:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 Notes

- All seeded users have **verified emails** and are **active**
- Password for all seeded accounts: `Password123!`
- Test buyer accounts (with `@example.com`) were created during testing and may not have verified emails
- All credentials work on both frontend (http://localhost:3000) and API (http://localhost:4000)
- Two-factor authentication (2FA) is **disabled by default** for seeded accounts

---

## 🔒 Security Notes

**⚠️ FOR DEVELOPMENT ONLY**

These are test credentials for local development. Never use these in production:

1. Change all passwords before deploying to production
2. Use environment-specific secrets
3. Enable 2FA for admin accounts in production
4. Regular password rotation policy
5. Monitor login attempts and failed authentications

---

## 🆘 Troubleshooting

### "Invalid credentials" error
1. Verify you're using exactly `Password123!` (case-sensitive)
2. Ensure email is exactly as listed (e.g., `admin1@nextpik.com`)
3. Check if API is running: `curl http://localhost:4000/api/v1/health`
4. Verify database connection: `docker ps | grep postgres`

### Can't access admin pages
1. Ensure you're logged in with ADMIN role
2. Check JWT token is valid
3. Clear browser cookies/localStorage
4. Try logging in again

### Email verification issues
All seeded accounts are pre-verified. If you created a new account:
```sql
-- Manually verify email in database
UPDATE users
SET "emailVerified" = true
WHERE email = 'your-email@example.com';
```

---

*Generated: January 18, 2026*
*NextPik v2.6.0*
