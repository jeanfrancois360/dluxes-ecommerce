import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  affiliateApi,
  type AffiliateAdvertiser,
  type AffiliateAdvertiserStatus,
  type AffiliateProduct,
  type AffiliateClickLog,
} from '@/lib/api/affiliate';

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
    [params?.page, params?.limit, params?.advertiserId, params?.isActive, params?.isFeatured]
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
