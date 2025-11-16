import { z } from 'zod';

/**
 * Product-related types and schemas
 */

export const ProductCategorySchema = z.enum([
  'accessories',
  'apparel',
  'beauty',
  'home',
  'jewelry',
  'watches',
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductStatusSchema = z.enum(['draft', 'active', 'archived', 'out_of_stock']);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  isPrimary: z.boolean().default(false),
});

export type ProductImage = z.infer<typeof ProductImageSchema>;

export const ProductVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  inventory: z.number().int().nonnegative(),
  options: z.record(z.string()),
  images: z.array(ProductImageSchema).optional(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string(),
  shortDescription: z.string().max(500).optional(),
  category: ProductCategorySchema,
  tags: z.array(z.string()).default([]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(ProductImageSchema).min(1),
  variants: z.array(ProductVariantSchema).optional(),
  status: ProductStatusSchema.default('draft'),
  featured: z.boolean().default(false),
  inventory: z.number().int().nonnegative().default(0),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['cm', 'in']).default('cm'),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  status?: ProductStatus;
  featured?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
