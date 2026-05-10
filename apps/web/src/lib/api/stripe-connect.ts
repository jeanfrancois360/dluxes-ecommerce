/**
 * Stripe Connect API
 * Client-side API for Stripe Connect integration
 */

import { api } from './client';

export interface StripeConnectAccount {
  accountId: string;
  onboardingUrl: string;
}

export interface StripeAccountStatus {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    pastDue: string[];
    eventuallyDue: string[];
  };
}

export interface DashboardLink {
  url: string;
}

/**
 * Create Stripe Connect account and get onboarding link
 */
export async function createStripeAccount(data?: {
  country?: string;
  businessType?: 'individual' | 'company';
}): Promise<StripeConnectAccount> {
  return api.post('/stripe-connect/create-account', data || {});
}

/**
 * Refresh onboarding link (if expired)
 */
export async function refreshOnboardingLink(accountId: string): Promise<{ onboardingUrl: string }> {
  return api.post('/stripe-connect/refresh-link', { accountId });
}

/**
 * Get Stripe Connect account status
 */
export async function getStripeAccountStatus(accountId: string): Promise<StripeAccountStatus> {
  return api.get(`/stripe-connect/account/${accountId}`);
}

/**
 * Sync account status from Stripe
 */
export async function syncStripeAccount(accountId: string): Promise<void> {
  await api.post(`/stripe-connect/account/${accountId}/sync`);
}

/**
 * Get Stripe Dashboard login link
 */
export async function getStripeDashboardLink(accountId: string): Promise<DashboardLink> {
  return api.post('/stripe-connect/dashboard-link', { accountId });
}

/**
 * Delete Stripe Connect account
 */
export async function deleteStripeAccount(accountId: string): Promise<void> {
  await api.delete(`/stripe-connect/account/${accountId}`);
}

// Export as default object
export const stripeConnectAPI = {
  createAccount: createStripeAccount,
  refreshLink: refreshOnboardingLink,
  getStatus: getStripeAccountStatus,
  syncAccount: syncStripeAccount,
  getDashboardLink: getStripeDashboardLink,
  deleteAccount: deleteStripeAccount,
};
