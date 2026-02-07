# Seller Dashboard Components

This directory contains all the components for the seller dashboard UI/UX system.

## Components

### Layout Components

- **`seller-layout.tsx`** - Main layout wrapper with responsive sidebar
- **`sidebar.tsx`** - Fixed sidebar navigation with active link highlighting
- **`mobile-nav.tsx`** - Mobile hamburger menu and header

### UI Components

- **`stat-card.tsx`** - Reusable metric card with trend indicators
- **`quick-action-card.tsx`** - Action card with icon and navigation
- **`page-header.tsx`** - Consistent page headers with breadcrumbs

## Usage

### Layout

The `SellerLayout` component is used in `/app/seller/layout.tsx` and provides:

- Fixed sidebar navigation on desktop
- Mobile-responsive hamburger menu
- Smooth animations using Framer Motion
- Gold accent color theme (#CBB57B)

```tsx
import SellerLayout from '@/components/seller/seller-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SellerLayout>{children}</SellerLayout>;
}
```

### Page Header

Add breadcrumbs and consistent styling to pages:

```tsx
import PageHeader from '@/components/seller/page-header';

<PageHeader
  title="Products"
  description="Manage your product listings"
  breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Products' }]}
  actions={<button>Add Product</button>}
/>;
```

### Stat Cards

Display metrics with optional trend indicators:

```tsx
import StatCard from '@/components/seller/stat-card';
import { Package } from 'lucide-react';

<StatCard
  title="Total Products"
  value={150}
  icon={Package}
  subtitle="25 active"
  trend={{ value: 12, isPositive: true }}
  isLoading={false}
  index={0}
/>;
```

### Quick Actions

Create action cards for the dashboard:

```tsx
import QuickActionCard from '@/components/seller/quick-action-card';
import { PlusCircle } from 'lucide-react';

<QuickActionCard
  title="Add New Product"
  description="Create and list a new product"
  icon={PlusCircle}
  href="/seller/products/new"
  index={0}
/>;
```

## Design System

### Colors

- **Primary Gold**: `#CBB57B`
- **Secondary Gold**: `#B8A068`
- **Neutral Backgrounds**: `neutral-50`, `neutral-100`

### Animations

All components use Framer Motion with:

- Spring animations for smooth feel
- Staggered delays for card grids
- Hover/tap effects on interactive elements

### Breakpoints

- **Mobile**: < 768px (sidebar collapses to hamburger)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (full sidebar visible)

## Navigation Structure

1. **Dashboard & Overview**
   - Dashboard (main)
   - Onboarding checklist

2. **Products & Inventory**
   - Products list
   - Add new product
   - Reviews

3. **Orders & Customers**
   - Orders
   - Inquiries

4. **Marketing & Growth**
   - Advertisements
   - Advertisement plans

5. **Earnings & Payments**
   - Earnings overview
   - Payout settings

6. **Subscription & Credits**
   - Subscription plan
   - Selling credits

7. **Settings**
   - Store settings
   - Vacation mode

## Features

- ✅ Fixed sidebar navigation
- ✅ Mobile responsive
- ✅ Active link highlighting
- ✅ Breadcrumb navigation
- ✅ Smooth animations
- ✅ Loading states
- ✅ Reusable components
- ✅ TypeScript support
- ✅ Consistent styling
