# Inventory System Settings Integration

## Overview
The inventory management system has been fully integrated with the System Settings module, allowing admins to configure inventory parameters from the UI instead of hardcoded values.

## What Was Implemented

### 1. Backend Integration

#### Database Seed (`packages/database/prisma/seeds/inventory-settings.seed.ts`)
Added 7 inventory settings to the database:
- `inventory.low_stock_threshold` - Stock level considered "low stock" (default: 10)
- `inventory.auto_sku_generation` - Auto-generate SKUs for new products (default: true)
- `inventory.sku_prefix` - Prefix for auto-generated SKUs (default: "PROD")
- `inventory.enable_stock_notifications` - Send email alerts for low stock (default: true)
- `inventory.notification_recipients` - Email addresses for stock alerts
- `inventory.allow_negative_stock` - Allow backorders (default: false)
- `inventory.transaction_history_page_size` - Pagination size (default: 20)

Run with: `npx tsx packages/database/prisma/seeds/inventory-settings.seed.ts`

#### Settings Service (`apps/api/src/settings/settings.service.ts`)
Added methods to fetch inventory settings:
- `getLowStockThreshold()` - Get threshold value
- `getAutoSkuGeneration()` - Get SKU auto-gen setting
- `getSkuPrefix()` - Get SKU prefix
- `getStockNotificationsEnabled()` - Get notification setting
- `getStockNotificationRecipients()` - Get email list
- `getAllowNegativeStock()` - Get backorder policy
- `getTransactionHistoryPageSize()` - Get pagination size
- `getInventorySettings()` - Get all inventory settings at once (optimized)

#### API Endpoint
Added public endpoint:
```
GET /settings/inventory/all
```
Returns all inventory settings in one call (no auth required for public settings)

### 2. Frontend Integration

#### Constants Files
**Frontend**: `apps/web/src/lib/constants/inventory.ts`
```typescript
export const INVENTORY_DEFAULTS = {
  LOW_STOCK_THRESHOLD: 10,
  TRANSACTION_HISTORY_PAGE_SIZE: 20,
  MAX_ITEMS_PER_PAGE: 100,
} as const;
```

**Backend**: `apps/api/src/common/constants/inventory.constants.ts`
```typescript
export const INVENTORY_DEFAULTS = {
  LOW_STOCK_THRESHOLD: 10,
  TRANSACTION_PAGE_SIZE: 50,
} as const;

export const SKU_CONFIG = {
  PRODUCT_PREFIX: 'PROD',
  RANDOM_LENGTH: 6,
} as const;
```

#### Custom Hook (`apps/web/src/hooks/use-inventory-settings.ts`)
```typescript
const { settings, loading, lowStockThreshold, transactionHistoryPageSize } = useInventorySettings();
```
- Fetches settings from `/settings/inventory/all`
- Falls back to constants if API fails
- Provides helper getters for common settings

#### Admin UI (`apps/web/src/components/settings/inventory-settings.tsx`)
Complete settings management interface with:
- **Stock Thresholds Section**: Low stock threshold, transaction history page size
- **SKU Generation Section**: Auto-generation toggle, SKU prefix configuration
- **Notifications & Policies Section**: Stock notifications toggle, negative stock policy

#### Settings Page Integration
Added "Inventory" tab to `/admin/settings`:
- Icon: Package
- Description: "Stock & inventory management"
- Placed between Currency and Delivery tabs

### 3. Component Updates

All inventory components now use settings dynamically:

**Updated Components:**
- `StockStatusBadge` - Uses `lowStockThreshold` from settings
- `StockLevelIndicator` - Uses `lowStockThreshold` from settings
- `InventoryHistoryModal` - Uses `transactionHistoryPageSize` from settings
- `Products List Page` - Fetches settings via `useInventorySettings()` hook
- `Product Form` - Uses constants with fallback to defaults
- `Inventory Service` (backend) - Uses constants with fallback to defaults
- `SKU Generator` (backend) - Uses SKU_CONFIG constants

## How It Works

### Settings Priority
1. **User-configured** settings from database (via System Settings)
2. **Default constants** as fallback if settings don't exist or API fails
3. **Component props** can still override settings when needed

### Example Flow
```
Admin changes "Low Stock Threshold" to 15 in UI
  ↓
Frontend calls PATCH /settings/inventory.low_stock_threshold
  ↓
Backend updates database + creates audit log
  ↓
Products page fetches settings via useInventorySettings()
  ↓
StockStatusBadge receives lowStockThreshold={15}
  ↓
Products with ≤15 units show "Low Stock" badge
```

## Admin Usage

### Viewing Settings
1. Navigate to `/admin/settings`
2. Click "Inventory" tab
3. View all configurable inventory parameters

### Updating Settings
1. Change any setting value
2. Click "Save" button next to the field
3. System creates audit log entry
4. Frontend components automatically use new values on next load

### Settings Changes Are Logged
- Every change creates an audit log entry
- Records: old value, new value, who changed it, when, from where
- Can be viewed in Settings → History
- Changes can be rolled back if needed

## Benefits

1. **No Hardcoding**: All configurable values are in settings
2. **Centralized Configuration**: One place to manage all inventory parameters
3. **Runtime Changes**: Update settings without redeploying code
4. **Audit Trail**: Full history of all configuration changes
5. **Graceful Fallback**: System works even if settings fail to load
6. **Type-Safe**: TypeScript constants ensure type safety
7. **Developer-Friendly**: Easy to add new settings in the future

## Adding New Inventory Settings

### 1. Add to Database Seed
Edit `inventory-settings.seed.ts`:
```typescript
{
  key: 'inventory.new_setting',
  category: 'inventory',
  value: defaultValue,
  valueType: SettingValueType.NUMBER, // or STRING, BOOLEAN, etc.
  label: 'Display Name',
  description: 'What this setting does',
  isPublic: true,
  isEditable: true,
  requiresRestart: false,
}
```

### 2. Add Getter to Settings Service
```typescript
async getNewSetting(): Promise<number> {
  try {
    const setting = await this.getSetting('inventory.new_setting');
    return Number(setting.value) || defaultValue;
  } catch (error) {
    return defaultValue;
  }
}
```

### 3. Add to Frontend Hook (if needed)
Update `InventorySettings` interface in `use-inventory-settings.ts`

### 4. Add UI in Settings Component
Add field to `inventory-settings.tsx` component

### 5. Reseed Database
```bash
npx tsx packages/database/prisma/seeds/inventory-settings.seed.ts
```

## Files Modified/Created

### Created:
- `packages/database/prisma/seeds/inventory-settings.seed.ts`
- `apps/web/src/lib/constants/inventory.ts`
- `apps/api/src/common/constants/inventory.constants.ts`
- `apps/web/src/hooks/use-inventory-settings.ts`
- `apps/web/src/components/settings/inventory-settings.tsx`

### Modified:
- `apps/api/src/settings/settings.service.ts` - Added inventory getters
- `apps/api/src/settings/settings.controller.ts` - Added `/settings/inventory/all` endpoint
- `apps/api/src/products/inventory.service.ts` - Use constants
- `apps/api/src/common/utils/sku-generator.util.ts` - Use SKU_CONFIG
- `apps/web/src/components/admin/stock-status-badge.tsx` - Use constants
- `apps/web/src/components/admin/inventory-history-modal.tsx` - Use constants
- `apps/web/src/components/admin/product-form.tsx` - Import constants
- `apps/web/src/app/admin/products/page.tsx` - Use hook to fetch settings
- `apps/web/src/app/admin/settings/page.tsx` - Add inventory tab

## Testing

### Test Settings UI
1. Go to `/admin/settings`
2. Click "Inventory" tab
3. Change "Low Stock Threshold" to 15
4. Click Save
5. Go to `/admin/products`
6. Products with 15 or fewer units should show "Low Stock" badge

### Test API
```bash
# Get all inventory settings
curl http://localhost:4000/api/v1/settings/inventory/all

# Get specific setting
curl http://localhost:4000/api/v1/settings/inventory.low_stock_threshold

# Update setting (requires auth)
curl -X PATCH http://localhost:4000/api/v1/settings/inventory.low_stock_threshold \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": 15}'
```

## Future Enhancements

- Add email notification service for low stock alerts
- Create scheduled job to check stock levels daily
- Add bulk update UI for multiple settings
- Create setting presets (e.g., "Conservative", "Aggressive" stock policies)
- Add setting validation rules
- Create setting templates for different business types
