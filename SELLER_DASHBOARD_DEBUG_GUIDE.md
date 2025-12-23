# 🔍 Seller Dashboard Debugging Guide

## Issue: "Failed to load dashboard"

The seller dashboard is showing an error. Let's debug this step by step.

---

## 🔧 Step 1: Check Browser Console

1. Open your browser's Developer Tools:
   - **Mac**: `Cmd + Option + I`
   - **Windows/Linux**: `F12` or `Ctrl + Shift + I`

2. Go to the **Console** tab

3. Look for error messages that show:
   - Red errors (API failures)
   - Network errors (401, 403, 404, 500)
   - CORS errors

**Common Errors:**

### Error 1: "Store not found"
```
GET http://localhost:4000/seller/dashboard 404 (Not Found)
Error: Store not found. Please create a store first.
```

**Solution:** You need to create a seller store first.

### Error 2: "Unauthorized" (401)
```
GET http://localhost:4000/seller/dashboard 401 (Unauthorized)
```

**Solution:** Your authentication token may be expired. Try logging out and logging back in.

### Error 3: "Forbidden" (403)
```
GET http://localhost:4000/seller/dashboard 403 (Forbidden)
```

**Solution:** Your user role is not SELLER. Check your user role in the database.

---

## 🔧 Step 2: Check Your User Role

1. Open browser console
2. Type this and press Enter:
   ```javascript
   localStorage.getItem('user')
   ```

3. Look at the response. Your role should be `"role":"SELLER"`

**If your role is NOT SELLER:**
- You need to create a seller store first
- Creating a store automatically upgrades your role to SELLER

---

## 🔧 Step 3: Check if You Have a Store

### Option A: Check via API (Browser Console)

```javascript
// Check if you have a store
fetch('http://localhost:4000/stores/me/store', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('Store:', data))
.catch(err => console.error('Error:', err));
```

### Option B: Check via Database

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5433 -d luxury_ecommerce

# Check your user and store
SELECT u.id, u.email, u.role, s.name as store_name, s.status as store_status
FROM users u
LEFT JOIN stores s ON s."userId" = u.id
WHERE u.email = 'your-email@example.com';
```

**Expected Result:**
- If you see a store_name → You have a store ✅
- If store_name is NULL → You need to create a store ❌

---

## 🔧 Step 4: Test API Endpoints Manually

Open a new terminal and test each endpoint:

### Test 1: Dashboard Endpoint
```bash
# Replace YOUR_TOKEN with your actual JWT token from localStorage
curl -X GET http://localhost:4000/seller/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** JSON response with store, products, orders, payouts data

### Test 2: Revenue Analytics
```bash
curl -X GET "http://localhost:4000/seller/analytics/revenue?period=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** JSON response with revenue data and trend

### Test 3: Order Breakdown
```bash
curl -X GET http://localhost:4000/seller/analytics/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** JSON response with order status counts

---

## 🔧 Step 5: Create a Seller Store (If You Don't Have One)

### Option A: Via API

```bash
curl -X POST http://localhost:4000/stores \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Store",
    "slug": "my-test-store",
    "email": "store@example.com",
    "description": "My awesome store"
  }'
```

### Option B: Via UI

1. Go to `/become-seller` page (if it exists)
2. Fill out the store creation form
3. Submit the form
4. Wait for admin approval (store status will be PENDING)

### Option C: Via Database (Quick Fix for Testing)

```sql
-- Connect to database
psql -U postgres -h localhost -p 5433 -d luxury_ecommerce

-- Create a store for your user
INSERT INTO stores (
  id,
  "userId",
  name,
  slug,
  email,
  status,
  "isActive",
  verified
)
VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',  -- Replace with your actual user ID
  'Test Store',
  'test-store-' || floor(random() * 10000),
  'teststore@example.com',
  'ACTIVE',  -- Set to ACTIVE so you can use it immediately
  true,
  true
);

-- Update your user role to SELLER
UPDATE users SET role = 'SELLER' WHERE id = 'YOUR_USER_ID_HERE';

-- Verify
SELECT * FROM stores WHERE "userId" = 'YOUR_USER_ID_HERE';
```

---

## 🔧 Step 6: Check Backend Logs

Look at your terminal where the backend is running (`pnpm dev`).

Look for:
- Error messages
- 404 Not Found
- 500 Internal Server Error
- Database connection errors

**Common Backend Errors:**

### Error: "Store not found"
```
[Nest] ERROR [SellerService] Store not found for user: xxx
```
**Solution:** Create a store (see Step 5)

### Error: "Invalid token"
```
[Nest] ERROR [JwtAuthGuard] Unauthorized
```
**Solution:** Log out and log back in

### Error: Database connection
```
[Nest] ERROR [PrismaClient] Can't reach database server
```
**Solution:** Make sure PostgreSQL is running on port 5433

---

## 🔧 Step 7: Quick Fix Script

Save this as `fix-seller-dashboard.js` and run it:

```javascript
// fix-seller-dashboard.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSellerDashboard(userEmail) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { store: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✓ User found:', user.email);
    console.log('Current role:', user.role);

    // Check if user has a store
    if (!user.store) {
      console.log('❌ No store found. Creating store...');

      // Create store
      const store = await prisma.store.create({
        data: {
          userId: user.id,
          name: `${user.firstName || 'Test'} Store`,
          slug: `store-${user.id.substring(0, 8)}`,
          email: user.email,
          status: 'ACTIVE',
          isActive: true,
          verified: true,
        }
      });

      console.log('✓ Store created:', store.name);
    } else {
      console.log('✓ Store exists:', user.store.name);
      console.log('Store status:', user.store.status);

      // If store is PENDING, activate it
      if (user.store.status !== 'ACTIVE') {
        await prisma.store.update({
          where: { id: user.store.id },
          data: { status: 'ACTIVE' }
        });
        console.log('✓ Store activated');
      }
    }

    // Update user role to SELLER
    if (user.role !== 'SELLER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SELLER' }
      });
      console.log('✓ User role updated to SELLER');
    }

    console.log('\n✅ All fixed! Try refreshing the dashboard now.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Replace with your email
fixSellerDashboard('your-email@example.com');
```

**Run it:**
```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce
node fix-seller-dashboard.js
```

---

## 🔧 Step 8: Test Credentials

According to `TEST_CREDENTIALS.md`, there should be test seller accounts.

Try logging in with a seller account that already exists:
- Check `TEST_CREDENTIALS.md` file
- Use an account with SELLER role
- Make sure that account has a store

---

## 📝 Checklist

Before the dashboard will work, verify:

- [ ] Backend is running (`pnpm dev`)
- [ ] Frontend is running (Next.js on port 3000)
- [ ] PostgreSQL is running (port 5433)
- [ ] You're logged in with a valid token
- [ ] Your user role is SELLER
- [ ] You have a store in the database
- [ ] Your store status is ACTIVE
- [ ] API endpoint `/seller/dashboard` returns 200 (not 404/401/403)

---

## 🆘 Still Not Working?

1. **Check the improved error message:**
   - The error screen now shows more details
   - Check browser console for specific errors

2. **Provide the following info for debugging:**
   - Browser console errors (screenshot)
   - Backend terminal logs (copy/paste)
   - Your user role and email
   - Whether you have a store (yes/no)

3. **Quick Test:**
   ```bash
   # Check if backend is responding
   curl http://localhost:4000/health

   # Check if you're authenticated
   curl http://localhost:4000/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## ✅ Solution Summary

**Most Common Issue:** User doesn't have a seller store yet.

**Quick Fix:**
1. Create a store via API or database
2. Set user role to SELLER
3. Set store status to ACTIVE
4. Refresh the dashboard

**Alternative:** Use an existing test seller account from `TEST_CREDENTIALS.md`
