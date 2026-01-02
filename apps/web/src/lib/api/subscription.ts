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
}

export interface SellerSubscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'TRIALING';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  creditsAllocated: number;
  creditsUsed: number;
  creditsRemaining: number;
  activeListingsCount: number;
  featuredSlotsUsed: number;
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
    hasCredits: boolean;
  };
}

export const subscriptionApi = {
  /**
   * Get all available subscription plans
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
};

export default subscriptionApi;
