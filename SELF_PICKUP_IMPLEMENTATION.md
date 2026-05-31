# Self-Pickup / Local Pickup Implementation Plan

**Date:** March 20, 2026
**Feature:** Allow customers to pick up orders directly from sellers' locations

---

## 📋 Overview

Add self-pickup as a shipping option allowing customers to:

- Choose "Local Pickup" at checkout (FREE or configurable fee)
- Pick up orders from seller's physical location
- Avoid shipping costs for nearby customers
- Support multi-vendor orders (pickup from multiple sellers)

---

## 🎯 Goals

1. ✅ **Customer Experience** - Easy option to select pickup at checkout
2. ✅ **Seller Control** - Sellers enable/disable pickup, set location & hours
3. ✅ **Zero Shipping Cost** - Default FREE (configurable by seller)
4. ✅ **Multi-Vendor Support** - Handle orders from multiple sellers
5. ✅ **Order Tracking** - Unique status for pickup orders
6. ✅ **Notifications** - Email/SMS when ready for pickup

---

## 🏗️ Architecture

### Shipping Provider Hierarchy (Updated)

```
TIER 0: Gelato (POD items only)
TIER 0.5: Self-Pickup (NEW - if customer is nearby) ← ADDED
TIER 1: EasyPost (Multi-carrier, enabled by default)
TIER 2: DHL (DHL Express)
TIER 3: Zones or Manual (Fallback)
```

---

## 📊 Database Changes

### 1. **Add Pickup Fields to Store Model**

```prisma
model Store {
  // ... existing fields ...

  // Self-Pickup Configuration
  pickupEnabled          Boolean   @default(false)
  pickupAddress          String?   // Full pickup address (if different from store address)
  pickupInstructions     String?   @db.Text // e.g., "Ring doorbell, wait at loading dock"
  pickupHours            Json?     // Structured pickup hours { monday: "9am-5pm", ... }
  pickupRadius           Int?      // Max distance in km/miles for pickup eligibility
  pickupFee              Decimal?  @default(0) @db.Decimal(10, 2) // Optional pickup fee
  pickupEstimatedMinutes Int?      @default(30) // How long to prepare order

  @@map("stores")
}
```

### 2. **Update Order Model**

```prisma
model Order {
  // ... existing fields ...

  // Pickup-specific fields
  isPickup              Boolean   @default(false)
  pickupStoreId         String?   // If single-vendor pickup
  pickupScheduledAt     DateTime? // When customer plans to pickup
  pickupCompletedAt     DateTime? // When order was picked up
  pickupCode            String?   // 6-digit verification code
  pickupInstructions    String?   @db.Text // From seller

  pickupStore          Store?    @relation("OrderPickupStore", fields: [pickupStoreId], references: [id])

  @@map("orders")
}
```

### 3. **Add Pickup-Specific Statuses**

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING

  // Pickup statuses (NEW)
  READY_FOR_PICKUP // Seller marks order ready
  PICKED_UP        // Customer picked up (terminal status)
  PICKUP_EXPIRED   // Customer didn't pick up within timeframe

  // Existing statuses
  PARTIALLY_SHIPPED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

---

## 🔧 Implementation Steps

### **Phase 1: Database & Models** (1-2 hours)

1. ✅ Create migration for Store pickup fields
2. ✅ Create migration for Order pickup fields
3. ✅ Add new OrderStatus enum values
4. ✅ Run migrations on dev database

```bash
# Create migration
cd packages/database
npx prisma migrate dev --name add_self_pickup_support

# Verify
npx prisma migrate status
```

---

### **Phase 2: Backend API** (3-4 hours)

#### **2.1 Seller Settings API**

**File:** `apps/api/src/seller/seller.controller.ts`

```typescript
// New endpoints
@Patch('pickup-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async updatePickupSettings(@Req() req, @Body() dto: UpdatePickupSettingsDto) {
  // Update store pickup configuration
}

@Get('pickup-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async getPickupSettings(@Req() req) {
  // Get current pickup configuration
}
```

**DTO:** `apps/api/src/seller/dto/update-pickup-settings.dto.ts`

```typescript
export class UpdatePickupSettingsDto {
  @IsBoolean()
  pickupEnabled: boolean;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  pickupInstructions?: string;

  @IsOptional()
  @IsObject()
  pickupHours?: Record<string, string>; // { monday: "9am-5pm" }

  @IsOptional()
  @IsNumber()
  pickupRadius?: number; // km

  @IsOptional()
  @IsNumber()
  pickupFee?: number;

  @IsOptional()
  @IsNumber()
  pickupEstimatedMinutes?: number;
}
```

#### **2.2 Update Shipping Calculation Service**

**File:** `apps/api/src/orders/shipping-tax.service.ts`

Add new method:

```typescript
/**
 * Check if self-pickup is available for customer location
 * TIER 0.5: Inserted BEFORE EasyPost in cascade
 */
private async calculatePickupOptions(
  address: ShippingAddress,
  items: CartItem[],
  subtotal: number
): Promise<ShippingOption[]> {
  const pickupOptions: ShippingOption[] = [];

  // Group items by store
  const storeGroups = new Map<string, CartItem[]>();
  for (const item of items) {
    if (!item.storeId) continue;
    if (!storeGroups.has(item.storeId)) {
      storeGroups.set(item.storeId, []);
    }
    storeGroups.get(item.storeId)!.push(item);
  }

  // Check each store for pickup availability
  for (const [storeId, storeItems] of storeGroups) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        pickupEnabled: true,
        pickupAddress: true,
        pickupFee: true,
        pickupRadius: true,
        pickupEstimatedMinutes: true,
        address1: true,
        city: true,
        province: true,
        country: true,
        postalCode: true,
        name: true,
      },
    });

    if (!store || !store.pickupEnabled) continue;

    // Check if customer is within pickup radius
    const storeLocation = {
      address: store.pickupAddress || store.address1,
      city: store.city,
      state: store.province,
      country: store.country,
      postalCode: store.postalCode,
    };

    const isWithinRadius = await this.isWithinPickupRadius(
      address,
      storeLocation,
      store.pickupRadius || 50 // default 50km
    );

    if (isWithinRadius) {
      pickupOptions.push({
        id: `pickup-${storeId}`,
        name: `Local Pickup from ${store.name}`,
        description: `Ready in ${store.pickupEstimatedMinutes || 30} minutes`,
        price: store.pickupFee?.toNumber() || 0,
        estimatedDays: 0, // Same day
        carrier: 'Self-Pickup',
        metadata: {
          storeId,
          storeName: store.name,
          pickupAddress: storeLocation,
        },
      });
    }
  }

  return pickupOptions;
}

/**
 * Check if customer address is within pickup radius
 */
private async isWithinPickupRadius(
  customerAddress: ShippingAddress,
  storeAddress: any,
  radiusKm: number
): Promise<boolean> {
  // Option 1: Simple - Compare zip codes (fast, approximate)
  if (customerAddress.postalCode === storeAddress.postalCode) {
    return true;
  }

  // Option 2: Advanced - Use geocoding API (accurate, requires API key)
  // Use Google Maps Distance Matrix or Mapbox Distance API
  // For now, return true if same city/state
  return (
    customerAddress.city?.toLowerCase() === storeAddress.city?.toLowerCase() &&
    customerAddress.state?.toLowerCase() === storeAddress.state?.toLowerCase()
  );
}
```

**Update main cascade method:**

```typescript
async calculateShippingOptions(
  address: ShippingAddress,
  items: CartItem[],
  subtotal: number
): Promise<ShippingOption[]> {
  // TIER 0: Gelato (POD)
  // ... existing Gelato logic ...

  // TIER 0.5: Self-Pickup (NEW)
  const pickupOptions = await this.calculatePickupOptions(address, items, subtotal);
  if (pickupOptions.length > 0) {
    this.logger.log(`[Pickup] Found ${pickupOptions.length} pickup options available`);
    // Return pickup + other options (let customer choose)
    const otherOptions = await this.getOtherShippingOptions(address, items, subtotal);
    return [...pickupOptions, ...otherOptions];
  }

  // TIER 1: EasyPost
  // ... existing logic ...
}
```

#### **2.3 Order Creation with Pickup**

**File:** `apps/api/src/orders/orders.service.ts`

Update `createOrder()` method:

```typescript
async createOrder(dto: CreateOrderDto, userId: string) {
  // ... existing validation ...

  // Check if pickup order
  const isPickup = dto.shippingOptionId?.startsWith('pickup-');

  let pickupStoreId: string | undefined;
  let pickupCode: string | undefined;

  if (isPickup) {
    // Extract storeId from shipping option
    pickupStoreId = dto.shippingOptionId.replace('pickup-', '');

    // Generate 6-digit pickup code
    pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

    // For pickup orders, shipping address can be optional or same as billing
    // Override shippingAddressId with store address
    const store = await this.prisma.store.findUnique({
      where: { id: pickupStoreId },
      select: { address1: true, city: true, province: true, postalCode: true },
    });

    // Create address record for store location (for consistency)
    const storeAddress = await this.prisma.address.create({
      data: {
        userId,
        street: store.address1 || 'Store Location',
        city: store.city || '',
        state: store.province || '',
        zipCode: store.postalCode || '',
        country: store.country || 'US',
        isDefault: false,
      },
    });

    dto.shippingAddressId = storeAddress.id;
  }

  // Create order
  const order = await this.prisma.order.create({
    data: {
      // ... existing fields ...
      isPickup,
      pickupStoreId,
      pickupCode,
      pickupInstructions: isPickup ? await this.getPickupInstructions(pickupStoreId!) : null,
      shippingProvider: isPickup ? 'SELF_PICKUP' : dto.shippingProvider,
    },
  });

  // Send pickup notification email
  if (isPickup) {
    await this.emailService.sendPickupOrderCreated(order);
  }

  return order;
}

private async getPickupInstructions(storeId: string): Promise<string | null> {
  const store = await this.prisma.store.findUnique({
    where: { id: storeId },
    select: { pickupInstructions: true },
  });
  return store?.pickupInstructions || null;
}
```

#### **2.4 Seller Mark Ready for Pickup**

**File:** `apps/api/src/seller/seller-orders.controller.ts`

```typescript
@Post('orders/:orderId/mark-ready-pickup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async markReadyForPickup(
  @Param('orderId') orderId: string,
  @Req() req
) {
  const order = await this.ordersService.markReadyForPickup(orderId, req.user.id);

  // Send notification to customer
  await this.emailService.sendPickupReadyNotification(order);
  await this.smsService.sendPickupReadySMS(order); // Optional

  return { success: true, order };
}

@Post('orders/:orderId/confirm-pickup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async confirmPickup(
  @Param('orderId') orderId: string,
  @Body() dto: ConfirmPickupDto
) {
  // Verify pickup code
  const order = await this.ordersService.confirmPickup(orderId, dto.pickupCode);
  return { success: true, order };
}
```

**DTO:**

```typescript
export class ConfirmPickupDto {
  @IsString()
  @Length(6, 6)
  pickupCode: string; // 6-digit code shown to customer
}
```

---

### **Phase 3: Frontend UI** (4-5 hours)

#### **3.1 Seller Pickup Settings Page**

**File:** `apps/web/src/app/seller/pickup-settings/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function PickupSettingsPage() {
  const [enabled, setEnabled] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      pickupEnabled: false,
      pickupAddress: '',
      pickupInstructions: '',
      pickupHours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        // ...
      },
      pickupRadius: 25, // km
      pickupFee: 0,
      pickupEstimatedMinutes: 30,
    },
  });

  const onSubmit = async (data: any) => {
    const res = await fetch('/api/v1/seller/pickup-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // Handle response
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Self-Pickup Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable Pickup Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Enable Self-Pickup</h2>
            <p className="text-gray-600">Allow customers to pick up orders from your location</p>
          </div>
          <input
            type="checkbox"
            {...register('pickupEnabled')}
            onChange={(e) => setEnabled(e.target.checked)}
            className="toggle"
          />
        </div>

        {enabled && (
          <>
            {/* Pickup Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Address</label>
              <input
                type="text"
                {...register('pickupAddress')}
                placeholder="123 Main St, City, State ZIP"
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank to use your store address</p>
            </div>

            {/* Pickup Instructions */}
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Instructions</label>
              <textarea
                {...register('pickupInstructions')}
                placeholder="Ring doorbell at loading dock entrance..."
                rows={4}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Pickup Hours */}
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Hours</label>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                (day) => (
                  <div key={day} className="flex items-center gap-4 mb-2">
                    <span className="w-24 capitalize">{day}</span>
                    <input
                      type="text"
                      {...register(`pickupHours.${day}`)}
                      placeholder="9:00 AM - 5:00 PM or 'Closed'"
                      className="flex-1 border rounded px-3 py-2"
                    />
                  </div>
                )
              )}
            </div>

            {/* Pickup Radius */}
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Radius (km)</label>
              <input
                type="number"
                {...register('pickupRadius')}
                min="1"
                max="100"
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Only customers within this radius can select pickup
              </p>
            </div>

            {/* Pickup Fee */}
            <div>
              <label className="block text-sm font-medium mb-2">Pickup Fee (USD)</label>
              <input
                type="number"
                {...register('pickupFee')}
                min="0"
                step="0.01"
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">Set to $0 for free pickup (recommended)</p>
            </div>

            {/* Preparation Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Preparation Time (minutes)</label>
              <input
                type="number"
                {...register('pickupEstimatedMinutes')}
                min="15"
                max="1440"
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                How long it takes to prepare an order for pickup
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
```

#### **3.2 Checkout Shipping Options (Show Pickup)**

**File:** `apps/web/src/components/checkout/shipping-method.tsx`

Update to display pickup options:

```tsx
{
  shippingOptions.map((option) => (
    <div
      key={option.id}
      className={`border rounded-lg p-4 cursor-pointer ${
        selectedOption?.id === option.id ? 'border-blue-600 bg-blue-50' : ''
      }`}
      onClick={() => setSelectedOption(option)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{option.name}</h3>
          <p className="text-sm text-gray-600">{option.description}</p>

          {/* Pickup-specific info */}
          {option.carrier === 'Self-Pickup' && (
            <div className="mt-2 text-sm text-green-600">
              <p>📍 {option.metadata?.pickupAddress?.address}</p>
              <p>✅ Ready for pickup same day!</p>
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="font-bold">{option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}</p>
          {option.estimatedDays > 0 && (
            <p className="text-sm text-gray-500">
              {option.estimatedDays} {option.estimatedDays === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
      </div>
    </div>
  ));
}
```

#### **3.3 Seller Order Management (Pickup Actions)**

**File:** `apps/web/src/app/seller/orders/[id]/page.tsx`

Add pickup action buttons:

```tsx
{
  order.isPickup && order.status === 'PROCESSING' && (
    <button
      onClick={() => markReadyForPickup()}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      ✅ Mark Ready for Pickup
    </button>
  );
}

{
  order.isPickup && order.status === 'READY_FOR_PICKUP' && (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p className="font-semibold">Pickup Code</p>
        <p className="text-3xl font-mono">{order.pickupCode}</p>
        <p className="text-sm text-gray-600 mt-2">
          Ask customer for this code before releasing order
        </p>
      </div>

      <button onClick={() => confirmPickup()} className="bg-blue-600 text-white px-4 py-2 rounded">
        🎉 Confirm Pickup Complete
      </button>
    </div>
  );
}
```

#### **3.4 Customer Order Tracking (Pickup View)**

**File:** `apps/web/src/app/dashboard/buyer/orders/[id]/page.tsx`

```tsx
{
  order.isPickup && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">📍 Pickup Information</h2>

      {order.status === 'PROCESSING' && (
        <p className="text-gray-700">
          Your order is being prepared. You'll receive a notification when it's ready for pickup.
        </p>
      )}

      {order.status === 'READY_FOR_PICKUP' && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-300 rounded p-4">
            <p className="text-green-800 font-semibold text-lg">
              ✅ Your order is ready for pickup!
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">Pickup Code:</p>
            <p className="text-4xl font-mono bg-white p-4 rounded border">{order.pickupCode}</p>
            <p className="text-sm text-gray-600 mt-2">
              Show this code to the seller when picking up your order
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">Pickup Location:</p>
            <p className="text-gray-700">{order.pickupInstructions}</p>
            <p className="text-gray-700 mt-1">{order.shippingAddress.street}</p>
            <p className="text-gray-700">
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zipCode}
            </p>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
          >
            🗺️ Get Directions
          </a>
        </div>
      )}

      {order.status === 'PICKED_UP' && (
        <div className="bg-gray-100 border border-gray-300 rounded p-4">
          <p className="text-gray-700">
            ✅ Order picked up on {formatDate(order.pickupCompletedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### **Phase 4: Email Notifications** (1-2 hours)

#### **4.1 Pickup Order Created Email**

**File:** `apps/api/src/email/templates/pickup-order-created.template.ts`

```typescript
export const pickupOrderCreatedTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<body>
  <h1>Your Order is Ready for Pickup Soon!</h1>
  <p>Hi ${order.user.name},</p>
  <p>Your order <strong>#${order.orderNumber}</strong> has been placed and will be ready for pickup soon.</p>

  <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2>Pickup Details</h2>
    <p><strong>Store:</strong> ${order.pickupStore.name}</p>
    <p><strong>Address:</strong><br>${order.pickupInstructions}</p>
    <p><strong>Estimated Ready Time:</strong> ${order.pickupEstimatedMinutes} minutes</p>
  </div>

  <p>You'll receive another email with your pickup code when your order is ready.</p>

  <a href="${process.env.FRONTEND_URL}/dashboard/buyer/orders/${order.id}"
     style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    View Order
  </a>
</body>
</html>
`;
```

#### **4.2 Order Ready for Pickup Email**

```typescript
export const pickupReadyTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<body>
  <h1>🎉 Your Order is Ready for Pickup!</h1>
  <p>Hi ${order.user.name},</p>
  <p>Great news! Your order <strong>#${order.orderNumber}</strong> is now ready for pickup.</p>

  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #22c55e;">
    <h2>Your Pickup Code</h2>
    <p style="font-size: 48px; font-weight: bold; font-family: monospace; text-align: center; margin: 20px 0;">
      ${order.pickupCode}
    </p>
    <p style="text-align: center; color: #666;">
      Show this code to the seller when picking up your order
    </p>
  </div>

  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Pickup Location</h3>
    <p><strong>${order.pickupStore.name}</strong></p>
    <p>${order.pickupInstructions}</p>
    <a href="https://maps.google.com/?q=${encodeURIComponent(fullAddress)}"
       style="color: #3b82f6;">Get Directions →</a>
  </div>

  <a href="${process.env.FRONTEND_URL}/dashboard/buyer/orders/${order.id}"
     style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    View Order Details
  </a>
</body>
</html>
`;
```

---

### **Phase 5: System Settings** (30 mins)

Add pickup-related settings to seed:

**File:** `packages/database/prisma/seed-settings.ts`

```typescript
{
  key: 'pickup_enabled_globally',
  category: 'shipping',
  value: true,
  valueType: SettingValueType.BOOLEAN,
  label: 'Enable Self-Pickup Globally',
  description: 'Allow sellers to offer self-pickup as a shipping option',
  isPublic: true,
  isEditable: true,
  requiresRestart: false,
  defaultValue: true,
},
{
  key: 'pickup_max_radius_km',
  category: 'shipping',
  value: 50,
  valueType: SettingValueType.NUMBER,
  label: 'Maximum Pickup Radius (km)',
  description: 'Maximum distance customers can be from store to select pickup',
  isPublic: false,
  isEditable: true,
  requiresRestart: false,
  defaultValue: 50,
},
{
  key: 'pickup_default_fee',
  category: 'shipping',
  value: 0,
  valueType: SettingValueType.NUMBER,
  label: 'Default Pickup Fee (USD)',
  description: 'Default fee for pickup orders (sellers can override)',
  isPublic: false,
  isEditable: true,
  requiresRestart: false,
  defaultValue: 0,
},
{
  key: 'pickup_expiry_hours',
  category: 'shipping',
  value: 72,
  valueType: SettingValueType.NUMBER,
  label: 'Pickup Expiry (hours)',
  description: 'Hours after which uncollected pickup orders expire',
  isPublic: false,
  isEditable: true,
  requiresRestart: false,
  defaultValue: 72,
},
```

---

## 🧪 Testing Checklist

### **Backend Tests**

- [ ] Seller can enable/disable pickup
- [ ] Seller can set pickup address, hours, instructions
- [ ] Pickup options appear only for customers within radius
- [ ] Pickup fee is applied correctly
- [ ] Pickup code is generated (6 digits)
- [ ] Seller can mark order ready for pickup
- [ ] Seller can confirm pickup with code verification
- [ ] Order status transitions correctly: PROCESSING → READY_FOR_PICKUP → PICKED_UP
- [ ] Multi-vendor orders with pickup from multiple stores

### **Frontend Tests**

- [ ] Seller pickup settings page loads and saves
- [ ] Pickup options display at checkout
- [ ] Pickup is FREE or shows correct fee
- [ ] Customer can select pickup option
- [ ] Order confirmation shows pickup details
- [ ] Customer receives pickup code email
- [ ] Seller can see pickup code in order details
- [ ] Google Maps link works correctly

### **Edge Cases**

- [ ] Customer outside pickup radius → No pickup option shown
- [ ] Store with pickup disabled → No pickup option
- [ ] Empty pickup instructions → Use default text
- [ ] Pickup order cancellation → Handle correctly
- [ ] Pickup expiry → Auto-cancel after 72 hours

---

## 📊 Analytics & Metrics

Track these metrics:

- **Pickup Adoption Rate** - % of orders using pickup
- **Pickup Completion Rate** - % of pickup orders actually collected
- **Average Preparation Time** - How long sellers take to prepare
- **Pickup Expiry Rate** - % of orders that expire uncollected
- **Pickup by Distance** - Distribution of customer distances
- **Cost Savings** - Shipping costs saved via pickup

---

## 🚀 Future Enhancements

1. **SMS Notifications** - Send pickup code via SMS
2. **QR Code** - Generate QR code for pickup verification
3. **Curbside Pickup** - "I'm here" button for curbside delivery
4. **Scheduled Pickup** - Customer selects specific pickup time
5. **Pickup Points** - Third-party pickup locations (like lockers)
6. **Geocoding Integration** - Accurate distance calculation (Google Maps API)
7. **Pickup Reminders** - Remind customers to pick up before expiry
8. **Pickup Analytics Dashboard** - Seller insights on pickup performance

---

## 📋 Migration Script

```sql
-- Migration: Add Self-Pickup Support
-- Date: 2026-03-20

-- Add pickup fields to Store
ALTER TABLE "stores" ADD COLUMN "pickupEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "stores" ADD COLUMN "pickupAddress" TEXT;
ALTER TABLE "stores" ADD COLUMN "pickupInstructions" TEXT;
ALTER TABLE "stores" ADD COLUMN "pickupHours" JSONB;
ALTER TABLE "stores" ADD COLUMN "pickupRadius" INTEGER;
ALTER TABLE "stores" ADD COLUMN "pickupFee" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "stores" ADD COLUMN "pickupEstimatedMinutes" INTEGER DEFAULT 30;

-- Add pickup fields to Order
ALTER TABLE "orders" ADD COLUMN "isPickup" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "pickupStoreId" TEXT;
ALTER TABLE "orders" ADD COLUMN "pickupScheduledAt" TIMESTAMP;
ALTER TABLE "orders" ADD COLUMN "pickupCompletedAt" TIMESTAMP;
ALTER TABLE "orders" ADD COLUMN "pickupCode" VARCHAR(6);
ALTER TABLE "orders" ADD COLUMN "pickupInstructions" TEXT;

-- Add foreign key
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupStoreId_fkey"
  FOREIGN KEY ("pickupStoreId") REFERENCES "stores"("id") ON DELETE SET NULL;

-- Add new order statuses
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "OrderStatus" ADD VALUE 'PICKUP_EXPIRED';

-- Add indexes
CREATE INDEX "orders_isPickup_idx" ON "orders"("isPickup");
CREATE INDEX "orders_pickupStoreId_idx" ON "orders"("pickupStoreId");
CREATE INDEX "orders_pickupCode_idx" ON "orders"("pickupCode");
CREATE INDEX "stores_pickupEnabled_idx" ON "stores"("pickupEnabled");
```

---

## 🎯 Summary

**Estimated Implementation Time:** 10-12 hours

**Phases:**

1. ✅ Database (1-2h) - Migrations + schema changes
2. ✅ Backend (3-4h) - APIs, pickup logic, order flow
3. ✅ Frontend (4-5h) - Seller settings, checkout, order tracking
4. ✅ Emails (1-2h) - Notification templates
5. ✅ Settings (30m) - System configuration
6. ✅ Testing (1-2h) - End-to-end testing

**Benefits:**

- 💰 **Zero Shipping Costs** - Free for customers
- 🚀 **Faster Fulfillment** - Same-day pickup available
- 🏪 **Foot Traffic** - Brings customers to physical locations
- 🌍 **Eco-Friendly** - Reduces carbon footprint
- 💪 **Competitive Advantage** - Not all platforms offer this

**Next Steps:**

1. Review and approve this implementation plan
2. Create database migration
3. Implement backend APIs
4. Build frontend UI
5. Test end-to-end
6. Deploy to production

---

Ready to implement? Let me know which phase you'd like to start with! 🚀
