'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  Search,
  MapPin,
  Clock,
  MessageCircle,
  Plus,
  AlertCircle,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  hotDealsApi,
  HotDeal,
  HotDealFilters,
  CATEGORY_LABELS,
  URGENCY_CONFIG,
  HotDealCategory,
  UrgencyLevel,
} from '@/lib/api/hot-deals';

// Urgency left-border colors
const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  NORMAL: 'border-l-gray-300',
  URGENT: 'border-l-[#CBB57B]',
  EMERGENCY: 'border-l-red-500',
};

// Live countdown (ticks every 60s)
function Countdown({ expiresAt, t }: { expiresAt: string; t: ReturnType<typeof useTranslations> }) {
  const [text, setText] = useState('');
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setText(t('expired'));
        setIsShort(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setIsShort(diff < 2 * 3600000);
      setText(h > 0 ? t('hoursLeft', { hours: h, minutes: m }) : t('minutesLeft', { minutes: m }));
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt, t]);

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${isShort ? 'text-red-500' : 'text-gray-400'}`}
    >
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      {text}
    </span>
  );
}

// Deal card
function HotDealCard({ deal, index }: { deal: HotDeal; index: number }) {
  const t = useTranslations('pages.hotDeals');
  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isUrgent = deal.urgency === 'URGENT';
  const responseCount = deal._count?.responses || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`group relative bg-white rounded-2xl border border-gray-100 border-l-4 ${URGENCY_BORDER[deal.urgency]} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      {/* Emergency glow */}
      {isEmergency && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-red-200 pointer-events-none" />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
          >
            {isEmergency && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
            {isUrgent && <Zap className="w-3 h-3" />}
            {urgencyConfig.label}
          </span>
          <Countdown expiresAt={deal.expiresAt} t={t} />
        </div>

        {/* Title */}
        <Link href={`/hot-deals/${deal.id}`}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2 group-hover:text-[#CBB57B] transition-colors line-clamp-2 leading-snug">
            {deal.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
          {deal.description}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            {CATEGORY_LABELS[deal.category]}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            <MapPin className="w-3 h-3" />
            {deal.city}
            {deal.state ? `, ${deal.state}` : ''}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircle className="w-3.5 h-3.5" />
            {responseCount} {responseCount === 1 ? t('response') : t('responses')}
          </span>
          <Link
            href={`/hot-deals/${deal.id}`}
            className="flex items-center gap-0.5 text-xs font-semibold text-[#CBB57B] hover:text-[#b9a369] transition-colors"
          >
            {t('viewDetails')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-200 p-5 shadow-sm animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-1" />
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-100">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function HotDealsPage() {
  const t = useTranslations('pages.hotDeals');
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HotDealFilters>({});
  const [citySearch, setCitySearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const categories = Object.entries(CATEGORY_LABELS) as [HotDealCategory, string][];

  useEffect(() => {
    async function fetchDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await hotDealsApi.getAll(filters);
        setDeals(response.deals);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeals();
  }, [filters, t]);

  const handleCitySearch = () => {
    if (citySearch.trim()) {
      setFilters((prev) => ({ ...prev, city: citySearch.trim(), page: 1 }));
    } else {
      const { city: _c, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    }
  };

  const clearCityFilter = () => {
    setCitySearch('');
    const { city: _c, ...rest } = filters;
    setFilters(rest);
  };

  const handleCategoryChange = (category: HotDealCategory | '') => {
    if (category) {
      setFilters((prev) => ({ ...prev, category, page: 1 }));
    } else {
      const { category: _cat, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    }
  };

  const clearFilters = () => {
    setFilters({});
    setCitySearch('');
  };

  const hasActiveFilters = !!(filters.category || filters.city);

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-[#f8f8f6]">
        {/* ── HERO ── dark, bold, urgent */}
        <div className="bg-[#111] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
              <div className="max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/80 mb-5">
                  <span className="w-1.5 h-1.5 bg-[#CBB57B] rounded-full animate-pulse" />
                  Urgent Services Marketplace
                </div>

                {/* Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[#CBB57B]/20 rounded-xl border border-[#CBB57B]/30">
                    <Flame className="w-7 h-7 text-[#CBB57B]" />
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                    Hot <span className="text-[#CBB57B]">Deals</span>
                  </h1>
                </div>

                <p className="text-gray-400 text-base leading-relaxed max-w-md">
                  Post your urgent service needs, connect with local providers fast. Only $1 per
                  post.
                </p>

                {/* Stats row */}
                {!isLoading && (
                  <div className="flex items-center gap-5 mt-5">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{pagination.total}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Active deals</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{categories.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Categories</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">$1</p>
                      <p className="text-xs text-gray-500 mt-0.5">Per post</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA — desktop */}
              <Link
                href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                className="hidden sm:inline-flex items-center gap-2.5 px-7 py-4 bg-[#CBB57B] text-black rounded-2xl font-bold text-sm hover:bg-[#b9a369] transition-colors shadow-lg shadow-[#CBB57B]/20 whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('postDeal')}
              </Link>
            </div>
          </div>
        </div>

        {/* ── MOBILE CTA ── */}
        <div className="sm:hidden bg-[#111] px-4 pb-4">
          <Link
            href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#CBB57B] text-black rounded-xl font-bold text-sm hover:bg-[#b9a369] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('postDeal')}
          </Link>
        </div>

        {/* ── FILTERS ── clean white bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
            {/* Search row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/25 focus:border-[#CBB57B] focus:bg-white outline-none transition-all"
                />
                {citySearch && (
                  <button
                    onClick={clearCityFilter}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleCitySearch}
                className="px-5 py-2.5 bg-[#111] text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors flex-shrink-0"
              >
                {t('search')}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  title={t('clear')}
                  className="px-3 py-2.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills — scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  !filters.category
                    ? 'bg-[#111] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(filters.category === key ? '' : key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    filters.category === key
                      ? 'bg-[#CBB57B] text-black'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Active city tag */}
            {filters.city && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                  <MapPin className="w-3 h-3" />
                  {filters.city}
                  <button onClick={clearCityFilter} className="ml-0.5 hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* My deals link */}
          {isAuthenticated && (
            <div className="mb-6 flex justify-end">
              <Link
                href="/hot-deals/my-deals"
                className="flex items-center gap-1 text-sm font-semibold text-[#CBB57B] hover:text-[#b9a369] transition-colors"
              >
                {t('viewMyDeals')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && deals.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-14 text-center">
              <div className="w-16 h-16 bg-[#CBB57B]/10 rounded-2xl mx-auto mb-5 flex items-center justify-center">
                <Flame className="w-8 h-8 text-[#CBB57B]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noDealsFound')}</h3>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                {hasActiveFilters ? t('noDealsMatch') : t('beFirstToPost')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {t('clear')}
                  </button>
                )}
                <Link
                  href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111] text-white rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('postDealShort')}
                </Link>
              </div>
            </div>
          )}

          {/* Deals grid */}
          {!isLoading && !error && deals.length > 0 && (
            <>
              {/* Result count */}
              <p className="text-xs text-gray-400 mb-4 font-medium">
                {pagination.total} deal{pagination.total !== 1 ? 's' : ''} found
                {filters.category && ` in ${CATEGORY_LABELS[filters.category]}`}
                {filters.city && ` near ${filters.city}`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {deals.map((deal, index) => (
                  <HotDealCard key={deal.id} deal={deal} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('previous')}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {t('pageOf', { page: pagination.page, totalPages: pagination.totalPages })}
                  </span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
