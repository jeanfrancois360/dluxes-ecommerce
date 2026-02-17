'use client';

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import {
  useAdminAdStatistics,
  useAdminAdSubscriptions,
  useAdminAdPlans,
} from '@/hooks/use-advertisements';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TRIAL: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  PAST_DUE: { label: 'Past Due', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700', icon: XCircle },
};

function AdSubscriptionsContent() {
  const { statistics, isLoading: statsLoading } = useAdminAdStatistics();
  const { subscriptions, isLoading: subsLoading } = useAdminAdSubscriptions();
  const { plans } = useAdminAdPlans();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Filter subscriptions
  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter((sub: any) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        sub.seller?.email?.toLowerCase().includes(searchLower) ||
        sub.seller?.firstName?.toLowerCase().includes(searchLower) ||
        sub.seller?.lastName?.toLowerCase().includes(searchLower) ||
        sub.plan?.name?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;

      // Plan filter
      const matchesPlan = planFilter === 'ALL' || sub.planId === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  if (statsLoading || subsLoading) {
    return (
      <>
        <PageHeader
          title="Advertisement Subscriptions"
          description="Monitor seller ad plan subscriptions and revenue"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#CBB57B]" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Advertisement Subscriptions"
        description="Monitor seller ad plan subscriptions and revenue"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Active */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">Active</p>
                <p className="text-3xl font-bold text-neutral-900">{statistics?.active || 0}</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Paying customers</span>
            </div>
          </div>

          {/* Trial */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">Trial</p>
                <p className="text-3xl font-bold text-neutral-900">{statistics?.trial || 0}</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-600">Free trial users</span>
            </div>
          </div>

          {/* MRR */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#CBB57B]/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#CBB57B]" />
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">MRR</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(statistics?.monthlyRecurringRevenue || 0, 'USD')}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-[#A89968] mr-1" />
              <span className="text-[#A89968]">Monthly revenue</span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-neutral-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">Total</p>
                <p className="text-3xl font-bold text-neutral-900">{statistics?.total || 0}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <span>All subscriptions</span>
            </div>
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{statistics?.active || 0}</p>
              <p className="text-sm text-green-600">Active</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{statistics?.trial || 0}</p>
              <p className="text-sm text-blue-600">Trial</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{statistics?.pastDue || 0}</p>
              <p className="text-sm text-red-600">Past Due</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-700">{statistics?.expired || 0}</p>
              <p className="text-sm text-orange-600">Expired</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">{statistics?.cancelled || 0}</p>
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
          </div>
        </section>

        {/* Subscriptions List */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            {/* Header with Filters */}
            <div className="p-6 border-b border-neutral-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-lg font-semibold text-neutral-900">All Subscriptions</h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search sellers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>

                  {/* Plan Filter */}
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  >
                    <option value="ALL">All Plans</option>
                    {plans.map((plan: any) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="overflow-x-auto">
              {filteredSubscriptions.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Period End
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Auto Renew
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredSubscriptions.map((sub: any) => {
                      const StatusIcon = statusConfig[sub.status as SubscriptionStatus]?.icon;
                      return (
                        <tr key={sub.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-neutral-900">
                                {sub.seller?.firstName || ''} {sub.seller?.lastName || ''}
                              </div>
                              <div className="text-sm text-neutral-500">{sub.seller?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {sub.plan?.name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {formatCurrency(
                                sub.plan?.price?.toNumber() || 0,
                                sub.plan?.currency || 'USD'
                              )}
                              /{sub.plan?.billingPeriod?.toLowerCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[sub.status as SubscriptionStatus]?.color || 'bg-gray-100 text-gray-700'}`}
                            >
                              {StatusIcon && <StatusIcon className="w-3 h-3" />}
                              {statusConfig[sub.status as SubscriptionStatus]?.label || sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            <div>
                              <span className="font-medium">{sub.adsCreated}</span> /{' '}
                              {sub.plan?.maxActiveAds === -1 ? '∞' : sub.plan?.maxActiveAds} ads
                            </div>
                            <div className="text-xs text-neutral-500">
                              {sub.impressionsUsed?.toLocaleString()} /{' '}
                              {sub.plan?.maxImpressions?.toLocaleString() || '∞'} impressions
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sub.autoRenew ? (
                              <span className="text-green-600 text-sm">Yes</span>
                            ) : (
                              <span className="text-neutral-400 text-sm">No</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">
                    {searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL'
                      ? 'No subscriptions match your filters'
                      : 'No subscriptions yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default function AdSubscriptionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdSubscriptionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
