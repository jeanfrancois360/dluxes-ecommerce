import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  affiliateApi,
  type AffiliateAdvertiser,
  type AffiliateAdvertiserStatus,
  type AffiliateCommission,
  type AffiliateCommissionStatus,
  type AffiliateProduct,
  type AffiliateProductTranslation,
  type AffiliateClickLog,
  type CommissionStats,
  type AwinFeedSync,
} from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Public Products (listing page)
// ---------------------------------------------------------------------------

export function useAffiliatePublicProducts(params?: {
  page?: number;
  limit?: number;
  advertiserId?: string;
  isFeatured?: boolean;
  inStock?: boolean;
  tag?: string;
  locale?: string;
}) {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params?.page,
      params?.limit,
      params?.advertiserId,
      params?.isFeatured,
      params?.inStock,
      params?.tag,
      params?.locale,
    ]
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.listProducts(memoizedParams);
      setProducts(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch affiliate products');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, pagination, loading, error, refetch: fetchProducts };
}

/**
 * Affiliate Hooks (Phase C.5)
 * useState + useCallback + useEffect pattern — matches use-admin.ts conventions.
 */

// ---------------------------------------------------------------------------
// Advertisers
// ---------------------------------------------------------------------------

export function useAffiliateAdvertisers(params?: {
  page?: number;
  limit?: number;
  approvalStatus?: AffiliateAdvertiserStatus;
  isActive?: boolean;
}) {
  const [advertisers, setAdvertisers] = useState<AffiliateAdvertiser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params?.page, params?.limit, params?.approvalStatus, params?.isActive]
  );

  const fetchAdvertisers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.listAdvertisers(memoizedParams);
      setAdvertisers(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch advertisers');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchAdvertisers();
  }, [fetchAdvertisers]);

  return { advertisers, pagination, loading, error, refetch: fetchAdvertisers };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export function useAffiliateProducts(params?: {
  page?: number;
  limit?: number;
  advertiserId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  fulfillmentSource?: 'FEED' | 'MANUAL';
}) {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params?.page,
      params?.limit,
      params?.advertiserId,
      params?.isActive,
      params?.isFeatured,
      params?.fulfillmentSource,
    ]
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.adminListProducts(memoizedParams);
      setProducts(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, pagination, loading, error, refetch: fetchProducts };
}

// ---------------------------------------------------------------------------
// Click Logs
// ---------------------------------------------------------------------------

export function useAffiliateClickLogs(params?: {
  page?: number;
  limit?: number;
  affiliateProductId?: string;
  advertiserId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [clickLogs, setClickLogs] = useState<AffiliateClickLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params?.page,
      params?.limit,
      params?.affiliateProductId,
      params?.advertiserId,
      params?.startDate,
      params?.endDate,
    ]
  );

  const fetchClickLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.listClickLogs(memoizedParams);
      setClickLogs(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch click logs');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchClickLogs();
  }, [fetchClickLogs]);

  return { clickLogs, pagination, loading, error, refetch: fetchClickLogs };
}

// ---------------------------------------------------------------------------
// Product Translations
// ---------------------------------------------------------------------------

export function useAffiliateProductTranslations(productId: string) {
  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [translations, setTranslations] = useState<AffiliateProductTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const [prod, trans] = await Promise.all([
        affiliateApi.getProductById(productId),
        affiliateApi.listTranslations(productId),
      ]);
      setProduct(prod);
      setTranslations(trans);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { product, translations, loading, error, refetch: fetchAll };
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export function useAffiliateCommissions(params?: {
  page?: number;
  limit?: number;
  status?: AffiliateCommissionStatus;
  advertiserId?: string;
  affiliateProductId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params?.page,
      params?.limit,
      params?.status,
      params?.advertiserId,
      params?.affiliateProductId,
      params?.startDate,
      params?.endDate,
    ]
  );

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.listCommissions(memoizedParams);
      setCommissions(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return { commissions, pagination, loading, error, refetch: fetchCommissions };
}

// ---------------------------------------------------------------------------
// Single Public Product (detail page)
// ---------------------------------------------------------------------------

export function useAffiliateProduct(slug: string, locale?: string) {
  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const result = await affiliateApi.getProductBySlug(slug, locale);
      setProduct(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [slug, locale]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}

// ---------------------------------------------------------------------------
// Feed Sync History
// ---------------------------------------------------------------------------

export function useFeedSyncs(params?: { advertiserId?: string; page?: number; limit?: number }) {
  const [syncs, setSyncs] = useState<AwinFeedSync[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params?.advertiserId, params?.page, params?.limit]
  );

  const fetchSyncs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.listFeedSyncs(memoizedParams);
      setSyncs(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed sync history');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchSyncs();
  }, [fetchSyncs]);

  return { syncs, pagination, loading, error, refetch: fetchSyncs };
}

// ---------------------------------------------------------------------------
// Commission Stats
// ---------------------------------------------------------------------------

export function useCommissionStats(advertiserId?: string) {
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await affiliateApi.getCommissionStats(advertiserId);
      setStats(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commission stats');
    } finally {
      setLoading(false);
    }
  }, [advertiserId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
