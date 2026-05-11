'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Home,
  Car,
  Truck,
  Monitor,
  BookOpen,
  Activity,
  Sparkles,
  Heart,
  Star,
  MoreHorizontal,
  Users,
  ArrowRight,
  Image as ImageIcon,
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

// ─── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  HotDealCategory,
  { Icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  CHILDCARE: { Icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
  HOME_SERVICES: { Icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
  AUTOMOTIVE: { Icon: Car, color: 'text-slate-600', bg: 'bg-slate-50' },
  PET_SERVICES: { Icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  MOVING_DELIVERY: { Icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
  TECH_SUPPORT: { Icon: Monitor, color: 'text-violet-600', bg: 'bg-violet-50' },
  TUTORING: { Icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  HEALTH_WELLNESS: { Icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
  CLEANING: { Icon: Sparkles, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  OTHER: { Icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50' },
};

// ─── Urgency card styles ───────────────────────────────────────────────────────

const URGENCY_CARD: Record<UrgencyLevel, { topBar: string; badge: string; badgeText: string }> = {
  NORMAL: {
    topBar: 'bg-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    badgeText: '',
  },
  URGENT: {
    topBar: 'bg-gradient-to-r from-[#CBB57B] to-amber-400',
    badge: 'bg-amber-50 text-amber-700',
    badgeText: '',
  },
  EMERGENCY: {
    topBar: 'bg-gradient-to-r from-red-500 to-rose-400',
    badge: 'bg-red-50 text-red-700',
    badgeText: '',
  },
};

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [text, setText] = useState('');
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setText('Expired');
        setIsShort(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setIsShort(diff < 2 * 3600000);
      setText(h > 0 ? `${h}h ${m}m` : `${m}m left`);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium tabular-nums ${isShort ? 'text-red-500' : 'text-gray-400'}`}
    >
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      {text}
    </span>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function HotDealCard({ deal, index }: { deal: HotDeal; index: number }) {
  const uc = URGENCY_CARD[deal.urgency];
  const catConf = CATEGORY_CONFIG[deal.category];
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isUrgent = deal.urgency === 'URGENT';
  const responseCount = deal._count?.responses ?? 0;
  const images = (deal as any).images as string[] | undefined;
  const firstImage = images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Top urgency bar */}
      <div className={`h-1 w-full flex-shrink-0 ${uc.topBar}`} />

      {/* Image */}
      {firstImage && (
        <div className="relative h-40 overflow-hidden bg-gray-50">
          <img
            src={firstImage}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {images && images.length > 1 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
              <ImageIcon className="w-3 h-3" />
              {images.length}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Urgency + timer */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${uc.badge}`}
          >
            {isEmergency && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
            )}
            {isUrgent && <Zap className="w-3 h-3 flex-shrink-0" />}
            {URGENCY_CONFIG[deal.urgency].label}
          </span>
          <Countdown expiresAt={deal.expiresAt} />
        </div>

        {/* Title */}
        <Link href={`/hot-deals/${deal.id}`} className="block mb-2">
          <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-[#CBB57B] transition-colors line-clamp-2 leading-snug">
            {deal.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed flex-1 mb-4">
          {deal.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${catConf.bg} ${catConf.color}`}
          >
            <catConf.Icon className="w-3 h-3" />
            {CATEGORY_LABELS[deal.category]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
            <MapPin className="w-3 h-3" />
            {deal.city}
            {deal.state ? `, ${deal.state}` : ''}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1 text-xs font-medium ${responseCount > 0 ? 'text-[#CBB57B]' : 'text-gray-400'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {deal.user.firstName}
            </span>
          </div>
          <Link
            href={`/hot-deals/${deal.id}`}
            className="flex items-center gap-1 text-xs font-bold text-[#CBB57B] hover:text-amber-600 transition-colors group/link"
          >
            View
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
      <div className="h-1 bg-gray-200" />
      <div className="p-5">
        <div className="flex justify-between mb-3">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-4/5 bg-gray-200 rounded mb-1.5" />
        <div className="h-5 w-3/5 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1.5" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotDealsPage() {
  const t = useTranslations('pages.hotDeals');
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HotDealFilters>({});
  const [citySearch, setCitySearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const searchRef = useRef<HTMLInputElement>(null);

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
      <div className="min-h-screen bg-[#F8F7F4]">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Left: Brand block */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(203,181,123,0.15)',
                    border: '1.5px solid rgba(203,181,123,0.25)',
                  }}
                >
                  <Flame className="w-7 h-7" style={{ color: '#CBB57B' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1
                      className="text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: '#ffffff' }}
                    >
                      Hot Deals
                    </h1>
                    {/* Live indicator */}
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: '#4ade80',
                      }}
                    >
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      {isLoading ? '…' : pagination.total} live
                    </span>
                  </div>
                  <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Urgent service requests · Connect with local providers instantly ·{' '}
                    <span className="font-semibold" style={{ color: '#CBB57B' }}>
                      Only $1 to post
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: CTA + search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 flex-shrink-0">
                {/* City search */}
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search by city…"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                    className="w-full sm:w-52 pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                    }}
                  />
                  <AnimatePresence>
                    {citySearch && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={clearCityFilter}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleCitySearch}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>

                <Link
                  href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0"
                  style={{ backgroundColor: '#CBB57B', color: '#000' }}
                >
                  <Plus className="w-4 h-4" />
                  Post a Deal — $1
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY CATEGORY BAR ───────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* All */}
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !filters.category
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                All
              </button>

              {categories.map(([key, label]) => {
                const conf = CATEGORY_CONFIG[key];
                const isActive = filters.category === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(isActive ? '' : key)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? `${conf.bg} ${conf.color} ring-1 ring-current/20`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <conf.Icon className="w-3 h-3" />
                    {label}
                  </button>
                );
              })}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors ml-auto"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ───────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toolbar row */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {!isLoading && !error && (
                <p className="text-sm text-gray-500">
                  <span className="text-gray-900 font-bold">{pagination.total}</span>{' '}
                  {pagination.total === 1 ? 'deal' : 'deals'}
                  {filters.category && (
                    <>
                      {' '}
                      in{' '}
                      <span className="font-semibold" style={{ color: '#CBB57B' }}>
                        {CATEGORY_LABELS[filters.category]}
                      </span>
                    </>
                  )}
                  {filters.city && (
                    <>
                      {' '}
                      near{' '}
                      <span className="font-semibold" style={{ color: '#CBB57B' }}>
                        {filters.city}
                      </span>
                    </>
                  )}
                </p>
              )}

              {filters.city && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: '#CBB57B18',
                    color: '#8B7355',
                    borderColor: '#CBB57B33',
                  }}
                >
                  <MapPin className="w-3 h-3" />
                  {filters.city}
                  <button onClick={clearCityFilter} className="hover:opacity-70 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {isAuthenticated && (
              <Link
                href="/hot-deals/my-deals"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                My Deals
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-gray-800 font-semibold mb-1">Could not load deals</p>
              <p className="text-sm text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          )}

          {/* Empty */}
          {!isLoading && !error && deals.length === 0 && (
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {hasActiveFilters ? 'No matches found' : 'No active deals yet'}
              </h3>
              <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'Try different filters or search in another city.'
                  : 'Be the first to post a service request in your area.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear filters
                  </button>
                )}
                <Link
                  href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#CBB57B', color: '#000' }}
                >
                  <Plus className="w-4 h-4" />
                  Post a Deal
                </Link>
              </div>
            </motion.div>
          )}

          {/* Grid */}
          {!isLoading && !error && deals.length > 0 && (
            <>
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
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    ← Previous
                  </button>
                  <span className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium shadow-sm">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next →
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
