import { api } from './client';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      image: string;
    };
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

export interface CalculateTotalsRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  shippingAddressId: string;
  shippingMethod?: string;
  currency?: string;
  couponCode?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  carrier?: string;
}

export interface OrderCalculationResponse {
  subtotal: number;
  shipping: {
    method: string;
    name: string;
    price: number;
    estimatedDays: number;
    carrier?: string;
  };
  shippingOptions: ShippingOption[];
  tax: {
    amount: number;
    rate: number;
    jurisdiction: string;
    breakdown?: {
      state?: number;
      county?: number;
      city?: number;
    };
  };
  discount: number;
  coupon?: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
  } | null;
  total: number;
  currency: string;
  breakdown: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  warnings?: string[];
}

export const ordersAPI = {
  getAll: () =>
    api.get<Order[]>('/orders'),

  getById: (id: string) =>
    api.get<Order>(`/orders/${id}`),

  create: (data: CreateOrderData) =>
    api.post<Order>('/orders', data),

  cancel: (id: string) =>
    api.post<Order>(`/orders/${id}/cancel`),

  track: (id: string) =>
    api.get(`/orders/${id}/tracking`),

  calculateTotals: (data: CalculateTotalsRequest) =>
    api.post<OrderCalculationResponse>('/orders/calculate-totals', data),
};
