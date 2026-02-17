export interface GelatoAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postCode: string;
  country: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface GelatoOrderItem {
  productUid: string;
  quantity: number;
  files?: GelatoFileSpec[];
  options?: Record<string, string>;
}

export interface GelatoFileSpec {
  type: 'default' | 'preview' | 'mockup';
  url: string;
  areaName?: string;
}

export interface GelatoCreateOrderRequest {
  orderReferenceId: string;
  customerReferenceId?: string;
  currency: string;
  items: GelatoOrderItem[];
  shippingAddress: GelatoAddress;
  billingAddress?: GelatoAddress;
  shipmentMethodUid?: string;
  metadata?: Record<string, string>;
}

export interface GelatoOrderResponse {
  id: string;
  orderReferenceId: string;
  fulfillmentStatus: string;
  financialStatus: string;
  channel: string;
  storeId: string;
  currency: string;
  items: GelatoOrderItemResponse[];
  shipments: GelatoShipment[];
  createdAt: string;
  updatedAt: string;
}

export interface GelatoOrderItemResponse {
  id: string;
  productUid: string;
  quantity: number;
  fulfillmentStatus: string;
  productionDetails?: {
    status: string;
    facility?: string;
  };
}

export interface GelatoShipment {
  id: string;
  shipmentMethodUid: string;
  shipmentMethodName: string;
  trackingCode?: string;
  trackingUrl?: string;
  carrier?: string;
  fulfillmentStatus: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface GelatoProduct {
  uid: string;
  title: string;
  description?: string;
  previewUrl?: string;
  category: string;
  variants: GelatoProductVariant[];
  printAreas: GelatoPrintArea[];
}

export interface GelatoProductVariant {
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

export interface GelatoWebhookPayload {
  event: string;
  id: string;
  createdAt: string;
  data: {
    order?: GelatoOrderResponse;
    orderId?: string;
    shipment?: GelatoShipment;
    [key: string]: any;
  };
}

export interface GelatoPriceCalculation {
  items: Array<{
    productUid: string;
    quantity: number;
    itemCost: { amount: string; currency: string };
  }>;
  shippingCost: { amount: string; currency: string };
  totalCost: { amount: string; currency: string };
}
