import { z } from 'zod';

/**
 * Wishlist-related types and schemas
 */

export const WishlistItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    brand: z.string().optional(),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    heroImage: z.string().url(),
    stock: z.number().int().nonnegative(),
    isAvailable: z.boolean(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().nonnegative().optional(),
  }),
  addedAt: z.date(),
});

export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const AddToWishlistSchema = z.object({
  productId: z.string(),
});

export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}

export interface WishlistFilters {
  sortBy?: 'recent' | 'priceAsc' | 'priceDesc';
  availability?: 'all' | 'inStock' | 'outOfStock';
}
