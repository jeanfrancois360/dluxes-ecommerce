/**
 * Subscription API
 *
 * API methods for managing seller subscriptions and subscription plans
 */

import { api } from './client';

export interface SubscriptionPlan {
  id: string;
  tier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxActiveListings: number;
  monthlyCredits: number;
  listingDurationDays: number;
  featuredSlotsPerMonth: number;
  allowedProductTypes: string[];
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    subscriptions: number;
  };
}

export interface SellerSubscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  creditsAllocated: number;
  creditsUsed: number;
  creditsRemaining?: number;
  activeListingsCount: number;
  featuredSlotsUsed: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface SubscriptionInfo {
  subscription: SellerSubscription;
  plan: SubscriptionPlan;
  tier: string;
  isActive: boolean;
}

export interface CanListProductTypeResponse {
  canList: boolean;
  reasons: {
    productTypeAllowed: boolean;
    meetsTierRequirement: boolean;
    hasListingCapacity: boolean;
    hasMonthlyCredits: boolean;
  };
}

export interface SubscriptionStatistics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  expiredSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export interface CreatePlanData {
  tier: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxActiveListings?: number;
  monthlyCredits?: number;
  featuredSlotsPerMonth?: number;
  listingDurationDays?: number;
  features?: string[];
  allowedProductTypes?: string[];
  isActive?: boolean;
  isPopular?: boolean;
  displayOrder?: number;
}

export const subscriptionApi = {
  /**
   * Get all available subscription plans (Public)
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return api.get('/subscription/plans');
  },

  /**
   * Get current seller's subscription information
   */
  async getMySubscription(): Promise<SubscriptionInfo> {
    return api.get('/subscription/my-subscription');
  },

  /**
   * Check if seller can list a specific product type
   */
  async canListProductType(productType: string): Promise<CanListProductTypeResponse> {
    return api.get(`/subscription/can-list/${productType}`);
  },

  // ========================================================================
  // Stripe Subscription Endpoints
  // ========================================================================

  /**
   * Create Stripe checkout session for subscription purchase
   */
  async createCheckout(planId: string, billingCycle: 'MONTHLY' | 'YEARLY'): Promise<{ sessionId: string; url: string }> {
    const response = await api.post('/subscription/create-checkout', { planId, billingCycle });
    return response.data || response;
  },

  /**
   * Verify checkout session and activate subscription (fallback for delayed webhooks)
   */
  async verifyCheckout(sessionId: string): Promise<{ activated: boolean; subscription: any }> {
    // The API client already unwraps { success, data } - no need to do it again
    return api.post('/subscription/verify-checkout', { sessionId });
  },

  /**
   * Create Stripe billing portal session
   */
  async createPortalSession(): Promise<{ url: string }> {
    const response = await api.post('/subscription/create-portal');
    return response.data || response;
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<{ message: string }> {
    const response = await api.post('/subscription/cancel');
    return response.data || response;
  },

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(): Promise<{ message: string }> {
    const response = await api.post('/subscription/resume');
    return response.data || response;
  },

  // ========================================================================
  // Admin Endpoints
  // ========================================================================

  /**
   * Get all subscription plans with stats (Admin)
   */
  async adminGetPlans(params?: { isActive?: boolean }): Promise<SubscriptionPlan[]> {
    const query = params?.isActive !== undefined ? `?isActive=${params.isActive}` : '';
    const response = await api.get(`/subscription/admin/plans${query}`);
    return response.data || response;
  },

  /**
   * Get plan by ID (Admin)
   */
  async adminGetPlan(id: string): Promise<SubscriptionPlan> {
    const response = await api.get(`/subscription/admin/plans/${id}`);
    return response.data || response;
  },

  /**
   * Create subscription plan (Admin)
   */
  async adminCreatePlan(data: CreatePlanData): Promise<SubscriptionPlan> {
    const response = await api.post('/subscription/admin/plans', data);
    return response.data || response;
  },

  /**
   * Update subscription plan (Admin)
   */
  async adminUpdatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await api.patch(`/subscription/admin/plans/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete subscription plan (Admin)
   */
  async adminDeletePlan(id: string): Promise<void> {
    await api.delete(`/subscription/admin/plans/${id}`);
  },

  /**
   * Toggle plan active status (Admin)
   */
  async adminTogglePlanStatus(tier: string): Promise<SubscriptionPlan> {
    const response = await api.patch(`/subscription/admin/plans/toggle/${tier}`);
    return response.data || response;
  },

  /**
   * Toggle plan active status by ID (Admin)
   */
  async adminTogglePlanStatusById(id: string): Promise<SubscriptionPlan> {
    const response = await api.patch(`/subscription/admin/plans/${id}/toggle`);
    return response.data || response;
  },

  /**
   * Duplicate subscription plan (Admin)
   */
  async adminDuplicatePlan(id: string): Promise<SubscriptionPlan> {
    const response = await api.post(`/subscription/admin/plans/${id}/duplicate`);
    return response.data || response;
  },

  /**
   * Get all seller subscriptions with filtering (Admin)
   */
  async adminGetSellerSubscriptions(params?: {
    status?: string;
    tier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: SellerSubscription[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.tier) query.append('tier', params.tier);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await api.get(`/subscription/admin/seller-subscriptions?${query}`);
    return response.data || response;
  },

  /**
   * Get subscription statistics (Admin)
   */
  async adminGetStatistics(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    expiredSubscriptions: number;
    subscriptionsByStatus: Record<string, number>;
    monthlyRevenue: number;
    yearlyRevenue: number;
    totalRevenue: number;
    planBreakdown: Array<{ tier: string; name: string; subscriberCount: number }>;
  }> {
    const response = await api.get('/subscription/admin/stats');
    return response.data || response;
  },

  /**
   * Cancel subscription (Admin)
   */
  async adminCancelSubscription(id: string): Promise<SellerSubscription> {
    const response = await api.post(`/subscription/admin/seller-subscriptions/${id}/cancel`);
    return response.data || response;
  },

  /**
   * Reactivate subscription (Admin)
   */
  async adminReactivateSubscription(id: string): Promise<SellerSubscription> {
    const response = await api.post(`/subscription/admin/seller-subscriptions/${id}/reactivate`);
    return response.data || response;
  },

  /**
   * Sync Stripe prices with subscription plans (Admin)
   */
  async adminSyncStripePrices(): Promise<{ synced: number; errors: string[] }> {
    const response = await api.post('/subscription/admin/sync-stripe');
    return response.data || response;
  },
};

export default subscriptionApi;
