export const GELATO_CONSTANTS = {
  API_VERSION: 'v4',

  WEBHOOK_EVENTS: {
    ORDER_CREATED: 'order:created',
    ORDER_CONFIRMED: 'order:confirmed',
    ORDER_IN_PRODUCTION: 'order:production_ready',
    ORDER_PRODUCED: 'order:production_finished',
    ORDER_SHIPPED: 'order:shipped',
    ORDER_DELIVERED: 'order:delivered',
    ORDER_CANCELLED: 'order:cancelled',
    ORDER_FAILED: 'order:failed',
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
