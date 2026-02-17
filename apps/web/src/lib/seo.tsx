import { Metadata } from 'next';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

export const siteConfig = {
  name: 'NextPik',
  description:
    'NextPik - Your premium multi-vendor marketplace for luxury fashion, electronics, vehicles, real estate, and designer products. Discover curated collections from verified sellers worldwide. Shop with confidence.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://nextpik.com',
  ogImage: '/og-image.jpg',
  keywords: [
    'nextpik',
    'nextpik marketplace',
    'nextpik online shopping',
    'multi-vendor marketplace',
    'luxury online shopping',
    'premium products marketplace',
    'designer fashion online',
    'luxury electronics store',
    'buy luxury vehicles online',
    'real estate marketplace',
    'curated luxury products',
    'verified sellers marketplace',
    'high-end shopping platform',
    'exclusive designer brands',
    'luxury home decor online',
    'premium marketplace platform',
  ],
};

export function generateSeoMetadata({
  title,
  description,
  keywords,
  image,
  url,
  noIndex = false,
  noFollow = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
}: {
  title?: string | null;
  description?: string | null;
  keywords?: string[];
  image?: string | null;
  url?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}): Metadata {
  const safeTitle = title || siteConfig.name;
  const metaTitle = safeTitle.includes(siteConfig.name)
    ? safeTitle
    : `${safeTitle} - ${siteConfig.name}`;
  const metaDescription = description || siteConfig.description;
  const metaImage = image || siteConfig.ogImage;
  const metaUrl = url ? `${siteConfig.url}${url}` : siteConfig.url;
  const metaKeywords = keywords ? [...siteConfig.keywords, ...keywords] : siteConfig.keywords;

  const robotsContent = [];
  if (noIndex) robotsContent.push('noindex');
  if (noFollow) robotsContent.push('nofollow');

  const ogType = type === 'product' ? 'website' : type;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords.join(', '),
    authors: authors?.map((name) => ({ name })),
    creator: siteConfig.name,
    publisher: siteConfig.name,
    robots: robotsContent.length > 0 ? robotsContent.join(', ') : undefined,
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: metaUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage.startsWith('http') ? metaImage : `${siteConfig.url}${metaImage}`,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage.startsWith('http') ? metaImage : `${siteConfig.url}${metaImage}`],
      creator: '@nextpik',
      site: '@nextpik',
    },
    alternates: {
      canonical: metaUrl,
    },
  };
}

// Structured Data Generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    alternateName: 'NextPik Marketplace',
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@nextpik.com',
        availableLanguage: ['English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'sales@nextpik.com',
        availableLanguage: ['English'],
      },
    ],
    sameAs: [
      'https://facebook.com/nextpik',
      'https://twitter.com/nextpik',
      'https://instagram.com/nextpik',
      'https://linkedin.com/company/nextpik',
    ],
  };
}

export function generateProductSchema({
  name,
  description,
  image,
  sku,
  brand,
  price,
  currency = 'USD',
  availability,
  condition = 'NewCondition',
  rating,
  reviewCount,
  url,
}: {
  name: string;
  description: string;
  image: string;
  sku: string;
  brand?: string;
  price: number;
  currency?: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
    sku,
    brand: brand
      ? {
          '@type': 'Brand',
          name: brand,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}${url}`,
      priceCurrency: currency,
      price: formatCurrencyAmount(price, 2),
      availability: `https://schema.org/${availability}`,
      itemCondition: `https://schema.org/${condition}`,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateReviewSchema({
  productName,
  reviews,
}: {
  productName: string;
  reviews: Array<{
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}) {
  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: productName,
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.comment,
    datePublished: review.date,
  }));
}

export function generateWebPageSchema({
  title,
  description,
  url,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  url: string;
  publishedTime?: string;
  modifiedTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: url.startsWith('http') ? url : `${siteConfig.url}${url}`,
    ...(publishedTime && { datePublished: publishedTime }),
    ...(modifiedTime && { dateModified: modifiedTime }),
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: 'NextPik Marketplace',
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateItemListSchema({
  items,
  name,
  description,
}: {
  items: Array<{ name: string; image?: string; url: string; price?: number; currency?: string }>;
  name: string;
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        image: item.image,
        url: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
        ...(item.price && {
          offers: {
            '@type': 'Offer',
            price: formatCurrencyAmount(item.price, 2),
            priceCurrency: item.currency || 'USD',
          },
        }),
      },
    })),
  };
}

// Helper to inject structured data into pages
export function StructuredData({ data }: { data: any }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
