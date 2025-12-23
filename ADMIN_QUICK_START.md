# Admin Quick Start Guide

## Common Admin Tasks

### 🔧 Initialize System Settings
If you see "Setting not found" errors:
```bash
npx tsx packages/database/prisma/seed-settings.ts
```

### 🚀 Start Development
```bash
# Terminal 1: Start database
pnpm docker:up

# Terminal 2: Start application
pnpm dev
```

### 👤 Access Admin Panel
- **URL**: http://localhost:3000/admin
- **Credentials**: See `TEST_CREDENTIALS.md`

### 📊 View Database
```bash
npx prisma studio
```

### 🔄 Reset Database (⚠️ Deletes all data)
```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma migrate reset
npx tsx packages/database/prisma/seed-settings.ts
```

## Admin Panel Sections

### Settings (`/admin/settings`)
- **General**: Site info, timezone, maintenance mode
- **Payment**: Stripe, escrow, commission rates
- **Currency**: Multi-currency configuration
- **Inventory**: Stock management settings
- **Delivery**: Shipping options
- **Security**: Password rules, 2FA, file uploads
- **Notifications**: Email/SMS preferences
- **SEO**: Meta tags, analytics

### Common Issues

#### "Setting 'xxx' not found"
```bash
npx tsx packages/database/prisma/seed-settings.ts
```

#### "Cannot save settings" (404 error)
✅ **FIXED** - Settings API route ordering corrected

#### "Invalid credentials" on page load
✅ **FIXED** - Auth context now handles expired tokens gracefully

#### Port already in use
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes on port 4000
lsof -ti:4000 | xargs kill -9
```

## Useful Commands

```bash
# Database
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations
pnpm prisma:seed          # Seed data

# Development
pnpm dev                  # Start all services
pnpm build                # Build for production
pnpm type-check           # Check TypeScript errors

# Testing
pnpm test                 # Run tests
curl http://localhost:4000/api/v1/settings/public  # Test API
```

## Documentation

- **Settings**: `SETTINGS_INITIALIZATION.md`
- **Settings API**: `SETTINGS_API_GUIDE.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Test Accounts**: `TEST_CREDENTIALS.md`
- **Full Guide**: `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`

---

**Need Help?** Check the documentation files or run `pnpm dev` for development mode.
