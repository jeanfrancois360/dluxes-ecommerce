import { api } from './client';

// Types
export interface Advertisement {
  id: string;
  advertiserId: string;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  linkUrl: string;
  linkText?: string;
  placement: AdPlacement;
  categoryId?: string;
  targetAudience?: Record<string, any>;
  startDate: string;
  endDate: string;
  pricingModel: AdPricingModel;
  budget?: number;
  dailyBudget?: number;
  bidAmount?: number;
  status: AdStatus;
  paymentStatus: AdPaymentStatus;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type AdPlacement =
  | 'HOMEPAGE_HERO'
  | 'HOMEPAGE_FEATURED'
  | 'HOMEPAGE_SIDEBAR'
  | 'PRODUCTS_BANNER'
  | 'PRODUCTS_INLINE'
  | 'PRODUCTS_SIDEBAR'
  | 'CATEGORY_BANNER'
  | 'PRODUCT_DETAIL_SIDEBAR'
  | 'CHECKOUT_UPSELL'
  | 'SEARCH_RESULTS';

export type AdPricingModel = 'CPM' | 'CPC' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'FIXED';
export type AdStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';
export type AdPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CreateAdvertisementDto {
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  linkUrl: string;
  linkText?: string;
  placement: AdPlacement;
  categoryId?: string;
  targetAudience?: Record<string, any>;
  startDate: string;
  endDate: string;
  pricingModel?: AdPricingModel;
  budget?: number;
  dailyBudget?: number;
}

export interface UpdateAdvertisementDto extends Partial<CreateAdvertisementDto> {
  status?: AdStatus;
}

export interface AdAnalytics {
  id: string;
  advertisementId: string;
  eventType: 'IMPRESSION' | 'VIEWABLE' | 'CLICK' | 'CONVERSION';
  userId?: string;
  sessionId?: string;
  page?: string;
  position?: number;
  createdAt: string;
}

export interface AdAnalyticsSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;  // Click-through rate
  conversionRate: number;
}

// API Methods
export const advertisementsApi = {
  // Public
  async getAll(): Promise<Advertisement[]> {
    const response = await api.get('/advertisements');
    return response.data || response;
  },

  async getActive(placement?: AdPlacement): Promise<Advertisement[]> {
    const params = placement ? `?placement=${placement}` : '';
    const response = await api.get(`/advertisements/active${params}`);
    return response.data || response;
  },

  async getById(id: string): Promise<Advertisement> {
    const response = await api.get(`/advertisements/${id}`);
    return response.data || response;
  },

  // Seller
  async getMyAds(): Promise<Advertisement[]> {
    const response = await api.get('/advertisements/my');
    return response.data || response;
  },

  async create(data: CreateAdvertisementDto): Promise<Advertisement> {
    const response = await api.post('/advertisements', data);
    return response.data || response;
  },

  async update(id: string, data: UpdateAdvertisementDto): Promise<Advertisement> {
    const response = await api.put(`/advertisements/${id}`, data);
    return response.data || response;
  },

  async toggle(id: string): Promise<Advertisement> {
    const response = await api.patch(`/advertisements/${id}/toggle`);
    return response.data || response;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/advertisements/${id}`);
  },

  async getAnalytics(id: string): Promise<AdAnalyticsSummary> {
    const response = await api.get(`/advertisements/${id}/analytics`);
    return response.data || response;
  },

  // Analytics tracking
  async trackEvent(id: string, eventType: 'IMPRESSION' | 'CLICK' | 'CONVERSION', data?: Record<string, any>): Promise<void> {
    await api.post(`/advertisements/${id}/event`, { eventType, ...data });
  },

  // Admin
  async getPending(): Promise<Advertisement[]> {
    const response = await api.get('/advertisements/pending');
    return response.data || response;
  },

  async approve(id: string): Promise<Advertisement> {
    const response = await api.patch(`/advertisements/${id}/approve`);
    return response.data || response;
  },

  async reject(id: string, reason?: string): Promise<Advertisement> {
    const response = await api.patch(`/advertisements/${id}/approve`, { approved: false, reason });
    return response.data || response;
  },
};
