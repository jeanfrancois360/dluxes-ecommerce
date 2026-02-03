/**
 * Settings Configuration
 *
 * Defines which settings come from environment variables vs database.
 * This creates a clear separation between infrastructure secrets and business configuration.
 *
 * @see CLAUDE.md for settings architecture details
 */

export type SettingSource = 'env' | 'database';

export interface SettingDefinition {
  key: string;
  source: SettingSource;
  label: string;
  description: string;
  category: 'payment' | 'general' | 'commission' | 'currency' | 'delivery' | 'security' | 'notification' | 'seo' | 'inventory';
  isSecret?: boolean;
  envKey?: string; // The actual .env variable name (if source is 'env')
  requiresRestart?: boolean;
}

/**
 * Settings that should ONLY be managed via .env files
 * These are typically infrastructure secrets and API credentials
 */
export const ENV_ONLY_SETTINGS: SettingDefinition[] = [
  // Stripe API Keys
  {
    key: 'stripe_publishable_key',
    source: 'env',
    envKey: 'STRIPE_PUBLISHABLE_KEY',
    label: 'Stripe Publishable Key',
    description: 'Public API key for Stripe integration (starts with pk_)',
    category: 'payment',
    isSecret: false,
  },
  {
    key: 'stripe_secret_key',
    source: 'env',
    envKey: 'STRIPE_SECRET_KEY',
    label: 'Stripe Secret Key',
    description: 'Secret API key for Stripe (starts with sk_)',
    category: 'payment',
    isSecret: true,
    requiresRestart: true,
  },
  {
    key: 'stripe_webhook_secret',
    source: 'env',
    envKey: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe Webhook Secret',
    description: 'Webhook signing secret for verifying Stripe events (starts with whsec_)',
    category: 'payment',
    isSecret: true,
    requiresRestart: true,
  },

  // PayPal Credentials
  {
    key: 'paypal_client_id',
    source: 'env',
    envKey: 'PAYPAL_CLIENT_ID',
    label: 'PayPal Client ID',
    description: 'PayPal REST API Client ID',
    category: 'payment',
    isSecret: false,
  },
  {
    key: 'paypal_client_secret',
    source: 'env',
    envKey: 'PAYPAL_CLIENT_SECRET',
    label: 'PayPal Client Secret',
    description: 'PayPal REST API Client Secret',
    category: 'payment',
    isSecret: true,
    requiresRestart: true,
  },

  // Email Configuration
  {
    key: 'resend_api_key',
    source: 'env',
    envKey: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: 'API key for Resend email service',
    category: 'notification',
    isSecret: true,
    requiresRestart: true,
  },

  // OAuth Credentials
  {
    key: 'google_client_id',
    source: 'env',
    envKey: 'GOOGLE_CLIENT_ID',
    label: 'Google OAuth Client ID',
    description: 'Google OAuth 2.0 Client ID for authentication',
    category: 'security',
    isSecret: false,
  },
  {
    key: 'google_client_secret',
    source: 'env',
    envKey: 'GOOGLE_CLIENT_SECRET',
    label: 'Google OAuth Client Secret',
    description: 'Google OAuth 2.0 Client Secret',
    category: 'security',
    isSecret: true,
    requiresRestart: true,
  },

  // Storage Credentials
  {
    key: 'supabase_url',
    source: 'env',
    envKey: 'SUPABASE_URL',
    label: 'Supabase URL',
    description: 'Supabase project URL for file storage',
    category: 'general',
    isSecret: false,
  },
  {
    key: 'supabase_anon_key',
    source: 'env',
    envKey: 'SUPABASE_ANON_KEY',
    label: 'Supabase Anon Key',
    description: 'Supabase anonymous key for public access',
    category: 'general',
    isSecret: false,
  },
  {
    key: 'supabase_service_key',
    source: 'env',
    envKey: 'SUPABASE_SERVICE_KEY',
    label: 'Supabase Service Key',
    description: 'Supabase service role key (full access)',
    category: 'general',
    isSecret: true,
    requiresRestart: true,
  },
];

/**
 * Settings that are managed via database
 * These are business configuration that can be changed at runtime
 */
export const DATABASE_SETTINGS: SettingDefinition[] = [
  // Stripe Configuration (not credentials)
  {
    key: 'stripe_enabled',
    source: 'database',
    label: 'Enable Stripe',
    description: 'Enable or disable Stripe payment processing',
    category: 'payment',
  },
  {
    key: 'stripe_test_mode',
    source: 'database',
    label: 'Stripe Test Mode',
    description: 'Use Stripe test environment (sandbox)',
    category: 'payment',
  },
  {
    key: 'stripe_currency',
    source: 'database',
    label: 'Stripe Default Currency',
    description: 'Default currency for Stripe transactions',
    category: 'payment',
  },
  {
    key: 'stripe_capture_method',
    source: 'database',
    label: 'Stripe Capture Method',
    description: 'Payment capture method: manual (for escrow) or automatic',
    category: 'payment',
  },
  {
    key: 'stripe_statement_descriptor',
    source: 'database',
    label: 'Statement Descriptor',
    description: 'Text shown on customer credit card statements',
    category: 'payment',
  },
  {
    key: 'stripe_auto_payout_enabled',
    source: 'database',
    label: 'Auto Payout',
    description: 'Automatically process seller payouts',
    category: 'payment',
  },

  // Escrow Settings
  {
    key: 'escrow_enabled',
    source: 'database',
    label: 'Enable Escrow',
    description: 'Enable escrow system for payment holding',
    category: 'payment',
  },
  {
    key: 'escrow_default_hold_days',
    source: 'database',
    label: 'Escrow Hold Period',
    description: 'Default number of days to hold payments in escrow',
    category: 'payment',
  },
  {
    key: 'escrow_auto_release_enabled',
    source: 'database',
    label: 'Auto-Release Escrow',
    description: 'Automatically release funds after hold period',
    category: 'payment',
  },

  // Payout Settings
  {
    key: 'min_payout_amount',
    source: 'database',
    label: 'Minimum Payout Amount',
    description: 'Minimum balance required for seller payout',
    category: 'payment',
  },
  {
    key: 'payout_schedule',
    source: 'database',
    label: 'Payout Schedule',
    description: 'Frequency of automatic payouts (daily, weekly, monthly)',
    category: 'payment',
  },
  {
    key: 'payment_methods',
    source: 'database',
    label: 'Enabled Payment Methods',
    description: 'List of enabled payment methods',
    category: 'payment',
  },
];

/**
 * Combined settings map for easy lookup
 */
export const SETTINGS_MAP = new Map<string, SettingDefinition>(
  [...ENV_ONLY_SETTINGS, ...DATABASE_SETTINGS].map(setting => [setting.key, setting])
);

/**
 * Check if a setting should come from environment variables
 */
export function isEnvSetting(key: string): boolean {
  const setting = SETTINGS_MAP.get(key);
  return setting?.source === 'env';
}

/**
 * Get the environment variable name for a setting
 */
export function getEnvKey(settingKey: string): string | undefined {
  const setting = SETTINGS_MAP.get(settingKey);
  return setting?.envKey;
}

/**
 * Check if a setting is a secret (should be masked in UI)
 */
export function isSecretSetting(key: string): boolean {
  const setting = SETTINGS_MAP.get(key);
  return setting?.isSecret ?? false;
}

/**
 * Get settings by category
 */
export function getSettingsByCategory(category: string, source?: SettingSource): SettingDefinition[] {
  const allSettings = [...ENV_ONLY_SETTINGS, ...DATABASE_SETTINGS];

  return allSettings.filter(setting => {
    const matchesCategory = setting.category === category;
    const matchesSource = source ? setting.source === source : true;
    return matchesCategory && matchesSource;
  });
}

/**
 * Mask sensitive values for display
 * Shows first 7 chars + "..." + last 4 chars
 */
export function maskSecretValue(value: string): string {
  if (!value || value.length < 12) {
    return '••••••••••••';
  }

  const start = value.substring(0, 7);
  const end = value.substring(value.length - 4);

  return `${start}...${end}`;
}
