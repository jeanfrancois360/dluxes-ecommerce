import { api } from './client';
import { Product, SearchFilters, SearchResult } from './types';

export const productsAPI = {
  // Get all products with filters and pagination
  getAll: (params?: SearchFilters) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    return api.get<SearchResult<Product>>(`/products?${queryParams.toString()}`);
  },

  // Get product by ID
  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  // Get product by slug
  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`),

  // Get featured products
  getFeatured: (limit: number = 8) =>
    api.get<Product[]>(`/products/featured?limit=${limit}`),

  // Get new arrivals
  getNewArrivals: async (limit: number = 8) => {
    try {
      return await api.get<Product[]>(`/products/new-arrivals?limit=${limit}`);
    } catch (error) {
      // Fallback to empty array if endpoint not available
      return [];
    }
  },

  // Get trending/popular products
  getTrending: async (limit: number = 8) => {
    try {
      return await api.get<Product[]>(`/products/trending?limit=${limit}`);
    } catch (error) {
      // Fallback to empty array if endpoint not available
      return [];
    }
  },

  // Get products on sale
  getOnSale: async (limit: number = 8) => {
    try {
      return await api.get<Product[]>(`/products/sale?limit=${limit}`);
    } catch (error) {
      // Fallback to empty array if endpoint not available
      return [];
    }
  },

  // Get related products (by category)
  getRelated: async (productId: string, limit: number = 4) => {
    try {
      return await api.get<SearchResult<Product>>(`/products/${productId}/related?limit=${limit}`);
    } catch (error) {
      // Fallback to empty result if endpoint not available
      return { products: [], total: 0, page: 1, pageSize: limit, totalPages: 0 };
    }
  },

  // Search products
  search: (filters: SearchFilters) =>
    productsAPI.getAll(filters),

  // Admin operations
  create: (data: Partial<Product>) =>
    api.post<Product>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};
