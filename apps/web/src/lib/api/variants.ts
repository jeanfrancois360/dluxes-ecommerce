import { api } from './client';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory: number;
  previousStock?: number | null;
  options: Record<string, string>; // { size: 'M', color: 'Black' }
  image?: string | null;
  colorHex?: string | null;
  colorName?: string | null;
  sizeChart?: any;
  isAvailable: boolean;
  lowStockThreshold: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantDto {
  name: string;
  sku: string;
  price?: number;
  compareAtPrice?: number;
  inventory: number;
  attributes: Record<string, string>; // { size: 'M', color: 'Black' }
  image?: string;
  colorHex?: string;
  colorName?: string;
  sizeChart?: any;
  displayOrder?: number;
  isAvailable?: boolean;
  lowStockThreshold?: number;
}

export interface UpdateProductVariantDto {
  name?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
  attributes?: Record<string, string>;
  image?: string;
  colorHex?: string;
  colorName?: string;
  sizeChart?: any;
  displayOrder?: number;
  isAvailable?: boolean;
  lowStockThreshold?: number;
}

export const variantsApi = {
  /**
   * Get all variants for a product
   */
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data || [];
  },

  /**
   * Get a specific variant by ID
   */
  async getVariantById(variantId: string): Promise<ProductVariant> {
    const response = await api.get(`/products/variants/${variantId}`);
    return response.data;
  },

  /**
   * Create a new variant
   */
  async createVariant(productId: string, data: CreateProductVariantDto): Promise<ProductVariant> {
    const response = await api.post(`/products/${productId}/variants`, data);
    return response.data;
  },

  /**
   * Create multiple variants in bulk
   */
  async bulkCreateVariants(productId: string, variants: CreateProductVariantDto[]): Promise<ProductVariant[]> {
    const response = await api.post(`/products/${productId}/variants/bulk`, { variants });
    return response.data;
  },

  /**
   * Update a variant
   */
  async updateVariant(variantId: string, data: UpdateProductVariantDto): Promise<ProductVariant> {
    const response = await api.patch(`/products/variants/${variantId}`, data);
    return response.data;
  },

  /**
   * Delete a variant
   */
  async deleteVariant(variantId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/products/variants/${variantId}`);
    return response.data;
  },

  /**
   * Reorder variants
   */
  async reorderVariants(
    productId: string,
    variantOrders: Array<{ id: string; order: number }>
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/products/${productId}/variants/reorder`, { variantOrders });
    return response.data;
  },
};
