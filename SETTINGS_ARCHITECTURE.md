# Settings Architecture v2.0

> **Last Updated:** January 18, 2026
> **Version:** 2.7.0 - Settings Refactor

## Overview

The settings system in NextPik now follows a **clear separation of concerns** between infrastructure secrets and business configuration:

- **`.env` files** → Infrastructure secrets (API keys, credentials)
- **Database** → Business configuration (enabled/disabled, preferences)

This architecture improves security, reduces confusion about the source of truth, and makes deployment easier.

---

## Architecture Principles

### 1. **Single Source of Truth**
- Each setting has exactly one authoritative source
- No confusion between .env and database values
- Clear documentation of where each setting lives

### 2. **Security First**
- API keys and secrets are NEVER stored in the database
- Sensitive values are never exposed through the UI
- Proper masking for any displayed secrets

### 3. **Runtime vs Deployment**
- `.env` settings require app restart
- Database settings can change at runtime
- UI clearly indicates which is which

### 4. **Backward Compatibility**
- Existing database settings continue to work
- No breaking changes to existing deployments
- Gradual migration path

---

## Settings Categories

### Environment Variables (.env)

**Location:** `apps/api/.env`

**Categories:**
1. **Payment Gateway Credentials**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`

2. **Authentication Providers**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`

3. **Email Service**
   - `RESEND_API_KEY`
   - `EMAIL_FROM`

4. **Storage Providers**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_BUCKET_NAME`

5. **Infrastructure**
   - `DATABASE_URL`
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
   - `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`
   - `JWT_SECRET`

**Characteristics:**
- ✅ Require application restart to change
- ✅ Never exposed through public APIs
- ✅ Not stored in database
- ✅ Managed via deployment/environment config

### Database Settings

**Location:** `SystemSetting` table in PostgreSQL

**Categories:**
1. **Payment Configuration**
   - `stripe_enabled` - Enable/disable Stripe
   - `stripe_test_mode` - Use test/live environment
   - `stripe_currency` - Default currency
   - `stripe_capture_method` - Manual or automatic
   - `stripe_statement_descriptor` - Card statement text

2. **Business Logic**
   - `escrow_enabled` - Enable escrow system
   - `escrow_default_hold_days` - Days to hold payments
   - `min_payout_amount` - Minimum payout threshold
   - `payout_schedule` - Payout frequency
   - `payment_methods` - Enabled payment options

3. **Commission & Delivery**
   - `global_commission_rate`
   - `delivery_confirmation_required`
   - etc.

**Characteristics:**
- ✅ Can change at runtime
- ✅ Managed through admin UI
- ✅ Audit logged with change history
- ✅ Support rollback functionality

---

## Implementation Files

### Frontend

#### Configuration
```
apps/web/src/lib/settings-config.ts
```
Defines which settings come from .env vs database. Single source of truth for setting metadata.

**Key Exports:**
- `ENV_ONLY_SETTINGS` - Array of settings that must come from .env
- `DATABASE_SETTINGS` - Array of settings managed in database
- `SETTINGS_MAP` - Combined map for lookups
- `isEnvSetting(key)` - Check if setting is from .env
- `getEnvKey(settingKey)` - Get the .env variable name
- `isSecretSetting(key)` - Check if value should be masked
- `maskSecretValue(value)` - Mask sensitive values for display

#### Components
```
apps/web/src/components/settings/env-settings-display.tsx
```
Reusable component for displaying read-only environment settings.

**Components:**
- `EnvSettingsDisplay` - Full display with configuration instructions
- `EnvSettingsStatus` - Compact status indicator

**Features:**
- Shows configuration status (configured/missing)
- Displays which .env variable to set
- Provides setup instructions
- Masks secret values
- Indicates which settings require restart

#### Updated Settings Panels
```
apps/web/src/components/settings/payment-settings.tsx
```
Updated to use new architecture:
- Shows API keys as read-only (.env-based)
- Keeps business config editable
- Clear visual separation with badges
- Collapsible API keys section

---

## Usage Guide

### For Developers

#### Adding a New Environment Setting

1. **Add to apps/api/.env:**
   ```bash
   NEW_API_KEY=your_secret_key_here
   ```

2. **Register in settings-config.ts:**
   ```typescript
   {
     key: 'new_api_key',
     source: 'env',
     envKey: 'NEW_API_KEY',
     label: 'New API Key',
     description: 'API key for XYZ service',
     category: 'payment',
     isSecret: true,
     requiresRestart: true,
   }
   ```

3. **Use the EnvSettingsDisplay component:**
   ```typescript
   import { EnvSettingsDisplay, getSettingsByCategory } from '@/lib/settings-config';

   const envSettings = getSettingsByCategory('payment', 'env');

   return (
     <EnvSettingsDisplay
       settings={envSettings}
       values={envValues}
       showValues={false}
     />
   );
   ```

#### Adding a New Database Setting

1. **Seed the setting in database:**
   ```typescript
   // packages/database/prisma/seed-settings.ts
   await prisma.systemSetting.create({
     data: {
       key: 'new_feature_enabled',
       category: 'general',
       value: true,
       valueType: 'BOOLEAN',
       label: 'Enable New Feature',
       description: 'Toggle new feature on/off',
       isPublic: false,
       isEditable: true,
       requiresRestart: false,
     },
   });
   ```

2. **Register in settings-config.ts:**
   ```typescript
   {
     key: 'new_feature_enabled',
     source: 'database',
     label: 'Enable New Feature',
     description: 'Toggle new feature on/off',
     category: 'general',
   }
   ```

3. **Use in UI with existing components:**
   ```typescript
   <SettingsToggle
     label="Enable New Feature"
     description="Toggle new feature on/off"
     checked={getSetting('new_feature_enabled') ?? false}
     onCheckedChange={async (checked) => {
       await updateSetting('new_feature_enabled', checked, 'Toggled feature');
     }}
   />
   ```

### For Administrators

#### Configuring Stripe (Example)

**Step 1: Get your Stripe keys**
1. Visit https://dashboard.stripe.com/apikeys
2. Copy your Publishable key (starts with `pk_`)
3. Copy your Secret key (starts with `sk_`)
4. Get your Webhook secret from Webhooks section

**Step 2: Update .env file**
```bash
# apps/api/.env

STRIPE_PUBLISHABLE_KEY=pk_test_51abc...
STRIPE_SECRET_KEY=sk_test_51abc...
STRIPE_WEBHOOK_SECRET=whsec_abc...
```

**Step 3: Restart the application**
```bash
# If using Docker
docker-compose restart api

# If running locally
pkill node
pnpm dev:api
```

**Step 4: Configure business settings in UI**
1. Navigate to Settings → Payment
2. Toggle "Enable Stripe" ON
3. Set "Test Mode" based on your keys
4. Choose default currency
5. Select capture method
6. Save changes

**Step 5: Verify configuration**
- Check the "Configuration Status" panel
- All three keys should show green checkmarks
- Click "Show API Keys Configuration" to see details

---

## Migration Guide

### Migrating Existing Database Keys to .env

If you have Stripe keys stored in the database, follow these steps:

**Step 1: Extract current values**
```sql
SELECT key, value FROM system_settings
WHERE key IN ('stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret');
```

**Step 2: Add to .env file**
```bash
STRIPE_PUBLISHABLE_KEY=<value_from_database>
STRIPE_SECRET_KEY=<value_from_database>
STRIPE_WEBHOOK_SECRET=<value_from_database>
```

**Step 3: Remove from database (optional)**
```sql
DELETE FROM system_settings
WHERE key IN ('stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret');
```

**Step 4: Restart application**
```bash
pnpm dev:api
```

The backend will now read these values from .env instead of the database.

---

## Security Best Practices

### DO ✅

1. **Store secrets in .env files**
   - API keys, tokens, passwords
   - OAuth client secrets
   - Webhook signing secrets

2. **Use environment variables in CI/CD**
   - GitHub Actions secrets
   - Vercel/Railway environment variables
   - Docker secrets

3. **Keep .env files out of version control**
   - Add to `.gitignore`
   - Use `.env.example` for templates
   - Document required variables

4. **Rotate secrets regularly**
   - Update .env files
   - Restart applications
   - No database changes needed

### DON'T ❌

1. **Never commit .env files**
   - Contains production secrets
   - Can leak credentials

2. **Don't store secrets in database**
   - Accessible through SQL
   - Harder to rotate
   - May be in backups

3. **Don't expose secrets in UI**
   - Even to admins
   - Use masked display only

4. **Don't mix sources**
   - Each setting has one source
   - No fallbacks between .env and DB

---

## Troubleshooting

### "Stripe keys not configured"

**Problem:** UI shows Stripe keys as missing.

**Solution:**
1. Check `apps/api/.env` file exists
2. Verify the three STRIPE_* variables are set
3. Restart the API server
4. Click "Reload Config" button in UI

### "Setting not updating"

**Problem:** Changes in .env not reflected in app.

**Cause:** .env changes require restart.

**Solution:**
```bash
# Kill the API process
pkill -f "next-env"

# Restart
pnpm dev:api
```

### "Can't edit API keys in UI"

**Problem:** API key fields are read-only or not showing.

**Expected Behavior:** This is intentional! API keys should be managed via .env files, not the UI.

**Solution:**
1. Edit `apps/api/.env` directly
2. Add or update the relevant STRIPE_*/PAYPAL_*/etc. variables
3. Restart the application
4. Verify in UI under "Show API Keys Configuration"

---

## FAQ

**Q: Why move keys from database to .env?**
**A:** Security and simplicity. .env files are:
- Not accessible through SQL queries
- Easier to manage in deployment pipelines
- Standard practice for infrastructure secrets
- Excluded from backups by default

**Q: Can I still use database for some API keys?**
**A:** Not recommended. The architecture enforces a single source of truth. If a key is in `ENV_ONLY_SETTINGS`, it must come from .env.

**Q: What happens to old database keys?**
**A:** They're ignored. The backend reads from .env first. You can safely delete them from the database.

**Q: Do I need to migrate everything at once?**
**A:** No. The system is backward compatible. Migrate secrets to .env as you update deployments.

**Q: How do I know which settings require .env?**
**A:** Check `apps/web/src/lib/settings-config.ts` → `ENV_ONLY_SETTINGS` array. The UI also shows a ".env" badge for these settings.

**Q: Can end users configure API keys?**
**A:** No. Only developers/DevOps with server access can modify .env files. This is a security feature.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.7.0 | Jan 18, 2026 | Settings refactor - moved API keys to .env, added EnvSettingsDisplay component |
| 2.6.0 | Jan 16, 2026 | Authentication enhancements |
| 2.5.0 | Jan 3, 2026 | Stripe subscription integration |

---

## Related Documentation

- `CLAUDE.md` - General project guidelines
- `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md` - Full technical reference
- `apps/api/.env.example` - Environment variables template
- `packages/database/prisma/schema.prisma` - Database schema

---

*For questions or issues, refer to the main documentation or create an issue in the project repository.*
