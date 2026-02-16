# NextPik SEO Guide

## Overview

This document outlines the SEO strategy and implementation for NextPik's multi-vendor marketplace to improve search engine rankings and compete effectively with similar brand names.

## Current SEO Implementation (v2.6.0+)

### Meta Tags & Structured Data

- ✅ Dynamic meta titles and descriptions per page
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ Organization Schema (JSON-LD)
- ✅ WebSite Schema with SearchAction
- ✅ Product Schema for product pages
- ✅ Breadcrumb Schema for navigation
- ✅ ItemList Schema for product collections

### Site Configuration

**Location:** `apps/web/src/lib/seo.tsx`

```typescript
siteConfig = {
  name: 'NextPik',
  description:
    'NextPik - Your premium multi-vendor marketplace for luxury fashion, electronics, vehicles, real estate, and designer products...',
  url: 'https://nextpik.com',
  keywords: [
    'nextpik',
    'nextpik marketplace',
    'multi-vendor marketplace',
    'luxury online shopping',
    // ... 16 total keywords
  ],
};
```

### Homepage SEO

**Location:** `apps/web/src/lib/metadata.ts`

- **Title:** NextPik - Multi-Vendor Luxury Marketplace | Fashion, Electronics, Vehicles & Real Estate
- **Description:** Shop NextPik's curated luxury marketplace featuring fashion, electronics, vehicles, real estate...
- **Keywords:** 10 targeted keywords focusing on brand differentiation

### Robots.txt

**Location:** `apps/web/src/app/robots.ts`

Configured to:

- Allow all major search engines
- Block admin, seller, and user-specific pages
- Include sitemap reference
- Filter tracking parameters

### Sitemap

**Location:** `apps/web/src/app/sitemap.ts`

Dynamically generates sitemap including:

- **Static pages** (priority: 0.5-1.0)
- **Product pages** (priority: 0.8, weekly updates)
- **Category pages** (priority: 0.7, weekly updates)
- **Store pages** (priority: 0.75, weekly updates)

Revalidates every hour to keep fresh.

## Brand Differentiation Strategy

### Problem

"NextPik" competes with "NextPick" (college tennis recruiting platform) in search results.

### Solution

1. **Consistent Branding:** Always use "NextPik" (not "NextPick")
2. **Qualifier Keywords:** Include "marketplace", "e-commerce", "shopping" in all meta content
3. **Category Specificity:** Emphasize categories (fashion, electronics, vehicles, real estate)
4. **Multi-vendor Focus:** Highlight multi-vendor marketplace aspect
5. **Geographic Targeting:** Target regions where tennis platform doesn't operate

### Key Differentiators

- "NextPik Marketplace" (not just "NextPik")
- Multi-vendor luxury platform
- Fashion, electronics, vehicles, real estate (NOT tennis/recruiting)
- E-commerce/shopping focus
- Verified sellers worldwide

## Structured Data Schemas

### 1. Organization Schema

**Purpose:** Establishes brand entity in Google Knowledge Graph

**Includes:**

- Company name, URL, logo
- Contact information
- Social media profiles
- Address information

### 2. WebSite Schema

**Purpose:** Enables Google Sitelinks Searchbox

**Includes:**

- Site name and description
- Search action with URL template
- Allows users to search your site directly from Google

### 3. Product Schema

**Purpose:** Rich snippets in product search results

**Includes:**

- Product name, image, price, SKU
- Brand information
- Availability status
- Aggregate ratings
- Reviews

### 4. ItemList Schema

**Purpose:** Enhanced visibility for product collections

**Use on:** Category pages, homepage carousels, featured collections

### 5. Breadcrumb Schema

**Purpose:** Breadcrumb navigation in search results

**Use on:** Product pages, category pages, nested pages

## Page-Specific SEO

### Homepage (`/`)

- Priority: 1.0 (highest)
- Change frequency: Daily
- Schemas: Organization, WebSite
- Focus keywords: "nextpik marketplace", "multi-vendor luxury"

### Product Pages (`/products/:slug`)

- Priority: 0.8
- Change frequency: Weekly
- Schemas: Product, Breadcrumb
- Dynamic meta from product data

### Category Pages (`/products?category=:slug`)

- Priority: 0.7
- Change frequency: Weekly
- Schemas: ItemList, Breadcrumb
- Category-specific meta titles

### Store Pages (`/store/:slug`)

- Priority: 0.75
- Change frequency: Weekly
- Schemas: Organization (seller), ItemList
- Seller branding + products

### Static Pages

- About, Contact, Help: Priority 0.6-0.7
- Terms, Privacy: Priority 0.5, noindex

## Technical SEO Checklist

### ✅ Implemented

- [x] Semantic HTML5 structure
- [x] Mobile-responsive design
- [x] Fast page load times (Next.js optimized)
- [x] Image optimization (Next.js Image component)
- [x] Clean URL structure
- [x] SSL/HTTPS
- [x] XML sitemap
- [x] Robots.txt
- [x] Canonical tags
- [x] Meta descriptions
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Structured data (JSON-LD)

### ⚠️ To Be Completed

- [ ] Google Search Console verification
- [ ] Bing Webmaster Tools verification
- [ ] Create og-image.jpg (1200x630px)
- [ ] Submit sitemap to search engines
- [ ] Set up Google Analytics 4
- [ ] Monitor Core Web Vitals
- [ ] Build backlinks from luxury/e-commerce blogs
- [ ] Create social media profiles (@nextpik)

## Content Strategy

### Keywords to Target

**Primary:**

- nextpik
- nextpik marketplace
- nextpik online shopping

**Secondary:**

- multi-vendor luxury marketplace
- premium online shopping platform
- verified luxury sellers

**Long-tail:**

- buy luxury fashion online nextpik
- nextpik electronics marketplace
- luxury vehicles for sale nextpik
- nextpik real estate listings

### Content Calendar

1. **Blog** (if added): SEO-optimized articles about luxury shopping, seller stories, product guides
2. **Category Pages:** Rich descriptions with keywords
3. **Product Descriptions:** Unique, keyword-rich content
4. **About Page:** Brand story emphasizing multi-vendor marketplace

## Performance Metrics to Monitor

### Search Console

- Impressions for "nextpik" queries
- Click-through rate (CTR)
- Average position
- Core Web Vitals

### Analytics

- Organic traffic
- Bounce rate
- Time on site
- Conversion rate from organic

### Rankings

- "nextpik" - Target: #1
- "nextpik marketplace" - Target: #1
- "nextpik shopping" - Target: #1-3
- Category + "nextpik" - Target: Top 5

## Local SEO (Future)

If expanding to specific regions:

- Create location-specific pages
- Add LocalBusiness schema
- Get listed in local directories
- Encourage location-tagged reviews

## Social Signals

- Consistent posting on Facebook, Twitter, Instagram, LinkedIn
- Use #nextpik, #nextpikmarketplace hashtags
- Share product launches, seller stories
- Engage with luxury/e-commerce communities

## Ongoing Optimization

### Monthly Tasks

- Review search console data
- Update underperforming meta descriptions
- Add new products to sitemap (automatic)
- Monitor competitor rankings
- Create new content

### Quarterly Tasks

- Full SEO audit
- Update keyword strategy
- Analyze backlink profile
- Review and update schemas
- Performance optimization

### Annual Tasks

- Major content refresh
- Update Terms/Privacy (if needed)
- Comprehensive competitor analysis
- Strategic planning for next year

## Tools & Resources

### Monitoring

- Google Search Console
- Google Analytics 4
- Bing Webmaster Tools
- Ahrefs/SEMrush (optional)

### Testing

- Google Rich Results Test
- PageSpeed Insights
- Mobile-Friendly Test
- Schema Markup Validator

### Validation

```bash
# Test structured data
curl https://nextpik.com | grep -A 50 '@context'

# Check robots.txt
curl https://nextpik.com/robots.txt

# Check sitemap
curl https://nextpik.com/sitemap.xml
```

## Emergency Checklist

If rankings drop suddenly:

1. Check Search Console for penalties
2. Verify sitemap is accessible
3. Check robots.txt didn't block crawlers
4. Ensure HTTPS is working
5. Test structured data validity
6. Check for duplicate content
7. Monitor server uptime
8. Review recent code changes

## Contact

For SEO questions or updates, refer to:

- **Technical Docs:** `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`
- **Project Guide:** `CLAUDE.md`
- **This Guide:** `SEO_GUIDE.md`

---

_Last Updated: February 16, 2026_
_Version: 2.6.0+_
