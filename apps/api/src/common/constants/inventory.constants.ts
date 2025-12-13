/**
 * Inventory Management Constants
 *
 * Centralized configuration for inventory-related features.
 * These can be overridden by system settings when available.
 */

export const INVENTORY_DEFAULTS = {
  /**
   * Low stock threshold - products with inventory at or below this level
   * are considered "low stock"
   */
  LOW_STOCK_THRESHOLD: 10,

  /**
   * Default pagination limit for inventory transactions
   */
  TRANSACTION_PAGE_SIZE: 50,
} as const;

/**
 * SKU Generation Configuration
 */
export const SKU_CONFIG = {
  /**
   * SKU prefix for products
   */
  PRODUCT_PREFIX: 'PROD',

  /**
   * Random string length in SKUs
   */
  RANDOM_LENGTH: 6,
} as const;
