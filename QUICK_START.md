# 🚀 Quick Start Guide - Luxury E-commerce Platform

## Get Your Platform Running in 5 Minutes

### Prerequisites
- Docker Desktop running
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

---

## Step 1: Start Database (30 seconds)

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis
```

---

## Step 2: Configure Stripe (2 minutes)

Get test keys from https://dashboard.stripe.com/test/apikeys

**Backend** (`apps/api/.env`):
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## Step 3: Start Services

```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

---

## Step 4: Test

1. Open: http://localhost:3000
2. Register an account
3. Add products to cart
4. Checkout with test card: **4242 4242 4242 4242**
5. See confetti! 🎉

---

## 📚 Full Documentation

- **IMPLEMENTATION_SUMMARY.md** - Backend features
- **FRONTEND_INTEGRATION_GUIDE.md** - Frontend details

**Happy selling! 🎉**
