# CLAUDE.md - NextPik

## Project Context

**NextPik** is a **production-ready multi-vendor luxury e-commerce platform** (v2.8.1) with:

- **Stripe payment processing** with escrow system
- **Multi-currency support** (46+ currencies)
- **Commission & payout system** for sellers
- **Real-time WebSocket updates**
- **Admin, Seller, Buyer, and Delivery Partner portals**

**Tech Stack:** Next.js 16 + NestJS + Prisma + PostgreSQL + Redis + Meilisearch
**Deadline:** January 3, 2026

## URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api/v1
- **Prisma Studio:** http://localhost:5555

---

## ⛔ CRITICAL - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL

### Payment & Financial (HIGH RISK)

- `apps/api/src/payment/` - Stripe integration, webhooks
- `apps/api/src/escrow/` - Escrow transactions
- `apps/api/src/commission/` - Commission calculations
- `apps/api/src/payout/` - Seller payouts
- Any file with `stripe`, `webhook`, or `payment` in the name

### Database Schema

- `packages/database/prisma/schema.prisma` - NEVER modify without migration plan
- `packages/database/prisma/migrations/` - Do not delete or modify existing migrations
- `packages/database/prisma/seed.ts` - Contains 38+ system settings

### Database Name (CRITICAL)

- ✅ **Correct database name:** `nextpik_ecommerce`
- ❌ **NEVER use:** `luxury_ecommerce` (obsolete database from old development)
- All `.env` files, `docker-compose.yml`, and scripts MUST use `nextpik_ecommerce`
- Port 5433 (Docker) or 5432 (local) depending on setup

### Authentication & Security

- `apps/api/src/auth/` - JWT, 2FA, sessions
- `apps/api/src/auth/strategies/jwt.strategy.ts` - Returns `{ id, userId, email, role }`
- `apps/api/src/guards/` - Authorization guards
- Any file containing secrets, tokens, or encryption logic

### System Settings

- `apps/api/src/settings/settings.service.ts` - 45 settings, audit logging
- Settings keys use **underscores** (e.g., `escrow_default_hold_days`, NOT `escrow.enabled`)

---

## 🔶 CAUTION - REVIEW BEFORE MODIFYING

### Core Services

- `apps/api/src/products/products.service.ts` - Product filtering, inventory
- `apps/api/src/orders/orders.service.ts` - Order workflow
- `apps/api/src/currency/currency.service.ts` - Exchange rates, sync with settings
- `apps/api/src/admin/admin.controller.ts` - Dashboard routes (6 endpoints added in v2.3.0)

### Upload System (v2.3.0 Fix Applied)

- `apps/api/src/upload/upload.module.ts` - Must have `MulterModule` imported
- `apps/api/src/upload/upload.service.ts` - Image optimization with Sharp

### Shared Packages

- `packages/database/` - Prisma client, shared across all apps
- `packages/ui/` - Shared React components
- `packages/shared/` - Shared utilities

### Configuration

- `apps/api/.env` - Backend secrets
- `apps/web/.env.local` - Frontend config
- `docker-compose.yml` - Service orchestration
- `turbo.json` - Build pipeline

---

## ✅ SAFE TO MODIFY

- `apps/web/src/components/` - UI components
- `apps/web/src/app/` - Page routes
- `apps/web/src/styles/` - Styling
- Documentation files (`*.md`)
- Test files (`*.spec.ts`, `*.test.ts`)

---

## Development Rules

### Before Making Changes

1. **Always run first:** `pnpm type-check`
2. **Lint code:** `pnpm lint`
3. **For database changes:** Create migration with `pnpm prisma:migrate dev --name descriptive_name`
4. **Test locally** before suggesting production changes

### Code Standards

- Use **underscore notation** for settings keys: `escrow_enabled` NOT `escrow.enabled`
- Use `formatCurrencyAmount()` from `@/lib/utils/number-format` for prices
- **ALWAYS sanitize user-generated HTML** - Use `sanitizeHtml()` from `@/lib/sanitize` before rendering
- Follow existing patterns in the codebase
- Add proper error handling with try-catch
- Use DTOs for all API inputs with class-validator decorators

### HTML Sanitization (Security)

**CRITICAL:** Never render user-generated HTML without sanitization. Use the appropriate function from `@/lib/sanitize`:

```typescript
import { sanitizeHtml, sanitizeText, sanitizePaymentInstructions } from '@/lib/sanitize';

// For rich product descriptions (allows safe HTML tags)
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />

// For plain text (strips all HTML)
const plainText = sanitizeText(userInput);

// For payment gateway instructions (more restrictive)
<div dangerouslySetInnerHTML={{ __html: sanitizePaymentInstructions(instructions) }} />
```

**Never use `dangerouslySetInnerHTML` without sanitization!**

### Field Name Mappings (Frontend ↔ Backend)

```
Frontend Form    →    Backend/Database
─────────────────────────────────────
inventory        →    inventory (correct)
stock            →    inventory (alias)
categoryId       →    categoryId
category         →    categoryId (alias)
```

### JWT User Object Structure

```typescript
// jwt.strategy.ts returns:
{
  id: payload.sub,        // Use req.user.id (PRIMARY)
  userId: payload.sub,    // Backward compat: req.user.userId
  email: payload.email,
  role: payload.role
}
```

### API Response Format

```typescript
// Standard success response
{ success: true, data: {...} }

// Standard error response
{ statusCode: 400, message: "Error", error: "Bad Request" }
```

### Category Ordering System

**Two Order Fields:**

1. **priority** (Integer, default: 0)
   - Higher values = more important
   - Used for featured/promoted categories
   - Primary sort criteria

2. **displayOrder** (Integer, default: 0)
   - Controls display sequence within same priority level
   - Lower values appear first
   - Secondary sort criteria

**Sort Order:**

```typescript
[
  { priority: 'desc' }, // Higher priority first
  { displayOrder: 'asc' }, // Lower displayOrder first
  { name: 'asc' }, // Alphabetical fallback
];
```

**Unlimited Nesting:**

- Database supports unlimited category depth via self-referencing `parentId`
- Circular reference prevention enforced at service level
- Frontend components support recursive tree rendering

**Admin Methods:**

- `updatePriority(id, priority)` - Set priority for single category
- `reorder(categoryIds[])` - Bulk reorder by priority
- `findAllRecursive()` - Get unlimited depth category tree
- `getCategoryDepth(id)` - Calculate category depth level

---

## Testing Commands

```bash
# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Development (optimized for M1 Mac)
pnpm dev:web              # Frontend only (recommended)
pnpm dev:api              # Backend only (recommended)
pnpm dev                  # Both (resource intensive)

# Database operations
pnpm prisma:generate      # Regenerate Prisma client
pnpm prisma:migrate dev   # Create new migration
pnpm prisma:studio        # Open database GUI

# Docker services
pnpm docker:up            # Start PostgreSQL, Redis, Meilisearch
pnpm docker:minimal       # Start essentials only (Postgres + Redis)
pnpm docker:down          # Stop services

# Production build
pnpm build                # Build all packages

# Security checks (IMPORTANT: Run before deploying)
pnpm security:check       # Run full security scan
pnpm security:audit       # Check for vulnerable dependencies
```

---

## 🔒 Security Commands

**Run these regularly to ensure security:**

```bash
# Full security check (before deployment)
pnpm security:check

# Dependency vulnerability scan
pnpm security:audit

# Manual checks
./security-check.sh       # Comprehensive security scan
```

**What the security check does:**

1. TypeScript type checking
2. Dependency vulnerability scan
3. Secret detection in staged files
4. Dangerous code pattern detection
5. Critical file integrity verification
6. Suspicious external link detection
7. Production build test

**Pre-commit hook automatically:**

- Blocks commits with exposed secrets (API keys, tokens)
- Warns when layout files are modified
- Scans for suspicious external links

**See `SECURITY.md` for:**

- Full security guidelines
- Incident response plan
- Security audit checklist
- Monitoring best practices

---

## Known Issues to Avoid

1. **Nested forms in React** - Never put `<form>` inside another `<form>`
2. **Empty query params** - Filter out empty strings before API calls
3. **Status filter default** - Don't default status to ACTIVE in product queries
4. **JsonArray type** - Cast to `string[]` when reading array settings
5. **MulterModule missing** - Upload module MUST import MulterModule for file uploads
6. **req.user.id undefined** - JWT strategy must return both `id` and `userId`
7. **Creating workarounds** - Never create database aliases, modify node_modules, or hardcode values. Always fix the source configuration (`.env` files) and regenerate.

## ⛔ FORBIDDEN Actions - NEVER Do These

### 1. Never Create Workarounds

When facing configuration or connection issues:

- ❌ DO NOT create database aliases or duplicates
- ❌ DO NOT modify files in `node_modules/`
- ❌ DO NOT hardcode values to bypass config issues
- ❌ DO NOT create "temporary fixes" that mask root causes
- ✅ ALWAYS fix the source configuration (`.env` files)
- ✅ ALWAYS regenerate after config changes

### 2. Database Configuration

- ✅ **Correct:** `nextpik_ecommerce`
- ❌ **NEVER:** `luxury_ecommerce` (deprecated, do not create or reference)
- If Prisma shows wrong database, fix `.env` and regenerate - NEVER create DB aliases

### 3. When Prisma Has Wrong Configuration

```bash
# ✅ CORRECT approach:
1. Fix the .env file (packages/database/.env, apps/api/.env)
2. rm -rf node_modules/.prisma packages/database/node_modules/.prisma
3. pnpm prisma:generate
4. Verify: grep -r "wrong_value" . --include="*.env*"

# ❌ WRONG approaches:
- Creating database aliases (CREATE DATABASE x TEMPLATE y)
- Modifying generated files in node_modules
- Hardcoding connection strings in source code
- Any "quick fix" that doesn't address root cause
```

### 4. The Golden Rule

> **If you're about to create a workaround, STOP.**
> Ask yourself: "Am I fixing the root cause or masking the problem?"
> If masking, find and fix the actual source of the issue instead.

---

## Recent Fixes (v2.3.0 - Dec 26, 2025)

### Admin Dashboard Routes

Added 6 new endpoints to `/admin/dashboard/*`:

- `GET /admin/dashboard/stats`
- `GET /admin/dashboard/revenue?days=30`
- `GET /admin/dashboard/orders-by-status`
- `GET /admin/dashboard/top-products?limit=5`
- `GET /admin/dashboard/customer-growth?days=30`
- `GET /admin/dashboard/recent-orders?limit=10`

### JWT Authentication Fix

```typescript
// jwt.strategy.ts now returns:
return {
  id: payload.sub, // Primary
  userId: payload.sub, // Backward compatibility
  email: payload.email,
  role: payload.role,
};
```

### Image Upload Fix

- Added `MulterModule.register()` to `upload.module.ts`
- Fixed "Multipart: Boundary not found" error

### Performance (M1 Mac)

- CPU: 40-50% reduction
- RAM: 54% reduction (5.5GB → 2.5GB)
- Use `pnpm dev:web` or `pnpm dev:api` for single-area work

### Security Hardening (v2.8.1 - Feb 23, 2026)

**XSS Protection:**

- Installed DOMPurify for HTML sanitization (`dompurify@3.3.1`, `isomorphic-dompurify@3.0.0`)
- Created `apps/web/src/lib/sanitize.ts` with three sanitization levels:
  - `sanitizeHtml()` - Rich HTML with safe formatting tags (for product descriptions)
  - `sanitizeText()` - Strips all HTML, returns plain text
  - `sanitizePaymentInstructions()` - Restrictive sanitization for payment gateway setup
- Applied sanitization to:
  - Product descriptions (`apps/web/src/app/products/[slug]/page.tsx`)
  - Payment gateway setup instructions (`apps/web/src/components/settings/payment/PaymentGatewayCard.tsx`)

**Rate Limiting:**

- Added `@Throttle` decorator to critical payment endpoints (20 req/minute):
  - `POST /payment/methods/setup` - Create SetupIntent
  - `POST /payment/create-intent` - Create payment intent
  - `POST /payment/create-intent-saved` - Create payment with saved method
  - `POST /payment/paypal/create-order` - Create PayPal order
- Auth endpoints already protected:
  - Login: 5 req/15min
  - Register: 3 req/hour
  - Password reset: 3 req/hour
  - Magic link: 3 req/hour

**Dependencies Updated:**

- Next.js: 15.5.6 → 16.1.6 (Turbopack improvements)
- Fixed 17 critical vulnerabilities (58% reduction: 29 → 12)
- Fixed DoS vulnerability in Next.js

**Files:**

- `apps/web/src/lib/sanitize.ts` - HTML sanitization utility
- `apps/api/src/payment/payment.controller.ts` - Rate limiting
- Pre-commit hooks already include secret detection

### Tax & Shipping Configuration (v2.7.0 - Jan 25, 2026)

**Tax System:**

- Added `tax_calculation_mode` setting: 'disabled', 'simple', 'by_state'
- Replaces hardcoded tax logic with admin-configurable settings
- Simple mode: Single default rate for all orders
- By-state mode: US state-specific tax rates (50 states + local estimates)
- Admin can configure via new "Tax" tab in System Settings

**Shipping System:**

- Added `shipping_mode` setting: 'manual', 'dhl_api', 'hybrid'
- Manual mode: Admin-configurable rates (standard, express, overnight)
- Settings: `shipping_standard_rate`, `shipping_express_rate`, `shipping_overnight_rate`, `shipping_international_surcharge`
- Foundation for future DHL API integration
- Admin can configure via new "Shipping" tab in System Settings

**Database:**

- Added 6 new system settings (tax_calculation_mode, shipping_mode, 4 shipping rates)
- Created default shipping zones (US Domestic, International) with rate tiers
- ShippingZone and ShippingRate models ready for zone-based shipping (future)

**Files Modified:**

- Backend: `shipping-tax.service.ts`, `settings.service.ts`, `seed-settings.ts`, `orders.service.ts`
- Frontend: `tax-settings.tsx`, `shipping-settings.tsx`, `settings/page.tsx`, `validations/settings.ts`
- Database: Created `seed-shipping-zones.ts` script

**Backward Compatibility:**

- All settings use current hardcoded values as defaults
- Fallback logic preserves existing behavior if settings not configured
- No breaking changes to existing orders or checkout flow

---

## API Endpoints Quick Reference

### Admin Dashboard

```
GET  /admin/dashboard/stats
GET  /admin/dashboard/revenue?days=30
GET  /admin/dashboard/orders-by-status
GET  /admin/dashboard/top-products?limit=5
GET  /admin/dashboard/customer-growth?days=30
GET  /admin/dashboard/recent-orders?limit=10
```

### Products

```
GET    /products                    # List with filters
GET    /products/:slug              # Get by slug
POST   /products                    # Create (Admin/Seller)
PATCH  /products/:id                # Update
DELETE /products/:id                # Delete
PATCH  /products/:id/inventory      # Adjust inventory
```

### Payment (Stripe)

```
POST  /payment/create-intent        # Create payment intent
POST  /payment/webhook              # Stripe webhook handler
GET   /payment/status/:orderId      # Payment status
POST  /payment/refund/:orderId      # Process refund
GET   /payment/health               # Health metrics (admin)
```

### Orders

```
GET   /orders                       # Get user orders
GET   /orders/:id                   # Get order details
POST  /orders                       # Create order
PATCH /orders/:id/status            # Update status (Admin)
POST  /orders/:id/cancel            # Cancel order
```

### Cart

```
GET    /cart                        # Get cart
POST   /cart/items                  # Add item
PATCH  /cart/items/:id              # Update quantity
DELETE /cart/items/:id              # Remove item
DELETE /cart                        # Clear cart
```

### Settings

```
GET   /settings/public              # Public settings
GET   /settings/:key                # Get single setting
PATCH /settings/:key                # Update setting (admin)
```

### Authentication

```
POST  /auth/register                # User registration
POST  /auth/login                   # Login
POST  /auth/magic-link/request      # Request magic link
POST  /auth/magic-link/verify       # Verify magic link
POST  /auth/password/reset-request  # Request password reset
POST  /auth/password/reset          # Reset password
GET   /auth/me                      # Get current user
POST  /auth/2fa/setup               # Setup 2FA
POST  /auth/2fa/enable              # Enable 2FA
```

### Seller

```
GET  /seller/dashboard              # Seller dashboard stats
GET  /seller/products               # Seller's products
POST /seller/products               # Create product
GET  /seller/orders                 # Seller's orders
```

---

## File Upload Requirements

```typescript
// upload.module.ts MUST have:
imports: [
  SupabaseModule,
  MulterModule.register({
    dest: './uploads',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }),
],
```

---

## Database Quick Reference

### Key Models (60+ tables)

- **User Management:** User, UserSession, Address, MagicLink
- **Products:** Product, ProductImage, ProductVariant, Category
- **Orders:** Order, OrderItem, Cart, CartItem
- **Multi-vendor:** Store, Commission, Payout, EscrowTransaction
- **Delivery:** Delivery, DeliveryProvider, DeliveryConfirmation
- **System:** SystemSetting, SettingsAuditLog

### User Roles

| Role               | Description             |
| ------------------ | ----------------------- |
| `BUYER`            | Can purchase products   |
| `SELLER`           | Can sell + buy products |
| `CUSTOMER`         | Legacy (same as BUYER)  |
| `DELIVERY_PARTNER` | Handle deliveries       |
| `ADMIN`            | Platform management     |
| `SUPER_ADMIN`      | System-level access     |

---

## When in Doubt

1. **Ask before modifying** payment, escrow, auth, or settings code
2. **Show diffs** before applying changes
3. **Test in development** before suggesting production changes
4. **Check the technical documentation** (`COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`)
5. **Use `pnpm type-check`** before committing
6. **Never assume** - if unsure, ask for clarification
7. **Preserve existing patterns** - don't introduce new conventions without approval

---

## Project Structure

```
nextpik/
├── apps/
│   ├── api/                    # NestJS backend (32 modules)
│   │   └── src/
│   │       ├── auth/           # Authentication
│   │       ├── products/       # Product management
│   │       ├── orders/         # Order processing
│   │       ├── payment/        # Stripe integration
│   │       ├── admin/          # Admin dashboard
│   │       ├── seller/         # Seller portal
│   │       └── ...
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # Pages (App Router)
│           ├── components/     # React components
│           ├── hooks/          # Custom hooks
│           ├── lib/            # Utilities
│           └── contexts/       # React contexts
├── packages/
│   ├── database/               # Prisma schema
│   ├── ui/                     # Shared UI components
│   └── shared/                 # Shared utilities
├── CLAUDE.md                   # This file
├── COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md
└── docker-compose.yml
```

---

## SEO & Brand Identity

### Core SEO Implementation

- **Site Name:** NextPik (NOT NextPick - different from tennis recruiting platform)
- **Brand Focus:** Multi-vendor luxury marketplace
- **Core Keywords:** nextpik marketplace, luxury online shopping, multi-vendor platform
- **Structured Data:** Organization, WebSite, Product, ItemList, Breadcrumb schemas
- **Dynamic Sitemap:** Auto-generates with products, categories, stores
- **Search Console:** Use `SEO_GUIDE.md` for setup instructions

### Meta Tags Strategy

- Homepage: Brand-focused with category mentions (fashion, electronics, vehicles, real estate)
- Products: Dynamic meta from product data + structured data
- Categories: Category-specific titles and descriptions
- Stores: Seller branding + product collections

### Files to Check for SEO

- `apps/web/src/lib/seo.tsx` - Core SEO config and schema generators
- `apps/web/src/lib/metadata.ts` - Page-specific meta tags
- `apps/web/src/app/sitemap.ts` - Dynamic sitemap generation
- `apps/web/src/app/robots.ts` - Robots.txt configuration
- `SEO_GUIDE.md` - Comprehensive SEO documentation

---

## Gelato Print-on-Demand Integration

**Implementation Model:** Per-Seller (Multi-Tenant) with Platform Fallback

**v2.9.0 Architecture:**

- Each seller connects their own Gelato account via Seller Dashboard
- Credentials encrypted (AES-256-GCM) and stored per-seller in database
- Platform credentials serve as fallback for unconfigured sellers
- Seller-specific webhook URLs for order tracking

**Environment Variables Required:**

```bash
# Encryption (REQUIRED)
ENCRYPTION_KEY=<32-byte-base64-key>  # Generate: openssl rand -base64 32

# Platform Gelato Account (Optional Fallback)
GELATO_API_KEY=your_platform_api_key
GELATO_STORE_ID=your_platform_store_id
GELATO_WEBHOOK_SECRET=your_platform_webhook_secret
GELATO_API_URL=https://api.gelato.com/v4
```

**How It Works:**

1. **Seller Setup:**
   - Seller navigates to `/seller/gelato-settings`
   - Enters Gelato API Key, Store ID, and optional Webhook Secret
   - Tests connection to verify credentials
   - Enables integration once verified

2. **Order Flow:**
   - Seller creates product with `fulfillmentType: GELATO_POD`
   - Customer places order
   - System loads seller's Gelato credentials (or uses platform fallback)
   - Order submitted to appropriate Gelato account
   - Gelato produces and ships directly to customer

3. **Webhooks:**
   - Platform webhook: `POST /webhooks/gelato` (backward compatible)
   - Seller webhook: `POST /webhooks/gelato/:base64(storeId)` (unique per seller)
   - Automatic status updates for production, shipping, delivery

**Database Schema:**

```prisma
model SellerGelatoSettings {
  gelatoApiKey       String?  // AES-256-GCM encrypted
  gelatoStoreId      String?
  gelatoWebhookSecret String? // AES-256-GCM encrypted
  isEnabled          Boolean  @default(false)
  isVerified         Boolean  @default(false)
  webhookUrl         String?  // Auto-generated
}

model GelatoPodOrder {
  storeId               String?
  usedPlatformAccount   Boolean  @default(false)
  // ... other fields
}
```

**API Endpoints:**

```
GET    /seller/gelato              # Get settings
POST   /seller/gelato              # Save/update settings
POST   /seller/gelato/test         # Test connection
PATCH  /seller/gelato/toggle       # Enable/disable
DELETE /seller/gelato              # Delete settings
GET    /seller/gelato/webhook-url  # Get webhook URL
```

**Security:**

- Credentials encrypted at rest using AES-256-GCM
- API keys masked in frontend: `dc0d0b41-••••••••-e7947ae3baf7`
- Webhook verification using `crypto.timingSafeEqual()` to prevent timing attacks
- 5-minute credential cache with automatic invalidation

**Migration Notes:**

- Platform account credentials still work as fallback
- Existing POD orders continue to function
- Sellers can optionally configure their own accounts
- System tracks which orders used seller vs platform account

---

## Version History


---

## Quick Start for Claude Code

When starting a session, say:

```
Read CLAUDE.md first, then help me with [your task]
```

For deadline tracking:

```
Check DEADLINE_TRACKER.md and tell me what I should work on today
```

---


---

## 📝 DOCUMENTATION RULES

### Auto-Update Requirements

After completing any **major change** that is **confirmed working**, Claude MUST update `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`:

**What counts as a major change:**

- New API endpoint added
- New feature implemented
- Bug fix that changes behavior
- Database schema change
- New component or page
- Configuration change
- Security fix

**What to update:**

1. Version number (if significant)
2. Relevant section in the docs
3. Add to "Recent Changes" section
4. Update "Version X.X.X Changes" section

**Update format:**

```markdown
### [Date] - Brief Description

- What was changed
- Files modified
- How to use it (if applicable)
```

**Example workflow:**

1. Make the change
2. Test it works
3. User confirms it's working
4. Update COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md
5. Tell user: "✅ Documentation updated"

### Do NOT Update Docs When:

- Change is experimental/untested
- User hasn't confirmed it works
- It's a minor typo or style fix
- It's a temporary debugging change

---

## 📋 DOC UPDATE TEMPLATE

When updating `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`, use this format:

````markdown
## [Section Name]

### [Feature/Fix Name] (v2.3.x - [Date])

**What:** Brief description of the change

**Files Modified:**

- `path/to/file1.ts` - What changed
- `path/to/file2.tsx` - What changed

**Usage:**

```typescript
// Code example if applicable
```

**API Endpoint (if applicable):**

- `METHOD /endpoint` - Description

**Tested:** ✅ Confirmed working
````
