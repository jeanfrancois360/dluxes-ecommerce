/**
 * Stores API Client
 * Type-safe API client for stores endpoints
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface PayoutSettings {
  id: string;
  name: string;
  payoutMethod: 'bank_transfer' | 'paypal' | 'stripe_connect' | null;
  payoutEmail: string | null;
  payoutCurrency: string;
  payoutMinAmount: number;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
  payoutDayOfWeek: number | null;
  payoutDayOfMonth: number | null;
  payoutAutomatic: boolean;
  bankAccountName: string | null;
  bankAccountNumber: string | null; // Masked
  bankRoutingNumber: string | null; // Masked
  bankName: string | null;
  bankBranchName: string | null;
  bankSwiftCode: string | null;
  bankIban: string | null; // Masked
  bankCountry: string | null;
  verified: boolean;
  status: string;
}

export interface PayoutSettingsResponse {
  settings: PayoutSettings;
  balances: {
    pending: number;
    available: number;
    currency: string;
  };
  nextPayoutDate: string;
}

export interface UpdatePayoutSettingsDto {
  payoutMethod?: 'bank_transfer' | 'paypal' | 'stripe_connect';
  payoutEmail?: string;
  payoutCurrency?: string;
  payoutMinAmount?: number;
  payoutFrequency?: 'weekly' | 'biweekly' | 'monthly';
  payoutDayOfWeek?: number;
  payoutDayOfMonth?: number;
  payoutAutomatic?: boolean;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankName?: string;
  bankBranchName?: string;
  bankSwiftCode?: string;
  bankIban?: string;
  bankCountry?: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  paymentMethod: string;
  paymentReference: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PayoutHistoryResponse {
  data: Payout[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
  };
}

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

  // Payout Settings
  getPayoutSettings: () => api.get<PayoutSettingsResponse>('/stores/me/payout-settings'),

  updatePayoutSettings: (data: UpdatePayoutSettingsDto) =>
    api.patch<{ message: string; settings: PayoutSettings }>('/stores/me/payout-settings', data),

  getPayoutHistory: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get<PayoutHistoryResponse>('/stores/me/payouts', {
    params,
  } as any),
};

// Export lowercase alias for consistency
export const storesApi = storesAPI;
