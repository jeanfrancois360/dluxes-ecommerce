'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import { useFeedSyncs, useAffiliateAdvertisers } from '@/hooks/use-affiliate';
import { affiliateApi } from '@/lib/api/affiliate';
import { formatDate } from '@/lib/utils/date-format';
import { toast } from '@/lib/utils/toast';
import { RefreshCw, Filter, X } from 'lucide-react';
import type { AwinFeedSync } from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function SyncStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-green-50 text-green-700 border-green-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    skipped: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  const cls = styles[status] ?? 'bg-gray-50 text-gray-500 border-gray-200';
  return (
    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Duration helper
// ---------------------------------------------------------------------------

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

function buildColumns(advertiserMap: Map<string, string>) {
  return [
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (item: AwinFeedSync) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {item.advertiserId ? (advertiserMap.get(item.advertiserId) ?? '—') : '—'}
          </div>
          {item.awinMerchantId && (
            <div className="text-xs text-gray-400 font-mono">{item.awinMerchantId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'feedId',
      label: 'Feed ID',
      render: (item: AwinFeedSync) => (
        <span className="text-xs text-gray-500 font-mono">{item.feedId ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: AwinFeedSync) => <SyncStatusBadge status={item.status} />,
    },
    {
      key: 'upserted',
      label: 'Upserted',
      align: 'right' as const,
      render: (item: AwinFeedSync) => (
        <span className="text-sm text-green-700 font-medium">
          {item.productsUpserted.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'skipped',
      label: 'Skipped',
      align: 'right' as const,
      render: (item: AwinFeedSync) => (
        <span className="text-sm text-gray-500">{item.productsSkipped.toLocaleString()}</span>
      ),
    },
    {
      key: 'errors',
      label: 'Errors',
      align: 'right' as const,
      render: (item: AwinFeedSync) => (
        <span
          className={`text-sm font-medium ${item.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}
        >
          {item.errors.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (item: AwinFeedSync) => (
        <span className="text-xs text-gray-500">
          {formatDuration(item.startedAt, item.completedAt)}
        </span>
      ),
    },
    {
      key: 'startedAt',
      label: 'Started',
      render: (item: AwinFeedSync) => (
        <span className="text-xs text-gray-500">{formatDate(item.startedAt)}</span>
      ),
    },
    {
      key: 'errorDetail',
      label: 'Error',
      render: (item: AwinFeedSync) =>
        item.errorDetail ? (
          <span
            className="text-xs text-red-500 max-w-[200px] truncate block"
            title={item.errorDetail}
          >
            {item.errorDetail}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function FeedSyncsContent() {
  const [page, setPage] = useState(1);
  const [advertiserIdFilter, setAdvertiserIdFilter] = useState('');
  const limit = 20;

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      advertiserId: advertiserIdFilter || undefined,
    }),
    [page, advertiserIdFilter]
  );

  const { syncs, pagination, loading, error, refetch } = useFeedSyncs(queryParams);

  const { advertisers } = useAffiliateAdvertisers(useMemo(() => ({ limit: 100 }), []));

  const advertiserMap = useMemo(
    () => new Map(advertisers.map((a) => [a.id, a.name])),
    [advertisers]
  );

  const columns = useMemo(() => buildColumns(advertiserMap), [advertiserMap]);

  // Sync all button
  const [syncingAll, setSyncingAll] = useState(false);
  const handleSyncAll = useCallback(async () => {
    if (!window.confirm('Trigger a full Awin feed sync for all active advertisers?')) return;
    try {
      setSyncingAll(true);
      const result = await affiliateApi.triggerFeedSync();
      if ('totalUpserted' in result) {
        toast.success(
          `Sync complete — ${result.totalUpserted} upserted across ${result.advertisersWithFeed} advertisers`,
          { duration: 7000 }
        );
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Feed sync failed.');
    } finally {
      setSyncingAll(false);
    }
  }, [refetch]);

  // Per-advertiser sync
  const [syncingMerchant, setSyncingMerchant] = useState<string | null>(null);
  const handleSyncAdvertiser = useCallback(
    async (awinMerchantId: string, name: string) => {
      if (!window.confirm(`Sync feed for ${name}?`)) return;
      try {
        setSyncingMerchant(awinMerchantId);
        const result = await affiliateApi.triggerFeedSync(awinMerchantId);
        if ('productsUpserted' in result && !('totalUpserted' in result)) {
          toast.success(`Sync complete — ${result.productsUpserted} upserted`);
        }
        refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sync failed.');
      } finally {
        setSyncingMerchant(null);
      }
    },
    [refetch]
  );

  const hasFilter = !!advertiserIdFilter;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feed Syncs</h1>
          <p className="text-gray-500 mt-1">
            Awin product feed sync history ({pagination.total} runs)
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          {syncingAll ? 'Syncing…' : 'Sync All Feeds'}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <select
            value={advertiserIdFilter}
            onChange={(e) => {
              setAdvertiserIdFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
          >
            <option value="">All advertisers</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {hasFilter && (
            <button
              onClick={() => {
                setAdvertiserIdFilter('');
                setPage(1);
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Per-advertiser sync trigger */}
          {advertiserIdFilter && (
            <button
              onClick={() => {
                const adv = advertisers.find((a) => a.id === advertiserIdFilter);
                if (adv?.awinMerchantId) {
                  handleSyncAdvertiser(adv.awinMerchantId, adv.name);
                }
              }}
              disabled={!!syncingMerchant}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingMerchant ? 'animate-spin' : ''}`} />
              {syncingMerchant ? 'Syncing…' : 'Sync this advertiser'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <ModernTable
        columns={columns}
        data={syncs}
        loading={loading}
        emptyMessage={
          hasFilter
            ? 'No sync runs found for this advertiser.'
            : 'No feed sync runs yet. Click "Sync All Feeds" to run the first sync.'
        }
        getRowId={(item) => item.id}
      />

      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> –{' '}
              <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> runs
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
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="ml-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminAffiliateFeedsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <FeedSyncsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
