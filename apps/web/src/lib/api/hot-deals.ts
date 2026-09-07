import api from './client';

// ─── Dynamic Category Config (from DB) ─────────────────────────────────────

export interface HotDealCategoryConfig {
  id: string;
  slug: string;
  label: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color key
  displayOrder: number;
  isActive: boolean;
  _count?: { hotDeals: number };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HotDeal {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryConfig?: HotDealCategoryConfig;
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
  budget?: number | null;
  budgetType?: BudgetType | null;
  images?: string[];
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

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'BOTH';
export type HotDealStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'FULFILLED' | 'CANCELLED';
export type BudgetType = 'HOURLY' | 'FIXED' | 'NEGOTIABLE';

export interface CreateHotDealData {
  title: string;
  description: string;
  category: string;
  urgency?: UrgencyLevel;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact?: ContactMethod;
  city: string;
  state?: string;
  zipCode?: string;
  images?: string[];
  budget?: number;
  budgetType?: BudgetType;
}

export interface HotDealFilters {
  category?: string;
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
  category: string;
  count: number;
}

// ─── Urgency config (static — only 3 levels) ───────────────────────────────

export const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; color: string; bgColor: string }
> = {
  NORMAL: { label: 'Normal', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  URGENT: { label: 'Urgent', color: 'text-gold', bgColor: 'bg-gold/20' },
  EMERGENCY: { label: 'Emergency', color: 'text-red-700', bgColor: 'bg-red-100' },
};

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

// ─── Color map: DB color key → Tailwind classes ────────────────────────────

export const COLOR_MAP: Record<string, { text: string; bg: string; ring: string }> = {
  pink: { text: 'text-pink-600', bg: 'bg-pink-50', ring: 'ring-pink-200' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  slate: { text: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-200' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  orange: { text: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  violet: { text: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  red: { text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50', ring: 'ring-cyan-200' },
  gray: { text: 'text-gray-600', bg: 'bg-gray-50', ring: 'ring-gray-200' },
  green: { text: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' },
  yellow: { text: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-50', ring: 'ring-teal-200' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200' },
};

export function getCategoryColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.gray;
}

// ─── API functions ──────────────────────────────────────────────────────────

export const hotDealsApi = {
  async create(data: CreateHotDealData): Promise<HotDeal> {
    return api.post('/hot-deals', data);
  },

  async getAll(filters?: HotDealFilters): Promise<HotDealsResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return api.get(`/hot-deals${queryString ? `?${queryString}` : ''}`);
  },

  async getCategoryStats(): Promise<CategoryStats[]> {
    return api.get('/hot-deals/categories/stats');
  },

  async getOne(id: string): Promise<HotDeal> {
    return api.get(`/hot-deals/${id}`);
  },

  async getMyDeals(): Promise<HotDeal[]> {
    return api.get('/hot-deals/my-deals');
  },

  async respond(
    dealId: string,
    data: { message: string; contactInfo?: string }
  ): Promise<HotDealResponse> {
    return api.post(`/hot-deals/${dealId}/respond`, data);
  },

  async confirmPayment(dealId: string, paymentIntentId: string): Promise<HotDeal> {
    return api.post(`/hot-deals/${dealId}/confirm-payment`, { paymentIntentId });
  },

  async markFulfilled(dealId: string): Promise<HotDeal> {
    return api.patch(`/hot-deals/${dealId}/fulfill`);
  },

  async cancel(dealId: string): Promise<HotDeal> {
    return api.patch(`/hot-deals/${dealId}/cancel`);
  },

  // ─── Category management (admin) ───────────────────────────────────────

  async getCategories(): Promise<HotDealCategoryConfig[]> {
    return api.get('/hot-deals/categories');
  },

  async getAdminCategories(): Promise<HotDealCategoryConfig[]> {
    return api.get('/hot-deals/categories/admin');
  },

  async createCategory(data: {
    slug: string;
    label: string;
    icon?: string;
    color?: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<HotDealCategoryConfig> {
    return api.post('/hot-deals/categories', data);
  },

  async updateCategory(
    slug: string,
    data: Partial<{
      label: string;
      icon: string;
      color: string;
      displayOrder: number;
      isActive: boolean;
    }>
  ): Promise<HotDealCategoryConfig> {
    return api.patch(`/hot-deals/categories/${slug}`, data);
  },

  async deleteCategory(slug: string): Promise<void> {
    return api.delete(`/hot-deals/categories/${slug}`);
  },

  async reorderCategories(slugs: string[]): Promise<HotDealCategoryConfig[]> {
    return api.post('/hot-deals/categories/reorder', { slugs });
  },
};

export default hotDealsApi;
