# Phase B Audit Report — NextPik Codebase Pattern Survey

**Date:** 2026-05-20
**Scope:** Read-only. Three areas: i18n namespace structure, admin sidebar, existing referral patterns.
**Purpose:** Inform Phase C (affiliate + blog build) so new code matches existing patterns.
**Files modified:** None.

---

## Table of Contents

- [Section 1 — i18n message namespace structure](#section-1--i18n-message-namespace-structure)
  - [1.1 File inventory](#11--file-inventory)
  - [1.2 Top-level namespaces in en.json](#12--top-level-namespaces-in-enjson)
  - [1.3 Structure depth and shape](#13--structure-depth-and-shape)
  - [1.4 Naming conventions](#14--naming-conventions)
  - [1.5 How keys are consumed in components](#15--how-keys-are-consumed-in-components)
  - [1.6 Existing admin-area i18n state](#16--existing-admin-area-i18n-state)
  - [1.7 Recommended namespace plan for new features](#17--recommended-namespace-plan-for-new-features)
- [Section 2 — Admin sidebar structure](#section-2--admin-sidebar-structure)
  - [2.1 Sidebar component file](#21--sidebar-component-file)
  - [2.2 Group/item structure](#22--groupitem-structure)
  - [2.3 How sidebar items become pages](#23--how-sidebar-items-become-pages)
  - [2.4 Where new groups/items should slot](#24--where-new-groupsitems-should-slot)
  - [2.5 Sidebar's auth check](#25--sidebars-auth-check)
- [Section 3 — Existing referral system patterns](#section-3--existing-referral-system-patterns)
  - [3.1 File inventory](#31--file-inventory)
  - [3.2 Data model](#32--data-model)
  - [3.3 Attribution mechanism](#33--attribution-mechanism)
  - [3.4 Click logging or visit tracking](#34--click-logging-or-visit-tracking)
  - [3.5 Storage of credit/reward](#35--storage-of-creditreward)
  - [3.6 Comparison to Awin model](#36--comparison-to-awin-model)
  - [3.7 Anything we should NOT copy](#37--anything-we-should-not-copy)
- [Section 4 — Cross-cutting findings](#section-4--cross-cutting-findings)
- [Section 5 — Recommended next planning decisions](#section-5--recommended-next-planning-decisions)

---

## Section 1 — i18n message namespace structure

### 1.1 — File inventory

Directory: `apps/web/messages/`

```
-rw-r--r--  en.json           208,101 bytes   5430 lines   (≈203 KB)
-rw-r--r--  es.json           220,130 bytes   5309 lines   (≈215 KB)
-rw-r--r--  fr.json           226,513 bytes   5309 lines   (≈221 KB)

Ignored (backup/temp):
  en.json.bak          192,605 bytes   (backup of an older en.json)
  en.json.temp               0 bytes   (empty)
  fr.json.backup       145,820 bytes   (older fr.json, pre-full-translation)
  fr.json.original-backup 145,593 bytes
```

**Finding:** `en.json` is slightly larger (121 more lines) than the other two locales, suggesting a small number of keys exist in English that have not yet been added to `es.json` / `fr.json`. The difference is small (~2%) and likely from the most recent additions.

---

### 1.2 — Top-level namespaces in `en.json`

67 top-level keys. Full list:

```
about                     account                   adminAdvertisementPlans
adminAdvertisements        adminAnalytics            adminCategories
adminCommissions           adminCurrencies           adminCustomers
adminDashboard             adminDeliveries           adminDeliveryPayouts
adminDeliveryProviders     adminEscrow               adminNav
adminOrders                adminPayouts              adminProducts
adminReviews               adminSellers              adminSettings
adminShipping              adminSubscriptions        ads
auth                       becomeSeller              buyerDashboard
buyerNav                   cart                      checkout
checkoutCancel             checkoutSuccess           common
components                 contact                   help
hotDeals                   legal                     pages
privacy                    productCard               products
quickViewModal             search                    sellerAdPlans
sellerAds                  sellerApplicationStatus   sellerCreditsSuccess
sellerDashboard            sellerEarnings            sellerInquiries
sellerNav                  sellerOnboarding          sellerOrderDetails
sellerOrders               sellerPayoutSettings      sellerProducts
sellerProductsEdit         sellerProductsNew         sellerReviews
sellerSellingCredits       sellerStoreSettings       sellerSubscription
sellerSubscriptionPlans    sellerSubscriptionSuccess sellerVacationMode
stores                     terms                     track
trackOrder                 wishlist
```

**Organization pattern:** Predominantly **page/feature-based**, with a clear naming convention:

- Admin pages: `admin{PageName}` (e.g., `adminDashboard`, `adminProducts`)
- Seller pages: `seller{PageName}` (e.g., `sellerDashboard`, `sellerOrders`)
- Buyer pages: `buyer{PageName}` (e.g., `buyerDashboard`, `buyerNav`)
- Public pages: short noun (`cart`, `checkout`, `products`, `stores`)
- Navigation: `adminNav`, `sellerNav`, `buyerNav`
- Shared components: `common`, `components`

---

### 1.3 — Structure depth and shape

#### `adminDashboard` — 2 levels deep, ~20 leaf strings, feature-organized

```
pageTitle
pageDescription
sections.overview
sections.paymentSystem
sections.analytics
sections.quickActions
stats.totalRevenue
stats.totalOrders
stats.totalCustomers
stats.totalProducts
charts.revenue
charts.orders
charts.topProducts
charts.customerGrowth
recentOrders.title
recentOrders.viewAll
recentOrders.guestCustomer
recentOrders.noEmail
recentOrders.noOrders
recentOrders.view
```

Shape: flat second level; `pageTitle`/`pageDescription` at root, then semantic groupings (`stats.*`, `charts.*`, `recentOrders.*`).

#### `adminSettings` — 2 levels deep (some 3), ~60+ leaf strings

```
pageTitle
pageDescription
searchPlaceholder
buttons.viewHistory
buttons.hideHistory
buttons.close
tabs.overview.label        ← 3 deep
tabs.overview.description
tabs.general.label
tabs.payment.label
tabs.commission.label
tabs.currency.label
tabs.inventory.label
tabs.tax.label
```

Shape: `tabs.{tabName}.{property}` pattern for multi-tab pages; demonstrates 3-level nesting is acceptable.

#### `adminProducts` — 2 levels deep, ~50+ leaf strings, semantic groups

```
pageTitle / pageDescription
actionsTitle
header.exportButton / header.addProductButton
stats.title / stats.totalProducts / stats.activeProducts / ...
filters.title / filters.searchPlaceholder / filters.loading / ...
```

#### `cart` — 1 level (flat), ~40 leaf strings

```
shoppingCart
itemsInCart
itemInCart
emptyCart
orderSummary
subtotalItems
shipping
calculatedAtCheckout
tax
subtotal
...
```

Shape: completely flat, no sub-grouping. Simple page.

#### `common` — 3 levels deep, ~80+ leaf strings

```
nav.home / nav.shop / nav.stores / nav.wishlist / nav.cart / ...
nav.adminDashboard / nav.sellerDashboard / ...
home.hero.accessories.title         ← 3 deep
home.hero.accessories.subtitle
home.hero.fashion.title
...
toast.addedToCart
toast.addedToWishlist
toast.loginRequired
toast.error / toast.success
```

Shape: `common` is the cross-cutting shared namespace. Contains global navigation, toast messages, and hero section copy. Nested 3 levels for hero variants.

#### `auth` — 2 levels, organized by flow

```
login.title / login.subtitle / login.emailLabel / ...
register.chooseAccountType / register.createAccount / ...
register.buyerAccount / register.sellerAccount / ...
register.buyerBenefit1..4 / register.sellerBenefit1..4
```

#### `components` — 2 levels: `components.{componentName}.{key}`

```
reviewsList.{keys}
reviewCard.{keys}
addressForm.{keys}
checkoutStepper.{keys}
filtersSidebar.{keys}
wishlistButton.{keys}
shippingMethod.{keys}
orderStatusBadge.{keys}
orderProgressTracker.{keys}
...
```

Shape: groups shared/reusable React component strings under one top-level namespace, with component name as second level. This avoids polluting page namespaces with component strings.

---

### 1.4 — Naming conventions

- **Case:** `camelCase` throughout — for both namespace names and leaf keys.
- **Plurality:** Namespace names follow the page name, which can be singular or plural:
  - Singular: `cart`, `checkout`, `account`, `search`, `help`
  - Plural: `products`, `stores`, `orders`, `reviews`
  - Admin prefix wins: `adminProducts`, `adminOrders` (plural matches route)
- **Key style:** Keys are noun phrases or descriptive labels, not imperative verbs:
  - `addProductButton` not `addProduct`
  - `exportButton` not `export`
  - `searchPlaceholder` not `placeholder`
  - Exception: some action keys in `auth` use verbs: `register.createAccount`
- **Common namespace:** `common.{category}.{key}` is the shared utility bag (nav links, toast messages).

**5 representative key paths:**

| Key path                              | Namespace        | Type               |
| ------------------------------------- | ---------------- | ------------------ |
| `adminDashboard.stats.totalRevenue`   | admin page       | stat label         |
| `adminSettings.tabs.overview.label`   | admin page       | tab label (3-deep) |
| `common.toast.addedToCart`            | shared           | toast message      |
| `auth.register.buyerBenefit1`         | auth flow        | marketing copy     |
| `components.orderStatusBadge.pending` | shared component | status label       |

---

### 1.5 — How keys are consumed in components

**Client components use `useTranslations`:**

```
apps/web/src/components/reviews/reviews-list.tsx:30:
  const t = useTranslations('components.reviewsList');

apps/web/src/components/reviews/review-card.tsx:16:
  const t = useTranslations('components.reviewCard');

apps/web/src/components/checkout/address-form.tsx:88:
  const t = useTranslations('components.addressForm');

apps/web/src/components/checkout/checkout-stepper.tsx:23:
  const t = useTranslations('components.checkoutStepper');

apps/web/src/components/filters-sidebar.tsx:42:
  const t = useTranslations('components.filtersSidebar');

apps/web/src/components/orders/order-status-badge.tsx:16:
  const t = useTranslations('components.orderStatusBadge');
```

**Server pages use `getTranslations`:**

```
apps/web/src/app/about/page.tsx:5:
  const t = await getTranslations('about');
```

**Detail — register page (3 namespaces in one component):**

`apps/web/src/app/auth/register/page.tsx` lines 34–36:

```tsx
const t = useTranslations('auth.register');
const tc = useTranslations('common');
const tLogin = useTranslations('auth.login');
```

Usage (lines 44–60):

```tsx
title: t('buyerAccount'),
description: t('buyerDescription'),
benefits: [t('buyerBenefit1'), t('buyerBenefit2'), t('buyerBenefit3'), t('buyerBenefit4')],
```

No interpolation visible on these calls. Interpolation (`t('key', { amount })`) is used elsewhere in the codebase (e.g., currency values in cart) but was not directly captured in these grep results.

**Admin dashboard (page-level namespace):**

`apps/web/src/app/admin/dashboard/page.tsx` line 10–11:

```tsx
import { useTranslations } from 'next-intl';
// ...
const t = useTranslations('adminDashboard');
```

Usage pattern: `t('stats.totalRevenue')`, `t('sections.overview')`, etc.

**Key pattern rules confirmed:**

1. Components under `components/` → `useTranslations('components.{ComponentName}')`
2. Admin pages → `useTranslations('adminPageName')` where `adminPageName` matches top-level key
3. Server-rendered pages → `await getTranslations('namespace')`
4. A single component/page can hold multiple `useTranslations` calls bound to different namespaces

---

### 1.6 — Existing admin-area i18n state

All admin-prefixed namespaces found in `en.json`:

```
adminAdvertisementPlans  → Advertisement plans management page
adminAdvertisements      → Advertisements management page
adminAnalytics           → Analytics dashboard
adminCategories          → Category management
adminCommissions         → Commission settings and overview
adminCurrencies          → Currency management
adminCustomers           → Customer list and detail
adminDashboard           → Main dashboard stats, charts, recent orders
adminDeliveries          → Delivery tracking
adminDeliveryPayouts     → Delivery partner payout management
adminDeliveryProviders   → Delivery provider configuration
adminEscrow              → Escrow transaction management
adminNav                 → Sidebar navigation labels (groups + items)
adminOrders              → Order management list/detail
adminPayouts             → Seller payout management
adminProducts            → Product management list
adminReviews             → Review moderation
adminSellers             → Seller management list/detail
adminSettings            → System settings (tabbed, ~60+ keys)
adminShipping            → Shipping configuration
adminSubscriptions       → Subscription management
```

21 admin-prefixed namespaces exist. However, **CRITICAL GAP FOUND:**

The `/admin/referrals` page (`apps/web/src/app/admin/referrals/page.tsx`) does **NOT** use `useTranslations`. It uses hardcoded English strings throughout:

```tsx
// apps/web/src/app/admin/referrals/page.tsx lines 42–50
statCards = [
  {
    title: 'Total Referrals',         // ← hardcoded
    value: statistics?.total?.count || 0,
    ...
  },
  {
    title: 'Total Rewards Paid',       // ← hardcoded
    ...
```

There is **no `adminReferrals` namespace** in `en.json`. This means admin pages are **partially** i18n'd — 21 pages have namespaces, but the referrals page was never added to the system. New admin pages (affiliate, blog) should have proper namespaces from day one.

---

### 1.7 — Recommended namespace plan for new features

All recommendations follow the confirmed `camelCase`, `admin{PageName}` naming convention.

#### Affiliate namespace: `affiliate`

Top-level namespace for public-facing affiliate program copy (product links, advertiser listings, deal pages). Matches the convention of short plural/noun names for public pages (`products`, `stores`).

Suggested structure:

```json
{
  "affiliate": {
    "pageTitle": "...",
    "pageDescription": "...",
    "hero": {
      "title": "...",
      "subtitle": "...",
      "cta": "..."
    },
    "product": {
      "visitStore": "...",
      "commission": "...",
      "externalLink": "..."
    },
    "advertiser": {
      "name": "...",
      "category": "...",
      "commissionRate": "..."
    },
    "filters": {
      "allCategories": "...",
      "searchPlaceholder": "..."
    },
    "empty": {
      "title": "...",
      "description": "..."
    }
  }
}
```

#### Admin affiliate namespace: `adminAffiliate`

For the admin management page. Follows `admin{PageName}` pattern exactly.

Suggested structure:

```json
{
  "adminAffiliate": {
    "pageTitle": "...",
    "pageDescription": "...",
    "stats": {
      "totalAdvertisers": "...",
      "activeLinks": "...",
      "clicksThisMonth": "...",
      "estimatedCommission": "..."
    },
    "advertiserTable": {
      "name": "...",
      "category": "...",
      "status": "...",
      "commissionRate": "...",
      "actions": "..."
    },
    "clickLog": {
      "title": "...",
      "productName": "...",
      "clickedAt": "...",
      "converted": "..."
    },
    "sync": {
      "lastSynced": "...",
      "syncNow": "...",
      "syncing": "..."
    }
  }
}
```

#### Blog namespace: `blog`

Public-facing blog (post list, post detail, categories). Short noun, no prefix.

Suggested structure:

```json
{
  "blog": {
    "pageTitle": "...",
    "pageDescription": "...",
    "post": {
      "publishedAt": "...",
      "author": "...",
      "readingTime": "...",
      "categories": "...",
      "sharePost": "...",
      "backToBlog": "..."
    },
    "list": {
      "latestPosts": "...",
      "featuredPost": "...",
      "loadMore": "...",
      "noPosts": "..."
    },
    "comments": {
      "title": "...",
      "writeComment": "...",
      "submitComment": "...",
      "noComments": "...",
      "loginToComment": "..."
    },
    "filters": {
      "allCategories": "...",
      "searchPlaceholder": "..."
    }
  }
}
```

#### Admin blog namespace: `adminBlog`

For admin post management and comment moderation.

Suggested structure:

```json
{
  "adminBlog": {
    "pageTitle": "...",
    "pageDescription": "...",
    "post": {
      "new": "...",
      "edit": "...",
      "publish": "...",
      "unpublish": "...",
      "delete": "...",
      "title": "...",
      "content": "...",
      "excerpt": "...",
      "coverImage": "...",
      "categories": "...",
      "publishedAt": "...",
      "status": "..."
    },
    "comments": {
      "pageTitle": "...",
      "approve": "...",
      "reject": "...",
      "delete": "...",
      "pending": "...",
      "approved": "...",
      "rejected": "..."
    },
    "stats": {
      "totalPosts": "...",
      "publishedPosts": "...",
      "pendingComments": "...",
      "totalViews": "..."
    }
  }
}
```

#### Newsletter namespace: `newsletter`

For the newsletter subscription widget and confirmation pages.

Suggested structure:

```json
{
  "newsletter": {
    "title": "...",
    "description": "...",
    "emailPlaceholder": "...",
    "subscribe": "...",
    "subscribing": "...",
    "success": "...",
    "alreadySubscribed": "...",
    "error": "...",
    "unsubscribe": {
      "title": "...",
      "confirm": "...",
      "success": "..."
    }
  }
}
```

---

## Section 2 — Admin sidebar structure

### 2.1 — Sidebar component file

**File:** `apps/web/src/components/admin/admin-sidebar.tsx` (219 lines)

Full file (no truncation needed — 219 lines):

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  User,
  FolderOpen,
  Star,
  BarChart3,
  Settings,
  Megaphone,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Percent,
  Truck,
  Banknote,
  PackageCheck,
  Store,
  Bell,
  Gift,
  Wallet,
} from 'lucide-react';

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    titleKey: 'overview',
    items: [
      { nameKey: 'dashboard', href: '/admin/dashboard', icon: Home },
      { nameKey: 'analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'commerce',
    items: [
      { nameKey: 'products', href: '/admin/products', icon: Package },
      { nameKey: 'orders', href: '/admin/orders', icon: ShoppingBag },
      { nameKey: 'categories', href: '/admin/categories', icon: FolderOpen },
      { nameKey: 'reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    titleKey: 'users',
    items: [
      { nameKey: 'userManagement', href: '/admin/users', icon: Users },
      { nameKey: 'sellerManagement', href: '/admin/sellers', icon: Store },
    ],
  },
  {
    titleKey: 'subscriptions',
    items: [
      { nameKey: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { nameKey: 'subscriptionPlans', href: '/admin/subscriptions/plans', icon: CreditCard },
      { nameKey: 'adSubscriptions', href: '/admin/subscriptions/advertisement', icon: CreditCard },
      { nameKey: 'sellerSubscriptions', href: '/admin/subscriptions/sellers', icon: CreditCard },
    ],
  },
  {
    titleKey: 'financials',
    items: [
      { nameKey: 'escrow', href: '/admin/escrow', icon: ShieldCheck },
      { nameKey: 'commissions', href: '/admin/commissions', icon: Percent },
      { nameKey: 'payouts', href: '/admin/payouts', icon: Banknote },
      { nameKey: 'payoutSettings', href: '/admin/payout-settings', icon: Wallet },
      { nameKey: 'currencies', href: '/admin/currencies', icon: DollarSign },
    ],
  },
  {
    titleKey: 'delivery',
    items: [
      { nameKey: 'shipping', href: '/admin/shipping', icon: Truck },
      { nameKey: 'deliveries', href: '/admin/deliveries', icon: PackageCheck },
      { nameKey: 'deliveryProviders', href: '/admin/delivery-providers', icon: Truck },
      { nameKey: 'deliveryPayouts', href: '/admin/delivery-payouts', icon: Banknote },
    ],
  },
  {
    titleKey: 'marketing',
    items: [
      { nameKey: 'advertisements', href: '/admin/advertisements', icon: Megaphone },
      { nameKey: 'advertisementPlans', href: '/admin/advertisement-plans', icon: CreditCard },
      { nameKey: 'announcements', href: '/admin/announcements', icon: Bell },
      { nameKey: 'referrals', href: '/admin/referrals', icon: Gift },
    ],
  },
  {
    titleKey: 'system',
    items: [
      { nameKey: 'settings', href: '/admin/settings', icon: Settings },
      { nameKey: 'profile', href: '/admin/profile', icon: User },
      { nameKey: 'security', href: '/admin/account/security', icon: ShieldCheck },
    ],
  },
];
```

The render section uses:

- `t('groups.{group.titleKey}')` for group headers — `apps/web/src/components/admin/admin-sidebar.tsx:166`
- `t('items.{item.nameKey}')` for item labels — `apps/web/src/components/admin/admin-sidebar.tsx:199`

Both look up inside the `adminNav` namespace (set on line 121: `const t = useTranslations('adminNav')`).

---

### 2.2 — Group/item structure

**Groups from `adminNav.groups`:**

```json
{
  "overview": "Overview",
  "commerce": "Commerce",
  "users": "Users",
  "subscriptions": "Subscriptions",
  "financials": "Financials",
  "delivery": "Delivery",
  "marketing": "Marketing",
  "system": "System"
}
```

**Items from `adminNav.items` (full list from en.json):**

```json
{
  "dashboard": "Dashboard",
  "analytics": "Analytics",
  "products": "Products",
  "orders": "Orders",
  "podOrders": "POD Orders",        ← in en.json but NOT in sidebar navigationGroups
  "categories": "Categories",
  "reviews": "Reviews",
  "customers": "Customers",         ← in en.json but NOT in sidebar navigationGroups
  "userManagement": "User Management",
  "sellerManagement": "Seller Management",
  "subscriptions": "Subscriptions",
  "subscriptionPlans": "Subscription Plans",
  "adSubscriptions": "Ad Subscriptions",
  "sellerSubscriptions": "Seller Subscriptions",
  "escrow": "Escrow",
  "commissions": "Commissions",
  "payouts": "Payouts",
  "payoutSettings": "Payout Settings",
  "currencies": "Currencies",
  "shipping": "Shipping",
  "deliveries": "Deliveries",
  "deliveryProviders": "Delivery Providers",
  "deliveryPayouts": "Delivery Payouts",
  "advertisements": "Advertisements",
  "advertisementPlans": "Advertisement Plans",
  "announcements": "Announcements",
  "referrals": "Referrals",
  "settings": "Settings",
  "security": "Security",
  "profile": "My Profile",
  "viewWebsite": "View Website",
  "logout": "Logout"
}
```

**Items grouped as rendered by the sidebar:**

| Group         | Items                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| overview      | dashboard, analytics                                                   |
| commerce      | products, orders, categories, reviews                                  |
| users         | userManagement, sellerManagement                                       |
| subscriptions | subscriptions, subscriptionPlans, adSubscriptions, sellerSubscriptions |
| financials    | escrow, commissions, payouts, payoutSettings, currencies               |
| delivery      | shipping, deliveries, deliveryProviders, deliveryPayouts               |
| marketing     | advertisements, advertisementPlans, announcements, referrals           |
| system        | settings, profile, security                                            |

**Note:** `podOrders` and `customers` exist in `en.json`'s `adminNav.items` but are NOT in `navigationGroups`. These are stale translation entries — likely added in anticipation but the sidebar items were removed or never added.

---

### 2.3 — How sidebar items become pages

The pattern is: `adminNav.items.{nameKey}` → route `/admin/{href-suffix}` → file at `apps/web/src/app/admin/{href-suffix}/page.tsx`.

**Verified mappings:**

| nameKey          | href                    | Route file exists?                                  |
| ---------------- | ----------------------- | --------------------------------------------------- |
| `dashboard`      | `/admin/dashboard`      | ✅ `apps/web/src/app/admin/dashboard/page.tsx`      |
| `products`       | `/admin/products`       | ✅ `apps/web/src/app/admin/products/page.tsx`       |
| `orders`         | `/admin/orders`         | ✅ `apps/web/src/app/admin/orders/page.tsx`         |
| `referrals`      | `/admin/referrals`      | ✅ `apps/web/src/app/admin/referrals/page.tsx`      |
| `categories`     | `/admin/categories`     | ✅ `apps/web/src/app/admin/categories/page.tsx`     |
| `analytics`      | `/admin/analytics`      | ✅ `apps/web/src/app/admin/analytics/page.tsx`      |
| `advertisements` | `/admin/advertisements` | ✅ `apps/web/src/app/admin/advertisements/page.tsx` |
| `settings`       | `/admin/settings`       | ✅ `apps/web/src/app/admin/settings/page.tsx`       |

Confirmed rule: `nameKey` maps to `kebab-case` route path. For multi-word names:

- `userManagement` → `/admin/users` (exception — href uses abbreviated path)
- `sellerManagement` → `/admin/sellers` (same exception)
- `advertisementPlans` → `/admin/advertisement-plans` (kebab-case of the camelCase)
- `payoutSettings` → `/admin/payout-settings`

The `nameKey` (camelCase) is always different from the `href` (kebab-case slug). The sidebar `href` is the definitive route; the `nameKey` is only for translation lookup.

**Admin app directory snapshot (all routes):**

```
apps/web/src/app/admin/
  account/security/page.tsx
  advertisement-plans/page.tsx
  advertisements/page.tsx
  analytics/page.tsx
  announcements/page.tsx
  categories/page.tsx
  commissions/page.tsx
  currencies/page.tsx
  customers/[id]/edit/page.tsx
  customers/[id]/orders/page.tsx
  customers/[id]/page.tsx
  customers/page.tsx
  deliveries/page.tsx
  delivery-payouts/page.tsx
  delivery-providers/page.tsx
  escrow/page.tsx
  layout.tsx
  orders/[id]/page.tsx
  orders/page.tsx
  page.tsx
  payout-settings/page.tsx
  payouts/page.tsx
  products/[id]/page.tsx
  products/page.tsx
  profile/page.tsx
  referrals/page.tsx
  reviews/page.tsx
  sellers/[id]/page.tsx
  sellers/page.tsx
  settings/page.tsx
  shipping/page.tsx
  subscriptions/advertisement/page.tsx
  subscriptions/plans/page.tsx
  subscriptions/sellers/page.tsx
  subscriptions/page.tsx
  users/[id]/page.tsx
  users/page.tsx
```

---

### 2.4 — Where new groups/items should slot

**Recommendation: Create a new `content` sidebar group.**

Reasoning:

- The `marketing` group already has 4 items (advertisements, advertisementPlans, announcements, referrals). Adding 2-3 more (affiliate, blog, newsletter) would make it 6-7 items, which is too many for a single group.
- Affiliate is distinct from NextPik's own advertising system — it sends traffic OUT to third-party advertisers, while `advertisements` manages ads placed ON NextPik. They shouldn't be in the same group without confusion.
- Blog and newsletter are content publishing tools, not marketing campaign tools.
- The new group label `content` fits naturally alongside `marketing` and is easy to extend.

**Proposed new sidebar group insertion (after `marketing`, before `system`):**

```tsx
{
  titleKey: 'content',
  items: [
    { nameKey: 'blog', href: '/admin/blog', icon: FileText },
    { nameKey: 'blogComments', href: '/admin/blog/comments', icon: MessageSquare },
    { nameKey: 'newsletter', href: '/admin/newsletter', icon: Mail },
    { nameKey: 'affiliate', href: '/admin/affiliate', icon: Link2 },
  ],
},
```

Required additions to `adminNav.groups`:

```json
{ "content": "Content & Affiliate" }
```

Required additions to `adminNav.items`:

```json
{
  "blog": "Blog",
  "blogComments": "Comment Moderation",
  "newsletter": "Newsletter",
  "affiliate": "Affiliate Program"
}
```

**Where each feature slots specifically:**

| Feature                         | Group                                       | Reasoning                                                         |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Blog post management            | `content`                                   | Content publishing, not transaction/marketing                     |
| Comment moderation              | `content` (sub-route under blog)            | Logically coupled to blog                                         |
| Newsletter management           | `content`                                   | Content delivery, separate from ad system                         |
| Affiliate (Awin)                | `content`                                   | Outbound affiliate links are content/publishing, not platform ads |
| Affiliate advertiser management | `content` (same affiliate item → sub-route) | `/admin/affiliate` handles all affiliate views                    |

---

### 2.5 — Sidebar's auth check

```bash
# grep -n "role\|UserRole\|isAdmin" apps/web/src/components/admin/admin-sidebar.tsx
# → No matches found
```

**Finding:** The sidebar performs **no role-based conditional rendering**. All `navigationGroups` are rendered to every user who reaches the admin layout. Access control is enforced upstream — in `apps/web/src/components/admin-route.tsx` (which wraps admin pages and checks `role === 'ADMIN' || role === 'SUPER_ADMIN'`), not in the sidebar itself.

**Implication for new pages:** New sidebar items do not need role guards in the sidebar component. They inherit the admin layout's gate. If SUPER_ADMIN-only pages are needed (e.g., affiliate API key config), that guard belongs in the page component or a dedicated route wrapper, not the sidebar.

---

## Section 3 — Existing referral system patterns

### 3.1 — File inventory

**API (`apps/api/src/referral/`):**

```
referral.controller.ts      # 255 lines — REST endpoints
referral.service.ts         # 1019 lines — business logic
referral.module.ts          # NestJS module wiring
dto/referral.dto.ts         # Input validation DTOs
```

**Web (`apps/web/src/`):**

```
hooks/use-referral.ts
lib/api/referral.ts                          # API client functions
components/account/referral-section.tsx      # User dashboard component
```

**Auth integration:** `apps/web/src/app/auth/register/page.tsx` — captures `?ref=CODE` from URL.

---

### 3.2 — Data model

From `packages/database/prisma/schema.prisma`:

**`ReferralCode` model (table: `referral_codes`):**

```prisma
model ReferralCode {
  id         String    @id @default(cuid())
  code       String    @unique          // e.g. "REF12AB34CD"
  userId     String    @unique          // one code per user (enforced)
  usageCount Int       @default(0)      // incremented on each use
  maxUsage   Int?                       // null = unlimited
  expiresAt  DateTime?                  // null = no expiry
  isActive   Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([code])
  @@index([userId])
  @@index([isActive])
  @@map("referral_codes")
}
```

**`Referral` model (table: `referrals`):**

```prisma
model Referral {
  id               String         @id @default(cuid())
  referrerId       String                              // user who shared the code
  referredId       String                              // user who used the code
  referredUserRole UserRole                            // BUYER or SELLER (at registration)
  rewardAmount     Decimal        @db.Decimal(10, 2)
  rewardCurrency   String         @default("USD")
  status           ReferralStatus @default(PENDING)    // PENDING → QUALIFIED → PAID | EXPIRED
  orderId          String?        @unique              // first qualifying order (BUYER path)
  storeId          String?                             // first store (SELLER path)
  qualifiedAt      DateTime?
  paidAt           DateTime?
  metadata         Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  referrer User   @relation("ReferrerReferrals", ...)
  referred User   @relation("ReferredReferrals", ...)
  order    Order? @relation(...)
  store    Store? @relation(...)

  @@index([referrerId])
  @@index([referredId])
  @@index([status])
  @@index([orderId])
  @@index([storeId])
  @@index([createdAt])
  @@map("referrals")
}
```

**Enum `ReferralStatus`:** `PENDING`, `QUALIFIED`, `PAID`, `EXPIRED`, `CANCELLED`

**Relevant `User` fields:**

- `referredById String?` — which user referred this user
- `storeCredit Decimal` — accumulated reward balance
- `totalReferrals Int` — count of successfully paid referrals

---

### 3.3 — Attribution mechanism

**How attribution works:**

1. Referrer shares URL: `{FRONTEND_URL}/auth/register?ref={CODE}` (generated in `referral.controller.ts` line 46).

2. New user visits the URL. The register page extracts the code:

   ```tsx
   // apps/web/src/app/auth/register/page.tsx lines 82–88
   useEffect(() => {
     const ref = searchParams.get('ref');
     if (ref) {
       setReferralCode(ref.toUpperCase().trim());
     }
   }, [searchParams]);
   ```

3. On form submit, the code is sent with registration payload:

   ```tsx
   // apps/web/src/app/auth/register/page.tsx line 158
   ...(referralCode && { referralCode }),
   ```

4. Auth service calls `referralService.applyReferralCode(code, newUserId)` — creates a `Referral` record in `PENDING` status.

5. **Attribution window:** Counted from registration date (not click date). Configurable via `referral_buyer_expiration_days` and `referral_seller_expiration_days` settings.

6. **Conversion trigger:**
   - BUYER path: Called from payment webhook after first paid order passes minimum order value. `referralService.checkBuyerQualification(orderId)` — `referral.service.ts:253`.
   - SELLER path: Called after seller creates first product. `referralService.checkSellerQualification(storeId)` — `referral.service.ts:332`.

**Storage medium:** The `?ref=CODE` URL parameter is extracted into React state on mount. It is **not** persisted to a cookie or `localStorage`. If the user opens the link in one browser session and registers in another, the code is lost.

---

### 3.4 — Click logging or visit tracking

```bash
# grep -rn "ReferralVisit|ReferralClick|trackVisit|incrementClick" apps/api/src/referral/
# → No matches
```

**Finding:** There is NO separate click-tracking or visit-logging in the referral system. The system only logs:

- `Referral` record (created at registration, not at click)
- `ReferralCode.usageCount` (incremented at registration)

If a user clicks a referral link but never registers, no record is created. There are no analytics for click-through rates, bounce rates, or partial funnel tracking.

---

### 3.5 — Storage of credit/reward

From `referral.service.ts` lines 457–479:

```typescript
// Grant reward in transaction
await this.prisma.$transaction(async (prisma) => {
  // Add store credit to referrer
  await prisma.user.update({
    where: { id: referral.referrerId },
    data: {
      storeCredit: {
        increment: referral.rewardAmount, // ← Decimal field on User
      },
      totalReferrals: {
        increment: 1, // ← Int counter on User
      },
    },
  });

  // Update referral to PAID
  await prisma.referral.update({
    where: { id: referralId },
    data: {
      status: ReferralStatus.PAID,
      paidAt: new Date(),
    },
  });
});
```

**Key facts:**

- **Reward timing:** Granted **immediately** when the qualifying event occurs. `qualifyReferral()` calls `grantReferralReward()` in the same call chain — no hold period, no manual approval step.
- **Reward storage:** `User.storeCredit` (Decimal) — platform credit, spendable on NextPik orders.
- **Counter:** `User.totalReferrals` increments for leaderboard and display.
- **No separate payout table:** Referral rewards bypass the `Payout` system entirely — they go directly to `User.storeCredit`. The referrer cannot withdraw this as cash; it is store credit only.

---

### 3.6 — Comparison to Awin model

| Aspect                       | NextPik Referral system                                                                | Awin (will need)                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Traffic direction**        | Referrer brings traffic **TO** NextPik — new user registers on NextPik                 | NextPik sends traffic **AWAY** to Awin advertiser's site                                                                      |
| **Attribution tracking**     | NextPik owns it: `?ref=CODE` → extracted at registration → stored in `Referral` record | Awin owns the tracking pixel/postback. NextPik logs the **outbound click** for reconciliation                                 |
| **Click logging**            | None — URL param disappears if user doesn't register in same session                   | Must persist: click ID, advertiser ID, product ID, timestamp. Needed for commission reconciliation against Awin Publisher API |
| **Conversion detection**     | NextPik detects internally: first paid order or first product created                  | Awin reports it externally: nightly sync via Awin Publisher API (Commission Report endpoint)                                  |
| **Conversion timing**        | Immediate upon qualifying event; no external dependency                                | Dependent on Awin's reporting lag (typically T+1 to T+30 for cookie window)                                                   |
| **Reward type**              | Platform store credit (`User.storeCredit`) — non-withdrawable                          | Cash commission from Awin — paid to NextPik's Awin publisher account                                                          |
| **Reward recipient**         | The NextPik user who shared the referral link                                          | NextPik (the publisher) earns the commission, not individual users                                                            |
| **Reward storage**           | `User.storeCredit` Decimal field                                                       | `AwinClickLog` table + `AwinCommission` table; eventually feeds platform revenue                                              |
| **Attribution window**       | Days from registration (configurable setting)                                          | Cookie window defined per advertiser in Awin (e.g., 30 days from click)                                                       |
| **Self-referral prevention** | Explicit check: `referralCode.userId === newUserId`                                    | Not applicable — NextPik is the publisher, clicks go to external sites                                                        |

---

### 3.7 — Anything we should NOT copy

**1. URL-param-only attribution with no persistence (critical flaw for Awin)**

The referral system stores the code only in React state from `searchParams`. If the user closes the tab and comes back, or switches browsers/devices, the code is gone. For Awin affiliate links, this would be catastrophic: the click needs to be durably logged at the moment it happens (server-side or via localStorage at minimum) so we can later match it against Awin's commission report.

**2. Immediate credit on conversion with no hold period**

For referrals, the system grants `storeCredit` immediately when the first order is paid. For Awin, commissions go through a validation period at the advertiser's end (orders can be returned, refunded, or disputed). Automatically crediting anything would require building hold-period logic that the referral system doesn't need.

**3. No click analytics**

The referral system has zero click/visit tracking — only conversion events. For affiliate programs, click-through rate, impressions, and EPC (earnings per click) are standard metrics that advertisers and publishers need. A new `AwinClickLog` table should be designed from scratch rather than adapted from referral patterns.

**4. Admin referrals page as template**

`apps/web/src/app/admin/referrals/page.tsx` uses hardcoded English strings and no `useTranslations`. Do not use it as a template for new admin pages. Use `apps/web/src/app/admin/dashboard/page.tsx` (which uses `useTranslations('adminDashboard')`) as the correct pattern to follow.

**5. Coupling reward to `User` model fields**

Referral rewards are baked into the `User` table (`storeCredit`, `totalReferrals`). Awin commissions should live in their own table (`AwinCommission`), not on `User`. Extending the `User` model further for every monetization type creates schema bloat.

---

## Section 4 — Cross-cutting findings

### Recent commits touching audited areas

```
c489601 fix(schema): complete prisma baseline recovery — weightGrams, migration bookkeeping
714f9ee feat(payment): implement all remaining payment TODOs
1b7d0fc fix(payment): implement inventory restoration on refund
1281001 fix(gelato): fix product images disappearing after 24 hours
1f81490 fix(escrow+orders): fix 2 critical bugs
```

**Finding:** No recent commits touch admin sidebar, i18n files, or referral code. The last 20 commits focus on payment, shipping, and schema recovery. The areas being audited are stable and have not been modified recently.

### Branches of note

```
* develop                               (current)
  fix/subscription-prelaunch
  fix/weight-standardization
  main
  remotes/origin/translations           ← may contain i18n-related work
  remotes/origin/fix/weight-standardization
  remotes/origin/gelato-integration
  remotes/origin/main
  remotes/origin/sendcloud-integration
  remotes/origin/fix-stabilization
```

**`remotes/origin/translations`** branch exists and may contain in-progress i18n work not yet merged. Before adding new namespaces to `en.json`, this branch should be checked to avoid merge conflicts on the messages file.

### TODO/FIXME comments in audited files

- `admin-sidebar.tsx`: No TODOs or FIXMEs found.
- `referral.service.ts`: No TODOs or FIXMEs found.
- `referral.controller.ts`: No TODOs or FIXMEs found.

### Stale entries in adminNav

`en.json` has `adminNav.items.podOrders` ("POD Orders") and `adminNav.items.customers` ("Customers") which do not appear in `navigationGroups` in `admin-sidebar.tsx`. These are orphaned translation keys. Not a blocker, but adding new items should follow the full cycle: add to both `navigationGroups` array AND `adminNav.items` in all three locales.

### Admin referrals page is not i18n'd

`apps/web/src/app/admin/referrals/page.tsx` does not use `useTranslations` and has no corresponding `adminReferrals` namespace. This is the only admin page in this state among the confirmed admin pages. It represents a known gap, not a pattern to follow.

### `en.json` line count discrepancy

`en.json` has 121 more lines than `es.json` and `fr.json` (5430 vs 5309). This means recent additions to English have not been translated yet. Any new Phase C additions to `en.json` should be mirrored in `es.json` and `fr.json` to maintain parity (even if with placeholder strings initially).

---

## Section 5 — Recommended next planning decisions

Before writing Phase C prompts, Jean Francois should confirm or decide on the following:

### Decision 1 — Sidebar group strategy

**Question:** Should affiliate and blog get their own `content` sidebar group, or fold under `marketing`?
**Recommendation:** Create a new `content` group (after `marketing`, before `system`). The `marketing` group is already at 4 items; affiliate semantically conflicts with the existing ads system; blog/newsletter are publishing tools.
**Action required:** Approve the group name (`content` or `Content & Affiliate` or `Publishing`) and its position in the list.

### Decision 2 — Affiliate page scope in sidebar

**Question:** Should affiliate have one sidebar item (`/admin/affiliate`) or two (`/admin/affiliate` + `/admin/affiliate/advertisers`)?
**Recommendation:** One item pointing to `/admin/affiliate` with sub-tabs on the page (advertisers list, click logs, commission sync). Matches how `subscriptions` works — one sidebar link, tabs inside. Keeps sidebar from getting crowded.

### Decision 3 — Blog comment moderation as separate sidebar item

**Question:** Should comment moderation be at `/admin/blog/comments` (sub-route, separate item) or a tab on the blog page?
**Recommendation:** Separate sidebar item (`blogComments`) only if comment volume is expected to be high and moderators need quick access. Otherwise, a tab on the blog management page is simpler. Decide based on expected use frequency.

### Decision 4 — Newsletter: new item or settings tab

**Question:** Does newsletter need its own sidebar item, or should it be a tab in `/admin/settings`?
**Recommendation:** Sidebar item only if there's active subscriber management (list view, segment management, send history). If it's just enable/disable + API key config, put it in settings. This decision gates whether a `newsletter` page file is needed.

### Decision 5 — i18n translation parity for new namespaces

**Question:** Should Phase C add all three locales (`en.json`, `es.json`, `fr.json`) at once, or English only?
**Recommendation:** Add placeholder entries in all three files simultaneously, even if `es.json` and `fr.json` initially contain the same English text. This prevents the 121-line drift from growing further and avoids missing-key console errors in non-English locales.

### Decision 6 — Awin click attribution storage

**Question:** Should outbound affiliate click data be stored server-side (DB row) or client-side (localStorage)?
**Recommendation:** Server-side `AwinClickLog` table, triggered by a lightweight Next.js route handler (`/api/affiliate/click`). Reasons: (a) localStorage is lost if user switches devices, (b) server logs are auditable, (c) commission reconciliation against Awin Publisher API needs a persistent record to match against. The referral system's URL-param-only approach explicitly should NOT be used.

### Decision 7 — Admin referrals page i18n backfill

**Question:** Should the existing `/admin/referrals` page be i18n'd as part of Phase C, or left as-is?
**Recommendation:** Add `adminReferrals` namespace and update the page as part of Phase C, since the work will be adjacent and the pattern will already be established. Low cost to do it right while in the area.

### Decision 8 — Awin commission sync timing

**Question:** Should Awin commission data sync on demand (admin button) or on a schedule (cron)?
**Recommendation:** Both: a scheduled nightly sync (e.g., 3 AM) using the existing cron infrastructure, plus a manual "Sync Now" button in the UI. The referral system's immediate-credit model is unsuitable for Awin because Awin commissions can be reversed during a validation window.

### Decision 9 — `adminNav.items` naming for blog sub-pages

**Question:** If blog has multiple sidebar items (blog + comments), what should the `nameKey` values be?
**Recommendation:** `blog` and `blogComments` — consistent with the existing pattern where related items share a prefix (`subscriptions`, `subscriptionPlans`, `adSubscriptions`, `sellerSubscriptions`).

### Decision 10 — `remotes/origin/translations` branch

**Action required before Phase C starts:** Check whether `origin/translations` has any pending i18n changes that need to be merged into `develop` first. If it contains changes to `en.json`/`es.json`/`fr.json`, merging after Phase C adds new keys will create a messy conflict.

---

_End of Phase B Audit Report_
