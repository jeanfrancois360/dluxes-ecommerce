# Settings API - Developer Guide

## Overview
This guide explains the settings system architecture and how to properly use it to avoid breaking changes.

## ⚠️ Critical: Route Ordering in NestJS

**IMPORTANT**: In NestJS, route order matters! More specific routes MUST come BEFORE generic parameterized routes.

### ❌ Wrong Order (Will Break)
```typescript
@Get(':key')           // ← Catches everything, including "category/payment"
async getSetting()

@Get('category/:category')  // ← Will NEVER match!
async getByCategory()
```

### ✅ Correct Order
```typescript
@Get()                      // Root route
async getAllSettings()

@Get('category/:category')  // Specific route
async getByCategory()

@Get('admin/audit-logs')    // Specific route
async getAllAuditLogs()

@Get(':key/audit')          // Parameterized + path
async getAuditLog()

@Get(':key')                // Generic param (MUST BE LAST!)
async getSetting()
```

## Backend API Routes

### Public Routes (No Authentication)
- `GET /settings/public` - Get public settings
- `GET /settings/stripe/publishable-key` - Get Stripe publishable key
- `GET /settings/stripe/configured` - Check if Stripe is configured
- `GET /settings/inventory/all` - Get inventory settings

### Authenticated Routes
- `GET /settings/:key` - Get setting by key (requires auth)

### Admin Routes (Requires ADMIN/SUPER_ADMIN role)
- `GET /settings` - Get all settings
- `GET /settings/category/:category` - Get settings by category
- `GET /settings/admin/audit-logs` - Get all audit logs
- `GET /settings/stripe/status` - Get Stripe configuration status
- `GET /settings/:key/audit` - Get audit log for a specific setting
- `POST /settings` - Create new setting
- `PATCH /settings/:key` - Update setting
- `DELETE /settings/:key` - Delete setting
- `POST /settings/rollback` - Rollback setting to previous value
- `POST /settings/stripe/reload` - Reload Stripe configuration

## Frontend Usage

### ✅ Type-Safe API Client (Recommended)

**Option 1: Named imports (recommended)**
```typescript
import * as settingsApi from '@/lib/api/settings';

// Get all settings
const settings = await settingsApi.getAllSettings();

// Get settings by category
const paymentSettings = await settingsApi.getSettingsByCategory('payment');

// Get public settings (no auth required)
const publicSettings = await settingsApi.getPublicSettings();

// Update a setting
await settingsApi.updateSetting('stripe_enabled', true, 'Enabling Stripe payments');

// Get audit log
const auditLogs = await settingsApi.getSettingAuditLog('stripe_enabled');
```

**Option 2: Using the API object**
```typescript
import { settingsAPI, settingsApi } from '@/lib/api/settings';

// Both are the same (settingsApi is an alias for backward compatibility)
const settings = await settingsAPI.getPublic();
const settings2 = await settingsApi.getPublicSettings();
```

**Option 3: Individual function imports**
```typescript
import { getAllSettings, updateSetting, getPublicSettings } from '@/lib/api/settings';

const settings = await getAllSettings();
await updateSetting('stripe_enabled', true);
const publicSettings = await getPublicSettings();
```

### ✅ Using React Hooks (Recommended)
```typescript
import { useSettings, useSettingsUpdate } from '@/hooks/use-settings';

function SettingsPage() {
  const { settings, loading, error, refetch } = useSettings('payment');
  const { updateSetting, updating } = useSettingsUpdate();

  const handleToggle = async (key: string, value: boolean) => {
    await updateSetting(key, value, 'User toggled setting');
    refetch();
  };

  // ...
}
```

### ❌ Direct Axios Usage (NOT Recommended)
```typescript
// DON'T DO THIS - Use the type-safe API client instead
await axios.patch(`${API_URL}/settings/${key}`, { value });
```

## Data Types

### Setting Object
```typescript
interface Setting {
  key: string;
  value: any;
  label: string;
  description?: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  category: string;
  isPublic: boolean;
  isEditable: boolean;
  requiresRestart: boolean;
}
```

### Audit Log Object
```typescript
interface SettingAuditLog {
  id: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedByEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLLBACK';
  reason?: string;
  createdAt: string;
}
```

## Best Practices

### 1. Always Use Type-Safe API Client
- Use `@/lib/api/settings` instead of direct API calls
- This provides type safety and automatic error handling
- Prevents breaking changes when endpoints change

### 2. Always Add Route Order Comments
When adding new routes to the settings controller:
```typescript
/**
 * IMPORTANT: This route must come BEFORE :key route
 * @route GET /settings/my-new-route
 */
@Get('my-new-route')
async myNewRoute() { }
```

### 3. Use React Hooks for State Management
- `useSettings(category?)` - Fetch and manage settings
- `useSettingsUpdate()` - Update settings with loading states
- `useSettingsAudit(settingKey?)` - Fetch audit logs

### 4. Always Provide Audit Reasons
```typescript
// ✅ Good
await updateSetting('stripe_enabled', true, 'Enabling payments for new store');

// ❌ Bad (no reason)
await updateSetting('stripe_enabled', true);
```

## Troubleshooting

### 404 Error on PATCH /settings/:key
**Cause**: Route ordering issue or authentication failure

**Solution**:
1. Check that more specific routes come before `:key` route
2. Verify user has ADMIN or SUPER_ADMIN role
3. Check that JWT token is valid

### Settings Not Updating
**Cause**: Using cached data or not refetching after update

**Solution**:
```typescript
const { updateSetting } = useSettingsUpdate();
const { refetch } = useSettings('payment');

await updateSetting(key, value);
refetch(); // ← Don't forget this!
```

### Type Errors
**Cause**: Using outdated types or direct axios

**Solution**: Always import types from `@/lib/api/settings`:
```typescript
import type { Setting, SettingAuditLog } from '@/lib/api/settings';
```

## Maintenance Checklist

Before modifying the settings controller:
- [ ] Understand NestJS route ordering rules
- [ ] Add new specific routes BEFORE generic `:key` route
- [ ] Update type definitions in `@/lib/api/settings.ts`
- [ ] Test all routes after changes
- [ ] Document any new routes in this guide

## Testing

### Manual Testing
```bash
# Test getting all settings (requires admin auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/v1/settings

# Test updating a setting (requires admin auth)
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true, "reason": "Testing"}' \
  http://localhost:4000/api/v1/settings/stripe_enabled

# Test getting settings by category (requires admin auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/settings/category/payment
```

## Files Modified

### Backend
- `apps/api/src/settings/settings.controller.ts` - Route ordering fixed

### Frontend
- `apps/web/src/lib/api/settings.ts` - Type-safe API client (NEW)
- `apps/web/src/hooks/use-settings.ts` - Updated to use new API client

## Migration Guide

If you have existing code using axios directly:

### Before
```typescript
const response = await axios.patch(
  `${API_URL}/settings/${key}`,
  { value, reason },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### After
```typescript
import { updateSetting } from '@/lib/api/settings';

const data = await updateSetting(key, value, reason);
```

---

**Last Updated**: 2025-12-22
**Maintained By**: Development Team
