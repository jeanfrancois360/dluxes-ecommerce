import { Metadata } from 'next';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

export const siteConfig = {
  name: 'Luxury Marketplace',
  description: 'Discover extraordinary lifestyle products curated for distinguished living. Premium fashion, home decor, electronics, and more from the world\'s finest brands.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://luxury-marketplace.com',
  ogImage: '/og-image.jpg',
  keywords: [
    'luxury marketplace',
    'premium products',
    'designer fashion',
    'luxury home decor',
    'high-end electronics',
    'exclusive brands',
    'curated lifestyle',
    'luxury shopping',
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
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}): Metadata {
  const metaTitle = title.includes(siteConfig.name) ? title : `${title} - ${siteConfig.name}`;
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
    authors: authors?.map(name => ({ name })),
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
      creator: '@luxurymarketplace',
      site: '@luxurymarketplace',
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
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@luxury-marketplace.com',
    },
    sameAs: [
      'https://facebook.com/luxurymarketplace',
      'https://twitter.com/luxurymarketplace',
      'https://instagram.com/luxurymarketplace',
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
    brand: brand ? {
      '@type': 'Brand',
      name: brand,
    } : undefined,
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
  return reviews.map(review => ({
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

// Helper to inject structured data into pages
export function StructuredData({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
