# EasyPost Security Migration Guide

## Phase 1: Backend Security - Remove API Keys from Database

**Date:** March 22, 2026
**Version:** v2.10.1
**Status:** ✅ Implementation Complete

---

## 🎯 Overview

This migration moves EasyPost API credentials from the database (SystemSettings table) to environment variables for improved security. This follows security best practices and prevents API keys from being exposed in database backups.

### Changes Made:

1. **Database Migration:** Removes `easypost_api_key` and `easypost_webhook_secret` from SystemSettings
2. **Service Update:** EasyPost service now ONLY reads from environment variables
3. **Health Check Endpoint:** New `/easypost/health` endpoint for connection status monitoring
4. **API Key Validation:** Validates API key format (EZTK for test, EZAK for production)

---

## 🚨 IMPORTANT: Run Before Production Deployment

### Step 1: Export Existing API Keys (CRITICAL - DO NOT SKIP)

This script safely exports your existing API keys from the database before they're deleted:

```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik

# Run the migration export script
pnpm tsx packages/database/scripts/migrate-easypost-to-env.ts
```

**What it does:**

- Reads existing API keys from database
- Displays them for you to copy
- Waits for confirmation before deleting
- Updates setting descriptions

**Expected Output:**

```
╔════════════════════════════════════════════════════════════════╗
║  EasyPost API Key Migration: Database → Environment Variables ║
╚════════════════════════════════════════════════════════════════╝

⚠️  CRITICAL: EasyPost API credentials found in database!

📋 Copy these values to your .env files:

─────────────────────────────────────────────────────────────
EASYPOST_API_KEY=EZTK_xxxxxxxxxxxx
EASYPOST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
─────────────────────────────────────────────────────────────

📂 Add these to:
   Local Development:  apps/api/.env.local or apps/api/.env
   Production:         Your hosting platform environment variables

💾 RECOMMENDED: Backup these values to a secure location

❓ Have you copied these values to your .env file? (yes/no):
```

---

## 📝 Step 2: Add to Environment Variables

### Local Development

Add to `apps/api/.env` or `apps/api/.env.local`:

```bash
# EasyPost API Credentials (Platform-wide)
EASYPOST_API_KEY=EZTK_test_xxxxxxxxxxxxx    # Test key
EASYPOST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx # Optional but recommended

# OR for production:
# EASYPOST_API_KEY=EZAK_prod_xxxxxxxxxxxxx  # Production key
```

### Production (DigitalOcean App Platform)

1. Go to your app settings in DigitalOcean
2. Navigate to: **Settings → Environment Variables**
3. Add the following environment variables:

```
EASYPOST_API_KEY=EZAK_prod_xxxxxxxxxxxxx
EASYPOST_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

4. Click "Save"
5. App will automatically redeploy

---

## 🚀 Step 3: Deploy the Migration

### For Local Development:

```bash
# 1. Install dependencies (if needed)
pnpm install

# 2. Run database migration
cd packages/database
pnpm prisma migrate deploy

# 3. Regenerate Prisma client
pnpm prisma:generate

# 4. Restart API server
cd ../..
pnpm dev:api
```

### For Production:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Apply database migration
cd packages/database
pnpm prisma migrate deploy

# 4. Restart API (method depends on your hosting)
pm2 restart nextpik-api
# OR on DigitalOcean: Wait for automatic deployment
```

---

## ✅ Step 4: Verify the Migration

### 1. Check Health Endpoint

```bash
# Local
curl http://localhost:4000/api/v1/easypost/health

# Production
curl https://api.nextpik.com/api/v1/easypost/health
```

**Expected Response (Success):**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "configured": true,
    "credentialsValid": true,
    "testMode": true,
    "webhookSecretConfigured": true,
    "apiKey": "EZTK••••••••xxxx",
    "connectionError": null,
    "message": "✅ EasyPost connected (Test mode)"
  }
}
```

**If API Key Missing:**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "configured": false,
    "credentialsValid": false,
    "testMode": true,
    "webhookSecretConfigured": false,
    "apiKey": "Not Configured",
    "connectionError": null,
    "message": "⚠️ API key not configured in environment variables"
  }
}
```

### 2. Check Admin UI (Future - Phase 2)

Once frontend is updated, navigate to:

```
Admin → Settings → EasyPost Shipping
```

Should show:

```
Status: ✅ Connected
Mode: Test (or Production)
API Key: EZTK••••••••xxxx (configured in .env)
```

### 3. Test Label Generation

Create a test order and try generating a shipping label:

1. Go to seller dashboard
2. View order
3. Click "Get Shipping Label"
4. Verify rates load successfully
5. Purchase label (in test mode - no charge)

---

## 🔍 What Changed

### Database Schema

**Removed Settings:**

- `easypost_api_key` ❌ (deleted from SystemSettings)
- `easypost_webhook_secret` ❌ (deleted from SystemSettings)

**Kept Settings:**

- `easypost_enabled` ✅ (boolean - enable/disable integration)
- `easypost_test_mode` ✅ (boolean - test vs production)
- `easypost_default_label_format` ✅ (string - PDF/PNG/ZPL/EPL2)
- `easypost_address_verification` ✅ (boolean)
- `easypost_default_carriers` ✅ (array)

### Code Changes

**File:** `apps/api/src/integrations/easypost/easypost.service.ts`

- ✅ Removed database fallback logic
- ✅ ONLY reads from `process.env.EASYPOST_API_KEY`
- ✅ Added API key format validation (EZTK vs EZAK)
- ✅ Added test/prod mode matching validation

**File:** `apps/api/src/integrations/easypost/easypost.controller.ts`

- ✅ Added `/health` endpoint for connection status
- ✅ Masks API key for display (shows first 4 + last 4 chars)
- ✅ Tests credentials validity without exposing keys

**File:** `packages/database/prisma/migrations/20260322000000_remove_easypost_keys_from_settings/migration.sql`

- ✅ Deletes API key settings from database
- ✅ Updates related setting descriptions

---

## 🛡️ Security Improvements

| Before                              | After                                     |
| ----------------------------------- | ----------------------------------------- |
| ❌ API keys in database             | ✅ API keys in environment variables only |
| ❌ Keys in database backups         | ✅ Keys never backed up                   |
| ❌ Keys editable via admin UI       | ✅ Keys only in server environment        |
| ❌ Keys exposed to frontend         | ✅ Only connection status shown           |
| ❌ Inconsistent with DHL (env vars) | ✅ Consistent: All API keys in env        |

---

## 🔧 Troubleshooting

### Issue: "EasyPost client not initialized"

**Cause:** API key not configured in environment variables

**Solution:**

1. Check `.env` file has `EASYPOST_API_KEY=...`
2. Restart API server to load new env vars
3. Verify with `/easypost/health` endpoint

### Issue: "Invalid EasyPost API key format"

**Cause:** API key doesn't start with EZTK or EZAK

**Solution:**

- Test keys start with `EZTK_`
- Production keys start with `EZAK_`
- Get valid key from: https://easypost.com/account/api-keys

### Issue: "Test mode enabled but API key is production"

**Cause:** Mismatch between test mode setting and API key type

**Solution:**

1. Go to Admin → Settings → EasyPost Shipping
2. Change "Test Mode" to match your API key:
   - `EZTK_...` → Test Mode = ON
   - `EZAK_...` → Test Mode = OFF

### Issue: Migration script shows "No keys found"

**Cause:** Keys were never stored in database (good!)

**Solution:**

- This is expected if you configured EasyPost directly via env vars
- Just ensure `.env` has the correct keys
- Skip to Step 2 (add to environment variables)

---

## 📊 Rollback Plan

If you need to rollback this migration:

### 1. Revert Database Migration

```sql
-- Add settings back (use your actual values)
INSERT INTO "SystemSetting" (key, value, description, type, createdAt, updatedAt)
VALUES
  ('easypost_api_key', 'EZTK_your_key_here', 'EasyPost API key', 'STRING', NOW(), NOW()),
  ('easypost_webhook_secret', 'whsec_your_secret_here', 'EasyPost webhook secret', 'STRING', NOW(), NOW());
```

### 2. Revert Code Changes

```bash
git revert <commit-hash-of-this-migration>
pnpm install
pnpm dev:api
```

**Note:** Rollback is NOT recommended - environment variables are more secure.

---

## 📚 Additional Resources

- **EasyPost API Docs:** https://docs.easypost.com/
- **EasyPost API Keys:** https://easypost.com/account/api-keys
- **Test Mode Guide:** https://docs.easypost.com/docs/test-mode
- **Webhook Documentation:** https://docs.easypost.com/docs/webhooks

---

## 🎯 Next Steps (Phase 2)

After Phase 1 is deployed successfully:

1. **Frontend Update:**
   - Remove API key input fields from admin UI
   - Add connection status panel
   - Show masked API key (read-only)

2. **Unified Shipping Settings:**
   - Merge "Shipping Rates" and "EasyPost Shipping" tabs
   - Create single "Shipping" settings page
   - Add shipping method selector

3. **Documentation:**
   - Update `EASYPOST_INTEGRATION.md`
   - Update `CLAUDE.md`
   - Add environment variable docs to README

---

## ✅ Checklist

- [ ] Run export script: `pnpm tsx packages/database/scripts/migrate-easypost-to-env.ts`
- [ ] Copy API keys displayed by script
- [ ] Add keys to `.env` file (local) or hosting platform (production)
- [ ] Run database migration: `pnpm prisma migrate deploy`
- [ ] Restart API server
- [ ] Test `/easypost/health` endpoint
- [ ] Test label generation on a test order
- [ ] Verify no errors in API logs
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Verify production health endpoint

---

**Questions or Issues?**

- Check troubleshooting section above
- Review API logs: `pm2 logs nextpik-api`
- Test connection: `GET /api/v1/easypost/health`
