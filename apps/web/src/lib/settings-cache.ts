/**
 * Settings cache invalidation utilities
 * Ensures UI updates immediately after settings changes
 */

import { mutate } from 'swr';

/**
 * Invalidate all settings-related caches
 * Call this after any settings update to refresh the entire app
 */
export async function invalidateAllSettings() {
  await Promise.all([
    mutate('/settings/public', undefined, { revalidate: true }),
    mutate((key) => typeof key === 'string' && key.startsWith('/settings/category/'), undefined, { revalidate: true }),
    mutate((key) => typeof key === 'string' && key.startsWith('/settings/'), undefined, { revalidate: true }),
  ]);
}

/**
 * Invalidate currency-related caches
 * Call this after currency settings updates
 */
export async function invalidateCurrencySettings() {
  console.log('🔄 Invalidating currency caches...');

  await Promise.all([
    mutate('/settings/public', undefined, { revalidate: true }),
    mutate('/currency/rates', undefined, { revalidate: true }),
    mutate('/currency/admin/all', undefined, { revalidate: true }),
    mutate((key) => typeof key === 'string' && key.startsWith('/currency/'), undefined, { revalidate: true }),
  ]);

  console.log('✅ Currency caches invalidated successfully');
}

/**
 * Invalidate payment-related caches
 * Call this after payment/escrow settings updates
 */
export async function invalidatePaymentSettings() {
  await Promise.all([
    mutate('/settings/public', undefined, { revalidate: true }),
    mutate((key) => typeof key === 'string' && key.startsWith('/settings/category/payment'), undefined, { revalidate: true }),
  ]);
}

/**
 * Invalidate delivery-related caches
 * Call this after delivery settings updates
 */
export async function invalidateDeliverySettings() {
  await Promise.all([
    mutate('/settings/public', undefined, { revalidate: true }),
    mutate((key) => typeof key === 'string' && key.startsWith('/delivery/'), undefined, { revalidate: true }),
  ]);
}

/**
 * Map of setting categories to their invalidation functions
 */
export const settingsCacheInvalidators = {
  currency: invalidateCurrencySettings,
  payment: invalidatePaymentSettings,
  delivery: invalidateDeliverySettings,
  all: invalidateAllSettings,
};

/**
 * Invalidate caches for a specific settings category
 */
export async function invalidateSettingsByCategory(category: string) {
  const invalidator = settingsCacheInvalidators[category as keyof typeof settingsCacheInvalidators];
  if (invalidator) {
    await invalidator();
  } else {
    // Default: invalidate all if category not found
    await invalidateAllSettings();
  }
}
