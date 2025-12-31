/**
 * Stores API Client
 * Type-safe API client for stores endpoints
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Store {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'REJECTED';
  isActive: boolean;
  verified: boolean;
  verifiedAt: string | null;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  termsConditions: string | null;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  rating: number | null;
  reviewCount: number;
  currency: string;
  timezone: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreDto {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  termsConditions?: string;
  metaTitle?: string;
  metaDescription?: string;
  currency?: string;
  timezone?: string;
}

export interface CreateStoreDto {
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  termsConditions?: string;
  metaTitle?: string;
  metaDescription?: string;
}

// ============================================================================
// Stores API
// ============================================================================

export const storesAPI = {
  // Seller Routes
  getMyStore: () => api.get<Store>('/stores/me/store'),

  updateMyStore: (data: UpdateStoreDto) => api.patch<Store>('/stores/me/store', data),

  createStore: (data: CreateStoreDto) => api.post<{ message: string; store: Store }>('/stores', data),

  deleteMyStore: () => api.delete('/stores/me/store'),

  getMyAnalytics: () => api.get('/stores/me/analytics'),

  // Public Routes
  getStores: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    verified?: boolean;
  }) => api.get<{ data: Store[]; total: number }>('/stores', {
    params,
  } as any),

  getStoreBySlug: (slug: string) => api.get<Store>(`/stores/${slug}`),

  // Get store products (uses products API with storeId filter)
  getStoreProducts: (storeId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/products', {
    params: {
      storeId,
      status: 'ACTIVE',
      ...params,
    },
  } as any),

  // Get store reviews (aggregated from product reviews)
  getStoreReviews: (storeId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/stores/${storeId}/reviews`, {
    params,
  } as any),

  // File Upload
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/stores/me/store/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any);
  },

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/stores/me/store/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any);
  },
};

// Export lowercase alias for consistency
export const storesApi = storesAPI;
