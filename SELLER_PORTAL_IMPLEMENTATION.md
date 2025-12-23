# NextPik Seller Portal - Implementation Guide

**Status**: Foundation Complete ✅  
**Date**: 2025-12-22  
**Priority**: Production-Ready Enhancement

---

## 🎉 COMPLETED INFRASTRUCTURE

### ✅ 1. Seller API Client
**File**: `apps/web/src/lib/api/seller.ts`

**Features**:
- Complete type-safe API client for all seller endpoints
- Dashboard, Analytics, Products, Orders, Commissions, Payouts, Store, Notifications
- TypeScript interfaces for all data types
- Consistent error handling

**Example Usage**:
```typescript
import * as sellerApi from '@/lib/api/seller';

const dashboard = await sellerApi.getDashboard();
const revenue = await sellerApi.getRevenueAnalytics('monthly');
```

### ✅ 2. Custom React Hooks
**File**: `apps/web/src/hooks/use-seller-dashboard.ts`

**Hooks Created**:
- `useSellerDashboard()` - Main dashboard summary
- `useRevenueAnalytics(period)` - Revenue data by period
- `useOrderStatusBreakdown()` - Order status stats
- `useTopProducts(limit)` - Best performing products
- `useRecentActivity(limit)` - Activity feed
- `useCompleteDashboard()` - Combined data hook

**Features**:
- SWR for caching and revalidation
- Auto-refresh intervals
- Optimistic updates ready
- Error handling built-in

**Example Usage**:
```typescript
import { useCompleteDashboard } from '@/hooks/use-seller-dashboard';

const { dashboard, revenue, topProducts, isLoading } = useCompleteDashboard();
```

### ✅ 3. Reusable Components
**File**: `apps/web/src/components/seller/analytics/stats-card.tsx`

**StatsCard Component**:
- Professional metric cards with icons
- Trend indicators (up/down arrows)
- Color variants (blue, green, purple, gold, red)
- Loading skeletons
- Click actions
- Framer Motion animations

**Example Usage**:
```tsx
<StatsCard
  title="Total Revenue"
  value={formatCurrency(revenue)}
  icon={DollarSign}
  trend={{ value: 12.5, isPositive: true, label: 'vs last month' }}
  color="gold"
/>
```

---

## 📋 NEXT STEPS - IMPLEMENTATION ORDER

### Phase 1: Complete Dashboard Components (High Priority)

#### 1.1 Revenue Chart Component
**File**: `apps/web/src/components/seller/analytics/revenue-chart.tsx`

**Requirements**:
- Line/Area chart using **recharts**
- Period switcher (7 days, 30 days, 90 days, 1 year)
- Responsive design
- Tooltip with formatted values
- Loading state
- Empty state

**Dependencies**:
```bash
pnpm add recharts
```

**Component Spec**:
```tsx
interface RevenueChartProps {
  data: Array<{ date: string; amount: number; orders: number }>;
  period: 'daily' | 'weekly' | 'monthly';
  currency: string;
  isLoading?: boolean;
}
```

#### 1.2 Activity Feed Component
**File**: `apps/web/src/components/seller/analytics/activity-feed.tsx`

**Requirements**:
- Timeline-style activity list
- Different icons for activity types (order, product, payout, review)
- Relative time display (e.g., "2 hours ago")
- Click to navigate to details
- Loading skeleton
- Empty state

#### 1.3 Order Status Donut Chart
**File**: `apps/web/src/components/seller/analytics/order-status-donut.tsx`

**Requirements**:
- Donut chart using **recharts**
- Color-coded segments (pending, processing, shipped, delivered, cancelled)
- Center display of total orders
- Legend with counts
- Responsive

### Phase 2: Enhanced Dashboard Page (Critical)

#### 2.1 Dashboard Layout Update
**File**: `apps/web/src/app/dashboard/seller/page.tsx`

**New Structure**:
```tsx
<div className="space-y-6">
  {/* Metrics Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatsCard title="Total Revenue" ... />
    <StatsCard title="Pending Orders" ... />
    <StatsCard title="Active Products" ... />
    <StatsCard title="Payout Balance" ... />
  </div>

  {/* Charts Row */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      <RevenueChart ... />
    </Card>
    <Card>
      <OrderStatusDonut ... />
    </Card>
  </div>

  {/* Activity & Quick Actions */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      <ActivityFeed ... />
    </Card>
    <Card>
      <QuickActions ... />
    </Card>
  </div>

  {/* Top Products */}
  <Card>
    <TopProductsTable ... />
  </Card>
</div>
```

### Phase 3: Product Management (High Priority)

#### 3.1 Enhanced Product List
**File**: `apps/web/src/app/seller/products/page.tsx`

**Enhancements Needed**:
- Real API integration (replace mock data)
- Advanced filters (category, price, stock status)
- Grid/List view toggle
- Bulk actions (activate, deactivate, delete)
- Search functionality
- Pagination
- Export to CSV

#### 3.2 Product Form Improvements
**File**: `apps/web/src/components/seller/products/product-form.tsx` (NEW)

**Features**:
- Rich text editor (TipTap)
- Multi-image upload with drag-drop
- Variant management (color, size, material)
- Category autocomplete
- Tag management
- SEO fields
- Draft auto-save

### Phase 4: Orders Management (High Priority)

#### 4.1 Orders List Enhancement
**File**: `apps/web/src/app/seller/orders/page.tsx`

**Current**: Basic list exists  
**Needs**: Real API, filters, export, bulk actions

#### 4.2 Order Detail Page
**File**: `apps/web/src/app/seller/orders/[id]/page.tsx`

**Add**:
- Mark as Shipped button
- Upload delivery proof
- Delivery tracking integration
- Commission breakdown
- Customer communication

### Phase 5: Payouts & Commissions (Medium Priority)

#### 5.1 Commissions Page (NEW)
**File**: `apps/web/src/app/seller/commissions/page.tsx`

**Features**:
- Commission history table
- Platform fee breakdown
- Filter by date, status
- Export to CSV
- Summary cards

#### 5.2 Payouts Page (NEW)
**File**: `apps/web/src/app/seller/payouts/page.tsx`

**Features**:
- Payout balance card
- Request payout button
- Payout history
- Payment method management
- Transaction details

### Phase 6: Store Settings (Medium Priority)

#### 6.1 Store Settings Enhancement
**File**: `apps/web/src/app/seller/store/settings/page.tsx`

**Current**: Basic form exists  
**Add**: Logo/banner upload, rich text editor, KYC status

---

## 🛠 BACKEND REQUIREMENTS

### API Endpoints to Implement/Verify

**Already Exist** (in `seller.controller.ts`):
- ✅ `GET /seller/dashboard`
- ✅ `GET /seller/products`
- ✅ `GET /seller/orders`

**Need to Add**:
```typescript
// Analytics
GET /seller/analytics/revenue?period=monthly
GET /seller/analytics/orders
GET /seller/analytics/top-products?limit=5
GET /seller/analytics/recent-activity?limit=10

// Commissions
GET /seller/commissions
GET /seller/commissions/summary

// Payouts
GET /seller/payouts
GET /seller/payouts/:id
POST /seller/payouts/request

// Orders
PATCH /seller/orders/:id/mark-shipped
POST /seller/orders/:id/upload-proof

// Store
GET /seller/store
PUT /seller/store
POST /seller/store/logo
POST /seller/store/banner
```

### Service Methods to Implement

**File**: `apps/api/src/seller/seller.service.ts`

```typescript
// Add these methods:

async getRevenueAnalytics(userId: string, period: string) {
  // Query orders grouped by date
  // Calculate totals and trends
  // Return formatted data
}

async getOrderStatusBreakdown(userId: string) {
  // Count orders by status
  // Return breakdown object
}

async getTopProducts(userId: string, limit: number) {
  // Query products with sales count
  // Order by revenue/sales
  // Return top N products
}

async getRecentActivity(userId: string, limit: number) {
  // Query recent orders, products, reviews
  // Format as activity items
  // Return sorted by timestamp
}

async getCommissions(userId: string, query: any) {
  // Query commission records
  // Include order details
  // Paginate results
}

async getPayouts(userId: string, query: any) {
  // Query payout records
  // Include commission details
  // Paginate results
}

async markOrderAsShipped(userId: string, orderId: string, data: any) {
  // Update order status
  // Create timeline entry
  // Notify customer
  // Notify delivery partner
}
```

---

## 📦 DEPENDENCIES TO INSTALL

```bash
# Charts library
pnpm add recharts

# Rich text editor (for product descriptions)
pnpm add @tiptap/react @tiptap/starter-kit

# Date/time utilities
pnpm add date-fns

# File upload (if not already installed)
pnpm add react-dropzone

# CSV export
pnpm add papaparse
pnpm add -D @types/papaparse
```

---

## 🎨 DESIGN TOKENS

### Color Palette
```typescript
const sellerTheme = {
  primary: '#CBB57B', // NextPik Gold
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: {
    primary: '#000000',
    secondary: '#6B7280',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};
```

### Typography
- **Font Family**: Poppins
- **Headings**: Bold (600-700)
- **Body**: Regular (400-500)

---

## 🧪 TESTING CHECKLIST

### Frontend
- [ ] Dashboard loads in < 1.5s
- [ ] All metrics display correctly
- [ ] Charts render with real data
- [ ] Responsive on mobile
- [ ] Loading states show
- [ ] Error states handled
- [ ] Optimistic updates work

### Backend
- [ ] All endpoints return correct data
- [ ] Permissions enforced (SELLER role)
- [ ] Pagination works
- [ ] Filters apply correctly
- [ ] File uploads succeed
- [ ] Error handling proper

### Integration
- [ ] Escrow status reflects in orders
- [ ] Delivery tracking syncs
- [ ] Payouts calculate correctly
- [ ] Notifications trigger
- [ ] Real-time updates work

---

## 📚 QUICK REFERENCE

### File Structure
```
apps/web/src/
├── lib/api/
│   └── seller.ts ✅ DONE
├── hooks/
│   └── use-seller-dashboard.ts ✅ DONE
├── components/seller/
│   └── analytics/
│       └── stats-card.tsx ✅ DONE
│       └── revenue-chart.tsx ⏳ TODO
│       └── activity-feed.tsx ⏳ TODO
│       └── order-status-donut.tsx ⏳ TODO
└── app/
    ├── dashboard/seller/
    │   └── page.tsx ⏳ ENHANCE
    └── seller/
        ├── products/ ⏳ ENHANCE
        ├── orders/ ⏳ ENHANCE
        ├── commissions/ ❌ NEW
        ├── payouts/ ❌ NEW
        └── store/ ⏳ ENHANCE
```

### Import Patterns
```typescript
// API Client
import * as sellerApi from '@/lib/api/seller';

// Hooks
import { useCompleteDashboard } from '@/hooks/use-seller-dashboard';

// Components
import { StatsCard } from '@/components/seller/analytics/stats-card';
```

---

## 🚀 IMMEDIATE NEXT STEPS

1. **Install Dependencies**:
```bash
cd apps/web
pnpm add recharts @tiptap/react @tiptap/starter-kit date-fns
```

2. **Create Revenue Chart Component**
3. **Create Activity Feed Component**
4. **Enhance Dashboard Page with real data**
5. **Implement backend analytics endpoints**
6. **Test end-to-end flow**

---

## 📞 SUPPORT

If you encounter issues:
1. Check `SETTINGS_API_GUIDE.md` for API patterns
2. Review `ADMIN_QUICK_START.md` for common commands
3. See `TEST_CREDENTIALS.md` for test accounts

---

**Next Session**: Continue with dashboard components and backend API implementation.

**Status**: Foundation is solid. Ready for component build-out! 🎯
