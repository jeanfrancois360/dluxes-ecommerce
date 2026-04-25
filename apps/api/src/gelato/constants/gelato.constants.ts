export const GELATO_CONSTANTS = {
  API_VERSION: 'v4',

  // Gelato's actual webhook event names (as sent by the dashboard)
  WEBHOOK_EVENTS: {
    ORDER_STATUS_UPDATED: 'order_status_updated',
    ORDER_ITEM_STATUS_UPDATED: 'order_item_status_updated',
    ORDER_ITEM_TRACKING_UPDATED: 'order_item_tracking_code_updated',
    ORDER_DELIVERY_ESTIMATE_UPDATED: 'order_delivery_estimate_updated',
  },

  // Gelato order status values (sent inside event payloads)
  ORDER_STATUS: {
    CREATED: 'created',
    PASSED: 'passed',
    IN_PRODUCTION: 'in_production',
    PRINTED: 'printed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
  },

  SHIPPING_METHODS: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    OVERNIGHT: 'overnight',
  },

  PRODUCT_CATEGORIES: [
    'apparel',
    'wall-art',
    'mugs',
    'phone-cases',
    'stationery',
    'home-living',
    'bags',
    'accessories',
  ],

  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
  },
} as const;

export type GelatoWebhookEventType =
  (typeof GELATO_CONSTANTS.WEBHOOK_EVENTS)[keyof typeof GELATO_CONSTANTS.WEBHOOK_EVENTS];
export type GelatoShippingMethod =
  (typeof GELATO_CONSTANTS.SHIPPING_METHODS)[keyof typeof GELATO_CONSTANTS.SHIPPING_METHODS];
