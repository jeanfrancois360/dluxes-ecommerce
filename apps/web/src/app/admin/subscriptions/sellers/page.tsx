'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { subscriptionApi, type SellerSubscription } from '@/lib/api/subscription';

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; dotColor: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active', dotColor: 'bg-green-600' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled', dotColor: 'bg-red-600' },
    EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expired', dotColor: 'bg-gray-600' },
    PAST_DUE: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Past Due', dotColor: 'bg-yellow-600' },
  };
  const badge = config[status] || config.EXPIRED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${badge.bg} ${badge.text} border border-current/20`}>
      <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
      {badge.label}
    </span>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:border-gray-300 transition-colors p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#CBB57B]/10 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ current, max, label }: { current: number; max: number; label: string }) {
  const percentage = max === -1 ? 0 : Math.min((current / max) * 100, 100);
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className={`font-bold ${isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-900'}`}>
          {current} / {max === -1 ? '∞' : max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${isDanger
              ? 'bg-red-600'
              : isWarning
                ? 'bg-yellow-500'
                : 'bg-[#CBB57B]'
            }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SellerSubscriptionsContent() {
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const statusMap: Record<string, string> = {
    all: '',
    active: 'ACTIVE',
    cancelled: 'CANCELLED',
    expired: 'EXPIRED',
  };

  // Fetch subscriptions with useSWR
  const { data, error, isLoading, mutate } = useSWR(
    ['seller-subscriptions', filter, searchQuery, page],
    () => subscriptionApi.adminGetSellerSubscriptions({
      status: statusMap[filter],
      search: searchQuery || undefined,
      page,
      limit: 10,
    })
  );

  const subscriptions = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  // Show error toast if data fetch fails
  React.useEffect(() => {
    if (error) {
      toast.error('Failed to fetch seller feature plans');
    }
  }, [error]);

  const handleCancelSubscription = async (id: string) => {
    try {
      await subscriptionApi.adminCancelSubscription(id);
      toast.success('Feature plan cancelled successfully');
      mutate(); // Refresh data after update
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel feature plan');
    }
  };

  const handleReactivateSubscription = async (id: string) => {
    try {
      await subscriptionApi.adminReactivateSubscription(id);
      toast.success('Feature plan reactivated successfully');
      mutate(); // Refresh data after update
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate feature plan');
    }
  };

  const stats = React.useMemo(() => ({
    total: pagination?.total || 0,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    cancelled: subscriptions.filter(s => s.status === 'CANCELLED').length,
    revenue: subscriptions.reduce((sum, s) => {
      if (s.status === 'ACTIVE') {
        return sum + (s.billingCycle === 'MONTHLY' ? s.plan.monthlyPrice : s.plan.yearlyPrice / 12);
      }
      return sum;
    }, 0),
  }), [subscriptions, pagination]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero Skeleton */}
        <div className="bg-gray-800 rounded-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-5 bg-gray-700 rounded w-1/2" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gray-900 rounded-lg p-8 shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gray-800 rounded-lg">
            <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">Seller Feature Plans</h1>
        </div>
        <p className="text-gray-300 text-lg ml-14">View and manage sellers subscribed to feature plans (unlock premium product types)</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Stores"
          value={stats.total.toString()}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          title="Active Feature Plans"
          value={stats.active.toString()}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled.toString()}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrencyAmount(stats.revenue)}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by seller name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg p-1.5">
          {(['all', 'active', 'cancelled', 'expired'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${filter === f
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Seller Cards Grid */}
      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No sellers found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((sub) => {
              const daysUntilExpiry = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const price = sub.billingCycle === 'MONTHLY' ? sub.plan.monthlyPrice : sub.plan.yearlyPrice;
              const listingsUsed = sub.activeListingsCount || 0;
              const listingsMax = sub.plan.maxActiveListings;
              const creditsUsed = sub.creditsUsed || 0;
              const creditsMax = sub.creditsAllocated;

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-lg shadow border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  {/* Header with Avatar */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {sub.user?.firstName?.charAt(0) || sub.user?.email?.charAt(0).toUpperCase() || 'S'}
                      </div>

                      {/* Seller Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {sub.user?.firstName && sub.user?.lastName
                            ? `${sub.user.firstName} ${sub.user.lastName}`
                            : 'Unknown Seller'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{sub.user?.email || 'No email'}</p>
                      </div>

                      <StatusBadge status={sub.status} />
                    </div>

                    {/* Plan & Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plan</p>
                        <p className="text-lg font-bold text-gray-900">{sub.plan.name}</p>
                        <p className="text-xs text-gray-600 capitalize">{sub.billingCycle.toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrencyAmount(price)}</p>
                        <p className="text-xs text-gray-600">/{sub.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Metrics */}
                  <div className="p-6 bg-gray-50 space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Usage</p>

                    <ProgressBar
                      current={listingsUsed}
                      max={listingsMax}
                      label="Active Listings"
                    />

                    <ProgressBar
                      current={creditsUsed}
                      max={creditsMax}
                      label="Credits Used"
                    />
                  </div>

                  {/* Timeline & Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {/* Timeline */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 bg-[#CBB57B] rounded-full" />
                          <div className="w-0.5 h-8 bg-gray-300" />
                          <div className={`w-2.5 h-2.5 rounded-full ${daysUntilExpiry > 0 ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Started</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(sub.currentPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Renewal</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Days Left</span>
                          <span className={`font-bold ${daysUntilExpiry > 7 ? 'text-green-600' : daysUntilExpiry > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Auto-Renew</span>
                          {!sub.cancelAtPeriodEnd ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              <span className="text-green-600 font-semibold">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-500 font-medium">No</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 flex gap-2">
                    {sub.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleCancelSubscription(sub.id)}
                        className="flex-1 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    ) : sub.status === 'CANCELLED' ? (
                      <button
                        onClick={() => handleReactivateSubscription(sub.id)}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reactivate
                      </button>
                    ) : null}
                    <button className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{((page - 1) * (pagination?.limit || 10)) + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(page * (pagination?.limit || 10), pagination?.total || 0)}</span> of{' '}
                  <span className="font-bold text-gray-900">{pagination?.total || 0}</span> results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-colors ${page === pageNum
                              ? 'bg-gray-900 text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
                    disabled={page === (pagination?.totalPages || 1)}
                    className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SellerSubscriptionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SellerSubscriptionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
