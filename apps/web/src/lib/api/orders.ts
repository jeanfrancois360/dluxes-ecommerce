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
  useStoreCredit?: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  carrier?: string;
  /** Provider tier that supplied this rate (easypost | sendcloud | easyship | dhl | zone | manual | gelato) */
  source?: string;
  /** True when the carrier requires a service point selection (e.g. DPD Shop, bpost @bpack) */
  requiresServicePoint?: boolean;
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
  storeCredit?: {
    available: number;
    applied: number;
  };
  taxBreakdown?: {
    sellerBreakdown: Array<{
      storeId: string;
      storeName: string;
      businessType: string | null;
      taxHandling: 'NEXTPIK_COLLECTS' | 'PRICE_INCLUSIVE';
      subtotal: number;
      taxRate: number;
      taxAmount: number;
      jurisdiction: string;
    }>;
    hasTaxInclusiveItems: boolean;
    hasTaxableItems: boolean;
  };
  total: number;
  currency: string;
  breakdown: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    storeCredit?: number;
    total: number;
  };
  warnings?: string[];
}

// Pickup-related types (v2.10.0)
export interface PickupStore {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  pickupHours?: Record<string, string> | null;
  pickupEstimatedMinutes?: number | null;
}

export const ordersAPI = {
  getAll: () => api.get<Order[]>('/orders'),

  getById: (id: string) => api.get<Order>(`/orders/${id}`),

  create: (data: CreateOrderData) => api.post<Order>('/orders', data),

  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`),

  track: (id: string) => api.get(`/orders/${id}/tracking`),

  calculateTotals: (data: CalculateTotalsRequest) =>
    api.post<OrderCalculationResponse>('/orders/calculate-totals', data),

  // Pickup-related endpoints (v2.10.0)
  getAvailablePickupStores: (productIds: string[]) =>
    api.post<PickupStore[]>('/orders/available-pickup-stores', { productIds }),
};
