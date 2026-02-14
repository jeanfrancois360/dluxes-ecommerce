/**
 * Seller Payout Settings API
 * Client-side API for managing seller payout configuration
 */

import { api } from './client';

export interface SellerPayoutSettings {
  id: string | null;
  sellerId: string;
  storeId: string | null;
  paymentMethod: string;

  // Bank Transfer
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string; // Masked
  routingNumber?: string;
  iban?: string; // Masked
  swiftCode?: string;
  bankAddress?: string;
  bankCountry?: string;

  // Stripe Connect
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  stripeOnboardedAt?: string;

  // PayPal
  paypalEmail?: string;
  paypalVerified?: boolean;

  // Wise
  wiseEmail?: string;
  wiseRecipientId?: string;

  // Tax & Compliance
  taxId?: string;
  taxCountry?: string;
  taxFormType?: string;
  taxFormUrl?: string;

  // Preferences
  payoutCurrency: string;

  // Verification
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionNotes?: string;

  // Relations
  seller?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  store?: {
    id: string;
    name: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

export interface UpdatePayoutSettingsDto {
  paymentMethod: string;

  // Bank Transfer
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
  bankAddress?: string;
  bankCountry?: string;

  // Stripe Connect
  stripeAccountId?: string;

  // PayPal
  paypalEmail?: string;

  // Wise
  wiseEmail?: string;
  wiseRecipientId?: string;

  // Tax & Compliance
  taxId?: string;
  taxCountry?: string;
  taxFormType?: string;
  taxFormUrl?: string;

  // Preferences
  payoutCurrency?: string;
}

export interface CanReceivePayoutsResponse {
  canReceive: boolean;
  reason?: string;
}

/**
 * Get current seller's payout settings
 */
export async function getPayoutSettings(): Promise<SellerPayoutSettings> {
  const response = await api.get('/seller/payout-settings');
  return response.data;
}

/**
 * Create or update seller's payout settings
 */
export async function updatePayoutSettings(
  data: UpdatePayoutSettingsDto
): Promise<SellerPayoutSettings> {
  const response = await api.post('/seller/payout-settings', data);
  return response.data;
}

/**
 * Check if seller can receive payouts
 */
export async function canReceivePayouts(): Promise<CanReceivePayoutsResponse> {
  const response = await api.get('/seller/payout-settings/can-receive');
  return response.data;
}

/**
 * Delete seller's payout settings
 */
export async function deletePayoutSettings(): Promise<void> {
  await api.delete('/seller/payout-settings');
}

// Export as default object for convenience
export const sellerPayoutAPI = {
  getSettings: getPayoutSettings,
  updateSettings: updatePayoutSettings,
  canReceive: canReceivePayouts,
  deleteSettings: deletePayoutSettings,
};
