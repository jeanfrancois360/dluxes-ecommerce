import { api } from './client';

/**
 * Affiliate API Client (Phase C.5)
 * Types derived from schema.prisma (Phase C.2) and DTOs (Phase C.3/C.4).
 * Covers all 19 AffiliateController endpoints + C.4 Awin sync endpoint.
 */

// ---------------------------------------------------------------------------
// Enum literal types — must match schema.prisma exactly
// ---------------------------------------------------------------------------

export type AffiliateAdvertiserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED';
export type AffiliateCommissionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'PAID';
export type TranslationStatus = 'ORIGINAL' | 'MACHINE_TRANSLATED' | 'HUMAN_REVIEWED' | 'PUBLISHED';
export type AffiliateFulfillmentSource = 'MANUAL' | 'FEED';

// ---------------------------------------------------------------------------
// Model interfaces — field names match schema.prisma
// ---------------------------------------------------------------------------

export interface AffiliateAdvertiser {
  id: string;
  awinMerchantId: string;
  name: string;
  websiteUrl?: string;
  logoUrl?: string;
  approvalStatus: AffiliateAdvertiserStatus;
  defaultCommissionRate?: number;
  notes?: string;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateProduct {
  id: string;
  slug: string;
  advertiserId: string;
  advertiser?: AffiliateAdvertiser;
  awinDeepLink: string;
  imageUrl: string;
  galleryUrls: string[];
  displayPrice?: number;
  displayCurrency?: string;
  originalPrice?: number;
  productCategoryIds: string[];
  tags: string[];
  brandName?: string;
  inStock?: boolean;
  fulfillmentSource?: AffiliateFulfillmentSource;
  merchantProductId?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  clickCount: number;
  conversionCount: number;
  createdById?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  // API-enriched: service populates from default-locale translation
  title?: string;
  translations?: AffiliateProductTranslation[];
}

export interface AffiliateProductTranslation {
  id: string;
  affiliateProductId: string;
  locale: string;
  title: string;
  description: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  translationStatus: TranslationStatus;
  isOriginal: boolean;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateCommission {
  id: string;
  affiliateProductId?: string;
  advertiserId?: string;
  advertiser?: AffiliateAdvertiser;
  awinTransactionId: string;
  awinClickRef?: string;
  saleAmount: number;
  commissionAmount: number;
  currency: string;
  status: AffiliateCommissionStatus;
  transactionDate: string;
  validationDate?: string;
  paymentDate?: string;
  rawPayload: Record<string, unknown>;
  syncedAt: string;
}

export interface AffiliateClickLog {
  id: string;
  affiliateProductId: string;
  advertiserId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  locale?: string;
  createdAt: string;
  // API-enriched
  affiliateProduct?: Pick<AffiliateProduct, 'id' | 'slug'>;
}

export interface AwinFeedMeta {
  feedId: string;
  advertiserId: string;
  advertiserName: string;
  downloadUrl: string;
  productCount: number;
  language: string;
}

export interface FeedSyncResult {
  advertiserId: string;
  awinMerchantId: string;
  feedId: string | null;
  productsUpserted: number;
  productsSkipped: number;
  errors: number;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  errorDetail?: string;
}

export interface AllFeedsSyncSummary {
  advertisersWithFeed: number;
  advertisersWithoutFeed: number;
  totalUpserted: number;
  totalSkipped: number;
  totalErrors: number;
  results: FeedSyncResult[];
}

export interface AwinFeedSync {
  id: string;
  advertiserId?: string;
  awinMerchantId?: string;
  feedId?: string;
  productsUpserted: number;
  productsSkipped: number;
  errors: number;
  status: string;
  errorDetail?: string;
  startedAt: string;
  completedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AwinSyncResult {
  synced: number;
  skipped: number;
  errors: number;
  startDate: string;
  endDate: string;
}

export interface CommissionStatsBucket {
  count: number;
  commissionAmount: number;
  saleAmount: number;
}

export interface CommissionStats {
  total: CommissionStatsBucket;
  byStatus: {
    PENDING?: CommissionStatsBucket;
    APPROVED?: CommissionStatsBucket;
    DECLINED?: CommissionStatsBucket;
    PAID?: CommissionStatsBucket;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return filtered ? `?${filtered}` : '';
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

const listProducts = async (params?: {
  page?: number;
  limit?: number;
  advertiserId?: string;
  isFeatured?: boolean;
  tag?: string;
  locale?: string;
}) => {
  return api.get<PaginatedResponse<AffiliateProduct>>(
    `/affiliate/products${buildQueryString(params)}`
  );
};

const getProductBySlug = async (slug: string, locale?: string) =>
  api.get<AffiliateProduct>(`/affiliate/products/${slug}${buildQueryString({ locale })}`);

// ---------------------------------------------------------------------------
// Admin — Advertisers
// ---------------------------------------------------------------------------

const createAdvertiser = async (body: {
  awinMerchantId: string;
  name: string;
  websiteUrl?: string;
  logoUrl?: string;
  approvalStatus?: AffiliateAdvertiserStatus;
  defaultCommissionRate?: number;
  notes?: string;
  isActive?: boolean;
}) => {
  const { data } = await api.post<{ data: AffiliateAdvertiser }>(
    '/affiliate/admin/advertisers',
    body
  );
  return data;
};

const listAdvertisers = async (params?: {
  page?: number;
  limit?: number;
  approvalStatus?: AffiliateAdvertiserStatus;
  isActive?: boolean;
}) => {
  return api.get<PaginatedResponse<AffiliateAdvertiser>>(
    `/affiliate/admin/advertisers${buildQueryString(params)}`
  );
};

const getAdvertiser = async (id: string) => {
  const { data } = await api.get<{ data: AffiliateAdvertiser }>(
    `/affiliate/admin/advertisers/${id}`
  );
  return data;
};

const updateAdvertiser = async (
  id: string,
  body: {
    name?: string;
    websiteUrl?: string;
    logoUrl?: string;
    approvalStatus?: AffiliateAdvertiserStatus;
    defaultCommissionRate?: number;
    notes?: string;
    isActive?: boolean;
  }
) => {
  const { data } = await api.patch<{ data: AffiliateAdvertiser }>(
    `/affiliate/admin/advertisers/${id}`,
    body
  );
  return data;
};

const deleteAdvertiser = async (id: string) => {
  await api.delete(`/affiliate/admin/advertisers/${id}`);
};

// ---------------------------------------------------------------------------
// Admin — Products
// ---------------------------------------------------------------------------

const createProduct = async (body: {
  slug: string;
  advertiserId: string;
  awinDeepLink: string;
  imageUrl: string;
  galleryUrls?: string[];
  displayPrice?: number;
  displayCurrency?: string;
  originalPrice?: number;
  productCategoryIds?: string[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
}) => {
  const { data } = await api.post<{ data: AffiliateProduct }>('/affiliate/admin/products', body);
  return data;
};

const adminListProducts = async (params?: {
  page?: number;
  limit?: number;
  advertiserId?: string;
  isFeatured?: boolean;
  tag?: string;
  locale?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  fulfillmentSource?: AffiliateFulfillmentSource;
}) => {
  return api.get<PaginatedResponse<AffiliateProduct>>(
    `/affiliate/admin/products${buildQueryString(params)}`
  );
};

const getProductById = async (id: string) => {
  const { data } = await api.get<{ data: AffiliateProduct }>(`/affiliate/admin/products/${id}`);
  return data;
};

const updateProduct = async (
  id: string,
  body: {
    awinDeepLink?: string;
    imageUrl?: string;
    galleryUrls?: string[];
    displayPrice?: number;
    displayCurrency?: string;
    originalPrice?: number;
    productCategoryIds?: string[];
    tags?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
  }
) => {
  const { data } = await api.patch<{ data: AffiliateProduct }>(
    `/affiliate/admin/products/${id}`,
    body
  );
  return data;
};

const deleteProduct = async (id: string) => {
  await api.delete(`/affiliate/admin/products/${id}`);
};

// ---------------------------------------------------------------------------
// Admin — Translations
// ---------------------------------------------------------------------------

const upsertTranslation = async (
  productId: string,
  body: {
    locale: string;
    title: string;
    description: string;
    longDescription?: string;
    seoTitle?: string;
    seoDescription?: string;
    translationStatus?: TranslationStatus;
    isOriginal?: boolean;
  }
) => {
  const { data } = await api.post<{ data: AffiliateProductTranslation }>(
    `/affiliate/admin/products/${productId}/translations`,
    body
  );
  return data;
};

const updateTranslation = async (
  productId: string,
  locale: string,
  body: {
    title?: string;
    description?: string;
    longDescription?: string;
    seoTitle?: string;
    seoDescription?: string;
    translationStatus?: TranslationStatus;
    isOriginal?: boolean;
  }
) => {
  const { data } = await api.patch<{ data: AffiliateProductTranslation }>(
    `/affiliate/admin/products/${productId}/translations/${locale}`,
    body
  );
  return data;
};

const listTranslations = async (productId: string) => {
  const { data } = await api.get<{ data: AffiliateProductTranslation[] }>(
    `/affiliate/admin/products/${productId}/translations`
  );
  return data;
};

// ---------------------------------------------------------------------------
// Admin — Commissions
// ---------------------------------------------------------------------------

const syncCommission = async (body: {
  awinTransactionId: string;
  affiliateProductId?: string;
  advertiserId?: string;
  awinClickRef?: string;
  saleAmount: number;
  commissionAmount: number;
  currency: string;
  status: AffiliateCommissionStatus;
  transactionDate: string;
  validationDate?: string;
  paymentDate?: string;
  rawPayload: Record<string, unknown>;
}) => {
  const { data } = await api.post<{ data: AffiliateCommission }>(
    '/affiliate/admin/commissions/sync',
    body
  );
  return data;
};

const batchSyncCommissions = async (commissions: Parameters<typeof syncCommission>[0][]) => {
  const { data } = await api.post<{ data: { synced: number; errors: number } }>(
    '/affiliate/admin/commissions/sync/batch',
    { commissions }
  );
  return data;
};

const listCommissions = async (params?: {
  page?: number;
  limit?: number;
  advertiserId?: string;
  affiliateProductId?: string;
  status?: AffiliateCommissionStatus;
  startDate?: string;
  endDate?: string;
}) => {
  return api.get<PaginatedResponse<AffiliateCommission>>(
    `/affiliate/admin/commissions${buildQueryString(params)}`
  );
};

const syncCommissionsFromAwin = async (params?: { startDate?: string; endDate?: string }) => {
  const { data } = await api.post<{ data: AwinSyncResult }>(
    '/affiliate/admin/commissions/awin-sync',
    params ?? {}
  );
  return data;
};

const getCommissionStats = async (advertiserId?: string) => {
  const { data } = await api.get<{ data: CommissionStats }>(
    `/affiliate/admin/commissions/stats${buildQueryString({ advertiserId })}`
  );
  return data;
};

// ---------------------------------------------------------------------------
// Admin — Feed Sync
// ---------------------------------------------------------------------------

const listFeeds = async () => api.get<AwinFeedMeta[]>('/affiliate/admin/feeds');

const triggerFeedSync = async (awinMerchantId?: string) =>
  api.post<FeedSyncResult | AllFeedsSyncSummary>(
    '/affiliate/admin/feeds/sync',
    awinMerchantId ? { awinMerchantId } : {}
  );

const listFeedSyncs = async (params?: { advertiserId?: string; page?: number; limit?: number }) =>
  api.get<PaginatedResponse<AwinFeedSync>>(
    `/affiliate/admin/feeds/history${buildQueryString(params)}`
  );

// ---------------------------------------------------------------------------
// Admin — Click analytics
// ---------------------------------------------------------------------------

const listClickLogs = async (params?: {
  page?: number;
  limit?: number;
  affiliateProductId?: string;
  advertiserId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return api.get<PaginatedResponse<AffiliateClickLog>>(
    `/affiliate/admin/clicks${buildQueryString(params)}`
  );
};

// ---------------------------------------------------------------------------
// Named export
// ---------------------------------------------------------------------------

export const affiliateApi = {
  // Public
  listProducts,
  getProductBySlug,
  // Admin advertisers
  createAdvertiser,
  listAdvertisers,
  getAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  // Admin products
  createProduct,
  adminListProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  // Admin translations
  upsertTranslation,
  updateTranslation,
  listTranslations,
  // Admin commissions
  syncCommission,
  batchSyncCommissions,
  listCommissions,
  syncCommissionsFromAwin,
  getCommissionStats,
  // Admin clicks
  listClickLogs,
  // Admin feed sync
  listFeeds,
  triggerFeedSync,
  listFeedSyncs,
};
