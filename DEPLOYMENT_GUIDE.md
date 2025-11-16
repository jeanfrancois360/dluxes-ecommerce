# Deployment Guide - Luxury E-Commerce Platform

Complete deployment guide for the luxury e-commerce platform to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Third-Party Services](#third-party-services)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Services

- **Hosting Platform**: Vercel (frontend), Railway/Render/AWS (backend)
- **Database**: PostgreSQL 16+ (Neon, Supabase, or AWS RDS)
- **Cache/Queue**: Redis (Upstash, Redis Cloud, or AWS ElastiCache)
- **Search**: Meilisearch Cloud or self-hosted
- **Storage**: Cloudflare R2 or AWS S3
- **Email**: Resend or SendGrid
- **Payments**: Stripe account

### Required Accounts

1. Stripe account (test and live keys)
2. Resend account for email
3. Meilisearch Cloud (or server for self-hosting)
4. Cloudflare account (for R2 storage)
5. Domain name with DNS access

---

## Environment Configuration

### Backend (.env)

Create `apps/api/.env`:

```env
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/db_name
DATABASE_REPLICA_URL=postgresql://user:password@replica-host:5432/db_name

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://default:password@host:6379

# Meilisearch
MEILISEARCH_HOST=https://ms-xxxxx.meilisearch.io
MEILISEARCH_API_KEY=your-meilisearch-master-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=luxury-ecommerce
R2_PUBLIC_URL=https://cdn.yourdomain.com

# CORS
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your-session-secret-min-32-chars

# 2FA
TWO_FACTOR_AUTH_ENABLED=true
```

### Frontend (.env.local)

Create `apps/web/.env.local`:

```env
# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_2FA=true

# SEO
NEXT_PUBLIC_SITE_NAME=Luxury Marketplace
NEXT_PUBLIC_SITE_DESCRIPTION=Discover extraordinary lifestyle products
```

---

## Database Setup

### 1. Create Production Database

**Using Neon:**
```bash
# Create database
neon databases create luxury-ecommerce --region us-east-1

# Get connection string
neon connection-string luxury-ecommerce
```

**Using Supabase:**
```bash
# Create project
supabase projects create luxury-ecommerce

# Get connection string from dashboard
```

### 2. Run Migrations

```bash
cd packages/database

# Generate Prisma Client
pnpm prisma generate

# Push schema to production
pnpm prisma db push

# Or run migrations
pnpm prisma migrate deploy

# Seed initial data (optional)
pnpm prisma db seed
```

### 3. Create Database Indexes

Run these SQL commands for performance:

```sql
-- Product indexes
CREATE INDEX idx_products_slug ON "Product"(slug);
CREATE INDEX idx_products_category ON "Product"("categoryId");
CREATE INDEX idx_products_featured ON "Product"("isFeatured");
CREATE INDEX idx_products_active ON "Product"("isActive");

-- Order indexes
CREATE INDEX idx_orders_user ON "Order"("userId");
CREATE INDEX idx_orders_status ON "Order"(status);
CREATE INDEX idx_orders_date ON "Order"("createdAt" DESC);

-- User indexes
CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_role ON "User"(role);

-- Review indexes
CREATE INDEX idx_reviews_product ON "Review"("productId");
CREATE INDEX idx_reviews_user ON "Review"("userId");

-- Wishlist indexes
CREATE INDEX idx_wishlist_user ON "WishlistItem"("userId");
```

---

## Backend Deployment

### Option 1: Railway

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login and Initialize:**
```bash
railway login
railway init
```

3. **Configure Services:**
```bash
# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis
```

4. **Deploy:**
```bash
cd apps/api
railway up
```

5. **Set Environment Variables:**
```bash
railway variables set KEY=value
```

### Option 2: AWS (EC2 + Docker)

1. **Build Docker Image:**
```bash
cd apps/api
docker build -t luxury-api:latest .
```

2. **Push to ECR:**
```bash
aws ecr create-repository --repository-name luxury-api
docker tag luxury-api:latest {account}.dkr.ecr.{region}.amazonaws.com/luxury-api:latest
docker push {account}.dkr.ecr.{region}.amazonaws.com/luxury-api:latest
```

3. **Deploy to EC2:**
```bash
# SSH to EC2 instance
ssh -i key.pem ec2-user@your-instance

# Pull and run
docker pull {account}.dkr.ecr.{region}.amazonaws.com/luxury-api:latest
docker run -d -p 3001:3001 --env-file .env luxury-api:latest
```

### Option 3: Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: luxury-api
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
```

2. Connect GitHub repo and deploy

---

## Frontend Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd apps/web
vercel --prod
```

4. **Set Environment Variables:**
```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
```

5. **Configure Domains:**
- Add custom domain in Vercel dashboard
- Update DNS records:
  - A record: `@` → Vercel IP
  - CNAME: `www` → `cname.vercel-dns.com`

### Alternative: Netlify

1. **Build Settings:**
```toml
[build]
  command = "pnpm build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy:**
```bash
netlify deploy --prod
```

---

## Third-Party Services

### 1. Stripe Setup

**Configure Webhooks:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/v1/payment/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

**Test Webhooks:**
```bash
stripe listen --forward-to localhost:3001/api/v1/payment/webhook
```

### 2. Meilisearch Setup

**Cloud:**
1. Create account at meilisearch.com
2. Create index: `products`
3. Configure searchable attributes:
```bash
curl -X PATCH 'https://ms-xxxxx.meilisearch.io/indexes/products/settings' \
  -H 'Authorization: Bearer MASTER_KEY' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "searchableAttributes": ["name", "description", "brand", "tags"],
    "filterableAttributes": ["categoryId", "price", "inStock", "onSale"],
    "sortableAttributes": ["price", "createdAt", "rating"]
  }'
```

**Self-Hosted:**
```bash
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-master-key \
  -v $(pwd)/meili_data:/meili_data \
  getmeili/meilisearch:latest
```

### 3. Cloudflare R2 Setup

1. Create R2 bucket: `luxury-ecommerce`
2. Set public access policy
3. Configure CORS:
```json
{
  "AllowedOrigins": ["https://yourdomain.com"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

### 4. Resend Setup

1. Add domain at resend.com/domains
2. Verify DNS records
3. Create API key
4. Test email:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

---

## Post-Deployment

### 1. Index Products in Meilisearch

```bash
# Call admin endpoint
curl -X POST 'https://api.yourdomain.com/api/v1/search/index' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

### 2. Create Admin User

```sql
-- Update user role to admin
UPDATE "User"
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

### 3. Configure CDN (Optional)

**Cloudflare:**
1. Add domain to Cloudflare
2. Enable caching for static assets
3. Configure page rules:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   - Always Use HTTPS

### 4. SSL Certificate

**Vercel:**
- Automatic SSL with Let's Encrypt

**Custom Server:**
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com
```

### 5. Test Deployment

Run through testing checklist:

- [ ] Homepage loads
- [ ] Products page loads with data
- [ ] Search functionality works
- [ ] User registration works
- [ ] Login works
- [ ] Add to cart works
- [ ] Checkout flow completes
- [ ] Order confirmation email received
- [ ] Admin dashboard accessible
- [ ] Payment processing works
- [ ] Images load from CDN

---

## Monitoring & Maintenance

### 1. Error Tracking

**Sentry:**
```bash
pnpm add @sentry/nextjs @sentry/node

# Configure in apps/web/sentry.config.js
```

### 2. Performance Monitoring

**Vercel Analytics:**
```bash
pnpm add @vercel/analytics

# Add to layout.tsx
import { Analytics } from '@vercel/analytics/react'
```

### 3. Logging

**Winston (Backend):**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 4. Database Backups

**Automated Backups:**
```bash
# Neon: Automatic daily backups
# Supabase: Automatic backups

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 5. Uptime Monitoring

**UptimeRobot:**
1. Add monitors for:
   - Frontend: https://yourdomain.com
   - API: https://api.yourdomain.com/health
   - Admin: https://yourdomain.com/admin
2. Set up email/SMS alerts

### 6. Security

**Security Headers:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# Increase max connections if needed
```

### Build Failures

```bash
# Clear cache
pnpm store prune
rm -rf node_modules .next
pnpm install

# Check Node version
node --version  # Should be 18+
```

### Payment Issues

```bash
# Test Stripe connection
stripe webhooks test

# Check webhook logs in Stripe Dashboard
```

### Search Not Working

```bash
# Check Meilisearch health
curl https://ms-xxxxx.meilisearch.io/health

# Re-index products
curl -X POST 'https://api.yourdomain.com/api/v1/search/index'
```

---

## Maintenance Checklist

### Daily
- [ ] Monitor error logs
- [ ] Check uptime alerts
- [ ] Review failed payments

### Weekly
- [ ] Review analytics
- [ ] Check database performance
- [ ] Review customer support tickets
- [ ] Monitor disk space

### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Review and optimize database queries

### Quarterly
- [ ] Penetration testing
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Update documentation

---

## Support & Resources

- **Documentation**: /docs folder
- **API Docs**: https://api.yourdomain.com/api/docs
- **Status Page**: https://status.yourdomain.com
- **Support Email**: support@yourdomain.com

---

**Last Updated:** November 11, 2024
**Version:** 1.0.0
