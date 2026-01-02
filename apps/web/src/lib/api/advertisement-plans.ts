import { api } from './client';

// Types
export interface AdvertisementPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  maxActiveAds: number;  // -1 for unlimited
  maxImpressions?: number;  // null for unlimited
  priorityBoost: number;
  allowedPlacements: string[];
  price: number;
  currency: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  trialDays: number;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdPlanSubscription {
  id: string;
  sellerId: string;
  planId: string;
  plan: AdvertisementPlan;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  adsCreated: number;
  impressionsUsed: number;
  autoRenew: boolean;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribeToPlanDto {
  planSlug: string;
  billingPeriod?: 'MONTHLY' | 'YEARLY';
}

// API Methods
export const advertisementPlansApi = {
  // Public
  async getAll(): Promise<AdvertisementPlan[]> {
    const response = await api.get('/advertisement-plans');
    return response.data || response;
  },

  async getBySlug(slug: string): Promise<AdvertisementPlan> {
    const response = await api.get(`/advertisement-plans/${slug}`);
    return response.data || response;
  },

  // Seller
  async subscribe(data: SubscribeToPlanDto): Promise<AdPlanSubscription> {
    const response = await api.post('/advertisement-plans/subscribe', data);
    return response.data || response;
  },

  async getMySubscription(): Promise<AdPlanSubscription | null> {
    try {
      const response = await api.get('/advertisement-plans/seller/subscription');
      return response.data || response;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },

  async getSubscriptionHistory(): Promise<AdPlanSubscription[]> {
    const response = await api.get('/advertisement-plans/seller/subscriptions/history');
    return response.data || response;
  },

  async cancelSubscription(subscriptionId: string): Promise<AdPlanSubscription> {
    const response = await api.post(`/advertisement-plans/subscriptions/${subscriptionId}/cancel`);
    return response.data || response;
  },

  // Admin
  async adminGetAll(): Promise<AdvertisementPlan[]> {
    const response = await api.get('/advertisement-plans/admin/plans');
    return response.data || response;
  },

  async adminCreate(data: Partial<AdvertisementPlan>): Promise<AdvertisementPlan> {
    const response = await api.post('/advertisement-plans/admin/plans', data);
    return response.data || response;
  },

  async adminUpdate(slug: string, data: Partial<AdvertisementPlan>): Promise<AdvertisementPlan> {
    const response = await api.put(`/advertisement-plans/admin/plans/${slug}`, data);
    return response.data || response;
  },

  async adminDelete(slug: string): Promise<void> {
    await api.delete(`/advertisement-plans/admin/plans/${slug}`);
  },

  async adminGetSubscriptions(): Promise<AdPlanSubscription[]> {
    const response = await api.get('/advertisement-plans/admin/subscriptions');
    return response.data || response;
  },

  async adminGetStatistics(): Promise<{
    totalPlans: number;
    activeSubscriptions: number;
    totalRevenue: number;
    impressionsServed: number;
  }> {
    const response = await api.get('/advertisement-plans/admin/statistics');
    return response.data || response;
  },
};
