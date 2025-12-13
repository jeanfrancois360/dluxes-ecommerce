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
   * Pagination limit for inventory transaction history
   */
  TRANSACTION_HISTORY_PAGE_SIZE: 20,

  /**
   * Maximum items per page for inventory lists
   */
  MAX_ITEMS_PER_PAGE: 100,
} as const;

/**
 * Transaction types for inventory adjustments
 */
export const TRANSACTION_TYPES = {
  PURCHASE: { label: 'Purchase/Receive', description: 'Stock received from suppliers' },
  SALE: { label: 'Sale', description: 'Stock sold to customers' },
  ADJUSTMENT: { label: 'Adjustment', description: 'Manual inventory correction' },
  RETURN: { label: 'Return', description: 'Customer returns' },
  DAMAGE: { label: 'Damage/Loss', description: 'Damaged or lost inventory' },
  RESTOCK: { label: 'Restock', description: 'Inventory replenishment' },
} as const;
