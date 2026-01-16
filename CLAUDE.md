# CLAUDE.md - NextPik

## Project Context
**NextPik** is a **production-ready multi-vendor luxury e-commerce platform** (v2.6.0) with:
- **Stripe payment processing** with escrow system
- **Multi-currency support** (46+ currencies)
- **Commission & payout system** for sellers
- **Real-time WebSocket updates**
- **Admin, Seller, Buyer, and Delivery Partner portals**

**Tech Stack:** Next.js 15 + NestJS + Prisma + PostgreSQL + Redis + Meilisearch
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
- Follow existing patterns in the codebase
- Add proper error handling with try-catch
- Use DTOs for all API inputs with class-validator decorators

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
```

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
  id: payload.sub,           // Primary
  userId: payload.sub,       // Backward compatibility
  email: payload.email,
  role: payload.role
};
```

### Image Upload Fix
- Added `MulterModule.register()` to `upload.module.ts`
- Fixed "Multipart: Boundary not found" error

### Performance (M1 Mac)
- CPU: 40-50% reduction
- RAM: 54% reduction (5.5GB → 2.5GB)
- Use `pnpm dev:web` or `pnpm dev:api` for single-area work

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
| Role | Description |
|------|-------------|
| `BUYER` | Can purchase products |
| `SELLER` | Can sell + buy products |
| `CUSTOMER` | Legacy (same as BUYER) |
| `DELIVERY_PARTNER` | Handle deliveries |
| `ADMIN` | Platform management |
| `SUPER_ADMIN` | System-level access |

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

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.6.0 | Jan 16, 2026 | Authentication enhancements: Email OTP 2FA, Google OAuth, seller store auto-creation |
| 2.5.0 | Jan 3, 2026 | Stripe subscription integration with webhooks and billing portal |
| 2.4.0 | Dec 31, 2025 | Store following system, admin notes, enhanced UI/UX |
| 2.3.0 | Dec 26, 2025 | UI/UX fixes, JWT auth fix, upload fix, M1 optimizations |
| 2.2.0 | Dec 13, 2025 | Stripe integration (production-ready) |
| 2.1.1 | Dec 13, 2025 | Product form fixes, filter system |
| 2.0.0 | Dec 13, 2025 | Currency settings, real-time updates, number formatting |

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

*Last Updated: January 16, 2026*
*Version: 2.6.0 - Authentication Enhancements*
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
````markdown
### [Date] - Brief Description
- What was changed
- Files modified
- How to use it (if applicable)
````

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

