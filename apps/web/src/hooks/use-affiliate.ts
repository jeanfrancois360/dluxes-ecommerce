import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  affiliateApi,
  type AffiliateAdvertiser,
  type AffiliateAdvertiserStatus,
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
