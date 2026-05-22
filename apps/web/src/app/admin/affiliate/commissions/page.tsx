'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import {
  useAffiliateCommissions,
  useCommissionStats,
  useAffiliateAdvertisers,
  useAffiliateProducts,
} from '@/hooks/use-affiliate';
import {
  affiliateApi,
  type AffiliateCommission,
  type AffiliateCommissionStatus,
} from '@/lib/api/affiliate';
import { toast } from '@/lib/utils/toast';
import { Filter, Loader2, RefreshCw, TrendingUp, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function diffDays(a: string, b: string): number {
  return Math.abs((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

const today = new Date();
const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

const SYNC_DEFAULT_START = formatDateInput(sevenDaysAgo);
const SYNC_DEFAULT_END = formatDateInput(today);
const LIST_DEFAULT_START = formatDateInput(thirtyDaysAgo);
const LIST_DEFAULT_END = formatDateInput(today);

const STATUS_OPTIONS: AffiliateCommissionStatus[] = ['PENDING', 'APPROVED', 'DECLINED', 'PAID'];

const STATUS_COLORS: Record<AffiliateCommissionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  PAID: 'bg-blue-100 text-blue-700',
};

// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

function StatsCards({ advertiserId }: { advertiserId?: string }) {
  const { stats, loading } = useCommissionStats(advertiserId || undefined);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Commissions',
      value: formatCurrency(stats.total.commissionAmount, 'USD'),
      sub: `${stats.total.count} transactions`,
      color: 'text-gray-900',
    },
    {
      label: 'Pending',
      value: formatCurrency(stats.byStatus.PENDING?.commissionAmount ?? 0, 'USD'),
      sub: `${stats.byStatus.PENDING?.count ?? 0} transactions`,
      color: 'text-yellow-600',
    },
    {
      label: 'Approved',
      value: formatCurrency(stats.byStatus.APPROVED?.commissionAmount ?? 0, 'USD'),
      sub: `${stats.byStatus.APPROVED?.count ?? 0} transactions`,
      color: 'text-green-600',
    },
    {
      label: 'Declined',
      value: String(stats.byStatus.DECLINED?.count ?? 0),
      sub: formatCurrency(stats.byStatus.DECLINED?.commissionAmount ?? 0, 'USD') + ' value',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
            {card.label}
          </p>
          <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync Now modal
// ---------------------------------------------------------------------------

function SyncNowModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [startDate, setStartDate] = useState(SYNC_DEFAULT_START);
  const [endDate, setEndDate] = useState(SYNC_DEFAULT_END);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    synced: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const rangeError = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (new Date(startDate) > new Date(endDate)) return 'Start date must be before end date.';
    if (diffDays(startDate, endDate) > 31)
      return 'Date range cannot exceed 31 days (Awin API limit).';
    return null;
  }, [startDate, endDate]);

  const handleSync = async () => {
    if (rangeError || !startDate || !endDate) return;
    setSyncing(true);
    try {
      const res = await affiliateApi.syncCommissionsFromAwin({ startDate, endDate });
      setResult({ synced: res.synced, skipped: res.skipped, errors: res.errors });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed.');
      setSyncing(false);
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sync Now from Awin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {result ? (
            // Result view
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{result.synced}</p>
                  <p className="text-xs text-green-700 mt-0.5">Synced</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-600">{result.skipped}</p>
                  <p className="text-xs text-gray-700 mt-0.5">Skipped</p>
                </div>
                <div className={`rounded-lg p-3 ${result.errors > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p
                    className={`text-2xl font-bold ${result.errors > 0 ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {result.errors}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${result.errors > 0 ? 'text-red-700' : 'text-gray-700'}`}
                  >
                    Errors
                  </p>
                </div>
              </div>
              {result.synced === 0 && result.errors === 0 && (
                <p className="text-xs text-amber-600 text-center">
                  0 synced — check Awin configuration or try a different date range.
                </p>
              )}
              <button
                onClick={handleDone}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            // Input view
            <>
              <p className="text-sm text-gray-500">
                Fetches commissions from Awin for the selected date range. Maximum 31 days.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {rangeError && <p className="mt-1.5 text-xs text-red-600">{rangeError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing || !!rangeError || !startDate || !endDate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing && <Loader2 className="w-3 h-3 animate-spin" />}
                  {syncing ? 'Syncing…' : 'Sync'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Entry modal
// ---------------------------------------------------------------------------

const EMPTY_ENTRY = {
  awinTransactionId: '',
  saleAmount: '',
  commissionAmount: '',
  currency: 'USD',
  status: 'PENDING' as AffiliateCommissionStatus,
  transactionDate: formatDateInput(today),
  advertiserId: '',
  affiliateProductId: '',
};

function ManualEntryModal({
  advertisers,
  products,
  onClose,
  onSuccess,
}: {
  advertisers: { id: string; name: string }[];
  products: { id: string; slug: string; title?: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.awinTransactionId.trim()) e.awinTransactionId = 'Required';
    if (!form.saleAmount || Number(form.saleAmount) <= 0) e.saleAmount = 'Must be > 0';
    if (!form.commissionAmount || Number(form.commissionAmount) <= 0)
      e.commissionAmount = 'Must be > 0';
    if (!form.currency.trim()) e.currency = 'Required';
    if (!form.transactionDate) e.transactionDate = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      await affiliateApi.syncCommission({
        awinTransactionId: form.awinTransactionId.trim(),
        saleAmount: Number(form.saleAmount),
        commissionAmount: Number(form.commissionAmount),
        currency: form.currency.trim(),
        status: form.status,
        transactionDate: form.transactionDate,
        advertiserId: form.advertiserId || undefined,
        affiliateProductId: form.affiliateProductId || undefined,
        rawPayload: {},
      });
      toast.success('Commission entry saved.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save commission.');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Manual Commission Entry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {/* Awin Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Awin Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...field('awinTransactionId')}
              placeholder="e.g. 123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.awinTransactionId && (
              <p className="mt-1 text-xs text-red-600">{errors.awinTransactionId}</p>
            )}
          </div>

          {/* Sale + Commission amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                {...field('saleAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.saleAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.saleAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                {...field('commissionAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.commissionAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.commissionAmount}</p>
              )}
            </div>
          </div>

          {/* Currency + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...field('currency')}
                maxLength={3}
                placeholder="USD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...field('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...field('transactionDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.transactionDate && (
              <p className="mt-1 text-xs text-red-600">{errors.transactionDate}</p>
            )}
          </div>

          {/* Advertiser */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser</label>
            <select
              {...field('advertiserId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {advertisers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              {...field('affiliateProductId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title ?? p.slug}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

function buildColumns(advertiserMap: Record<string, string>, productMap: Record<string, string>) {
  return [
    {
      key: 'awinTransactionId',
      label: 'Transaction ID',
      render: (item: AffiliateCommission) => (
        <span className="text-sm font-mono text-gray-700">{item.awinTransactionId}</span>
      ),
    },
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (item: AffiliateCommission) => (
        <span className="text-sm text-gray-700">
          {item.advertiserId ? (advertiserMap[item.advertiserId] ?? item.advertiserId) : '—'}
        </span>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (item: AffiliateCommission) => (
        <span className="text-sm font-mono text-gray-700 truncate max-w-[140px] block">
          {item.affiliateProductId
            ? (productMap[item.affiliateProductId] ?? item.affiliateProductId)
            : '—'}
        </span>
      ),
    },
    {
      key: 'saleAmount',
      label: 'Sale',
      render: (item: AffiliateCommission) => (
        <span className="text-sm text-gray-700">
          {formatCurrency(item.saleAmount, item.currency)}
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      label: 'Commission',
      render: (item: AffiliateCommission) => (
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(item.commissionAmount, item.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: AffiliateCommission) => (
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[item.status]}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'transactionDate',
      label: 'Date',
      render: (item: AffiliateCommission) => (
        <span className="text-sm text-gray-600">
          {new Date(item.transactionDate).toLocaleDateString()}
        </span>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function CommissionsContent() {
  // List filters
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [advertiserIdFilter, setAdvertiserIdFilter] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');
  const [startDate, setStartDate] = useState(LIST_DEFAULT_START);
  const [endDate, setEndDate] = useState(LIST_DEFAULT_END);

  // Modals
  const [showSync, setShowSync] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const limit = 20;
  const bothDates = startDate && endDate;
  const hasOnlyOneDate = Boolean((startDate && !endDate) || (!startDate && endDate));

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      status: (statusFilter as AffiliateCommissionStatus) || undefined,
      advertiserId: advertiserIdFilter || undefined,
      affiliateProductId: productIdFilter || undefined,
      startDate: bothDates ? startDate : undefined,
      endDate: bothDates ? endDate : undefined,
    }),
    [page, statusFilter, advertiserIdFilter, productIdFilter, startDate, endDate, bothDates]
  );

  const { commissions, pagination, loading, error, refetch } = useAffiliateCommissions(queryParams);

  // Stats — pass advertiser filter so cards reflect the current advertiser scope
  const { refetch: refetchStats } = useCommissionStats(advertiserIdFilter || undefined);

  // Advertiser + product data for dropdowns and lookup maps
  const { advertisers, loading: advertisersLoading } = useAffiliateAdvertisers(
    useMemo(() => ({ limit: 100 }), [])
  );
  const { products, loading: productsLoading } = useAffiliateProducts(
    useMemo(() => ({ limit: 100 }), [])
  );

  const advertiserMap = useMemo(
    () => Object.fromEntries(advertisers.map((a) => [a.id, a.name])),
    [advertisers]
  );
  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.slug])),
    [products]
  );

  const columns = useMemo(
    () => buildColumns(advertiserMap, productMap),
    [advertiserMap, productMap]
  );

  const hasActiveFilters = Boolean(
    statusFilter || advertiserIdFilter || productIdFilter || startDate || endDate
  );

  const clearFilters = () => {
    setStatusFilter('');
    setAdvertiserIdFilter('');
    setProductIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleFilterChange = () => setPage(1);

  const handleSyncSuccess = useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  const handleManualSuccess = useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Commissions</h1>
          <p className="text-gray-500 mt-1">
            Awin commission transactions ({pagination.total} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManual(true)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Manual Entry
          </button>
          <button
            onClick={() => setShowSync(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Now from Awin
          </button>
        </div>
      </div>

      {/* Stats cards — filter by current advertiser selection */}
      <StatsCards advertiserId={advertiserIdFilter || undefined} />

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Advertiser */}
          <select
            value={advertiserIdFilter}
            onChange={(e) => {
              setAdvertiserIdFilter(e.target.value);
              handleFilterChange();
            }}
            disabled={advertisersLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All advertisers</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Product */}
          <select
            value={productIdFilter}
            onChange={(e) => {
              setProductIdFilter(e.target.value);
              handleFilterChange();
            }}
            disabled={productsLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ?? p.slug}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {hasOnlyOneDate && (
          <p className="mt-2 text-xs text-amber-600">
            Set both a start and end date to filter by date range.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <ModernTable
        columns={columns}
        data={commissions}
        loading={loading}
        emptyMessage={
          hasActiveFilters ? 'No commissions match your filters.' : 'No commissions yet.'
        }
        getRowId={(item) => item.id}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> –{' '}
              <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> commissions
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        p === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pagination.totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && commissions.length === 0 && !hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No commissions yet</h2>
          <p className="text-sm text-gray-500">
            Use &ldquo;Sync Now from Awin&rdquo; to import commission data, or add an entry
            manually.
          </p>
        </div>
      )}

      {/* Modals */}
      {showSync && (
        <SyncNowModal onClose={() => setShowSync(false)} onSuccess={handleSyncSuccess} />
      )}
      {showManual && (
        <ManualEntryModal
          advertisers={advertisers}
          products={products}
          onClose={() => setShowManual(false)}
          onSuccess={handleManualSuccess}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminAffiliateCommissionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CommissionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
