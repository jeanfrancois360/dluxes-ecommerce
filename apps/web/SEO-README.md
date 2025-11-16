# SEO Implementation Guide

This document provides guidance on the SEO implementation for the Luxury Marketplace e-commerce platform.

## Overview

The application uses Next.js 15's Metadata API to provide comprehensive SEO coverage across all pages. This includes:

- Dynamic metadata generation
- OpenGraph tags for social media
- Twitter Card tags
- JSON-LD structured data
- Sitemap generation
- Robots.txt configuration
- Custom error pages with proper SEO handling

## Files Structure

```
apps/web/src/
├── lib/
│   ├── seo.ts              # Core SEO utilities and structured data generators
│   └── metadata.ts         # Pre-configured metadata for all pages
├── components/
│   └── structured-data.tsx # Component for injecting JSON-LD
└── app/
    ├── layout.tsx          # Root layout with default metadata
    ├── sitemap.ts          # Dynamic sitemap generator
    ├── robots.ts           # Robots.txt configuration
    ├── not-found.tsx       # Custom 404 page
    ├── error.tsx           # Custom 500 error page
    ├── global-error.tsx    # Global error handler
    └── [routes]/
        └── layout.tsx      # Route-specific metadata
```

## Core SEO Utilities

### seo.ts

Contains the main SEO configuration and helper functions:

- `siteConfig`: Global site configuration
- `generateSeoMetadata()`: Generate metadata for any page
- `generateOrganizationSchema()`: Organization structured data
- `generateProductSchema()`: Product structured data
- `generateBreadcrumbSchema()`: Breadcrumb structured data
- `generateReviewSchema()`: Review structured data
- `generateWebPageSchema()`: WebPage structured data

### metadata.ts

Pre-configured metadata exports for common pages:

- Home page
- Product listing and detail pages
- Auth pages (login, register, etc.)
- Account pages (orders, wishlist, profile)
- Checkout pages
- Static pages (about, contact, help, terms, privacy)

## Usage Examples

### Static Pages

For static pages, simply import and use the pre-configured metadata in a layout file:

```tsx
// app/about/layout.tsx
import { Metadata } from 'next';
import { aboutMetadata } from '@/lib/metadata';

export const metadata: Metadata = aboutMetadata;

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Dynamic Pages

For pages with dynamic content, use `generateMetadata`:

```tsx
// app/products/[slug]/page.tsx
import { Metadata } from 'next';
import { getProductMetadata } from '@/lib/metadata';
import { generateProductSchema } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  return getProductMetadata(product);
}
```

### Adding Structured Data

Use the `StructuredData` component to add JSON-LD to pages:

```tsx
import { StructuredData } from '@/components/structured-data';
import { generateProductSchema } from '@/lib/seo';

export default function ProductPage({ product }) {
  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand,
    price: product.price,
    currency: 'USD',
    availability: product.inStock ? 'InStock' : 'OutOfStock',
    rating: product.rating,
    reviewCount: product.reviewCount,
    url: `/products/${product.slug}`,
  });

  return (
    <div>
      {/* Your page content */}
      <StructuredData data={productSchema} />
    </div>
  );
}
```

## Metadata Configuration by Page Type

### Public Pages (Index, Follow)
- Home page
- Product listing
- Product detail pages
- Category pages
- Static content (About, Contact, Help)

**SEO Settings:**
- `robots.index: true`
- `robots.follow: true`
- Full metadata with OpenGraph and Twitter cards
- Structured data (Organization, Product, etc.)
- Sitemap inclusion

### Auth Pages (NoIndex, NoFollow)
- Login
- Register
- Password reset
- Magic link

**SEO Settings:**
- `robots.noindex: true`
- `robots.nofollow: true`
- Basic metadata only
- Excluded from sitemap

### Account Pages (NoIndex)
- Dashboard
- Orders
- Wishlist
- Profile
- Addresses

**SEO Settings:**
- `robots.noindex: true`
- Basic metadata only
- Excluded from sitemap

### Checkout Pages (NoIndex)
- Cart
- Checkout
- Order confirmation

**SEO Settings:**
- `robots.noindex: true`
- Basic metadata only
- Excluded from sitemap

### Admin Pages (NoIndex, NoFollow)
- All admin routes

**SEO Settings:**
- `robots.noindex: true`
- `robots.nofollow: true`
- Minimal metadata
- Excluded from sitemap
- Blocked in robots.txt

## Error Pages

### 404 Not Found
- Custom branded page with search functionality
- Links to popular categories
- Featured products carousel
- SEO-friendly with `noindex` meta tag

### 500 Server Error
- Clean error message
- "Try Again" and "Go Home" actions
- Contact support link
- Error details in development mode
- SEO-friendly with `noindex` meta tag

### Global Error
- Root-level error handler
- Minimal dependencies
- Basic styling
- Contact information

## Sitemap Generation

The sitemap is dynamically generated and includes:

- All public static pages
- All published products
- All categories
- Proper priority and changeFrequency values

**File:** `apps/web/src/app/sitemap.ts`

To fetch products and categories, uncomment and configure the API calls in the sitemap.ts file.

## Robots.txt

The robots.txt file is configured to:

- Allow crawling of public pages
- Block admin, account, checkout, auth routes
- Block API routes
- Block utility URLs (JSON files, UTM parameters)
- Reference the sitemap

**File:** `apps/web/src/app/robots.ts`

## Best Practices Implemented

1. **Unique Titles**: All pages have unique, descriptive titles under 60 characters
2. **Unique Descriptions**: All pages have unique meta descriptions under 160 characters
3. **Keywords**: Relevant keywords included but not over-stuffed
4. **OpenGraph Tags**: Complete OpenGraph implementation for social sharing
5. **Twitter Cards**: Twitter Card tags for enhanced Twitter sharing
6. **Canonical URLs**: Proper canonical URL configuration
7. **Structured Data**: Schema.org markup for enhanced search results
8. **Image Alt Text**: All images should include descriptive alt text
9. **Heading Hierarchy**: Proper H1, H2, H3 structure
10. **Mobile Optimization**: Responsive design with proper viewport configuration
11. **Page Speed**: Optimized metadata loading with minimal impact

## Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Production Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_APP_URL` in environment variables
- [ ] Replace placeholder Google verification code in root layout
- [ ] Update sitemap.ts to fetch real product and category data
- [ ] Add real social media URLs in organization schema
- [ ] Generate and add Open Graph images
- [ ] Test all metadata with social media debuggers:
  - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
  - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Test structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Verify robots.txt is accessible
- [ ] Check page speed with [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Verify mobile-friendliness with [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

## Monitoring

After launch, monitor:

1. **Google Search Console**
   - Index coverage
   - Performance metrics
   - Core Web Vitals
   - Mobile usability
   - Rich results

2. **Analytics**
   - Organic traffic
   - Bounce rates
   - Page load times
   - Conversion rates

3. **Regular Audits**
   - Run monthly SEO audits
   - Check for broken links
   - Update outdated content
   - Monitor competitor rankings
   - Review and update keywords

## Additional Resources

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Moz SEO Learning Center](https://moz.com/learn/seo)
