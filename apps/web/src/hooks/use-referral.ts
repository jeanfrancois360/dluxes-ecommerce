import useSWR from 'swr';
import { referralApi } from '@/lib/api/referral';

/**
 * Referral Hooks (v2.11.0)
 * SWR-based hooks for referral data fetching
 */

/**
 * Get referral summary for current user
 * Returns: referral code, usage stats, earnings, pending rewards
 */
export function useReferralSummary() {
  const { data, error, mutate, isLoading } = useSWR(
    '/referral/summary',
    referralApi.getReferralSummary,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds
    }
  );

  return {
    summary: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Get referral settings (public info)
 * Returns: enabled, rewards amounts, min order value, currency, etc.
 */
export function useReferralSettings() {
  const { data, error, isLoading } = useSWR('/referral/settings', referralApi.getReferralSettings, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute (settings change rarely)
  });

  return {
    settings: data?.data,
    isLoading,
    isError: error,
  };
}

/**
 * Get referral history with pagination
 */
export function useReferralHistory(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const key = params ? ['/referral/history', JSON.stringify(params)] : '/referral/history';

  const { data, error, mutate, isLoading } = useSWR(
    key,
    () => referralApi.getReferralHistory(params),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    history: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Get leaderboard (top referrers)
 */
export function useLeaderboard(limit: number = 10) {
  const { data, error, isLoading } = useSWR(
    ['/referral/leaderboard', limit],
    () => referralApi.getLeaderboard(limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    leaderboard: data?.data || [],
    isLoading,
    isError: error,
  };
}

/**
 * Get all referrals (Admin only)
 */
export function useAllReferrals(params?: {
  status?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const key = params ? ['/referral/admin/all', JSON.stringify(params)] : '/referral/admin/all';

  const { data, error, mutate, isLoading } = useSWR(key, () => referralApi.getAllReferrals(params));

  return {
    referrals: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Get referral statistics (Admin only)
 */
export function useReferralStatistics(params?: { startDate?: string; endDate?: string }) {
  const key = params
    ? ['/referral/admin/statistics', JSON.stringify(params)]
    : '/referral/admin/statistics';

  const { data, error, mutate, isLoading } = useSWR(
    key,
    () => referralApi.getReferralStatistics(params),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    statistics: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
