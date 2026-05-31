'use client';

import React, { useState, useMemo } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import {
  useAffiliateClickLogs,
  useAffiliateAdvertisers,
  useAffiliateProducts,
} from '@/hooks/use-affiliate';
import { Filter, MousePointerClick, X } from 'lucide-react';
import type { AffiliateClickLog } from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

const DEFAULT_START = formatDateInput(thirtyDaysAgo);
const DEFAULT_END = formatDateInput(today);

// ---------------------------------------------------------------------------
// Table columns — built as a function to close over the lookup maps
// ---------------------------------------------------------------------------

function buildColumns(advertiserMap: Record<string, string>, productMap: Record<string, string>) {
  return [
    {
      key: 'createdAt',
      label: 'Date / Time',
      render: (item: AffiliateClickLog) => {
        const d = new Date(item.createdAt);
        return (
          <div>
            <div className="text-sm text-gray-700">{d.toLocaleDateString()}</div>
            <div className="text-xs text-gray-400">{d.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      key: 'product',
      label: 'Product',
      render: (item: AffiliateClickLog) => {
        const display = productMap[item.affiliateProductId] ?? item.affiliateProductId;
        return (
          <span className="text-sm font-mono text-gray-700 truncate max-w-[160px] block">
            {display}
          </span>
        );
      },
    },
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (item: AffiliateClickLog) => (
        <span className="text-sm text-gray-700">
          {advertiserMap[item.advertiserId] ?? item.advertiserId}
        </span>
      ),
    },
    {
      key: 'userId',
      label: 'User',
      render: (item: AffiliateClickLog) =>
        item.userId ? (
          <span className="text-sm font-mono text-gray-700 truncate max-w-[120px] block">
            {item.userId}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Anonymous</span>
        ),
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: (item: AffiliateClickLog) => (
        <span className="text-sm font-mono text-gray-600">{item.ipAddress ?? '—'}</span>
      ),
    },
    {
      key: 'referrer',
      label: 'Referrer',
      render: (item: AffiliateClickLog) => {
        const ref = item.referrer;
        if (!ref) return <span className="text-gray-400">—</span>;
        const truncated = ref.length > 40 ? ref.slice(0, 40) + '…' : ref;
        return (
          <span className="text-sm text-gray-600 font-mono" title={ref}>
            {truncated}
          </span>
        );
      },
    },
    {
      key: 'locale',
      label: 'Locale',
      render: (item: AffiliateClickLog) => (
        <span className="text-sm text-gray-600">{item.locale ?? '—'}</span>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function ClicksContent() {
  // List state
  const [page, setPage] = useState(1);
  const [advertiserIdFilter, setAdvertiserIdFilter] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');
  // Date range — default to last 30 days.
  // Both dates are required together (service ANDs them; a lone date is ignored).
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);

  const limit = 50;

  // Only pass dates when BOTH are filled. If only one is set the backend
  // silently ignores them both — passing a half-range would confuse the user.
  const bothDates = startDate && endDate;
  const hasOnlyOneDate = Boolean((startDate && !endDate) || (!startDate && endDate));

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      advertiserId: advertiserIdFilter || undefined,
      affiliateProductId: productIdFilter || undefined,
      startDate: bothDates ? startDate : undefined,
      endDate: bothDates ? endDate : undefined,
    }),
    [page, advertiserIdFilter, productIdFilter, startDate, endDate, bothDates]
  );

  const { clickLogs, pagination, loading, error } = useAffiliateClickLogs(queryParams);

  // Advertiser + product data — used for filter dropdowns AND client-side lookup maps
  const { advertisers, loading: advertisersLoading } = useAffiliateAdvertisers(
    useMemo(() => ({ limit: 100 }), [])
  );
  const { products, loading: productsLoading } = useAffiliateProducts(
    useMemo(() => ({ limit: 100 }), [])
  );

  // Client-side lookup maps: { id → displayName }
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

  const hasActiveFilters = Boolean(advertiserIdFilter || productIdFilter || startDate || endDate);

  const clearFilters = () => {
    setAdvertiserIdFilter('');
    setProductIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleFilterChange = () => setPage(1);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Click Analytics</h1>
          <p className="text-gray-500 mt-1">Affiliate link click log ({pagination.total} total)</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Date range — both required together */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
            />
          </div>

          {/* Advertiser dropdown */}
          <select
            value={advertiserIdFilter}
            onChange={(e) => {
              setAdvertiserIdFilter(e.target.value);
              handleFilterChange();
            }}
            disabled={advertisersLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] disabled:opacity-50"
          >
            <option value="">All advertisers</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Product dropdown */}
          <select
            value={productIdFilter}
            onChange={(e) => {
              setProductIdFilter(e.target.value);
              handleFilterChange();
            }}
            disabled={productsLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] disabled:opacity-50"
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
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Half-range hint */}
        {hasOnlyOneDate && (
          <p className="mt-2 text-xs text-amber-600">
            Set both a start and end date to filter by date range.
          </p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <ModernTable
        columns={columns}
        data={clickLogs}
        loading={loading}
        emptyMessage={hasActiveFilters ? 'No clicks match your filters.' : 'No click logs yet.'}
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
              <span className="font-medium">{pagination.total}</span> clicks
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
                          ? 'z-10 bg-gray-100 border-gray-900 text-gray-900'
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

      {/* Empty state — no clicks at all */}
      {!loading && !error && clickLogs.length === 0 && !hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MousePointerClick className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No click logs yet</h2>
          <p className="text-sm text-gray-500">
            Clicks are recorded when users follow affiliate deep links.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminAffiliateClicksPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ClicksContent />
      </AdminLayout>
    </AdminRoute>
  );
}
