/**
 * Seller Pickup API Client
 * Self-Pickup Feature (v2.10.0)
 */

import { api } from './client';

export interface SellerPickupSettings {
  pickupEnabled: boolean;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  pickupHours?: Record<string, string> | null;
  pickupRadius?: number | null;
  pickupFee?: number | null;
  pickupEstimatedMinutes?: number | null;
  // Store info for fallback
  storeName: string;
  storeAddress?: string | null;
  storeCity?: string | null;
  storeState?: string | null;
  storeZipCode?: string | null;
}

export interface UpdatePickupSettingsDto {
  pickupEnabled: boolean;
  pickupAddress?: string;
  pickupInstructions?: string;
  pickupHours?: Record<string, string>;
  pickupRadius?: number;
  pickupFee?: number;
  pickupEstimatedMinutes?: number;
}

export const sellerPickupAPI = {
  /**
   * Get seller's pickup settings
   */
  async getSettings(): Promise<SellerPickupSettings> {
    return api.get<SellerPickupSettings>('/seller/pickup-settings');
  },

  /**
   * Update seller's pickup settings
   */
  async updateSettings(data: UpdatePickupSettingsDto): Promise<SellerPickupSettings> {
    return api.patch<SellerPickupSettings>('/seller/pickup-settings', data);
  },
};
