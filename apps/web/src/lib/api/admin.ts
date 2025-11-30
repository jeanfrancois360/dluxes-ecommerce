/**
 * Admin API Client
 *
 * API functions for admin dashboard operations
 */

import { api } from './client';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  value: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  image?: string;
}

export interface CustomerGrowth {
  date: string;
  customers: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  productCount: number;
  featured: boolean;
  image?: string;
  showInNavbar?: boolean;
  showInFooter?: boolean;
  showOnHomepage?: boolean;
  isFeatured?: boolean;
  priority?: number;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  videoUrl?: string;
  linkUrl?: string;
  linkText?: string;
  placement: string;
  pricingModel: string;
  price: number;
  startDate?: string;
  endDate?: string;
  status: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
  advertiser?: { id: string; firstName: string; lastName: string; email: string };
  category?: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Dashboard APIs
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response;
  },

  async getRevenueData(days: number = 30): Promise<RevenueData[]> {
    const response = await api.get(`/admin/dashboard/revenue?days=${days}`);
    return response;
  },

  async getOrdersByStatus(): Promise<OrdersByStatus[]> {
    const response = await api.get('/admin/dashboard/orders-by-status');
    return response;
  },

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const response = await api.get(`/admin/dashboard/top-products?limit=${limit}`);
    return response;
  },

  async getCustomerGrowth(days: number = 30): Promise<CustomerGrowth[]> {
    const response = await api.get(`/admin/dashboard/customer-growth?days=${days}`);
    return response;
  },

  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    const response = await api.get(`/admin/dashboard/recent-orders?limit=${limit}`);
    return response;
  },
};

// Helper function to transform admin product data to backend DTO format
function transformProductData(data: Partial<AdminProduct>): any {
  const transformed: any = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: data.price,
    inventory: data.stock ?? 0, // Map 'stock' to 'inventory'
  };

  // Optional fields
  if (data.compareAtPrice !== undefined) transformed.compareAtPrice = data.compareAtPrice;
  if (data.category) transformed.categoryId = data.category; // Map 'category' to 'categoryId'
  if (data.status) {
    // Map status values to backend enum
    const statusMap: Record<string, string> = {
      'active': 'ACTIVE',
      'inactive': 'ARCHIVED',
      'draft': 'DRAFT',
      'ACTIVE': 'ACTIVE',
      'ARCHIVED': 'ARCHIVED',
      'DRAFT': 'DRAFT',
      'OUT_OF_STOCK': 'OUT_OF_STOCK',
    };
    transformed.status = statusMap[data.status] || 'DRAFT';
  }
  if (data.images && data.images.length > 0) transformed.heroImage = data.images[0]; // Use first image as heroImage

  // Remove fields that don't exist in the DTO
  // Don't send: sku, tags, images (already transformed)

  return transformed;
}

// Products APIs
export const adminProductsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: AdminProduct[]; total: number; pages: number }> {
    const response = await api.get('/admin/products', { params });
    return response;
  },

  async getById(id: string): Promise<AdminProduct> {
    const response = await api.get(`/products/${id}`);
    return response;
  },

  async create(data: Partial<AdminProduct>): Promise<AdminProduct> {
    const transformedData = transformProductData(data);
    const response = await api.post('/products', transformedData);
    return response;
  },

  async update(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
    const transformedData = transformProductData(data);
    const response = await api.patch(`/products/${id}`, transformedData);
    return response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await api.post('/products/bulk-delete', { ids });
  },

  async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    await api.post('/products/bulk-update-status', { ids, status });
  },
};

// Orders APIs
export const adminOrdersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ orders: AdminOrder[]; total: number; pages: number }> {
    const response = await api.get('/admin/orders', { params });
    return response;
  },

  async getById(id: string): Promise<AdminOrder> {
    const response = await api.get(`/admin/orders/${id}`);
    return response;
  },

  async updateStatus(id: string, status: string): Promise<AdminOrder> {
    const response = await api.patch(`/admin/orders/${id}/status`, { status });
    return response;
  },

  async refund(id: string, amount?: number): Promise<void> {
    await api.post(`/admin/orders/${id}/refund`, { amount });
  },
};

// Customers APIs
export const adminCustomersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ customers: AdminCustomer[]; total: number; pages: number }> {
    const response = await api.get('/admin/customers', { params });
    return response;
  },

  async getById(id: string): Promise<AdminCustomer & { orders: AdminOrder[] }> {
    const response = await api.get(`/admin/customers/${id}`);
    return response;
  },

  async update(id: string, data: Partial<AdminCustomer>): Promise<AdminCustomer> {
    const response = await api.put(`/admin/customers/${id}`, data);
    return response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/customers/${id}`);
  },
};

// Categories APIs
export const adminCategoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data || response;
  },

  async create(data: Partial<Category>): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data || response;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data || response;
  },

  async updateVisibility(id: string, data: { showInNavbar?: boolean; showInFooter?: boolean; showOnHomepage?: boolean; isFeatured?: boolean }): Promise<Category> {
    const response = await api.patch(`/categories/${id}/visibility`, data);
    return response.data || response;
  },

  async reorder(categoryIds: string[]): Promise<Category[]> {
    const response = await api.patch('/categories/reorder', { categoryIds });
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

// Advertisements APIs
export const adminAdvertisementsApi = {
  async getAll(params?: { status?: string; placement?: string }): Promise<Advertisement[]> {
    const response = await api.get('/advertisements', { params });
    return response.data || response;
  },

  async getPending(): Promise<Advertisement[]> {
    const response = await api.get('/advertisements/pending');
    return response.data || response;
  },

  async getById(id: string): Promise<Advertisement> {
    const response = await api.get(`/advertisements/${id}`);
    return response.data || response;
  },

  async create(data: Partial<Advertisement>): Promise<Advertisement> {
    const response = await api.post('/advertisements', data);
    return response.data || response;
  },

  async update(id: string, data: Partial<Advertisement>): Promise<Advertisement> {
    const response = await api.put(`/advertisements/${id}`, data);
    return response.data || response;
  },

  async approve(id: string, approved: boolean, rejectionReason?: string): Promise<Advertisement> {
    const response = await api.patch(`/advertisements/${id}/approve`, { approved, rejectionReason });
    return response.data || response;
  },

  async toggle(id: string, isActive: boolean): Promise<Advertisement> {
    const response = await api.patch(`/advertisements/${id}/toggle`, { isActive });
    return response.data || response;
  },

  async getAnalytics(id: string): Promise<any> {
    const response = await api.get(`/advertisements/${id}/analytics`);
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/advertisements/${id}`);
  },
};

// Reviews APIs
export const adminReviewsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
  }): Promise<{ reviews: Review[]; total: number; pages: number }> {
    const response = await api.get('/admin/reviews', { params });
    return response;
  },

  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<Review> {
    const response = await api.patch(`/admin/reviews/${id}/status`, { status });
    return response;
  },

  async bulkUpdateStatus(ids: string[], status: 'approved' | 'rejected'): Promise<void> {
    await api.post('/admin/reviews/bulk-update-status', { ids, status });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/reviews/${id}`);
  },
};

// Analytics APIs
export const adminAnalyticsApi = {
  async getMetrics(startDate: string, endDate: string): Promise<{
    revenue: number;
    orders: number;
    customers: number;
    conversionRate: number;
    averageOrderValue: number;
  }> {
    const response = await api.get('/admin/analytics/metrics', {
      params: { startDate, endDate },
    });
    return response;
  },

  async getSalesByCategory(startDate: string, endDate: string): Promise<
    Array<{ category: string; sales: number; orders: number }>
  > {
    const response = await api.get('/admin/analytics/sales-by-category', {
      params: { startDate, endDate },
    });
    return response;
  },

  async getSalesByProduct(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{ productId: string; name: string; sales: number; orders: number }>> {
    const response = await api.get('/admin/analytics/sales-by-product', {
      params: { startDate, endDate, limit },
    });
    return response;
  },
};
