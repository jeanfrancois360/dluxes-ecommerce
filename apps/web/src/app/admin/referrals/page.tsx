'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useReferralStatistics, useAllReferrals, useReferralSettings } from '@/hooks/use-referral';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { referralApi } from '@/lib/api/referral';
import { toast } from '@/lib/utils/toast';
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
  Banknote,
  ChevronDown,
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

  // Flat commission payouts state
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('PENDING');
  const [updatingPayout, setUpdatingPayout] = useState<string | null>(null);

  const loadPayouts = useCallback(async () => {
    try {
      setPayoutsLoading(true);
      const result = await referralApi.getReferralPayouts({
        status: payoutStatusFilter || undefined,
        limit: 50,
      });
      setPayouts(result?.data ?? []);
    } catch {
      toast.error('Failed to load payout records');
    } finally {
      setPayoutsLoading(false);
    }
  }, [payoutStatusFilter]);

  // Load payouts when tab is first opened — lazy via button
  const handlePayoutStatusUpdate = async (
    payoutId: string,
    status: string,
    paymentMethod?: string,
    paymentReference?: string
  ) => {
    try {
      setUpdatingPayout(payoutId);
      await referralApi.updateReferralPayout(payoutId, { status, paymentMethod, paymentReference });
      toast.success('Payout status updated');
      await loadPayouts();
    } catch {
      toast.error('Failed to update payout');
    } finally {
      setUpdatingPayout(null);
    }
  };

  const statCards = [
    {
      title: t('stats.totalReferrals'),
      value: statistics?.total?.count || 0,
      icon: Users,
      color: 'blue',
    },
    {
      title: t('stats.totalRewardsPaid'),
      value: formatCurrencyAmount(statistics?.total?.rewardsPaid || 0),
      icon: DollarSign,
      color: 'green',
    },
    {
      title: t('stats.buyerReferrals'),
      value: statistics?.buyers?.count || 0,
      subtitle: formatCurrencyAmount(statistics?.buyers?.rewardsPaid || 0),
      icon: Gift,
      color: 'purple',
    },
    {
      title: t('stats.sellerReferrals'),
      value: statistics?.sellers?.count || 0,
      subtitle: formatCurrencyAmount(statistics?.sellers?.rewardsPaid || 0),
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
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
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
                    {formatCurrencyAmount(data?.amount || 0)}
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">{t('filters.allRoles')}</option>
              <option value="BUYER">{t('filters.roleBuyer')}</option>
              <option value="SELLER">{t('filters.roleSeller')}</option>
            </select>
            {(filters.status || filters.role) && (
              <button
                onClick={() => setFilters({ status: '', role: '', page: 1, limit: 20 })}
                className="text-sm text-neutral-600 hover:text-black underline"
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
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
                          {formatCurrencyAmount(referral.rewardAmount)}
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
                                ? 'z-10 bg-black border-black text-white'
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
        {/* Flat Commission Payouts */}
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Flat Commission Payouts</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cash payouts queued for referrers using the flat_commission reward type
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-300"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
              <button
                onClick={loadPayouts}
                disabled={payoutsLoading}
                className="text-xs font-medium bg-black text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {payoutsLoading ? 'Loading…' : 'Load Payouts'}
              </button>
            </div>
          </div>

          {payouts.length === 0 ? (
            <div className="py-12 text-center">
              <Banknote className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No payout records yet.</p>
              <p className="text-xs text-neutral-400 mt-1">
                Records appear here when the reward type is set to{' '}
                <span className="font-mono bg-neutral-100 px-1 rounded">flat_commission</span>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-50">
                    {[
                      'Referrer',
                      'Amount',
                      'Status',
                      'Payment Method',
                      'Reference',
                      'Queued',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {payouts.map((p) => {
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-amber-50 text-amber-700',
                      PROCESSING: 'bg-blue-50 text-blue-700',
                      PAID: 'bg-emerald-50 text-emerald-700',
                      FAILED: 'bg-red-50 text-red-700',
                    };
                    const name = p.referrer?.firstName
                      ? `${p.referrer.firstName} ${p.referrer.lastName || ''}`.trim()
                      : (p.referrer?.email ?? 'Unknown');
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-neutral-800 text-xs">{name}</p>
                          <p className="text-neutral-400 text-xs">{p.referrer?.email}</p>
                        </td>
                        <td className="px-5 py-3 font-semibold text-neutral-900 text-xs">
                          ${Number(p.amount).toFixed(2)} {p.currency}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] ?? 'bg-neutral-100 text-neutral-600'}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-500">
                          {p.paymentMethod ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-neutral-500">
                          {p.paymentReference ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            {p.status === 'PENDING' && (
                              <button
                                onClick={() => handlePayoutStatusUpdate(p.id, 'PROCESSING')}
                                disabled={updatingPayout === p.id}
                                className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                              >
                                Mark Processing
                              </button>
                            )}
                            {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                              <button
                                onClick={() => {
                                  const ref = prompt('Payment reference (optional):') ?? undefined;
                                  const method =
                                    prompt(
                                      'Payment method (bank_transfer / stripe_connect / paypal):'
                                    ) ?? undefined;
                                  handlePayoutStatusUpdate(p.id, 'PAID', method, ref);
                                }}
                                disabled={updatingPayout === p.id}
                                className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            {p.status !== 'FAILED' && p.status !== 'PAID' && (
                              <button
                                onClick={() => handlePayoutStatusUpdate(p.id, 'FAILED')}
                                disabled={updatingPayout === p.id}
                                className="text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                Fail
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
