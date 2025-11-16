/**
 * Shared constants
 */

export const API_VERSION = 'v1';

export const DEFAULT_PAGE_SIZE = 24;

export const MAX_PAGE_SIZE = 100;

export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

export const SUPPORTED_LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES'] as const;

export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  xlarge: { width: 2400, height: 2400 },
} as const;

export const CACHE_TTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
} as const;

export const RATE_LIMITS = {
  api: {
    public: { points: 100, duration: 60 }, // 100 requests per minute
    authenticated: { points: 300, duration: 60 }, // 300 requests per minute
  },
  auth: {
    login: { points: 5, duration: 300 }, // 5 attempts per 5 minutes
    register: { points: 3, duration: 3600 }, // 3 attempts per hour
  },
} as const;
