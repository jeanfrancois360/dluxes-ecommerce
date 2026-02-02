/**
 * Credits API
 *
 * API methods for managing seller credits, packages, and transactions
 */

import { api } from './client';

export interface CreditBalance {
  id: string;
  userId: string;
  availableCredits: number;
  lifetimeCredits: number;
  lifetimeUsed: number;
  expiringCredits: number;
  expirationDate: string | null;
  purchasedCredits: number;
}

export interface CreditTransaction {
  id: string;
  type: 'ALLOCATION' | 'PURCHASE' | 'DEBIT' | 'REFUND' | 'BONUS' | 'EXPIRATION' | 'ADJUSTMENT';
  action: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  currency: string;
  savingsPercent: number;
  savingsLabel: string | null;
  isPopular: boolean;
}

export interface CreditCostResponse {
  action: string;
  cost: number;
}

export interface CheckCreditsResponse {
  hasCredits: boolean;
  required: number;
  available: number;
}

export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
  page: number;
  pages: number;
}

export interface CreditHistoryParams {
  page?: number;
  limit?: number;
  type?: string;
}

export interface PurchaseResponse {
  sessionId: string;
  sessionUrl: string;
}

export const creditsApi = {
  /**
   * Get all available credit packages
   */
  async getPackages(): Promise<CreditPackage[]> {
    return api.get('/credits/packages');
  },

  /**
   * Get current seller's credit balance
   */
  async getBalance(): Promise<CreditBalance> {
    return api.get('/credits/balance');
  },

  /**
   * Get credit cost for a specific action
   */
  async getCost(action: string): Promise<CreditCostResponse> {
    return api.get(`/credits/cost/${action}`);
  },

  /**
   * Check if seller has enough credits for a specific action
   */
  async checkCredits(action: string): Promise<CheckCreditsResponse> {
    return api.get(`/credits/check/${action}`);
  },

  /**
   * Get credit transaction history
   */
  async getHistory(params?: CreditHistoryParams): Promise<CreditHistoryResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    return api.get(`/credits/history?${query.toString()}`);
  },

  /**
   * Purchase a credit package (returns Stripe Checkout URL)
   */
  async purchase(packageId: string): Promise<PurchaseResponse> {
    return api.post(`/credits/purchase/${packageId}`, {});
  },
};

export default creditsApi;
