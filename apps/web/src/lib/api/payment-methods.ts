/**
 * Payment Methods API Client
 *
 * API methods for managing saved payment methods (cards)
 */

import { api } from './client';

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  funding?: string;
  country?: string;
}

export interface PaymentMethodsResponse {
  success: boolean;
  data: {
    paymentMethods: SavedPaymentMethod[];
    defaultPaymentMethodId: string | null;
  };
  message?: string;
}

export interface SetupIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
    setupIntentId: string;
    publishableKey: string;
  };
  message?: string;
}

export interface ActionResponse {
  success: boolean;
  data?: {
    success: boolean;
    message: string;
  };
  message?: string;
}

// Card brand display names and icons
export const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

// Card brand colors for UI
export const CARD_BRAND_COLORS: Record<string, string> = {
  visa: 'bg-blue-600',
  mastercard: 'bg-red-500',
  amex: 'bg-blue-400',
  discover: 'bg-orange-500',
  diners: 'bg-blue-700',
  jcb: 'bg-green-600',
  unionpay: 'bg-red-600',
  unknown: 'bg-gray-500',
};

export const paymentMethodsApi = {
  /**
   * Get all saved payment methods for current user
   */
  getPaymentMethods: () => api.get<PaymentMethodsResponse>('/payment/methods'),

  /**
   * Create a SetupIntent for adding a new card
   */
  createSetupIntent: () => api.post<SetupIntentResponse>('/payment/methods/setup', {}),

  /**
   * Set a payment method as default
   */
  setDefault: (paymentMethodId: string) =>
    api.patch<ActionResponse>(`/payment/methods/${paymentMethodId}/default`, {}),

  /**
   * Remove a saved payment method
   */
  remove: (paymentMethodId: string) =>
    api.delete<ActionResponse>(`/payment/methods/${paymentMethodId}`),
};

export default paymentMethodsApi;
