import api from './client';

// Types
export interface HotDeal {
  id: string;
  title: string;
  description: string;
  category: HotDealCategory;
  urgency: UrgencyLevel;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact: ContactMethod;
  city: string;
  state?: string;
  zipCode?: string;
  status: HotDealStatus;
  paymentStatus: string;
  expiresAt: string;
  publishedAt?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  responses?: HotDealResponse[];
  _count?: {
    responses: number;
  };
}

export interface HotDealResponse {
  id: string;
  message: string;
  contactInfo?: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export type HotDealCategory =
  | 'CHILDCARE'
  | 'HOME_SERVICES'
  | 'AUTOMOTIVE'
  | 'PET_SERVICES'
  | 'MOVING_DELIVERY'
  | 'TECH_SUPPORT'
  | 'TUTORING'
  | 'HEALTH_WELLNESS'
  | 'CLEANING'
  | 'OTHER';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'BOTH';
export type HotDealStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'FULFILLED' | 'CANCELLED';

export interface CreateHotDealData {
  title: string;
  description: string;
  category: HotDealCategory;
  urgency?: UrgencyLevel;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact?: ContactMethod;
  city: string;
  state?: string;
  zipCode?: string;
}

export interface HotDealFilters {
  category?: HotDealCategory;
  city?: string;
  page?: number;
  limit?: number;
}

export interface HotDealsResponse {
  deals: HotDeal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryStats {
  category: HotDealCategory;
  count: number;
}

// Category display names
export const CATEGORY_LABELS: Record<HotDealCategory, string> = {
  CHILDCARE: 'Childcare & Babysitting',
  HOME_SERVICES: 'Home Services',
  AUTOMOTIVE: 'Automotive',
  PET_SERVICES: 'Pet Services',
  MOVING_DELIVERY: 'Moving & Delivery',
  TECH_SUPPORT: 'Tech Support',
  TUTORING: 'Tutoring',
  HEALTH_WELLNESS: 'Health & Wellness',
  CLEANING: 'Cleaning',
  OTHER: 'Other',
};

// Urgency display names and colors
export const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; color: string; bgColor: string }
> = {
  NORMAL: { label: 'Normal', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  URGENT: { label: 'Urgent', color: 'text-gold', bgColor: 'bg-gold/20' },
  EMERGENCY: { label: 'Emergency', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Status display names and colors
export const STATUS_CONFIG: Record<
  HotDealStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  ACTIVE: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100' },
  EXPIRED: { label: 'Expired', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  FULFILLED: { label: 'Fulfilled', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// API functions
export const hotDealsApi = {
  /**
   * Create a new hot deal (requires payment)
   */
  async create(data: CreateHotDealData): Promise<HotDeal> {
    return api.post('/hot-deals', data);
  },

  /**
   * Get all active hot deals with optional filters
   */
  async getAll(filters?: HotDealFilters): Promise<HotDealsResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return api.get(`/hot-deals${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get category statistics for filters
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    return api.get('/hot-deals/categories/stats');
  },

  /**
   * Get a single hot deal by ID
   */
  async getOne(id: string): Promise<HotDeal> {
    return api.get(`/hot-deals/${id}`);
  },

  /**
   * Get user's own hot deals
   */
  async getMyDeals(): Promise<HotDeal[]> {
    return api.get('/hot-deals/my-deals');
  },

  /**
   * Respond to a hot deal
   */
  async respond(
    dealId: string,
    data: { message: string; contactInfo?: string }
  ): Promise<HotDealResponse> {
    return api.post(`/hot-deals/${dealId}/respond`, data);
  },

  /**
   * Confirm payment and activate the hot deal
   */
  async confirmPayment(dealId: string, paymentIntentId: string): Promise<HotDeal> {
    return api.post(`/hot-deals/${dealId}/confirm-payment`, { paymentIntentId });
  },

  /**
   * Mark a hot deal as fulfilled
   */
  async markFulfilled(dealId: string): Promise<HotDeal> {
    return api.patch(`/hot-deals/${dealId}/fulfill`);
  },

  /**
   * Cancel a hot deal
   */
  async cancel(dealId: string): Promise<HotDeal> {
    return api.patch(`/hot-deals/${dealId}/cancel`);
  },
};

export default hotDealsApi;
