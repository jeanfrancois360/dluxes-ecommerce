'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReferralStatistics, useAllReferrals, useReferralSettings } from '@/hooks/use-referral';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { formatDate } from '@/lib/utils/date-format';
import {
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Filter,
  Download,
} from 'lucide-react';
import type { ReferralStatus } from '@/lib/api/types';

/**
 * Admin Referrals Dashboard (v2.11.0)
 * Comprehensive referral management and analytics
 * ZERO HARDCODED AMOUNTS - All values from API
 */

export default function AdminReferralsPage() {
  const t = useTranslations('adminReferrals');

  const [filters, setFilters] = useState({
    status: '',
    role: '',
    page: 1,
    limit: 20,
  });

  const { statistics, isLoading: statsLoading } = useReferralStatistics();
  const { referrals, pagination, isLoading: referralsLoading, mutate } = useAllReferrals(filters);
  const { settings, isLoading: settingsLoading } = useReferralSettings();

  const isLoading = statsLoading || referralsLoading || settingsLoading;

  const statCards = [
    {
      title: t('stats.totalReferrals'),
      value: statistics?.total?.count || 0,
      icon: Users,
      color: 'blue',
    },
    {
      title: t('stats.totalRewardsPaid'),
      value: formatCurrencyAmount(statistics?.total?.rewardsPaid || 0, settings?.currency || 'USD'),
      icon: DollarSign,
      color: 'green',
    },
    {
      title: t('stats.buyerReferrals'),
      value: statistics?.buyers?.count || 0,
      subtitle: formatCurrencyAmount(
        statistics?.buyers?.rewardsPaid || 0,
        settings?.currency || 'USD'
      ),
      icon: Gift,
      color: 'purple',
    },
    {
      title: t('stats.sellerReferrals'),
      value: statistics?.sellers?.count || 0,
      subtitle: formatCurrencyAmount(
        statistics?.sellers?.rewardsPaid || 0,
        settings?.currency || 'USD'
      ),
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getStatusBadgeColor = (status: ReferralStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'QUALIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'SELLER'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('pageTitle')}</h1>
            <p className="text-gray-500 mt-1">{t('pageDescription')}</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => alert(t('header.exportComingSoon'))}
          >
            <Download className="w-4 h-4" />
            {t('header.exportButton')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('stats.totalRewardsPaidValue', { amount: stat.subtitle })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('statusBreakdown.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(['pending', 'qualified', 'paid', 'expired', 'cancelled'] as const).map((status) => {
              const data = statistics?.byStatus?.[status as keyof typeof statistics.byStatus];
              const icons = {
                pending: Clock,
                qualified: CheckCircle,
                paid: DollarSign,
                expired: Clock,
                cancelled: Clock,
              };
              const Icon = icons[status];

              return (
                <div key={status} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {t(`status.${status}`)}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{data?.count || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrencyAmount(data?.amount || 0, settings?.currency || 'USD')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{t('filters.label')}</span>
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="PENDING">{t('status.pending')}</option>
              <option value="QUALIFIED">{t('status.qualified')}</option>
              <option value="PAID">{t('status.paid')}</option>
              <option value="EXPIRED">{t('status.expired')}</option>
              <option value="CANCELLED">{t('status.cancelled')}</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('filters.allRoles')}</option>
              <option value="BUYER">{t('filters.roleBuyer')}</option>
              <option value="SELLER">{t('filters.roleSeller')}</option>
            </select>
            {(filters.status || filters.role) && (
              <button
                onClick={() => setFilters({ status: '', role: '', page: 1, limit: 20 })}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('filters.clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.referrer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.referredUser')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.reward')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.date')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {t('table.noReferrals')}
                    </td>
                  </tr>
                ) : (
                  referrals.map((referral: any) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referrer?.firstName} {referral.referrer?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{referral.referrer?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referred?.firstName} {referral.referred?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{referral.referred?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(
                            referral.referredUserRole
                          )}`}
                        >
                          {referral.referredUserRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrencyAmount(referral.rewardAmount, referral.rewardCurrency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(
                            referral.status
                          )}`}
                        >
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(referral.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('pagination.previous')}
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('pagination.next')}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t.rich('pagination.showing', {
                      start: formatNumber((filters.page - 1) * filters.limit + 1),
                      end: formatNumber(Math.min(filters.page * filters.limit, pagination.total)),
                      total: formatNumber(pagination.total),
                      b: (chunks) => <span className="font-medium">{chunks}</span>,
                    })}
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label={t('pagination.ariaLabel')}
                  >
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {t('pagination.previous')}
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= filters.page - 1 && page <= filters.page + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === filters.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {t('pagination.next')}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
