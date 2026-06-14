'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useFeedSyncs, useAffiliateAdvertisers, useAffiliateProducts } from '@/hooks/use-affiliate';
import { affiliateApi } from '@/lib/api/affiliate';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/date-format';
import { toast } from '@/lib/utils/toast';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  X,
  Package,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  SkipForward,
  Database,
  ArrowRight,
} from 'lucide-react';
import type {
  AwinFeedSync,
  AffiliateAdvertiser,
  AllFeedsSyncSummary,
  FeedSyncResult,
} from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncStatusKey = 'success' | 'partial' | 'failed' | 'skipped' | string;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; dot: string; badge: string; label: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Success',
  },
  partial: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Partial',
  },
  failed: {
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Failed',
  },
  skipped: {
    icon: <SkipForward className="w-4 h-4 text-gray-400" />,
    dot: 'bg-gray-300',
    badge: 'bg-gray-50 text-gray-500 border-gray-200',
    label: 'Skipped',
  },
};

function getStatusConfig(status: SyncStatusKey) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.skipped;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status?: string }) {
  const dot = status ? getStatusConfig(status).dot : 'bg-gray-200';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />;
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'green' | 'red' | 'amber' | 'blue';
}) {
  const accentCls =
    {
      green: 'text-green-600',
      red: 'text-red-600',
      amber: 'text-amber-600',
      blue: 'text-blue-600',
    }[accent ?? 'blue'] ?? 'text-gray-900';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className="p-2.5 bg-gray-50 rounded-lg flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accentCls}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync result panel — appears after manual sync
// ---------------------------------------------------------------------------

function SyncResultPanel({
  result,
  advertiserMap,
  onDismiss,
}: {
  result: AllFeedsSyncSummary | FeedSyncResult;
  advertiserMap: Map<string, string>;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSummary = 'results' in result;

  const totalUpserted = isSummary ? result.totalUpserted : result.productsUpserted;
  const totalErrors = isSummary ? result.totalErrors : result.errors;
  const isClean = totalErrors === 0;
  const rows = isSummary ? result.results : [result];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`rounded-xl border p-4 ${
        isClean ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {isClean ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-semibold text-sm ${isClean ? 'text-green-800' : 'text-amber-800'}`}>
              Sync complete — {totalUpserted.toLocaleString()} products upserted
              {totalErrors > 0 && `, ${totalErrors} errors`}
            </p>
            {isSummary && (
              <p className="text-xs text-gray-500 mt-0.5">
                {result.advertisersWithFeed} advertiser{result.advertisersWithFeed !== 1 ? 's' : ''}{' '}
                with feeds
                {result.advertisersWithoutFeed > 0 &&
                  ` · ${result.advertisersWithoutFeed} without feeds`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {rows.length > 1 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Show details
                </>
              )}
            </button>
          )}
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(expanded || rows.length === 1) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-3 divide-y divide-white/60 rounded-lg overflow-hidden border border-white/40">
              {rows.map((row, i) => {
                const cfg = getStatusConfig(row.status);
                const advName = row.advertiserId
                  ? (advertiserMap.get(row.advertiserId) ?? row.awinMerchantId)
                  : row.awinMerchantId;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-white/70 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {cfg.icon}
                      <span className="font-medium text-gray-800">{advName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="text-green-700 font-medium">
                        ↑ {row.productsUpserted.toLocaleString()}
                      </span>
                      {row.errors > 0 && (
                        <span className="text-red-600 font-medium">
                          {row.errors} error{row.errors !== 1 ? 's' : ''}
                        </span>
                      )}
                      {row.feedId && (
                        <span className="text-gray-400 font-mono">#{row.feedId.slice(-6)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Advertiser health card
// ---------------------------------------------------------------------------

function AdvertiserHealthCard({
  advertiser,
  lastSync,
  syncingMerchant,
  onSync,
  advertiserSyncResults,
}: {
  advertiser: AffiliateAdvertiser;
  lastSync?: AwinFeedSync;
  syncingMerchant: string | null;
  onSync: (awinMerchantId: string, name: string) => void;
  advertiserSyncResults: Record<string, FeedSyncResult>;
}) {
  const inlineResult = advertiserSyncResults[advertiser.id];
  const isSyncing = syncingMerchant === advertiser.awinMerchantId;
  const status = inlineResult?.status ?? lastSync?.status;
  const upserted = inlineResult?.productsUpserted ?? lastSync?.productsUpserted;
  const lastTime = lastSync?.startedAt;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={status} />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{advertiser.name}</p>
            <p className="text-xs text-gray-400 font-mono">{advertiser.awinMerchantId}</p>
          </div>
        </div>
        <button
          onClick={() => onSync(advertiser.awinMerchantId, advertiser.name)}
          disabled={!!syncingMerchant}
          title="Sync this advertiser"
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-300" />
          {lastTime ? (
            <span title={formatDateTime(lastTime)}>{formatRelativeTime(lastTime)}</span>
          ) : (
            <span className="text-gray-300">Never synced</span>
          )}
        </div>
        {upserted !== undefined && (
          <span className="font-medium text-gray-700">{upserted.toLocaleString()} products</span>
        )}
      </div>

      {status && <StatusBadge status={status} />}

      {/* Inline result for just-synced */}
      {inlineResult && (
        <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
          ↑ {inlineResult.productsUpserted.toLocaleString()} upserted
          {inlineResult.errors > 0 && (
            <span className="text-red-500 ml-2">{inlineResult.errors} errors</span>
          )}
        </div>
      )}

      <Link
        href="/admin/affiliate/products"
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors self-start"
      >
        View products <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History row — expandable error detail
// ---------------------------------------------------------------------------

function HistoryRow({
  sync,
  advertiserMap,
}: {
  sync: AwinFeedSync;
  advertiserMap: Map<string, string>;
}) {
  const [showError, setShowError] = useState(false);
  const cfg = getStatusConfig(sync.status);
  const advName = sync.advertiserId ? (advertiserMap.get(sync.advertiserId) ?? '—') : '—';

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{advName}</p>
            {sync.awinMerchantId && (
              <p className="text-xs text-gray-400 font-mono">{sync.awinMerchantId}</p>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {cfg.icon}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-semibold text-green-700">
            {sync.productsUpserted.toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm text-gray-400">{sync.productsSkipped.toLocaleString()}</span>
        </td>
        <td className="px-4 py-3 text-right">
          {sync.errors > 0 ? (
            <button
              onClick={() => setShowError((s) => !s)}
              className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 ml-auto"
            >
              {sync.errors}
              {showError ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="text-sm text-gray-300">0</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-gray-400">
            {formatDuration(sync.startedAt, sync.completedAt)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className="text-xs text-gray-500 cursor-default"
            title={formatDateTime(sync.startedAt)}
          >
            {formatRelativeTime(sync.startedAt)}
          </span>
        </td>
      </tr>
      {showError && sync.errorDetail && (
        <tr className="bg-red-50">
          <td colSpan={7} className="px-4 py-2">
            <p className="text-xs text-red-700 font-mono break-all">{sync.errorDetail}</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function FeedSyncsContent() {
  // Fetch recent syncs for health panel + stats (up to 200)
  const healthParams = useMemo(() => ({ limit: 100, page: 1 }), []);
  const {
    syncs: allSyncs,
    loading: healthLoading,
    refetch: refetchHealth,
  } = useFeedSyncs(healthParams);

  // Paginated history
  const [page, setPage] = useState(1);
  const [advertiserIdFilter, setAdvertiserIdFilter] = useState('');
  const limit = 20;

  const historyParams = useMemo(
    () => ({ page, limit, advertiserId: advertiserIdFilter || undefined }),
    [page, advertiserIdFilter]
  );
  const {
    syncs: historySyncs,
    pagination,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useFeedSyncs(historyParams);

  const refetchAll = useCallback(() => {
    refetchHealth();
    refetchHistory();
  }, [refetchHealth, refetchHistory]);

  const { advertisers } = useAffiliateAdvertisers(useMemo(() => ({ limit: 100 }), []));

  // Total feed products in DB (live count)
  const { pagination: feedProductPagination } = useAffiliateProducts(
    useMemo(() => ({ fulfillmentSource: 'FEED' as const, limit: 1 }), [])
  );

  const advertiserMap = useMemo(
    () => new Map(advertisers.map((a) => [a.id, a.name])),
    [advertisers]
  );

  // ---------------------------------------------------------------------------
  // Derived stats from allSyncs (most recent 100 runs)
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    if (!allSyncs.length) return null;

    const latestTime = new Date(allSyncs[0].startedAt).getTime();
    // Batch = runs started within 5 minutes of the most recent
    const batch = allSyncs.filter(
      (s) => Math.abs(new Date(s.startedAt).getTime() - latestTime) < 5 * 60 * 1000
    );

    return {
      lastSync: allSyncs[0].startedAt,
      lastSyncFull: formatDateTime(allSyncs[0].startedAt),
      batchUpserted: batch.reduce((a, s) => a + s.productsUpserted, 0),
      batchErrors: batch.reduce((a, s) => a + s.errors, 0),
      batchAdvertisers: new Set(batch.filter((s) => s.advertiserId).map((s) => s.advertiserId!))
        .size,
    };
  }, [allSyncs]);

  // Latest sync per advertiser (for health panel)
  const advertiserLatestSync = useMemo(() => {
    const map = new Map<string, AwinFeedSync>();
    for (const sync of [...allSyncs].reverse()) {
      if (sync.advertiserId) map.set(sync.advertiserId, sync);
    }
    // Re-process in forward order so latest wins
    for (const sync of allSyncs) {
      if (sync.advertiserId) map.set(sync.advertiserId, sync);
    }
    return map;
  }, [allSyncs]);

  // ---------------------------------------------------------------------------
  // Sync actions
  // ---------------------------------------------------------------------------

  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<AllFeedsSyncSummary | FeedSyncResult | null>(null);
  const [syncingMerchant, setSyncingMerchant] = useState<string | null>(null);
  const [advertiserSyncResults, setAdvertiserSyncResults] = useState<
    Record<string, FeedSyncResult>
  >({});

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setSyncResult(null);
    try {
      const result = await affiliateApi.triggerFeedSync();
      setSyncResult(result);
      refetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Feed sync failed.');
    } finally {
      setSyncingAll(false);
    }
  }, [refetchAll]);

  const handleSyncAdvertiser = useCallback(
    async (awinMerchantId: string, name: string) => {
      const advertiser = advertisers.find((a) => a.awinMerchantId === awinMerchantId);
      setSyncingMerchant(awinMerchantId);
      try {
        const result = await affiliateApi.triggerFeedSync(awinMerchantId);
        const r = result as FeedSyncResult;
        if (advertiser) {
          setAdvertiserSyncResults((prev) => ({ ...prev, [advertiser.id]: r }));
        }
        toast.success(`${name} — ${r.productsUpserted.toLocaleString()} products synced`, {
          duration: 4000,
        });
        refetchAll();
      } catch (err) {
        toast.error(`${name}: ${err instanceof Error ? err.message : 'Sync failed.'}`);
      } finally {
        setSyncingMerchant(null);
      }
    },
    [advertisers, refetchAll]
  );

  const hasFilter = !!advertiserIdFilter;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feed Syncs</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Automated Awin product feed ingestion · nightly at 02:00 Paris time
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll || !!syncingMerchant}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          {syncingAll ? 'Syncing…' : 'Sync All Feeds'}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sync result panel                                                   */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {syncResult && (
          <SyncResultPanel
            result={syncResult}
            advertiserMap={advertiserMap}
            onDismiss={() => setSyncResult(null)}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Stats row                                                           */}
      {/* ------------------------------------------------------------------ */}
      {!healthLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Clock className="w-5 h-5 text-gray-400" />}
            label="Last Sync"
            value={formatRelativeTime(stats.lastSync)}
            sub={stats.lastSyncFull}
          />
          <StatCard
            icon={<Package className="w-5 h-5 text-blue-500" />}
            label="Products (last batch)"
            value={stats.batchUpserted.toLocaleString()}
            accent="blue"
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-green-500" />}
            label="Advertisers synced"
            value={stats.batchAdvertisers}
            sub={`across ${advertisers.length} active`}
            accent="green"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            label="Errors (last batch)"
            value={stats.batchErrors}
            accent={stats.batchErrors > 0 ? 'red' : 'green'}
          />
          <StatCard
            icon={<Database className="w-5 h-5 text-purple-500" />}
            label="Feed Products (total)"
            value={feedProductPagination.total.toLocaleString()}
            accent="blue"
          />
        </div>
      )}

      {healthLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Advertiser health grid                                              */}
      {/* ------------------------------------------------------------------ */}
      {advertisers.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Advertiser Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {advertisers.map((adv) => (
              <AdvertiserHealthCard
                key={adv.id}
                advertiser={adv}
                lastSync={advertiserLatestSync.get(adv.id)}
                syncingMerchant={syncingMerchant}
                onSync={handleSyncAdvertiser}
                advertiserSyncResults={advertiserSyncResults}
              />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sync history                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <h2 className="text-base font-semibold text-gray-900">
            Sync History
            {pagination.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {pagination.total} runs
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={advertiserIdFilter}
              onChange={(e) => {
                setAdvertiserIdFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CBB57B] bg-white"
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
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {historyError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-3">
            {historyError}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {historyLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading history…</p>
            </div>
          ) : historySyncs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {hasFilter ? 'No sync runs for this advertiser.' : 'No feed syncs yet.'}
              </p>
              {!hasFilter && (
                <p className="text-xs text-gray-400 mt-1">
                  Click &ldquo;Sync All Feeds&rdquo; above to run the first sync.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      'Advertiser',
                      'Status',
                      'Upserted',
                      'Skipped',
                      'Errors',
                      'Duration',
                      'Started',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                          ['Upserted', 'Skipped', 'Errors'].includes(h) ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historySyncs.map((sync) => (
                    <HistoryRow key={sync.id} sync={sync} advertiserMap={advertiserMap} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span>–
              <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
                      className={`px-3 py-1.5 text-sm border rounded-lg font-medium ${
                        p === page
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === 2 && page > 3)
                  return (
                    <span key={p} className="px-1 text-gray-300">
                      …
                    </span>
                  );
                if (p === pagination.totalPages - 1 && page < pagination.totalPages - 2)
                  return (
                    <span key={p} className="px-1 text-gray-300">
                      …
                    </span>
                  );
                return null;
              })}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
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
