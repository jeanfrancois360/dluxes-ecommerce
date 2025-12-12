# Project Instructions for Claude Code

## Overview
This is a luxury e-commerce platform built with Next.js 15, NestJS, PostgreSQL, and Prisma.

## Important Notes

### Database
- PostgreSQL runs on port **5433** (not 5432)
- Use credentials: `postgres:User@123!@localhost:5433`

### Storage
- Using **Supabase Storage** (not Cloudflare R2)
- Configure SUPABASE_URL and SUPABASE_SERVICE_KEY

### Package Namespaces
- Root package: `luxury-ecommerce`
- Workspace packages use `@luxury-ecommerce` namespace
- Example: `@luxury-ecommerce/database`, `@luxury-ecommerce/api`, `@luxury-ecommerce/web`

### Current Status
- Multi-vendor marketplace is fully implemented
- Escrow payment system active
- Delivery partner system complete
- System settings module operational

## Documentation
- **Comprehensive Guide**: `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Quick Start**: `QUICK_START_GUIDE.md`
- **Testing**: `TEST_ACCOUNTS_AND_GUIDE.md`

## Common Commands
```bash
# Start all services
pnpm docker:up
pnpm dev

# Database operations
pnpm prisma:generate
pnpm prisma:migrate

# Build
pnpm build
```

## Test Accounts
See `TEST_CREDENTIALS.md` for all test account credentials.
