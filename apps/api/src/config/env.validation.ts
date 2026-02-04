import * as Joi from 'joi';

/**
 * Environment Variable Validation Schema
 *
 * Validates all required environment variables on application startup.
 * Provides clear error messages if any required variables are missing or invalid.
 */

export const envValidationSchema = Joi.object({
  // ============================================================================
  // Core Application Settings
  // ============================================================================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),

  PORT: Joi.number()
    .default(4000)
    .description('API server port'),

  // ============================================================================
  // Frontend Configuration
  // ============================================================================
  FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend application URL (e.g., https://nextpik.com)'),

  // ============================================================================
  // Database Configuration
  // ============================================================================
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string'),

  // ============================================================================
  // JWT Authentication
  // ============================================================================
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT signing secret (minimum 32 characters for security)'),

  JWT_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT token expiration time'),

  // ============================================================================
  // Email Service (Resend)
  // ============================================================================
  RESEND_API_KEY: Joi.string()
    .required()
    .description('Resend API key for sending emails'),

  EMAIL_FROM: Joi.string()
    .default('noreply@nextpik.com')
    .description('Email sender address (can include name: "Name <email@domain.com>")'),

  EMAIL_FROM_NAME: Joi.string()
    .default('NextPik')
    .description('Email sender name'),

  // ============================================================================
  // Google OAuth
  // ============================================================================
  GOOGLE_CLIENT_ID: Joi.string()
    .required()
    .description('Google OAuth client ID'),

  GOOGLE_CLIENT_SECRET: Joi.string()
    .required()
    .description('Google OAuth client secret'),

  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default('http://localhost:4000/api/v1/auth/google/callback')
    .description('Google OAuth callback URL'),

  // ============================================================================
  // Stripe Payment Integration
  // ============================================================================
  STRIPE_SECRET_KEY: Joi.string()
    .required()
    .description('Stripe secret key'),

  STRIPE_PUBLISHABLE_KEY: Joi.string()
    .required()
    .description('Stripe publishable key'),

  STRIPE_WEBHOOK_SECRET: Joi.string()
    .required()
    .description('Stripe webhook signing secret'),

  // ============================================================================
  // Redis (Caching & Sessions)
  // ============================================================================
  REDIS_HOST: Joi.string()
    .default('localhost')
    .description('Redis server host'),

  REDIS_PORT: Joi.number()
    .default(6379)
    .description('Redis server port'),

  REDIS_PASSWORD: Joi.string()
    .allow('')
    .optional()
    .description('Redis password (optional)'),

  // ============================================================================
  // Meilisearch (Search Engine)
  // ============================================================================
  MEILISEARCH_HOST: Joi.string()
    .uri()
    .default('http://localhost:7700')
    .description('Meilisearch server URL'),

  MEILISEARCH_API_KEY: Joi.string()
    .allow('')
    .optional()
    .description('Meilisearch master key (optional in development)'),

  // ============================================================================
  // File Storage (Supabase)
  // ============================================================================
  SUPABASE_URL: Joi.string()
    .uri()
    .allow('')
    .optional()
    .description('Supabase project URL (optional if not using file storage)'),

  SUPABASE_KEY: Joi.string()
    .allow('')
    .optional()
    .description('Supabase anon/public key (optional if not using file storage)'),

  SUPABASE_BUCKET_NAME: Joi.string()
    .default('uploads')
    .description('Supabase storage bucket name'),

  // ============================================================================
  // Security & Rate Limiting
  // ============================================================================
  THROTTLE_TTL: Joi.number()
    .default(60)
    .description('Rate limit time window in seconds'),

  THROTTLE_LIMIT: Joi.number()
    .default(10)
    .description('Maximum requests per time window'),

  // ============================================================================
  // Session Configuration
  // ============================================================================
  SESSION_SECRET: Joi.string()
    .min(32)
    .default('change-this-to-a-secure-random-string-in-production')
    .description('Session encryption secret'),

  // ============================================================================
  // Logging
  // ============================================================================
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('Application log level'),

  // ============================================================================
  // CORS Configuration
  // ============================================================================
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .description('Allowed CORS origins (comma-separated for multiple)'),

  // ============================================================================
  // Optional: Analytics & Monitoring
  // ============================================================================
  SENTRY_DSN: Joi.string()
    .uri()
    .allow('')
    .optional()
    .description('Sentry error tracking DSN (optional)'),

  // ============================================================================
  // Optional: PayPal Configuration
  // ============================================================================
  PAYPAL_CLIENT_ID: Joi.string()
    .allow('')
    .optional()
    .description('PayPal client ID (optional)'),

  PAYPAL_CLIENT_SECRET: Joi.string()
    .allow('')
    .optional()
    .description('PayPal client secret (optional)'),

  PAYPAL_MODE: Joi.string()
    .valid('sandbox', 'live')
    .default('sandbox')
    .description('PayPal environment mode'),
});

/**
 * Helper function to validate environment variables manually
 * Useful for debugging or custom validation scenarios
 */
export function validateEnv(config: Record<string, any>): {
  error?: Joi.ValidationError;
  value: any;
} {
  return envValidationSchema.validate(config, {
    abortEarly: false, // Collect all errors, not just first one
    allowUnknown: true, // Allow extra env vars that aren't in schema
  });
}
