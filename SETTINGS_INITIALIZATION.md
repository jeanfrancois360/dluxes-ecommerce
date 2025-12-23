# Settings Initialization Guide

## Overview
This guide explains how to initialize and manage system settings for the Luxury E-commerce platform.

## Initial Setup

### Quick Start
If you're seeing "Setting 'site_name' not found" or similar errors in the admin settings page, run this command:

```bash
# From the project root
npx tsx packages/database/prisma/seed-settings.ts
```

This will create all 48 default system settings in your database.

### What Gets Seeded

The seed script creates settings in the following categories:

#### General Settings (7 settings)
- `site_name` - Platform name
- `site_tagline` - Platform tagline/slogan
- `contact_email` - Support email address
- `contact_phone` - Support phone number
- `timezone` - Default timezone
- `maintenance_mode` - Enable/disable site
- `allowed_countries` - Countries where orders are allowed

#### Payment Settings (16 settings)
- `escrow_enabled` - Enable escrow system
- `escrow_default_hold_days` - Days to hold funds
- `min_payout_amount` - Minimum payout threshold
- `payout_schedule` - Payout frequency
- `escrow_auto_release_enabled` - Auto-release funds
- `payment_methods` - Enabled payment methods
- **Stripe Integration:**
  - `stripe_enabled` - Enable Stripe
  - `stripe_test_mode` - Use test mode
  - `stripe_publishable_key` - Public API key
  - `stripe_secret_key` - Secret API key
  - `stripe_webhook_secret` - Webhook secret
  - `stripe_webhook_url` - Webhook URL
  - `stripe_currency` - Default currency
  - `stripe_capture_method` - Capture method (manual/automatic)
  - `stripe_statement_descriptor` - Card statement text
  - `stripe_auto_payout_enabled` - Auto-transfer to sellers

#### Commission Settings (3 settings)
- `global_commission_rate` - Default commission percentage
- `commission_type` - Commission calculation type
- `commission_applies_to_shipping` - Include shipping in commission

#### Currency Settings (4 settings)
- `default_currency` - Primary currency (USD)
- `supported_currencies` - All enabled currencies
- `currency_auto_sync` - Auto-update exchange rates
- `currency_sync_frequency` - How often to sync rates

#### Delivery Settings (4 settings)
- `delivery_confirmation_required` - Require delivery proof
- `free_shipping_threshold` - Free shipping minimum
- `delivery_auto_assign` - Auto-assign to partners
- `delivery_partner_commission` - Delivery partner rate

#### Security Settings (7 settings)
- `2fa_required_for_admin` - Enforce 2FA for admins
- `password_min_length` - Minimum password characters
- `session_timeout_minutes` - Session timeout duration
- `max_login_attempts` - Failed login limit
- `password_require_special_chars` - Require special chars
- `allowed_file_types` - Permitted upload formats
- `max_file_size_mb` - Maximum file upload size

#### Notification Settings (3 settings)
- `email_notifications_enabled` - Enable email notifications
- `sms_notifications_enabled` - Enable SMS notifications
- `notification_events` - Events that trigger notifications

#### SEO Settings (4 settings)
- `seo_meta_title` - Default meta title
- `seo_meta_description` - Default meta description
- `seo_keywords` - Default keywords
- `analytics_enabled` - Enable Google Analytics

## Accessing Settings

### Admin Interface
1. Navigate to `/admin/settings`
2. Use the tabbed interface to access different setting categories
3. Edit settings directly in the UI
4. Changes are saved with audit trail

### Programmatic Access

#### Backend (NestJS)
```typescript
import { SettingsService } from '@/settings/settings.service';

// Get a setting
const siteName = await this.settingsService.getSetting('site_name');

// Update a setting
await this.settingsService.updateSetting(
  'maintenance_mode',
  true,
  userId,
  userEmail,
  ipAddress,
  userAgent,
  'Enabling maintenance for updates'
);
```

#### Frontend (React)
```typescript
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';

function MyComponent() {
  const { settings, loading } = useSettings('general');
  const { updateSetting } = useSettingsUpdate();

  const handleUpdate = async () => {
    await updateSetting('site_name', 'My New Name', 'Rebranding');
  };
}
```

## Common Issues

### "Setting 'xxx' not found" Error
**Solution**: Run the seed script
```bash
npx tsx packages/database/prisma/seed-settings.ts
```

### Settings Page Shows Empty
**Cause**: Settings not seeded or database connection issue

**Solution**:
1. Check database connection
2. Run seed script
3. Check browser console for errors

### Cannot Update Settings
**Cause**: Insufficient permissions or settings marked as not editable

**Solution**:
1. Ensure you're logged in as ADMIN or SUPER_ADMIN
2. Check that the setting has `isEditable: true` in database
3. Some settings (like `requiresRestart: true`) need app restart

## Re-seeding Settings

### Safe Re-seed (Preserves Custom Values)
The seed script uses `upsert`, which:
- Creates settings that don't exist
- Updates metadata (label, description) for existing settings
- **Preserves your custom values**

```bash
npx tsx packages/database/prisma/seed-settings.ts
```

### Full Reset (⚠️ Destructive)
To completely reset all settings to defaults:

```bash
# Delete all settings (USE WITH CAUTION!)
npx prisma studio
# Or use SQL
# DELETE FROM system_settings;

# Then re-seed
npx tsx packages/database/prisma/seed-settings.ts
```

## Adding New Settings

### 1. Add to Seed Script
Edit `packages/database/prisma/seed-settings.ts`:

```typescript
{
  key: 'my_new_setting',
  category: 'general',
  value: 'default value',
  valueType: SettingValueType.STRING,
  label: 'My New Setting',
  description: 'What this setting does',
  isPublic: false,
  isEditable: true,
  requiresRestart: false,
  defaultValue: 'default value',
}
```

### 2. Update Frontend Types
Add to `apps/web/src/lib/validations/settings.ts`:

```typescript
export const generalSettingsSchema = z.object({
  // ... existing fields
  my_new_setting: z.string(),
});
```

### 3. Update UI Component
Add form field in the appropriate settings component.

### 4. Run Seed Script
```bash
npx tsx packages/database/prisma/seed-settings.ts
```

## Audit Trail

Every setting change is logged with:
- Old value
- New value
- Who made the change
- When it was changed
- Why (reason provided)
- IP address and user agent

View audit logs:
- Admin UI: Settings page → "View History" button
- API: `GET /api/v1/settings/admin/audit-logs`
- Specific setting: `GET /api/v1/settings/{key}/audit`

## Environment Variables vs Database Settings

### When to Use Environment Variables
- Secrets (API keys in production)
- Server configuration (port, host)
- Database connections

### When to Use Database Settings
- Business logic configuration
- Feature flags
- User-configurable options
- Values that change frequently

### Best Practice for Stripe Keys
**Development**: Use database settings (easier to manage)
**Production**: Consider environment variables for security

The system supports both:
```typescript
// Priority: Environment variable > Database setting
const stripeKey = process.env.STRIPE_SECRET_KEY || 
                  await settingsService.getSetting('stripe_secret_key');
```

## Backup and Restore

### Backup Settings
```bash
# Export all settings
npx prisma db execute --file=backup-settings.sql
```

### Restore Settings
```bash
# Import settings backup
npx prisma db execute --file=restore-settings.sql
```

## Troubleshooting

### Check Current Settings
```bash
# Open Prisma Studio
npx prisma studio

# Navigate to SystemSetting table
# View all current settings
```

### View Audit History
```bash
# Check SettingsAuditLog table in Prisma Studio
# Filter by settingKey or changedBy
```

### Reset Specific Category
```typescript
// Delete specific category settings
await prisma.systemSetting.deleteMany({
  where: { category: 'general' }
});

// Re-seed
npx tsx packages/database/prisma/seed-settings.ts
```

---

**Last Updated**: 2025-12-22
**Version**: 1.0.0
