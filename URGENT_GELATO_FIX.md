# 🚨 URGENT: Gelato Integration Fix Required

**Date:** March 12, 2026
**Status:** Production Issue - Requires Immediate Deployment
**Severity:** High (Feature completely broken in production)

---

## The Problem

All Gelato Print-on-Demand endpoints are failing in production with:

```
Error 400: Database operation failed
```

**Affected Endpoints:**

- `GET /api/v1/seller/gelato`
- `POST /api/v1/seller/gelato`
- `GET /api/v1/seller/gelato/webhook-url`
- `POST /api/v1/seller/gelato/test`

**Impact:** Sellers cannot configure Gelato POD integration at all.

---

## Root Cause

The Gelato integration has a **critical deployment gap**:

✅ **Backend code exists** - Services, controllers, DTOs all implemented
✅ **Frontend code exists** - Settings page, API calls all implemented
✅ **Prisma schema exists** - Models defined in schema.prisma
❌ **Database tables DON'T exist** - Migration was never created or applied

**Missing tables:**

1. `SellerGelatoSettings` - Stores encrypted Gelato API credentials per seller
2. `gelato_pod_orders` - Tracks print-on-demand orders
3. `gelato_webhook_events` - Processes Gelato webhooks
4. `GelatoPodStatus` enum - Order status values

---

## The Fix

I've created the missing migration and deployment tools:

### Files Created

1. **Migration SQL** (the actual database changes)

   ```
   packages/database/prisma/migrations/20260312084142_add_seller_gelato_settings/migration.sql
   ```

2. **Deployment Script** (interactive deployment helper)

   ```
   apply-gelato-migration.sh
   ```

3. **Comprehensive Guide** (step-by-step instructions)
   ```
   GELATO_MIGRATION_GUIDE.md
   ```

---

## Deploy to Production NOW

### Quick Deploy (5 minutes)

```bash
# 1. Get your production database credentials from DigitalOcean

# 2. Set environment variable
export DATABASE_URL="postgresql://user:password@host:port/nextpik_ecommerce"

# 3. Apply migration
cd packages/database
pnpm prisma migrate deploy

# 4. Restart backend API
# (DigitalOcean: Actions → Force Rebuild)
```

### Or Use Interactive Script

```bash
./apply-gelato-migration.sh
```

The script will:

- Prompt for database backup confirmation
- Guide you through the migration
- Verify success

---

## Verification

After deployment, test in production:

```bash
# Should return empty settings (NOT an error)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.nextpik.com/api/v1/seller/gelato
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": null,
    "gelatoApiKey": null,
    "isEnabled": false,
    ...
  }
}
```

**Browser check:**

1. Login as seller at https://nextpik.com
2. Navigate to `/seller/gelato-settings`
3. Should see the Gelato settings form (no error)

---

## Why This Happened

**Timeline of events:**

1. ✅ Gelato integration code was written (v2.9.0)
2. ✅ Prisma schema was updated with new models
3. ❌ **Migration was never created** (`pnpm prisma migrate dev` not run)
4. ❌ **Tables were never added to production database**
5. 🔴 **Code deployed → tries to query non-existent tables → fails**

**Prevention:**

- Always run `pnpm prisma migrate dev` after updating schema.prisma
- Check `packages/database/prisma/migrations/` folder for new migration
- Verify migration applied locally before deploying to production
- Add migration deployment to production CI/CD pipeline

---

## Post-Deployment Checklist

- [ ] Migration applied to production database
- [ ] Backend API restarted (to clear any cached errors)
- [ ] Verified tables exist via SQL query
- [ ] Tested GET `/api/v1/seller/gelato` endpoint (200 OK)
- [ ] Tested frontend `/seller/gelato-settings` page loads
- [ ] Confirmed `ENCRYPTION_KEY` environment variable is set
- [ ] Updated team on fix deployment

---

## Need Help?

**Full instructions:** See `GELATO_MIGRATION_GUIDE.md`

**Rollback plan:** Included in the guide (drop tables + update migrations tracking)

**Questions:** Check CLAUDE.md for support channels

---

**Bottom line:** This is a simple database migration that got missed during Gelato integration development. The fix is straightforward - just needs to be deployed to production ASAP.
