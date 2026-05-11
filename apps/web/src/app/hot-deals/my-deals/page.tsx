'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ArrowLeft,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  TrendingUp,
  Zap,
  Calendar,
  ChevronRight,
  Image as ImageIcon,
  Search,
  X,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  hotDealsApi,
  HotDeal,
  CATEGORY_LABELS,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  HotDealStatus,
  UrgencyLevel,
  BudgetType,
} from '@/lib/api/hot-deals';

// ─── Urgency top-bar ─────────────────────────────────────────────────────────

const URGENCY_BAR: Record<UrgencyLevel, string> = {
  NORMAL: 'bg-gray-200',
  URGENT: 'bg-gradient-to-r from-[#CBB57B] to-amber-400',
  EMERGENCY: 'bg-gradient-to-r from-red-500 to-rose-400',
};

const URGENCY_BADGE: Record<UrgencyLevel, { bg: string; text: string }> = {
  NORMAL: { bg: 'bg-gray-100', text: 'text-gray-600' },
  URGENT: { bg: 'bg-amber-50', text: 'text-amber-700' },
  EMERGENCY: { bg: 'bg-red-50', text: 'text-red-700' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeRemaining(
  expiresAt: string,
  t: ReturnType<typeof useTranslations>
): { text: string; isExpired: boolean; isShort: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: t('expired'), isExpired: true, isShort: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const isShort = diff < 2 * 3600000;
  if (h > 0) return { text: t('hoursLeft', { hours: h, minutes: m }), isExpired: false, isShort };
  return { text: t('minutesLeft', { minutes: m }), isExpired: false, isShort };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyDealsPage() {
  const t = useTranslations('pages.hotDealsMyDeals');
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HotDealStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/my-deals');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    async function fetchMyDeals() {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await hotDealsApi.getMyDeals();
        setDeals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyDeals();
  }, [isAuthenticated, t]);

  const handleMarkFulfilled = async (dealId: string) => {
    setActionLoading(dealId);
    try {
      await hotDealsApi.markFulfilled(dealId);
      toast.success(t('markedFulfilled'));
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'FULFILLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToMark'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (dealId: string) => {
    if (!confirm(t('confirmCancel'))) return;
    setActionLoading(dealId);
    try {
      await hotDealsApi.cancel(dealId);
      toast.success(t('dealCancelled'));
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'CANCELLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToCancel'));
    } finally {
      setActionLoading(null);
    }
  };

  // Loading skeleton
  if (!isInitialized || (isLoading && isAuthenticated)) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-[#F8F7F4]">
          <div style={{ backgroundColor: '#0D0D0D' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-4" />
              <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="h-1 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) return null;

  // Counts (always computed from full list)
  const activeDeals = deals.filter((d) => d.status === 'ACTIVE');
  const pendingDeals = deals.filter((d) => d.status === 'PENDING');
  const pastDeals = deals.filter((d) => ['FULFILLED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const totalResponses = deals.reduce((sum, d) => sum + (d._count?.responses || 0), 0);

  // Filtered list
  const filtered = deals.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isFiltered = statusFilter !== 'ALL' || search.trim() !== '';

  // When filtered, show flat list; otherwise grouped sections
  const filteredActive = filtered.filter((d) => d.status === 'ACTIVE');
  const filteredPending = filtered.filter((d) => d.status === 'PENDING');
  const filteredPast = filtered.filter((d) =>
    ['FULFILLED', 'EXPIRED', 'CANCELLED'].includes(d.status)
  );

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-[#F8F7F4]">
        {/* ── Dark header ───────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-4">
              {/* Left */}
              <div className="flex items-center gap-4">
                <Link
                  href="/hot-deals"
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Hot Deals</span>
                </Link>

                <div className="w-px h-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(203,181,123,0.15)',
                      border: '1.5px solid rgba(203,181,123,0.25)',
                    }}
                  >
                    <Flame className="w-5 h-5" style={{ color: '#CBB57B' }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black" style={{ color: '#ffffff' }}>
                      {t('myHotDeals')}
                    </h1>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {t('manageRequests')}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/hot-deals/new"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0"
                style={{ backgroundColor: '#CBB57B', color: '#000' }}
              >
                <Plus className="w-4 h-4" />
                {t('postNewDeal')}
              </Link>
            </div>

            {/* Stats row */}
            {deals.length > 0 && (
              <div
                className="flex items-center gap-6 mt-7 pt-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                {[
                  {
                    value: activeDeals.length,
                    label: 'Active',
                    color: '#4ade80',
                    bg: 'rgba(74,222,128,0.12)',
                  },
                  {
                    value: pendingDeals.length,
                    label: 'Pending',
                    color: '#fbbf24',
                    bg: 'rgba(251,191,36,0.12)',
                  },
                  {
                    value: totalResponses,
                    label: 'Responses',
                    color: '#CBB57B',
                    bg: 'rgba(203,181,123,0.12)',
                  },
                  {
                    value: pastDeals.length,
                    label: 'Past',
                    color: 'rgba(255,255,255,0.4)',
                    bg: 'rgba(255,255,255,0.06)',
                  },
                ].map(({ value, label, color, bg }) => (
                  <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: bg }}
                    >
                      <span className="text-sm font-black" style={{ color }}>
                        {value}
                      </span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        {deals.length > 0 && (
          <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 py-3">
                {/* Search — always visible, never scrolls */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search deals…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-40 pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B]/50 focus:bg-white transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

                {/* Scrollable pills — Clear button is OUTSIDE this scroll zone */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                  {(
                    [
                      {
                        value: 'ALL',
                        label: 'All',
                        count: deals.length,
                        activeClass: 'bg-gray-900 text-white',
                        badgeClass: 'bg-white/20 text-white',
                      },
                      {
                        value: 'ACTIVE',
                        label: 'Active',
                        count: activeDeals.length,
                        activeClass: 'bg-green-600 text-white',
                        badgeClass: 'bg-white/25 text-white',
                      },
                      {
                        value: 'PENDING',
                        label: 'Pending',
                        count: pendingDeals.length,
                        activeClass: 'bg-amber-500 text-white',
                        badgeClass: 'bg-white/25 text-white',
                      },
                      {
                        value: 'FULFILLED',
                        label: 'Fulfilled',
                        count: deals.filter((d) => d.status === 'FULFILLED').length,
                        activeClass: 'bg-blue-600 text-white',
                        badgeClass: 'bg-white/25 text-white',
                      },
                      {
                        value: 'EXPIRED',
                        label: 'Expired',
                        count: deals.filter((d) => d.status === 'EXPIRED').length,
                        activeClass: 'bg-gray-500 text-white',
                        badgeClass: 'bg-white/25 text-white',
                      },
                      {
                        value: 'CANCELLED',
                        label: 'Cancelled',
                        count: deals.filter((d) => d.status === 'CANCELLED').length,
                        activeClass: 'bg-red-500 text-white',
                        badgeClass: 'bg-white/25 text-white',
                      },
                    ] as {
                      value: HotDealStatus | 'ALL';
                      label: string;
                      count: number;
                      activeClass: string;
                      badgeClass: string;
                    }[]
                  ).map(({ value, label, count, activeClass, badgeClass }) => {
                    const isSelected = statusFilter === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setStatusFilter(value)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isSelected ? activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                        {count > 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? badgeClass
                                : 'bg-white text-gray-500 border border-gray-200'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Clear — always visible at the right, never inside scroll zone */}
                {isFiltered && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearch('');
                    }}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {deals.length === 0 && !isLoading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm py-20 px-8 text-center"
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #CBB57B22, #FEF3C722)' }}
              >
                <Flame className="w-10 h-10" style={{ color: '#CBB57B' }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('noDealsYet')}</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                {t('noDealsDescription')}
              </p>
              <Link
                href="/hot-deals/new"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#CBB57B', color: '#000' }}
              >
                <Plus className="w-4 h-4" />
                {t('postFirstDeal')}
              </Link>
            </motion.div>
          )}

          {/* No filter results */}
          {isFiltered && filtered.length === 0 && deals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 px-8 text-center"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800 mb-1">No deals match your filters</p>
              <p className="text-sm text-gray-400 mb-5">
                Try a different status or clear the search.
              </p>
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearch('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            </motion.div>
          )}

          {/* Pending */}
          {filteredPending.length > 0 && (
            <Section
              icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
              label={t('pendingPayment', { count: filteredPending.length })}
              accent="text-amber-600"
            >
              {filteredPending.map((deal, i) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  index={i}
                  actionLoading={actionLoading}
                  onCancel={handleCancel}
                  t={t}
                />
              ))}
            </Section>
          )}

          {/* Active */}
          {filteredActive.length > 0 && (
            <Section
              icon={<Flame className="w-4 h-4" style={{ color: '#CBB57B' }} />}
              label={t('activeDeals', { count: filteredActive.length })}
              accent="text-gray-700"
            >
              {filteredActive.map((deal, i) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  index={i}
                  actionLoading={actionLoading}
                  onMarkFulfilled={handleMarkFulfilled}
                  onCancel={handleCancel}
                  t={t}
                />
              ))}
            </Section>
          )}

          {/* Past */}
          {filteredPast.length > 0 && (
            <Section
              icon={<Clock className="w-4 h-4 text-gray-400" />}
              label={t('pastDeals', { count: filteredPast.length })}
              accent="text-gray-500"
            >
              {filteredPast.map((deal, i) => (
                <DealCard key={deal.id} deal={deal} index={i} isPast t={t} />
              ))}
            </Section>
          )}
        </div>

        {/* Mobile FAB */}
        <div className="sm:hidden fixed bottom-6 right-6 z-30">
          <Link
            href="/hot-deals/new"
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all"
            style={{ backgroundColor: '#CBB57B', color: '#000' }}
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  label,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>{label}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  deal,
  index = 0,
  actionLoading,
  onMarkFulfilled,
  onCancel,
  isPast,
  t,
}: {
  deal: HotDeal;
  index?: number;
  actionLoading?: string | null;
  onMarkFulfilled?: (id: string) => void;
  onCancel?: (id: string) => void;
  isPast?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const urgencyBadge = URGENCY_BADGE[deal.urgency];
  const urgencyBar = URGENCY_BAR[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];
  const timeInfo = getTimeRemaining(deal.expiresAt, t);
  const isThisDealLoading = actionLoading === deal.id;
  const responseCount = deal._count?.responses || 0;
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isUrgent = deal.urgency === 'URGENT';
  const images = deal.images as string[] | undefined;
  const firstImage = images?.[0];
  const budget = deal.budget;
  const budgetType = deal.budgetType as BudgetType | null | undefined;

  // Status pill styling
  const statusPill: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-50', text: 'text-green-700' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
    FULFILLED: { bg: 'bg-blue-50', text: 'text-blue-700' },
    EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-500' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const sp = statusPill[deal.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
        isPast ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Top urgency bar */}
      <div className={`h-1 w-full ${urgencyBar}`} />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Thumbnail */}
          {firstImage && (
            <div className="relative w-full sm:w-24 h-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={firstImage} alt={deal.title} className="w-full h-full object-cover" />
              {images && images.length > 1 && (
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/55 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <ImageIcon className="w-2.5 h-2.5" />
                  {images.length}
                </div>
              )}
            </div>
          )}
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${sp.bg} ${sp.text}`}
              >
                {statusConfig.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${urgencyBadge.bg} ${urgencyBadge.text}`}
              >
                {isEmergency && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
                )}
                {isUrgent && <Zap className="w-3 h-3 flex-shrink-0" />}
                {URGENCY_CONFIG[deal.urgency].label}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {CATEGORY_LABELS[deal.category]}
              </span>
              {(budget || budgetType) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                  <DollarSign className="w-3 h-3" />
                  {budget
                    ? `${budget % 1 === 0 ? budget : budget.toFixed(2)}${budgetType === 'HOURLY' ? '/hr' : ''}`
                    : 'Negotiable'}
                </span>
              )}
            </div>

            {/* Title */}
            <Link href={`/hot-deals/${deal.id}`}>
              <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-[#CBB57B] transition-colors mb-1.5 line-clamp-1">
                {deal.title}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
              {deal.description}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {deal.city}
                {deal.state ? `, ${deal.state}` : ''}
              </span>
              <span
                className={`flex items-center gap-1.5 ${responseCount > 0 ? 'font-semibold text-[#CBB57B]' : ''}`}
              >
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {t('responsesCount', { count: responseCount })}
              </span>
              {deal.status === 'ACTIVE' && !timeInfo.isExpired && (
                <span
                  className={`flex items-center gap-1.5 font-semibold ${timeInfo.isShort ? 'text-red-500' : 'text-[#8B7355]'}`}
                >
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {timeInfo.text}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {formatDate(deal.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2 flex-shrink-0 sm:min-w-[108px]">
            {/* View */}
            <Link
              href={`/hot-deals/${deal.id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('view')}</span>
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Link>

            {/* Fulfill */}
            {deal.status === 'ACTIVE' && onMarkFulfilled && (
              <button
                onClick={() => onMarkFulfilled(deal.id)}
                disabled={isThisDealLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-all disabled:opacity-50"
              >
                {isThisDealLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>{t('fulfill')}</span>
              </button>
            )}

            {/* Cancel */}
            {(deal.status === 'ACTIVE' || deal.status === 'PENDING') && onCancel && (
              <button
                onClick={() => onCancel(deal.id)}
                disabled={isThisDealLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                {isThisDealLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{t('cancel')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
