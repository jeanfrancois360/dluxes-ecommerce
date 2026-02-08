# Seller Pages - Black Header Update Summary

**Date:** February 7, 2026
**Status:** ✅ In Progress

## Pages Updated with Black PageHeader

### ✅ Completed (6 pages):

1. **Products** - `/seller/products`
2. **Orders** - `/seller/orders`
3. **Earnings** - `/seller/earnings`
4. **Reviews** - `/seller/reviews`
5. **Inquiries** - `/seller/inquiries` ← Just updated
6. **Advertisements** - `/seller/advertisements` ← Just updated

### 🔄 Remaining Pages to Update:

**High Priority:**

- [ ] Store Settings - `/seller/store/settings`
- [ ] Onboarding - `/seller/onboarding`
- [ ] Subscription - `/seller/subscription`
- [ ] Payout Settings - `/seller/payout-settings`
- [ ] Vacation Mode - `/seller/vacation-mode`

**Medium Priority:**

- [ ] Selling Credits - `/seller/selling-credits`
- [ ] Ad Plans - `/seller/advertisement-plans`
- [ ] Credits - `/seller/credits`

**Lower Priority (Special pages):**

- Products New/Edit - Form pages
- Orders Detail - Detail pages
- Subscription Success/Cancel - Status pages
- Credits Success - Success pages

## Design Specification

All pages should have:

```tsx
<PageHeader
  title="Page Title"
  description="Page description"
  breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Current Page' }]}
  actions={
    // Optional action buttons
  }
/>
```

### Visual Design:

- **Background:** Black (`bg-black`)
- **Title:** White, large, bold
- **Description:** Light gray (`text-neutral-400`)
- **Breadcrumbs:** Gray with gold hover
- **Active breadcrumb:** Gold (`text-[#CBB57B]`)
- **Buttons:** Black bg + gold text + gold border

---

**Next:** Update remaining high-priority pages
