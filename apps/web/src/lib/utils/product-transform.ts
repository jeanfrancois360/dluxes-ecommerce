import { Product } from '@/lib/api/types';
import { QuickViewProduct } from '@luxury/ui';

/**
 * Transform API Product to QuickViewProduct format for UI components
 */
export function transformToQuickViewProduct(product: any | null | undefined): QuickViewProduct | null {
  if (!product) return null;

  // Handle both API format and frontend format
  const isFeatured = product.isFeatured ?? product.featured ?? false;
  const stock = product.stock ?? product.inventory ?? 0;
  const trackInventory = product.trackInventory ?? true;

  // Calculate badges - use Set to avoid duplicates
  const badgeSet = new Set<string>();
  if (isFeatured) badgeSet.add('Featured');
  if (product.compareAtPrice && product.compareAtPrice > product.price) badgeSet.add('Sale');
  if (product.badges && Array.isArray(product.badges)) {
    product.badges.forEach(badge => badgeSet.add(badge));
  }
  const badges = Array.from(badgeSet);

  // Transform images - handle both formats
  let images: string[] = [];
  if (product.images?.length > 0) {
    images = product.images.map((img: any) =>
      typeof img === 'string' ? img : img.url
    );
  } else if (product.heroImage) {
    images = [product.heroImage];
  }

  // Transform variants - handle both formats
  let variants = undefined;
  if (product.variants?.length > 0) {
    variants = {
      sizes: product.variants
        .filter((v: any) => v.attributes?.size)
        .map((v: any) => ({
          name: v.attributes.size,
          value: v.attributes.size.toLowerCase(),
          inStock: v.isAvailable && v.stock > 0,
        })),
      colors: product.variants
        .filter((v: any) => v.attributes?.color)
        .map((v: any) => ({
          name: v.attributes.color,
          value: v.attributes.color.toLowerCase(),
          hex: v.attributes.colorHex || '#000000',
        })),
    };
  } else if (product.colors || product.sizes) {
    // Handle sizes and colors arrays from API
    variants = {};
    if (product.sizes?.length > 0) {
      variants.sizes = product.sizes.map((size: string) => ({
        name: size,
        value: size.toLowerCase(),
        inStock: true,
      }));
    }
    if (product.colors?.length > 0) {
      variants.colors = product.colors.map((color: string) => ({
        name: color,
        value: color.toLowerCase(),
        hex: '#000000',
      }));
    }
  }

  // Use rating and reviewCount from API if available
  const rating = product.rating ? parseFloat(product.rating) : 0;
  const reviewCount = product.reviewCount ?? 0;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? product.category?.name,
    price: product.price ?? 0,
    compareAtPrice: product.compareAtPrice,
    image: product.heroImage,
    images,
    badges,
    rating,
    reviewCount,
    slug: product.slug,
    description: product.description ?? product.shortDescription,
    inStock: trackInventory ? stock > 0 : true,
    variants: Object.keys(variants || {}).length > 0 ? variants : undefined,
  };
}

/**
 * Transform multiple products
 */
export function transformToQuickViewProducts(products: Product[] | null | undefined): QuickViewProduct[] {
  if (!products || !Array.isArray(products)) {
    return [];
  }
  return products
    .map(transformToQuickViewProduct)
    .filter((p): p is QuickViewProduct => p !== null);
}
