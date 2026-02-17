import { api } from './client';

export interface GelatoProduct {
  uid: string;
  title: string;
  description?: string;
  previewUrl?: string;
  category: string;
  variants: GelatoVariant[];
  printAreas: GelatoPrintArea[];
}

export interface GelatoVariant {
  variantUid: string;
  title: string;
  options: Record<string, string>;
  productUid: string;
  baseCost?: {
    amount: string;
    currency: string;
  };
}

export interface GelatoPrintArea {
  name: string;
  width: number;
  height: number;
  dpi: number;
  fileTypes: string[];
}

export interface GelatoShippingMethod {
  uid: string;
  name: string;
  type: string;
  price: {
    amount: string;
    currency: string;
  };
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface GelatoPodOrder {
  id: string;
  orderId: string;
  orderItemId: string;
  gelatoOrderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  order?: { orderNumber: string; userId: string };
  product?: { name: string; images?: { url: string }[] };
}

export const gelatoApi = {
  async getStatus(): Promise<{
    configured: boolean;
    enabled: boolean;
    storeId: string | null;
    apiConnected: boolean;
  }> {
    const response = await api.get('/gelato/status');
    return response.data ?? response;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get('/gelato/catalog/categories');
    return (response.data ?? response).categories;
  },

  async getProducts(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: GelatoProduct[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const response = await api.get(`/gelato/catalog/products?${query}`);
    return response.data ?? response;
  },

  async getProductDetails(productUid: string): Promise<GelatoProduct> {
    const response = await api.get(`/gelato/catalog/products/${productUid}`);
    return response.data ?? response;
  },

  async configurePodProduct(
    productId: string,
    config: {
      gelatoProductUid: string;
      gelatoTemplateId?: string;
      designFileUrl?: string;
      printAreas?: Record<string, any>;
      baseCost?: number;
    }
  ) {
    const response = await api.post(`/gelato/products/${productId}/configure`, config);
    return response.data ?? response;
  },

  async updatePodProduct(
    productId: string,
    config: {
      gelatoProductUid?: string;
      designFileUrl?: string;
      printAreas?: Record<string, any>;
    }
  ) {
    const response = await api.patch(`/gelato/products/${productId}/configure`, config);
    return response.data ?? response;
  },

  async removePodConfiguration(productId: string) {
    const response = await api.delete(`/gelato/products/${productId}/configure`);
    return response.data ?? response;
  },

  async getShippingEstimate(
    productId: string,
    params: { quantity: number; country: string; state?: string }
  ): Promise<GelatoShippingMethod[]> {
    const query = new URLSearchParams({
      quantity: String(params.quantity),
      country: params.country,
    });
    if (params.state) query.set('state', params.state);
    const response = await api.get(`/gelato/products/${productId}/shipping?${query}`);
    return (response.data ?? response).shippingMethods;
  },

  async getPodOrders(params?: {
    status?: string;
    orderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: GelatoPodOrder[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.orderId) query.set('orderId', params.orderId);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const response = await api.get(`/gelato/orders?${query}`);
    return response.data ?? response;
  },

  async getPodOrder(podOrderId: string): Promise<GelatoPodOrder & { gelatoStatus?: any }> {
    const response = await api.get(`/gelato/orders/${podOrderId}`);
    return response.data ?? response;
  },

  async submitPodOrder(orderId: string, orderItemId: string, shippingMethod?: string) {
    const response = await api.post('/gelato/orders/submit', {
      orderId,
      orderItemId,
      shippingMethod,
    });
    return response.data ?? response;
  },

  async submitAllPodItems(orderId: string) {
    const response = await api.post(`/gelato/orders/${orderId}/submit-all`);
    return response.data ?? response;
  },

  async cancelPodOrder(podOrderId: string, reason?: string) {
    const response = await api.post(`/gelato/orders/${podOrderId}/cancel`, { reason });
    return response.data ?? response;
  },

  async syncOrderStatus(podOrderId: string) {
    const response = await api.post(`/gelato/orders/${podOrderId}/sync`);
    return response.data ?? response;
  },
};
