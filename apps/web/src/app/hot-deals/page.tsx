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
  NORMAL: 'border-l-gray-200',
  URGENT: 'border-l-[#CBB57B]',
  EMERGENCY: 'border-l-red-500',
};

// Live countdown that ticks every minute
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
  const responseCount = deal._count?.responses || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`group bg-white rounded-xl border border-gray-200 border-l-4 ${URGENCY_BORDER[deal.urgency]} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300${isEmergency ? ' ring-1 ring-red-100' : ''}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
        >
          {isEmergency && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
          {urgencyConfig.label}
        </span>
        <Countdown expiresAt={deal.expiresAt} t={t} />
      </div>

      {/* Title */}
      <Link href={`/hot-deals/${deal.id}`}>
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-[#CBB57B] transition-colors line-clamp-2 leading-snug">
          {deal.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{deal.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {CATEGORY_LABELS[deal.category]}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
    </motion.div>
  );
}

// Skeleton loading card
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-24 bg-gray-200 rounded" />
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
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

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
      const { city: _city, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    }
  };

  const clearCityFilter = () => {
    setCitySearch('');
    const { city: _city, ...rest } = filters;
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#CBB57B] to-[#9a8a5c] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Flame className="w-7 h-7" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
                </div>
                <p className="text-base text-white/85 max-w-lg leading-relaxed">{t('subtitle')}</p>
                {!isLoading && pagination.total > 0 && (
                  <p className="mt-2 text-sm text-white/70 font-medium">
                    {pagination.total} active deal{pagination.total !== 1 ? 's' : ''} right now
                  </p>
                )}
              </div>
              <Link
                href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                {t('postDeal')}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden px-4 py-3 bg-white border-b">
          <Link
            href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('postDeal')}
          </Link>
        </div>

        {/* Sticky Filter Bar */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
            {/* Search row */}
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-shadow"
                />
                {citySearch && (
                  <button
                    onClick={clearCityFilter}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleCitySearch}
                className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex-shrink-0"
              >
                {t('search')}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                  title={t('clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills — horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  !filters.category
                    ? 'bg-[#CBB57B] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(filters.category === key ? '' : key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filters.category === key
                      ? 'bg-[#CBB57B] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Active city filter tag */}
            {filters.city && (
              <div className="flex items-center gap-2 pt-0.5">
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

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* My deals link */}
          {isAuthenticated && (
            <div className="mb-6 flex justify-end">
              <Link
                href="/hot-deals/my-deals"
                className="flex items-center gap-1 text-sm font-medium text-[#CBB57B] hover:text-[#b9a369] transition-colors"
              >
                {t('viewMyDeals')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Loading skeleton grid */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="px-5 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && deals.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noDealsFound')}</h3>
              <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                {hasActiveFilters ? t('noDealsMatch') : t('beFirstToPost')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {t('clear')}
                  </button>
                )}
                <Link
                  href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('postDealShort')}
                </Link>
              </div>
            </div>
          )}

          {/* Deals grid — fixed condition (was inverted before) */}
          {!isLoading && !error && deals.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal, index) => (
                  <HotDealCard key={deal.id} deal={deal} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-10">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('previous')}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {t('pageOf', { page: pagination.page, totalPages: pagination.totalPages })}
                  </span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
