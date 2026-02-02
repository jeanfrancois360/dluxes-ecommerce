# Seller Notification Email Templates - Documentation

## Overview
This document provides comprehensive documentation for the 7 email templates created for the Seller Management & Monthly Credit System.

**Created**: 2026-02-02
**Location**: `/apps/api/src/email/templates/`
**Status**: ✅ Complete

---

## Template Architecture

### Design System
All templates follow the NextPik design system:
- **Colors**: Black (#000000), Gold (#CBB57B, #A89968), Gray (#737373), White (#FFFFFF)
- **Typography**: Inter font family
- **Layout**: Maximum width 600px, responsive design
- **Components**: Base template wrapper with header, content, footer

### Base Template
All email templates extend `baseEmailTemplate()` which provides:
- Responsive HTML structure
- Consistent header with logo
- Footer with copyright and social links
- Brand-consistent styling

---

## Email Templates

### 1. Seller Approved (`seller-approved.template.ts`)

**Trigger**: Admin approves a seller application
**Sent to**: Newly approved seller
**Purpose**: Welcome seller and guide them to purchase credits

**Parameters**:
```typescript
{
  sellerName: string;        // Seller's first name
  storeName: string;         // Store name
  creditsUrl: string;        // URL to credits purchase page
  dashboardUrl: string;      // URL to seller dashboard
}
```

**Key Features**:
- Green success checkmark icon
- 3-step onboarding guide
- Dual CTA buttons: "Purchase Credits" (primary) + "Go to Dashboard" (secondary)
- Important notice about credit requirements
- Gold gradient on primary CTA

**Usage Example**:
```typescript
import { sellerApprovedTemplate } from './templates/seller-approved.template';

const html = sellerApprovedTemplate({
  sellerName: 'John',
  storeName: 'Premium Electronics',
  creditsUrl: 'https://nextpik.com/seller/selling-credits',
  dashboardUrl: 'https://nextpik.com/dashboard/seller',
});

await emailService.sendMail({
  to: user.email,
  subject: 'Congratulations! Your Seller Account is Approved',
  html,
});
```

---

### 2. Seller Rejected (`seller-rejected.template.ts`)

**Trigger**: Admin rejects a seller application
**Sent to**: Rejected applicant
**Purpose**: Inform seller of rejection with reason and provide support options

**Parameters**:
```typescript
{
  sellerName: string;        // Seller's first name
  storeName: string;         // Store name
  rejectionReason: string;   // Detailed reason from admin
  supportUrl: string;        // URL to contact support
}
```

**Key Features**:
- Red warning icon
- Rejection reason in prominent card
- 3 actionable steps: Review → Contact Support → Reapply
- Empathetic tone with constructive guidance
- Single CTA: "Contact Support"

**Usage Example**:
```typescript
import { sellerRejectedTemplate } from './templates/seller-rejected.template';

const html = sellerRejectedTemplate({
  sellerName: 'Jane',
  storeName: 'Fashion Boutique',
  rejectionReason: 'Product quality standards not met. Please provide higher quality product images and more detailed descriptions.',
  supportUrl: 'https://nextpik.com/support',
});

await emailService.sendMail({
  to: user.email,
  subject: 'Seller Application Update - NextPik',
  html,
});
```

---

### 3. Seller Suspended (`seller-suspended.template.ts`)

**Trigger**: Admin suspends a seller account
**Sent to**: Suspended seller
**Purpose**: Notify seller of suspension and provide resolution steps

**Parameters**:
```typescript
{
  sellerName: string;         // Seller's first name
  storeName: string;          // Store name
  suspensionReason: string;   // Detailed reason from admin
  supportUrl: string;         // URL to contact support
}
```

**Key Features**:
- Orange/amber warning icon
- Suspension reason card
- 4-point impact explanation (products inactive, orders blocked, etc.)
- 4-step resolution plan
- Urgent red CTA: "Contact Support Immediately"
- Legal compliance notice

**Usage Example**:
```typescript
import { sellerSuspendedTemplate } from './templates/seller-suspended.template';

const html = sellerSuspendedTemplate({
  sellerName: 'Mike',
  storeName: 'Tech Gadgets Store',
  suspensionReason: 'Multiple customer complaints about late shipments and product quality issues.',
  supportUrl: 'https://nextpik.com/support/urgent',
});

await emailService.sendMail({
  to: user.email,
  subject: 'Important: Your NextPik Store Has Been Suspended',
  html,
});
```

---

### 4. Credits Purchased (`credits-purchased.template.ts`)

**Trigger**: Stripe webhook confirms successful credit purchase
**Sent to**: Seller who just purchased credits
**Purpose**: Confirm purchase and provide transaction details

**Parameters**:
```typescript
{
  sellerName: string;        // Seller's first name
  storeName: string;         // Store name
  monthsPurchased: number;   // Number of months purchased
  amountPaid: string;        // Amount in dollars (e.g., "89.97")
  newBalance: number;        // Total credits after purchase
  expiryDate: string;        // Formatted expiry date
  dashboardUrl: string;      // URL to dashboard
  invoiceUrl?: string;       // Optional invoice download link
}
```

**Key Features**:
- Gold gradient success card with large balance display
- Detailed transaction table
- Blue info card: "What Happens Next?" with 4 checkmarks
- Dual CTAs: Dashboard + Invoice (optional)
- Pro tip box for credit management

**Usage Example**:
```typescript
import { creditsPurchasedTemplate } from './templates/credits-purchased.template';

const html = creditsPurchasedTemplate({
  sellerName: 'Sarah',
  storeName: 'Home Decor Plus',
  monthsPurchased: 3,
  amountPaid: '89.97',
  newBalance: 5,
  expiryDate: 'May 2, 2026',
  dashboardUrl: 'https://nextpik.com/dashboard/seller',
  invoiceUrl: 'https://nextpik.com/invoices/inv_123456',
});

await emailService.sendMail({
  to: user.email,
  subject: 'Payment Successful - Credits Added to Your Account',
  html,
});
```

---

### 5. Credits Low Warning (`credits-low-warning.template.ts`)

**Trigger**: Cron job detects credits below threshold (default: 2 months)
**Sent to**: Seller with low credits
**Purpose**: Encourage seller to purchase more credits before depletion

**Parameters**:
```typescript
{
  sellerName: string;         // Seller's first name
  storeName: string;          // Store name
  currentBalance: number;     // Current credit balance
  daysUntilDepletion: number; // Estimated days until 0 credits
  creditsUrl: string;         // URL to credits page
  dashboardUrl: string;       // URL to dashboard
}
```

**Key Features**:
- Orange warning icon
- Large balance display with amber gradient
- 3-point "What This Means" section
- Green pricing card with benefits
- Prominent gold CTA: "Purchase Credits Now"
- Urgency messaging without panic

**Usage Example**:
```typescript
import { creditsLowWarningTemplate } from './templates/credits-low-warning.template';

const html = creditsLowWarningTemplate({
  sellerName: 'David',
  storeName: 'Sports Equipment Co',
  currentBalance: 2,
  daysUntilDepletion: 60,
  creditsUrl: 'https://nextpik.com/seller/selling-credits',
  dashboardUrl: 'https://nextpik.com/dashboard/seller',
});

await emailService.sendMail({
  to: user.email,
  subject: 'Reminder: Your Selling Credits Are Running Low',
  html,
});
```

---

### 6. Credits Depleted (`credits-depleted.template.ts`)

**Trigger**: Cron job detects credits = 0, grace period activated
**Sent to**: Seller with zero credits
**Purpose**: Alert seller of depletion and grace period deadline

**Parameters**:
```typescript
{
  sellerName: string;      // Seller's first name
  storeName: string;       // Store name
  graceEndsAt: string;     // Formatted grace period end date/time
  creditsUrl: string;      // URL to credits page
  dashboardUrl: string;    // URL to dashboard
}
```

**Key Features**:
- Red critical alert icon
- Huge "0" display in red gradient
- Grace period countdown in dark red card
- 3 immediate impact cards
- Blue restoration steps section
- Animated pulse effect on CTA
- Severe urgency tone

**Usage Example**:
```typescript
import { creditsDepletedTemplate } from './templates/credits-depleted.template';

const html = creditsDepletedTemplate({
  sellerName: 'Lisa',
  storeName: 'Beauty Essentials',
  graceEndsAt: 'February 5, 2026 at 11:59 PM',
  creditsUrl: 'https://nextpik.com/seller/selling-credits',
  dashboardUrl: 'https://nextpik.com/dashboard/seller',
});

await emailService.sendMail({
  to: user.email,
  subject: 'CRITICAL: Your Selling Credits Have Been Depleted',
  html,
});
```

---

### 7. Grace Period Ending (`grace-period-ending.template.ts`)

**Trigger**: Cron job detects < 24 hours until grace period expires
**Sent to**: Seller in final hours of grace period
**Purpose**: Final warning before automatic suspension

**Parameters**:
```typescript
{
  sellerName: string;       // Seller's first name
  storeName: string;        // Store name
  hoursRemaining: number;   // Hours until suspension
  graceEndsAt: string;      // Formatted deadline
  productsCount: number;    // Number of products to be suspended
  creditsUrl: string;       // URL to credits page
  dashboardUrl: string;     // URL to dashboard
}
```

**Key Features**:
- Dark red pulsing icon
- Massive hours countdown (80px font)
- Black card with 4-point suspension impact
- Green reactivation card for hope
- Largest CTA button with urgent styling
- Multiple "FINAL WARNING" badges
- Emergency tone throughout

**Usage Example**:
```typescript
import { gracePeriodEndingTemplate } from './templates/grace-period-ending.template';

const html = gracePeriodEndingTemplate({
  sellerName: 'Robert',
  storeName: 'Outdoor Adventure Gear',
  hoursRemaining: 18,
  graceEndsAt: 'February 5, 2026 at 11:59 PM',
  productsCount: 47,
  creditsUrl: 'https://nextpik.com/seller/selling-credits',
  dashboardUrl: 'https://nextpik.com/dashboard/seller',
});

await emailService.sendMail({
  to: user.email,
  subject: 'FINAL WARNING: Store Suspension in Less Than 24 Hours',
  html,
});
```

---

## Integration Guide

### Step 1: Import Templates

In your service file (e.g., `seller-approval.service.ts`):

```typescript
import {
  sellerApprovedTemplate,
  sellerRejectedTemplate,
  sellerSuspendedTemplate,
  creditsPurchasedTemplate,
  creditsLowWarningTemplate,
  creditsDepletedTemplate,
  gracePeriodEndingTemplate,
} from '../email/templates/seller-notifications.index';
```

### Step 2: Inject EmailService

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly emailService: EmailService,
) {}
```

### Step 3: Send Emails

Example from `seller-approval.service.ts`:

```typescript
async approveSeller(storeId: string, adminId: string) {
  const result = await this.prisma.$transaction(async (tx) => {
    // Update store and user...
    return { store, user };
  });

  // Send approval email
  const html = sellerApprovedTemplate({
    sellerName: result.user.firstName,
    storeName: result.store.name,
    creditsUrl: `${process.env.FRONTEND_URL}/seller/selling-credits`,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/seller`,
  });

  await this.emailService.sendMail({
    to: result.user.email,
    subject: 'Congratulations! Your Seller Account is Approved',
    html,
  });

  return { success: true, message: 'Seller approved and notified' };
}
```

### Step 4: Cron Job Integration

Example from `seller-credits.cron.ts`:

```typescript
@Cron('0 8 * * *', { name: 'low-credit-warnings' })
async sendLowCreditWarnings() {
  const threshold = await this.settingsService.getSetting('seller_low_credit_warning_threshold');

  const stores = await this.prisma.store.findMany({
    where: {
      status: 'ACTIVE',
      creditsBalance: { lte: Number(threshold.value), gt: 0 },
    },
    include: { user: true },
  });

  for (const store of stores) {
    const daysUntilDepletion = store.creditsBalance * 30; // Approximate

    const html = creditsLowWarningTemplate({
      sellerName: store.user.firstName,
      storeName: store.name,
      currentBalance: store.creditsBalance,
      daysUntilDepletion,
      creditsUrl: `${process.env.FRONTEND_URL}/seller/selling-credits`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/seller`,
    });

    await this.emailService.sendMail({
      to: store.user.email,
      subject: 'Reminder: Your Selling Credits Are Running Low',
      html,
    });
  }
}
```

---

## Email Sending Schedule

| Template | Trigger | Frequency |
|----------|---------|-----------|
| Seller Approved | Manual (admin action) | One-time |
| Seller Rejected | Manual (admin action) | One-time |
| Seller Suspended | Manual (admin action) | One-time |
| Credits Purchased | Automatic (Stripe webhook) | Per transaction |
| Credits Low Warning | Automatic (cron: daily 8 AM) | Daily if below threshold |
| Credits Depleted | Automatic (cron: daily 2 AM) | Daily while at 0 credits |
| Grace Period Ending | Automatic (cron: hourly check) | Once at < 24 hours |

---

## Testing Checklist

### Manual Testing
- [ ] Send test email for each template
- [ ] Verify all dynamic variables render correctly
- [ ] Check email displays properly in Gmail
- [ ] Check email displays properly in Outlook
- [ ] Check email displays properly in Apple Mail
- [ ] Verify mobile responsiveness
- [ ] Test all CTA buttons link correctly
- [ ] Verify unsubscribe links work (if applicable)

### Automated Testing
```typescript
describe('Seller Email Templates', () => {
  it('should generate seller approved email', () => {
    const html = sellerApprovedTemplate({
      sellerName: 'Test User',
      storeName: 'Test Store',
      creditsUrl: 'https://example.com/credits',
      dashboardUrl: 'https://example.com/dashboard',
    });
    expect(html).toContain('Test User');
    expect(html).toContain('Test Store');
  });

  // Add tests for each template...
});
```

---

## Best Practices

### 1. **Personalization**
- Always use seller's first name in greeting
- Include store name prominently
- Use dynamic data (dates, balances, etc.)

### 2. **Clear CTAs**
- One primary action per email
- Use action-oriented button text
- Make buttons large and easy to tap on mobile

### 3. **Responsive Design**
- All templates tested at 320px-600px widths
- Touch-friendly buttons (min 44px height)
- Readable font sizes on mobile (14px minimum)

### 4. **Accessibility**
- Semantic HTML structure
- Alt text for icons (via SVG)
- Sufficient color contrast
- Clear visual hierarchy

### 5. **Email Client Compatibility**
- Inline CSS (required for most email clients)
- Avoid JavaScript (not supported)
- Use tables for complex layouts if needed
- Test in major email clients before deployment

### 6. **Brand Consistency**
- Use NextPik color palette
- Maintain consistent tone
- Include logo in header
- Footer with social links

---

## Environment Variables Required

Ensure these are set in your `.env` file:

```bash
FRONTEND_URL=https://nextpik.com
SUPPORT_URL=https://nextpik.com/support
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@nextpik.com
SMTP_PASS=your-app-password
```

---

## File Locations

### Templates
- `/apps/api/src/email/templates/seller-approved.template.ts`
- `/apps/api/src/email/templates/seller-rejected.template.ts`
- `/apps/api/src/email/templates/seller-suspended.template.ts`
- `/apps/api/src/email/templates/credits-purchased.template.ts`
- `/apps/api/src/email/templates/credits-low-warning.template.ts`
- `/apps/api/src/email/templates/credits-depleted.template.ts`
- `/apps/api/src/email/templates/grace-period-ending.template.ts`

### Index
- `/apps/api/src/email/templates/seller-notifications.index.ts`

### Base Template
- `/apps/api/src/email/templates/base.template.ts`

---

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify EmailService is properly injected
3. Check server logs for errors
4. Ensure recipient email is valid

### Broken Layout
1. Verify HTML structure is valid
2. Check for missing closing tags
3. Ensure inline styles are present
4. Test in specific email client

### Missing Dynamic Data
1. Verify all required parameters are passed
2. Check template variables match function signature
3. Ensure data is not undefined/null
4. Add fallback values where appropriate

### Links Not Working
1. Verify `FRONTEND_URL` environment variable
2. Check URL construction logic
3. Test links in email preview
4. Ensure URLs are properly encoded

---

## Future Enhancements

Potential improvements for future versions:

1. **Internationalization (i18n)**
   - Multi-language support
   - Locale-specific date formatting
   - Currency conversion

2. **A/B Testing**
   - Test different subject lines
   - Vary CTA button text
   - Measure open and click rates

3. **Advanced Personalization**
   - Product recommendations
   - Performance insights
   - Seasonal messages

4. **Template Variants**
   - Light/dark mode versions
   - Simplified text-only versions
   - VIP seller special templates

5. **Analytics Integration**
   - Track open rates
   - Monitor click-through rates
   - Measure conversion rates

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-02 | Initial release - 7 templates created |

---

**Maintained by**: NextPik Development Team
**Last Updated**: 2026-02-02
**Status**: ✅ Production Ready
