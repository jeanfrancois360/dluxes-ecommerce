/**
 * Seller Gelato Settings API
 * Client-side API for managing seller Gelato Print-on-Demand integration
 *
 * v2.9.0 - Per-seller Gelato integration
 */

import { api } from './client';

export interface SellerGelatoSettings {
  id: string | null;
  sellerId: string;
  storeId: string;

  // Gelato API Credentials (masked when returned)
  gelatoApiKey: string | null; // Format: "dc0d0b41-••••••••-e7947ae3baf7"
  gelatoStoreId: string | null;
  gelatoWebhookSecret: string | null; // Shown as "••••••••"

  // Connection Status
  isEnabled: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  lastTestAt: string | null;

  // Account Info (fetched from Gelato API)
  gelatoAccountName: string | null;
  gelatoAccountEmail: string | null;

  // Webhook Configuration
  webhookUrl: string | null; // Generated seller-specific webhook URL
  webhookId: string | null;

  // Metadata
  connectionError: string | null;
  notes: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateGelatoSettingsDto {
  gelatoApiKey?: string;
  gelatoStoreId?: string;
  gelatoWebhookSecret?: string;
  isEnabled?: boolean;
  notes?: string;
}

export interface TestGelatoConnectionDto {
  apiKey: string;
  storeId: string;
}

export interface TestConnectionResponse {
  success: boolean;
  error?: string;
  accountName?: string;
  accountEmail?: string;
}

export interface WebhookUrlResponse {
  webhookUrl: string;
  instructions: string[];
}

/**
 * Get current seller's Gelato settings
 */
export async function getGelatoSettings(): Promise<SellerGelatoSettings> {
  const response = await api.get('/seller/gelato');
  return response.data?.data || response.data || response;
}

/**
 * Create or update seller's Gelato settings
 * Tests connection before saving
 */
export async function updateGelatoSettings(
  data: UpdateGelatoSettingsDto
): Promise<SellerGelatoSettings> {
  const response = await api.post('/seller/gelato', data);
  return response.data?.data || response.data || response;
}

/**
 * Test Gelato API connection without saving credentials
 */
export async function testGelatoConnection(
  credentials: TestGelatoConnectionDto
): Promise<TestConnectionResponse> {
  const response = await api.post('/seller/gelato/test', credentials);
  return response.data?.data || response.data || response;
}

/**
 * Enable or disable Gelato integration
 */
export async function toggleGelatoEnabled(enabled: boolean): Promise<SellerGelatoSettings> {
  const response = await api.patch('/seller/gelato/toggle', { enabled });
  return response.data?.data || response.data || response;
}

/**
 * Delete seller's Gelato settings
 */
export async function deleteGelatoSettings(): Promise<void> {
  await api.delete('/seller/gelato');
}

/**
 * Get seller-specific webhook URL for Gelato dashboard configuration
 */
export async function getGelatoWebhookUrl(): Promise<WebhookUrlResponse> {
  const response = await api.get('/seller/gelato/webhook-url');
  return response.data?.data || response.data || response;
}

// Export as default object for convenience
export const sellerGelatoAPI = {
  getSettings: getGelatoSettings,
  updateSettings: updateGelatoSettings,
  testConnection: testGelatoConnection,
  toggleEnabled: toggleGelatoEnabled,
  deleteSettings: deleteGelatoSettings,
  getWebhookUrl: getGelatoWebhookUrl,
};
