/**
 * Fallback defaults for SystemSetting accessors.
 *
 * SOURCE OF TRUTH: packages/database/prisma/seed-settings.ts (and seed.ts)
 * These constants exist ONLY as a runtime safety net for cases where:
 *   - A setting row is missing (fresh env, failed migration, accidental delete)
 *   - The seed has not yet been run
 *
 * If you change a default here, you MUST also update the seed file.
 * If these two diverge, the seed wins — fix the constant, not the seed.
 *
 * Grouped by domain to mirror seed-settings.ts structure.
 */
export const SETTING_DEFAULTS = {
  // --------------------------------------------------------------------------
  // SITE / GENERAL
  // --------------------------------------------------------------------------
  site: {
    name: 'NextPik E-commerce',
    tagline: 'Where Elegance Meets Excellence',
    contact_email: 'support@luxury.com',
    /** Seed default: 'America/New_York'. Code previously fell back to 'UTC' — drift, not intent. */
    timezone: 'America/New_York',
    maintenance_mode: false,
  },

  // --------------------------------------------------------------------------
  // AUDIT
  // --------------------------------------------------------------------------
  audit: {
    /**
     * Fixed key from dot to underscore notation — accessor was silently using fallback.
     * The DB key is 'audit_log_retention_days' (underscore).
     * The old accessor read 'audit.log_retention_days' (dot), which never matched,
     * so this fallback was firing on every request in production.
     */
    log_retention_days: 2555, // 7 years
  },

  // --------------------------------------------------------------------------
  // INVENTORY
  // --------------------------------------------------------------------------
  inventory: {
    low_stock_threshold: 10,
    auto_sku_generation: true,
    sku_prefix: 'PROD',
    enable_stock_notifications: true,
    /**
     * Seed default includes two recipients. Code previously fell back to one — drift.
     * BEHAVIORAL CHANGE: environments relying on the fallback will now notify both addresses.
     */
    notification_recipients: ['inventory@luxury.com', 'admin@luxury.com'] as string[],
    allow_negative_stock: false,
    transaction_history_page_size: 20,
  },

  // --------------------------------------------------------------------------
  // STRIPE / PAYMENT CONFIG
  // (API keys are env vars; these are business-config defaults only)
  // --------------------------------------------------------------------------
  stripe: {
    enabled: false,
    test_mode: true,
    currency: 'USD',
    capture_method: 'manual' as 'automatic' | 'manual',
    statement_descriptor: 'LUXURY ECOM',
    auto_payout_enabled: false,
  },

  // --------------------------------------------------------------------------
  // TAX
  // --------------------------------------------------------------------------
  tax: {
    calculation_mode: 'disabled' as 'disabled' | 'simple' | 'by_state',
    default_rate: 0.1, // 10%
  },

  // --------------------------------------------------------------------------
  // SHIPPING
  // --------------------------------------------------------------------------
  shipping: {
    /**
     * Seed default: 'hybrid'. Code previously fell back to 'manual' — drift.
     * BEHAVIORAL CHANGE: environments relying on the fallback will now use hybrid mode.
     */
    mode: 'hybrid' as 'manual' | 'dhl_api' | 'hybrid',
    standard_rate: 9.99,
    express_rate: 19.99,
    overnight_rate: 29.99,
    international_surcharge: 15.0,
  },

  // --------------------------------------------------------------------------
  // FREE SHIPPING
  // --------------------------------------------------------------------------
  free_shipping: {
    enabled: true,
    /**
     * Seed default: 100. Code previously fell back to 200 — drift.
     * BEHAVIORAL CHANGE: environments relying on the fallback will now apply
     * free shipping at $100 instead of $200.
     */
    threshold: 100,
  },

  // --------------------------------------------------------------------------
  // SELF-PICKUP
  // --------------------------------------------------------------------------
  pickup: {
    enabled: true,
    default_radius_km: 50,
    require_code_verification: true,
    expiration_days: 7,
    allow_scheduling: false,
    default_fee: 0,
  },

  // --------------------------------------------------------------------------
  // REFERRAL
  // --------------------------------------------------------------------------
  referral: {
    enabled: true,
    reward_type: 'store_credit' as 'store_credit' | 'coupon' | 'flat_commission',
    buyer_reward: 10.0,
    seller_reward: 50.0,
    min_order_value: 25.0,
    buyer_expiration_days: 90,
    seller_expiration_days: 180,
    code_length: 8,
    code_prefix: '',
    max_usage_per_code: 0,
    reward_currency: 'USD',
    min_payout_amount: 5.0,
    auto_generate_code: true,
    show_leaderboard: true,
  },

  // --------------------------------------------------------------------------
  // SUBSCRIPTION
  // --------------------------------------------------------------------------
  subscription: {
    grace_days: 3,
  },

  // --------------------------------------------------------------------------
  // SELLER CREDITS
  // --------------------------------------------------------------------------
  seller: {
    monthly_credit_price: 29.99,
    credit_grace_period_days: 3,
    min_credit_purchase: 1,
    max_credit_purchase: 12,
    low_credit_warning_threshold: 2,
  },

  // --------------------------------------------------------------------------
  // CURRENCY
  // --------------------------------------------------------------------------
  currency: {
    default: 'USD',
    auto_sync: true,
  },

  // --------------------------------------------------------------------------
  // GELATO
  // --------------------------------------------------------------------------
  gelato: {
    default_shipping_method: 'standard',
  },

  // --------------------------------------------------------------------------
  // ESCROW (read by non-escrow services only — e.g. gelato-orders)
  // The escrow module itself is protected and not part of this refactor.
  // --------------------------------------------------------------------------
  escrow: {
    default_hold_days: 7,
  },

  // --------------------------------------------------------------------------
  // CREDITS (generic credit cost/bonus)
  // --------------------------------------------------------------------------
  credits: {
    bonus_amount: 0,
    cost_per_unit: 1,
  },

  // --------------------------------------------------------------------------
  // 2FA ENFORCEMENT (v2.12.0)
  // --------------------------------------------------------------------------
  twoFactor: {
    required_for_seller: true,
    required_for_admin_v2: true,
    required_for_delivery_partner: true,
    grace_period_days_existing: 14,
    grace_period_days_new: 7,
    device_trust_duration_days: 30,
    device_trust_enabled: true,
  },
} as const;
