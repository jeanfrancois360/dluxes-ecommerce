/**
 * Seller API Client
 * Type-safe API client for seller endpoints
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface SellerDashboardSummary {
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
    verified: boolean;
    rating: number | null;
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    createdAt: string;
  };
  products: {
    total: number;
    active: number;
    draft: number;
    outOfStock: number;
    lowStock: number;
    totalViews: number;
    totalLikes: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  payouts: {
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
    nextPayoutDate: string | null;
  };
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'order' | 'product' | 'payout' | 'review' | 'delivery';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  metadata?: any;
}

export interface RevenueAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{ date: string; amount: number; orders: number }>;
  total: number;
  trend: { value: number; isPositive: boolean };
}

export interface OrderStatusBreakdown {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  sales: number;
  revenue: number;
  views: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  heroImage: string | null;
  inventory: number;
  price: number;
}

export interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  transactionId: string | null;
  processedAt: string | null;
  createdAt: string;
  commissions: Commission[];
}

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: 'draft' | 'active' | 'archived';
  images: Array<{ url: string; alt: string }>;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  status: string;
  total: number;
  items: Array<{
    id: string;
    product: {
      name: string;
      image: string;
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

// Detailed order type for individual order view
export interface SellerOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: string;
      name: string;
      slug: string;
      heroImage: string | null;
    };
  }>;
  shippingAddress: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string | null;
  } | null;
  delivery: {
    id: string;
    status: string;
    trackingNumber: string | null;
    estimatedDelivery: string | null;
    deliveredAt: string | null;
    deliveryPartner?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
    provider?: {
      id: string;
      name: string;
      contactPhone: string | null;
    } | null;
  } | null;
}

// Inquiry Types
export type InquiryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'VIEWING_SCHEDULED'
  | 'TEST_DRIVE_SCHEDULED'
  | 'NEGOTIATING'
  | 'CONVERTED'
  | 'CLOSED'
  | 'SPAM';

export interface Inquiry {
  id: string;
  productId: string;
  sellerId: string;
  storeId?: string;
  userId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  preferredContact?: string;
  preferredTime?: string;
  scheduledViewing?: string;
  preApproved: boolean;
  scheduledTestDrive?: string;
  tradeInInterest: boolean;
  status: InquiryStatus;
  sellerNotes?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    productType: string;
    heroImage?: string;
    images?: Array<{ url: string }>;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  store?: {
    id: string;
    name: string;
  };
}

export interface InquiryStats {
  total: number;
  new: number;
  contacted: number;
  scheduled: number;
  converted: number;
}

// ============================================================================
// Seller API
// ============================================================================

export const sellerAPI = {
  // Dashboard
  getDashboard: () => api.get<SellerDashboardSummary>('/seller/dashboard'),

  // Analytics
  getRevenueAnalytics: (period: 'daily' | 'weekly' | 'monthly' = 'monthly') =>
    api.get<RevenueAnalytics>('/seller/analytics/revenue', {
      params: { period },
    } as any),

  getOrderStatusBreakdown: () =>
    api.get<OrderStatusBreakdown>('/seller/analytics/orders'),

  getTopProducts: (limit: number = 5) =>
    api.get<TopProduct[]>('/seller/analytics/top-products', {
      params: { limit },
    } as any),

  getLowStockProducts: (threshold: number = 10, limit: number = 10) =>
    api.get<LowStockProduct[]>('/seller/products/low-stock', {
      params: { threshold, limit },
    } as any),

  getRecentActivity: (limit: number = 10) =>
    api.get<Activity[]>('/seller/analytics/recent-activity', {
      params: { limit },
    } as any),

  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get<{ data: SellerProduct[]; total: number }>('/seller/products', {
    params,
  } as any),

  getProduct: (id: string) => api.get<SellerProduct>(`/seller/products/${id}`),

  createProduct: (data: any) => api.post<SellerProduct>('/seller/products', data),

  updateProduct: (id: string, data: any) =>
    api.patch<SellerProduct>(`/seller/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/seller/products/${id}`),

  // Orders
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<{ data: SellerOrder[]; total: number }>('/seller/orders', {
    params,
  } as any),

  getOrder: (id: string) => api.get<SellerOrderDetail>(`/seller/orders/${id}`),

  updateOrderStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/seller/orders/${id}/status`, data),

  updateShippingInfo: (id: string, data: { trackingNumber?: string; carrier?: string; notes?: string }) =>
    api.patch(`/seller/orders/${id}/shipping`, data),

  markAsShipped: (id: string, data: { trackingNumber?: string; shippingCarrier?: string }) =>
    api.patch(`/seller/orders/${id}/mark-shipped`, data),

  uploadDeliveryProof: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('proof', file);
    return api.post(`/seller/orders/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any);
  },

  // Commissions
  getCommissions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<{ data: Commission[]; total: number }>('/seller/commissions', {
    params,
  } as any),

  getCommissionSummary: () =>
    api.get<{
      totalEarnings: number;
      totalCommissions: number;
      totalPlatformFees: number;
      pendingAmount: number;
      paidAmount: number;
    }>('/seller/commissions/summary'),

  // Payouts
  getPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ data: Payout[]; total: number }>('/seller/payouts', {
      params,
    } as any),

  getPayout: (id: string) => api.get<Payout>(`/seller/payouts/${id}`),

  requestPayout: () => api.post('/seller/payouts/request'),

  // Store
  getStore: () => api.get('/seller/store'),

  updateStore: (data: any) => api.put('/seller/store', data),

  uploadStoreLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/seller/store/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any);
  },

  uploadStoreBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post('/seller/store/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    } as any);
  },

  // Notifications
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/seller/notifications', {
      params,
    } as any),

  markNotificationAsRead: (id: string) =>
    api.patch(`/seller/notifications/${id}/read`),

  markAllNotificationsAsRead: () => api.patch('/seller/notifications/read-all'),

  // Inquiries
  getInquiries: (params?: {
    page?: number;
    limit?: number;
    status?: InquiryStatus;
  }) => api.get<{
    inquiries: Inquiry[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>('/inquiries/seller', { params } as any),

  getInquiryStats: () => api.get<InquiryStats>('/inquiries/seller/stats'),

  getInquiry: (id: string) => api.get<Inquiry>(`/inquiries/${id}`),

  updateInquiryStatus: (id: string, data: { status: InquiryStatus; sellerNotes?: string }) =>
    api.patch<Inquiry>(`/inquiries/${id}/status`, data),
};

// Export lowercase alias for consistency
export const sellerApi = sellerAPI;

// Export individual functions for convenience
export const getDashboard = () => sellerAPI.getDashboard();
export const getRevenueAnalytics = (period?: 'daily' | 'weekly' | 'monthly') =>
  sellerAPI.getRevenueAnalytics(period);
export const getOrderStatusBreakdown = () => sellerAPI.getOrderStatusBreakdown();
export const getTopProducts = (limit?: number) => sellerAPI.getTopProducts(limit);
export const getLowStockProducts = (threshold?: number, limit?: number) =>
  sellerAPI.getLowStockProducts(threshold, limit);
export const getRecentActivity = (limit?: number) => sellerAPI.getRecentActivity(limit);
