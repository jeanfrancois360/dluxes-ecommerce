import { z } from 'zod';

// ============================================================================
// GENERAL SETTINGS
// ============================================================================
export const generalSettingsSchema = z.object({
  site_name: z.string().min(3, 'Site name must be at least 3 characters').max(50, 'Site name must be less than 50 characters'),
  site_tagline: z.string().min(5, 'Tagline must be at least 5 characters').max(100, 'Tagline must be less than 100 characters'),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  maintenance_mode: z.boolean(),
  allowed_countries: z.array(z.string()).min(1, 'At least one country must be selected'),
});

// ============================================================================
// PAYMENT & ESCROW SETTINGS
// ============================================================================
export const paymentSettingsSchema = z.object({
  escrow_enabled: z.boolean().optional(), // Optional - handled separately via toggle in uppercase PAYMENT category
  escrow_default_hold_days: z.number().int().min(1, 'Hold days must be at least 1').max(90, 'Hold days cannot exceed 90'),
  escrow_auto_release_enabled: z.boolean().optional(), // Optional - handled separately via immediate-save toggle
  min_payout_amount: z.number().min(0, 'Minimum payout must be positive'),
  payout_schedule: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  payment_methods: z.array(z.string()).min(1, 'At least one payment method must be enabled'),
});

// ============================================================================
// COMMISSION SETTINGS
// ============================================================================
export const commissionSettingsSchema = z.object({
  global_commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%'),
  commission_type: z.enum(['percentage', 'fixed', 'tiered']),
  commission_applies_to_shipping: z.boolean(),
  commission_min_amount: z.number().min(0, 'Minimum amount cannot be negative').max(100, 'Minimum amount cannot exceed $100'),
  commission_max_amount: z.number().min(0, 'Maximum amount cannot be negative'),
  commission_fixed_fee: z.number().min(0, 'Fixed fee cannot be negative').max(50, 'Fixed fee cannot exceed $50'),
}).refine(
  (data) => {
    // If max is set (not 0), it must be greater than min
    if (data.commission_max_amount > 0 && data.commission_min_amount > data.commission_max_amount) {
      return false;
    }
    return true;
  },
  {
    message: 'Maximum commission must be greater than minimum commission',
    path: ['commission_max_amount'],
  }
);

// ============================================================================
// CURRENCY SETTINGS
// ============================================================================
export const currencySettingsSchema = z.object({
  default_currency: z.string().length(3, 'Currency code must be 3 characters'),
  supported_currencies: z.array(z.string()).min(1, 'At least one currency must be supported'),
  currency_auto_sync: z.boolean(),
  currency_sync_frequency: z.enum(['hourly', 'daily', 'weekly']),
}).refine(
  (data) => {
    // Default currency must be in supported currencies
    return data.supported_currencies.includes(data.default_currency);
  },
  {
    message: 'Default currency must be in supported currencies list',
    path: ['default_currency'],
  }
);

// ============================================================================
// DELIVERY/FULFILLMENT SETTINGS
// ============================================================================
export const deliverySettingsSchema = z.object({
  delivery_confirmation_required: z.boolean(),
  delivery_auto_assign: z.boolean(),
  delivery_partner_commission: z.number().min(0).max(100),
});

// ============================================================================
// TAX SETTINGS
// ============================================================================
export const taxSettingsSchema = z.object({
  tax_calculation_mode: z.enum(['disabled', 'simple', 'by_state'], {
    errorMap: () => ({ message: 'Tax mode must be disabled, simple, or by_state' }),
  }),
  tax_default_rate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(1, 'Tax rate cannot exceed 100%'),
}).refine(
  (data) => {
    // If mode is 'simple', tax_default_rate must be > 0
    if (data.tax_calculation_mode === 'simple' && data.tax_default_rate <= 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Default tax rate must be greater than 0 when using simple mode',
    path: ['tax_default_rate'],
  }
);

// ============================================================================
// SHIPPING RATES SETTINGS
// ============================================================================
export const shippingSettingsSchema = z.object({
  shipping_mode: z.enum(['manual', 'dhl_api', 'hybrid'], {
    errorMap: () => ({ message: 'Shipping mode must be manual, dhl_api, or hybrid' }),
  }),
  shipping_standard_rate: z.number().min(0, 'Rate cannot be negative'),
  shipping_express_rate: z.number().min(0, 'Rate cannot be negative'),
  shipping_overnight_rate: z.number().min(0, 'Rate cannot be negative'),
  shipping_international_surcharge: z.number().min(0, 'Surcharge cannot be negative'),
  free_shipping_enabled: z.boolean(),
  free_shipping_threshold: z.number().min(0, 'Threshold must be positive'),
});

// ============================================================================
// ADVERTISEMENT SETTINGS
// ============================================================================
export const advertisementSettingsSchema = z.object({
  ad_min_duration_days: z.number().int().min(1, 'Minimum duration must be at least 1 day'),
  ad_max_active_per_product: z.number().int().min(1, 'Must allow at least 1 ad per product'),
  ad_auto_expire: z.boolean(),
});

// ============================================================================
// SECURITY SETTINGS
// ============================================================================
export const securitySettingsSchema = z.object({
  '2fa_required_for_admin': z.boolean(),
  session_timeout_minutes: z.number().int().min(5, 'Session timeout must be at least 5 minutes').max(1440, 'Session timeout cannot exceed 24 hours'),
  max_login_attempts: z.number().int().min(3, 'Must allow at least 3 login attempts').max(10, 'Cannot exceed 10 login attempts'),
  password_min_length: z.number().int().min(6, 'Minimum password length must be at least 6').max(32, 'Maximum password length is 32'),
  password_require_special_chars: z.boolean(),
  allowed_file_types: z.array(z.string()).min(1, 'At least one file type must be allowed'),
  max_file_size_mb: z.number().min(1, 'Maximum file size must be at least 1MB').max(100, 'Maximum file size cannot exceed 100MB'),
});

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================
export const notificationSettingsSchema = z.object({
  email_notifications_enabled: z.boolean(),
  sms_notifications_enabled: z.boolean(),
  notification_events: z.array(z.string()).min(1, 'At least one notification event must be enabled'),
});

// ============================================================================
// SEO & MARKETING SETTINGS
// ============================================================================
export const seoSettingsSchema = z.object({
  seo_meta_title: z.string().min(10, 'Meta title must be at least 10 characters').max(60, 'Meta title must be less than 60 characters'),
  seo_meta_description: z.string().min(10, 'Meta description must be at least 10 characters').max(160, 'Meta description must be less than 160 characters'),
  seo_keywords: z.string().optional(),
  analytics_enabled: z.boolean(),
});

// ============================================================================
// COMBINED SETTINGS SCHEMA (for full validation)
// ============================================================================
export const allSettingsSchema = z.object({
  general: generalSettingsSchema,
  payment: paymentSettingsSchema,
  commission: commissionSettingsSchema,
  currency: currencySettingsSchema,
  delivery: deliverySettingsSchema,
  tax: taxSettingsSchema,
  shipping: shippingSettingsSchema,
  advertisement: advertisementSettingsSchema,
  security: securitySettingsSchema,
  notifications: notificationSettingsSchema,
  seo: seoSettingsSchema,
});

// Type exports
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export type CommissionSettings = z.infer<typeof commissionSettingsSchema>;
export type CurrencySettings = z.infer<typeof currencySettingsSchema>;
export type DeliverySettings = z.infer<typeof deliverySettingsSchema>;
export type TaxSettings = z.infer<typeof taxSettingsSchema>;
export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;
export type AdvertisementSettings = z.infer<typeof advertisementSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type AllSettings = z.infer<typeof allSettingsSchema>;
