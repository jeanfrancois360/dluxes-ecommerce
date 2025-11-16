import { z } from 'zod';

/**
 * Shopping cart types and schemas
 */

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  sku: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  items: z.array(CartItemSchema).default([]),
  subtotal: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Cart = z.infer<typeof CartSchema>;

export const AddToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
});

export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
