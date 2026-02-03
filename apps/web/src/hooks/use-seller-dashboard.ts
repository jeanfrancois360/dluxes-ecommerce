'use client';

import useSWR from 'swr';
import * as sellerApi from '@/lib/api/seller';
import type {
  SellerDashboardSummary,
  RevenueAnalytics,
  OrderStatusBreakdown,
  TopProduct,
  Activity,
} from '@/lib/api/seller';

/**
 * Hook to fetch complete seller dashboard data
 */
export function useSellerDashboard() {
  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSWR<SellerDashboardSummary>(
    '/seller/dashboard',
    sellerApi.getDashboard,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
      onError: (err) => {
        console.error('[useSellerDashboard] Error fetching dashboard:', err);
        console.error('[useSellerDashboard] Error details:', {
          message: err?.message,
          status: err?.status,
          data: err?.data,
        });
      },
    }
  );

  return {
    summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: mutateSummary,
  };
}

/**
 * Hook to fetch revenue analytics with period selection
 */
export function useRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  const { data, error, isLoading, mutate } = useSWR<RevenueAnalytics>(
    `/seller/analytics/revenue?period=${period}`,
    () => sellerApi.getRevenueAnalytics(period),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  return {
    data,
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to fetch order status breakdown
 */
export function useOrderStatusBreakdown() {
  const { data, error, isLoading, mutate } = useSWR<OrderStatusBreakdown>(
    '/seller/analytics/orders',
    sellerApi.getOrderStatusBreakdown,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to fetch top performing products
 */
export function useTopProducts(limit: number = 5) {
  const { data, error, isLoading, mutate } = useSWR<TopProduct[]>(
    `/seller/analytics/top-products?limit=${limit}`,
    () => sellerApi.getTopProducts(limit),
    {
      revalidateOnFocus: false,
      refreshInterval: 300000,
      onError: (err) => {
        console.error('[useTopProducts] Error:', err);
      },
    }
  );

  return {
    products: data || [],
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to fetch recent activity feed
 */
export function useRecentActivity(limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<Activity[]>(
    `/seller/analytics/recent-activity?limit=${limit}`,
    () => sellerApi.getRecentActivity(limit),
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds for real-time feel
      onError: (err) => {
        console.error('[useRecentActivity] Error:', err);
      },
    }
  );

  return {
    activities: data || [],
    isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Combined hook for complete dashboard data
 */
export function useCompleteDashboard() {
  const dashboard = useSellerDashboard();
  const revenue = useRevenueAnalytics('monthly');
  const orderBreakdown = useOrderStatusBreakdown();
  const topProducts = useTopProducts(5);
  const recentActivity = useRecentActivity(10);

  const isLoading =
    dashboard.isLoading ||
    revenue.isLoading ||
    orderBreakdown.isLoading ||
    topProducts.isLoading ||
    recentActivity.isLoading;

  const hasError =
    dashboard.error ||
    revenue.error ||
    orderBreakdown.error ||
    topProducts.error ||
    recentActivity.error;

  return {
    dashboard: dashboard.summary,
    revenue: revenue.data,
    orderBreakdown: orderBreakdown.data,
    topProducts: topProducts.products,
    recentActivity: recentActivity.activities,
    isLoading,
    hasError,
    dashboardError: dashboard.error, // Expose dashboard error for specific error handling
    refetch: () => {
      dashboard.refetch();
      revenue.refetch();
      orderBreakdown.refetch();
      topProducts.refetch();
      recentActivity.refetch();
    },
  };
}
