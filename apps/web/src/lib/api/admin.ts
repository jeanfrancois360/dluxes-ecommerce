/**
 * Admin API Client
 *
 * API functions for admin dashboard operations
 */

import { api } from './client';

// Helper function to build query string from params
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined, null, and empty strings
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

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
  stock?: number; // Legacy field name
  inventory?: number; // Database field name
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
    variantId?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    product?: {
      id: string;
      name: string;
      store?: {
        id: string;
        name: string;
        slug: string;
      };
    };
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency?: string;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  commissions?: Array<{
    id: string;
    storeId: string;
    sellerId: string;
    orderAmount: number;
    commissionAmount: number;
    currency: string;
    status: string;
    store: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
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
  showInTopBar?: boolean;
  showInSidebar?: boolean;
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
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  videos?: string[];
  isApproved: boolean;
  isPinned: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Computed field for UI convenience
  status?: 'pending' | 'approved' | 'rejected';
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
    // Accept both 'inventory' (from ProductForm) and 'stock' (from AdminProduct interface)
    inventory: (data as any).inventory ?? data.stock,
  };

  // SKU field - add if provided
  if (data.sku !== undefined && data.sku !== null && data.sku !== '') {
    transformed.sku = data.sku;
  }

  // Optional fields
  if (data.compareAtPrice !== undefined) transformed.compareAtPrice = data.compareAtPrice;

  // Category handling - accept both 'categoryId' (from ProductForm) and 'category' (from AdminProduct interface)
  const categoryValue = (data as any).categoryId ?? data.category;
  if (categoryValue) {
    transformed.categoryId = categoryValue;
  }

  // Status mapping
  if (data.status) {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      inactive: 'ARCHIVED',
      draft: 'DRAFT',
      ACTIVE: 'ACTIVE',
      ARCHIVED: 'ARCHIVED',
      DRAFT: 'DRAFT',
      OUT_OF_STOCK: 'OUT_OF_STOCK',
    };
    transformed.status = statusMap[data.status] || 'DRAFT';
  }

  // Image handling - support multiple images
  if (data.images && data.images.length > 0) {
    transformed.heroImage = data.images[0];
    // Convert images array to gallery format
    if (data.images.length > 1) {
      transformed.gallery = data.images.slice(1).map((url: string) => ({
        type: 'image',
        url,
      }));
    }
  }

  // Product type and purchase type
  if ((data as any).productType) {
    transformed.productType = (data as any).productType;
  }
  if ((data as any).purchaseType) {
    transformed.purchaseType = (data as any).purchaseType;
  }

  // Additional optional fields
  if ((data as any).shortDescription) transformed.shortDescription = (data as any).shortDescription;
  if ((data as any).featured !== undefined) transformed.featured = (data as any).featured;
  if ((data as any).weight !== undefined) transformed.weight = (data as any).weight;
  if ((data as any).isPreOrder !== undefined) transformed.isPreOrder = (data as any).isPreOrder;
  if ((data as any).contactRequired !== undefined)
    transformed.contactRequired = (data as any).contactRequired;
  if ((data as any).displayOrder !== undefined)
    transformed.displayOrder = (data as any).displayOrder;

  // SEO fields
  if ((data as any).metaTitle) transformed.metaTitle = (data as any).metaTitle;
  if ((data as any).metaDescription) transformed.metaDescription = (data as any).metaDescription;
  if ((data as any).seoKeywords && Array.isArray((data as any).seoKeywords)) {
    transformed.seoKeywords = (data as any).seoKeywords;
  }

  // Tags/Badges - convert tags to badges if present
  if (data.tags && Array.isArray(data.tags)) {
    transformed.badges = data.tags;
  }

  // Product attributes
  if ((data as any).colors && Array.isArray((data as any).colors)) {
    transformed.colors = (data as any).colors;
  }
  if ((data as any).sizes && Array.isArray((data as any).sizes)) {
    transformed.sizes = (data as any).sizes;
  }
  if ((data as any).materials && Array.isArray((data as any).materials)) {
    transformed.materials = (data as any).materials;
  }

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
    const response = await api.get(`/products${buildQueryString(params)}`);
    const data = response.data || response;
    // Map totalPages to pages for consistency
    return {
      products: data.products,
      total: data.total,
      pages: data.totalPages || data.pages,
    };
  },

  async getById(id: string): Promise<AdminProduct> {
    const response = await api.get(`/products/id/${id}`);
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

  async addImages(productId: string, images: string[]): Promise<AdminProduct> {
    const response = await api.post(`/products/${productId}/images`, { images });
    return response;
  },

  async removeImage(productId: string, imageId: string): Promise<AdminProduct> {
    const response = await api.delete(`/products/${productId}/images/${imageId}`);
    return response;
  },

  async reorderImages(
    productId: string,
    imageOrders: Array<{ id: string; order: number }>
  ): Promise<AdminProduct> {
    const response = await api.patch(`/products/${productId}/images/reorder`, { imageOrders });
    return response;
  },

  // Inventory Management APIs
  async adjustProductInventory(
    productId: string,
    data: {
      quantity: number;
      type: 'SALE' | 'RETURN' | 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE';
      reason?: string;
      notes?: string;
    }
  ): Promise<AdminProduct> {
    const response = await api.patch(`/products/${productId}/inventory`, data);
    return response;
  },

  async adjustVariantInventory(
    productId: string,
    variantId: string,
    data: {
      quantity: number;
      type: 'SALE' | 'RETURN' | 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE';
      reason?: string;
      notes?: string;
    }
  ): Promise<any> {
    const response = await api.patch(
      `/products/${productId}/variants/${variantId}/inventory`,
      data
    );
    return response;
  },

  async getInventoryTransactions(
    productId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<{
    transactions: Array<{
      id: string;
      type: string;
      quantity: number;
      previousQuantity: number;
      newQuantity: number;
      reason?: string;
      notes?: string;
      createdAt: string;
      user?: { id: string; firstName: string; lastName: string; email: string };
      variant?: { id: string; name: string; sku: string };
    }>;
    total: number;
  }> {
    const response = await api.get(
      `/products/${productId}/inventory/transactions${buildQueryString(params)}`
    );
    return response;
  },

  async getLowStockProducts(threshold?: number): Promise<AdminProduct[]> {
    const response = await api.get(
      `/products/inventory/low-stock${buildQueryString({ threshold })}`
    );
    return response;
  },

  async getOutOfStockProducts(): Promise<AdminProduct[]> {
    const response = await api.get('/products/inventory/out-of-stock');
    return response;
  },

  async getInventorySummary(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryUnits: number;
    recentTransactions: Array<any>;
  }> {
    const response = await api.get('/products/inventory/summary');
    return response;
  },

  async bulkUpdateInventory(
    updates: Array<{
      productId?: string;
      variantId?: string;
      quantity: number;
      type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'RESTOCK';
      reason?: string;
    }>
  ): Promise<Array<{ success: boolean; productId?: string; variantId?: string; error?: string }>> {
    const response = await api.post('/products/inventory/bulk-update', { updates });
    return response;
  },

  async syncProductInventory(productId: string): Promise<AdminProduct> {
    const response = await api.post(`/products/${productId}/inventory/sync`);
    return response;
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
    const response = await api.get(`/admin/orders${buildQueryString(params)}`);
    return response;
  },

  async getById(id: string): Promise<AdminOrder> {
    // Backend route is /orders/:id, not /admin/orders/:id
    const response = await api.get(`/orders/${id}`);
    return response;
  },

  async updateStatus(id: string, status: string): Promise<AdminOrder> {
    // Backend route is /orders/:id/status, not /admin/orders/:id/status
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response;
  },

  async refund(id: string, amount?: number): Promise<void> {
    // Backend route is /payment/refund/:orderId
    await api.post(`/payment/refund/${id}`, { amount });
  },
};

export interface CustomerStats {
  total: number;
  newThisMonth: number;
  growthPercent: number;
  vipCount: number;
  totalRevenue: number;
}

// Customers APIs
export const adminCustomersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    segment?: string;
    sortBy?: string;
  }): Promise<{ customers: AdminCustomer[]; total: number; pages: number }> {
    const queryParams: any = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.pageSize = params.limit; // Backend uses pageSize, not limit
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.role) queryParams.role = params.role;

    const response = await api.get(`/admin/users${buildQueryString(queryParams)}`);
    const data = response.data || response;

    // Map response to expected format
    let customers = (data.users || []).map((user: any) => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      phone: user.phone,
      role: user.role,
      totalOrders: user._count?.orders || 0,
      totalSpent: user.totalSpent || 0,
      status: user.isActive ? 'active' : user.isSuspended ? 'suspended' : 'inactive',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    // Apply segment filter on frontend (backend doesn't support this)
    if (params?.segment) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      customers = customers.filter((c: any) => {
        switch (params.segment) {
          case 'vip':
            return c.totalSpent >= 1000;
          case 'regular':
            return c.totalSpent < 1000 && c.totalSpent > 0;
          case 'new':
            return new Date(c.createdAt) >= thirtyDaysAgo;
          case 'at-risk':
            return !c.lastLoginAt || new Date(c.lastLoginAt) < ninetyDaysAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting on frontend
    if (params?.sortBy) {
      const [field, order] = params.sortBy.split('-');
      customers.sort((a: any, b: any) => {
        let aVal = a[field];
        let bVal = b[field];

        // Handle date fields
        if (field === 'createdAt' || field === 'lastLoginAt') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }

        // Handle name sorting
        if (field === 'name') {
          aVal = (aVal || '').toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        // Handle orderCount
        if (field === 'orderCount') {
          aVal = a.totalOrders || 0;
          bVal = b.totalOrders || 0;
        }

        if (order === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    return {
      customers,
      total: params?.segment ? customers.length : data.total || 0,
      pages: params?.segment
        ? Math.ceil(customers.length / (params?.limit || 25))
        : data.pages || 0,
    };
  },

  async getStats(): Promise<CustomerStats> {
    const response = await api.get('/admin/customers/stats');
    return response;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/admin/users/${id}`);
    const data = response.data || response;
    return data;
  },

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    }
  ): Promise<any> {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data || response;
  },

  async suspend(id: string): Promise<any> {
    const response = await api.patch(`/admin/users/${id}/suspend`, {});
    return response.data || response;
  },

  async activate(id: string): Promise<any> {
    const response = await api.patch(`/admin/users/${id}/activate`, {});
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  // Admin Notes
  async getNotes(customerId: string): Promise<any[]> {
    const response = await api.get(`/admin/customers/${customerId}/notes`);
    return response.data || response;
  },

  async addNote(customerId: string, content: string): Promise<any> {
    const response = await api.post(`/admin/customers/${customerId}/notes`, { content });
    return response.data || response;
  },

  async deleteNote(customerId: string, noteId: string): Promise<void> {
    await api.delete(`/admin/customers/${customerId}/notes/${noteId}`);
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

    // Check if backend returned success: false
    if (response.success === false) {
      throw new Error(response.message || 'Failed to create category');
    }

    return response.data || response;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.patch(`/categories/${id}`, data);

    // Check if backend returned success: false
    if (response.success === false) {
      throw new Error(response.message || 'Failed to update category');
    }

    return response.data || response;
  },

  async updateVisibility(
    id: string,
    data: {
      showInNavbar?: boolean;
      showInFooter?: boolean;
      showOnHomepage?: boolean;
      isFeatured?: boolean;
    }
  ): Promise<Category> {
    const response = await api.patch(`/categories/${id}/visibility`, data);

    // Check if backend returned success: false
    if (response.success === false) {
      throw new Error(response.message || 'Failed to update visibility');
    }

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
    const response = await api.get(`/advertisements${buildQueryString(params)}`);
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
    const response = await api.patch(`/advertisements/${id}/approve`, {
      approved,
      rejectionReason,
    });
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
    const response = await api.get(`/admin/reviews${buildQueryString(params)}`);
    // Add computed status field for UI convenience
    const reviews =
      response.reviews?.map((review: Review) => ({
        ...review,
        status: review.isApproved ? 'approved' : ('pending' as 'pending' | 'approved' | 'rejected'),
      })) || [];
    return {
      ...response,
      reviews,
    };
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
  async getMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    revenue: number;
    orders: number;
    customers: number;
    conversionRate: number;
    averageOrderValue: number;
  }> {
    const response = await api.get(
      `/admin/analytics/metrics${buildQueryString({ startDate, endDate })}`
    );
    return response;
  },

  async getSalesByCategory(
    startDate: string,
    endDate: string
  ): Promise<Array<{ category: string; sales: number; orders: number }>> {
    const response = await api.get(
      `/admin/analytics/sales-by-category${buildQueryString({ startDate, endDate })}`
    );
    return response;
  },

  async getSalesByProduct(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{ productId: string; name: string; sales: number; orders: number }>> {
    const response = await api.get(
      `/admin/analytics/sales-by-product${buildQueryString({ startDate, endDate, limit })}`
    );
    return response;
  },
};

// Store interface
export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  user: {
    email: string;
  };
  _count: {
    products: number;
  };
}

// Stores APIs
export const adminStoresApi = {
  async getAll(params?: { status?: string; search?: string }): Promise<AdminStore[]> {
    const response = await api.get(`/admin/stores${buildQueryString(params)}`);
    return response.data || [];
  },
};
