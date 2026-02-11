'use client';

import { StructuredData, generateProductSchema } from '@/lib/seo';

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    description: string;
    slug: string;
    price: number;
    sku?: string;
    brand?: string;
    images?: Array<{ url: string }>;
    heroImage: string;
    inventory: number;
    rating?: number;
    reviewCount?: number;
    store?: {
      name: string;
    };
  };
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const image = product.images?.[0]?.url || product.heroImage;
  const availability = product.inventory > 0 ? 'InStock' : 'OutOfStock';
  const brand = product.brand || product.store?.name || 'NextPik';

  const schema = generateProductSchema({
    name: product.name,
    description: product.description,
    image,
    sku: product.sku || product.id,
    brand,
    price: product.price,
    currency: 'USD',
    availability,
    condition: 'NewCondition',
    rating: product.rating,
    reviewCount: product.reviewCount,
    url: `/products/${product.slug}`,
  });

  return <StructuredData data={schema} />;
}
