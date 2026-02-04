'use client';

import React from 'react';
import useSWR from 'swr';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import Link from 'next/link';
import { subscriptionApi } from '@/lib/api/subscription';
import { advertisementPlansApi } from '@/lib/api/advertisement-plans';
import { toast, standardToasts } from '@/lib/utils/toast';

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon,
  trend,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}) {
  const isPositive = trend === 'up' ? change >= 0 : change < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${isPositive
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
          }`}>
          {isPositive ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </div>
  );
}

function SubscriptionsDashboardContent() {
  // Fetch seller subscription stats
  const { data: sellerStats, error: sellerError, isLoading: sellerLoading } = useSWR(
    'subscription-stats',
    () => subscriptionApi.adminGetStatistics()
  );

  // Fetch advertisement subscription stats
  const { data: adStats, error: adError, isLoading: adLoading } = useSWR(
    'ad-stats',
    () => advertisementPlansApi.adminGetStatistics()
  );

  const loading = sellerLoading || adLoading;
  const error = sellerError || adError;

  // Show error toast if data fetch fails
  React.useEffect(() => {
    if (error) {
      toast.error('Failed to load subscription statistics');
    }
  }, [error]);

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    if (!sellerStats) {
      return {
        totalActiveSubscriptions: 0,
        monthlyRevenue: 0,
        totalPlans: 0,
        totalAdvertisementSubscriptions: 0,
        totalSellerSubscriptions: 0,
        growthRate: 0,
        churnRate: 0,
      };
    }

    const totalActive = sellerStats.activeSubscriptions + (adStats?.activeSubscriptions || 0);
    const totalRevenue = sellerStats.monthlyRevenue + (adStats?.totalRevenue || 0);

    // Calculate growth rate (mock for now - would need historical data)
    const growthRate = 12.5; // TODO: Calculate from historical data

    // Calculate churn rate from real data
    const churnRate = sellerStats.canceledSubscriptions > 0
      ? Number((sellerStats.canceledSubscriptions / sellerStats.totalSubscriptions * 100).toFixed(1))
      : 0;

    return {
      totalActiveSubscriptions: totalActive,
      monthlyRevenue: totalRevenue,
      totalPlans: sellerStats.totalPlans,
      totalAdvertisementSubscriptions: adStats?.activeSubscriptions || 0,
      totalSellerSubscriptions: sellerStats.activeSubscriptions,
      growthRate,
      churnRate,
    };
  }, [sellerStats, adStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero Skeleton */}
        <div className="rounded-lg bg-gray-800 p-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-5 bg-gray-700 rounded w-1/2" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse border border-gray-200">
              <div className="h-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
        {/* Breakdown Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse border border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
              <div className="space-y-4">
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-lg bg-gray-900 p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gray-800 rounded-lg">
            <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Feature Plans Dashboard</h1>
        </div>
        <p className="text-gray-300 text-base ml-14">Manage seller feature plans that unlock premium product types (SERVICE, INQUIRY, REAL_ESTATE)</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Feature Plans"
          value={formatNumber(stats.totalActiveSubscriptions)}
          change={stats.growthRate}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrencyAmount(stats.monthlyRevenue)}
          change={8.2}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Feature Plans"
          value={formatNumber(stats.totalPlans)}
          change={0}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Churn Rate"
          value={`${stats.churnRate}%`}
          change={stats.churnRate}
          trend="down"
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </div>

      {/* Subscription Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seller Feature Plan Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#CBB57B]/10 rounded-lg">
              <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Seller Feature Plans</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white rounded-lg shadow-sm">
                  <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-base">Active Subscribers</p>
                  <p className="text-gray-600 text-sm font-medium">Sellers with feature plans</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSellerSubscriptions}</p>
                <Link href="/admin/subscriptions/sellers" className="inline-flex items-center gap-1.5 text-[#CBB57B] text-sm hover:text-[#a89158] font-semibold">
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Advertisement Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#CBB57B]/10 rounded-lg">
              <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Advertisement Subscriptions</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white rounded-lg shadow-sm">
                  <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-base">Active Ad Campaigns</p>
                  <p className="text-gray-600 text-sm font-medium">Running advertisements</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAdvertisementSubscriptions}</p>
                <Link href="/admin/subscriptions/advertisement" className="inline-flex items-center gap-1.5 text-[#CBB57B] text-sm hover:text-[#a89158] font-semibold">
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/subscriptions/plans"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#CBB57B] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Manage Feature Plans</h3>
              <p className="text-sm text-gray-600">Edit tiers, pricing, and product types</p>
            </div>
            <div className="p-3 bg-[#CBB57B]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#CBB57B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/subscriptions/advertisement"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#CBB57B] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Ad Campaigns</h3>
              <p className="text-sm text-gray-600">Monitor performance</p>
            </div>
            <div className="p-3 bg-[#CBB57B]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#CBB57B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/subscriptions/sellers"
          className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-[#CBB57B] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Seller Feature Plans</h3>
              <p className="text-sm text-gray-600">View active subscriptions</p>
            </div>
            <div className="p-3 bg-[#CBB57B]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#CBB57B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function SubscriptionsDashboardPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SubscriptionsDashboardContent />
      </AdminLayout>
    </AdminRoute>
  );
}
