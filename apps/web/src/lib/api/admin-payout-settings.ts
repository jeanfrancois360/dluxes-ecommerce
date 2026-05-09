/**
 * Admin Payout Settings API
 * Admin-side client for managing seller payout configurations
 */

import { api } from './client';
import { SellerPayoutSettings } from './seller-payout';

export interface AdminPayoutSettingsFilters {
  verified?: boolean;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface AdminPayoutSettingsListResponse {
  data: SellerPayoutSettings[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VerifyPayoutSettingsDto {
  verified: boolean;
  rejectionNotes?: string;
}

/**
 * Get all seller payout settings (admin)
 */
export async function getAllPayoutSettings(
  filters?: AdminPayoutSettingsFilters
): Promise<AdminPayoutSettingsListResponse> {
  const params = new URLSearchParams();
  if (filters?.verified !== undefined) params.set('verified', String(filters.verified));
  if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return api.get(`/admin/payout-settings${query ? `?${query}` : ''}`);
}

/**
 * Get payout settings for a specific seller (admin)
 */
export async function getSellerPayoutSettings(sellerId: string): Promise<SellerPayoutSettings> {
  return api.get(`/admin/payout-settings/${sellerId}`);
}

/**
 * Verify or reject a seller's payout settings
 */
export async function verifyPayoutSettings(
  settingsId: string,
  dto: VerifyPayoutSettingsDto
): Promise<SellerPayoutSettings> {
  return api.patch(`/admin/payout-settings/${settingsId}/verify`, dto);
}

/**
 * Trigger a manual Stripe Connect payout for a seller
 */
export async function triggerStripeManualPayout(
  sellerId: string,
  amount: number,
  currency: string,
  description?: string
): Promise<{ transferId: string; amount: number; currency: string }> {
  return api.post('/stripe-connect/manual-payout', { sellerId, amount, currency, description });
}

/**
 * Sync Stripe Connect account status
 */
export async function syncStripeAccount(accountId: string): Promise<void> {
  return api.post(`/stripe-connect/account/${accountId}/sync`, {});
}

/**
 * Get Stripe dashboard login link for a seller's connected account
 */
export async function getStripeDashboardLink(accountId: string): Promise<{ url: string }> {
  return api.post('/stripe-connect/dashboard-link', { accountId });
}

export const adminPayoutAPI = {
  getAll: getAllPayoutSettings,
  getSeller: getSellerPayoutSettings,
  verify: verifyPayoutSettings,
  triggerStripePayout: triggerStripeManualPayout,
  syncStripe: syncStripeAccount,
  stripeDashboard: getStripeDashboardLink,
};
