import { Product } from '@/lib/api/types';
import { QuickViewProduct } from '@luxury/ui';

/**
 * Transform API Product to QuickViewProduct format for UI components
 */
export function transformToQuickViewProduct(product: any | null | undefined): QuickViewProduct | null {
  if (!product) return null;

  // Validate required fields
  if (!product.id || !product.name || !product.slug) {
    console.warn('Product missing required fields:', product);
    return null;
  }

  // Handle both API format and frontend format
  const isFeatured = product.isFeatured ?? product.featured ?? false;
  const stock = product.stock ?? product.inventory ?? 0;
  const trackInventory = product.trackInventory ?? true;

  // Calculate badges - use Set to avoid duplicates
  const badgeSet = new Set<string>();
  if (isFeatured) badgeSet.add('Featured');
  if (product.compareAtPrice && product.compareAtPrice > product.price) badgeSet.add('Sale');
  if (product.badges && Array.isArray(product.badges)) {
    product.badges.forEach((badge: string) => badgeSet.add(badge));
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
    variants = {} as any;
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

  // Handle price - for INQUIRY products, price can be null/undefined
  let price: number | undefined = undefined;
  const purchaseType = product.purchaseType || 'INSTANT';

  try {
    if (product.price !== null && product.price !== undefined) {
      const parsedPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      price = isNaN(parsedPrice) ? undefined : parsedPrice;
    } else if (purchaseType === 'INSTANT') {
      // For INSTANT products, default to 0 if no price
      price = 0;
    }
    // For INQUIRY products, leave price as undefined
  } catch (e) {
    console.warn('Failed to parse price for product:', product.id, product.name, e);
    price = purchaseType === 'INSTANT' ? 0 : undefined;
  }

  let compareAtPrice = undefined;
  try {
    if (product.compareAtPrice !== null && product.compareAtPrice !== undefined) {
      const parsedComparePrice = typeof product.compareAtPrice === 'number' ? product.compareAtPrice : parseFloat(product.compareAtPrice);
      compareAtPrice = isNaN(parsedComparePrice) ? undefined : parsedComparePrice;
    }
  } catch (e) {
    console.warn('Failed to parse compareAtPrice for product:', product.id, product.name, e);
  }

  // Ensure heroImage has a fallback
  const heroImage = product.heroImage || images[0] || '/images/placeholder-product.jpg';

  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? product.category?.name,
    price,
    compareAtPrice,
    image: heroImage,
    images,
    badges,
    rating,
    reviewCount,
    slug: product.slug,
    purchaseType,
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
