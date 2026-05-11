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
  Filter,
  TrendingUp,
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

// ─── Category config (icons + colors) ────────────────────────────────────────

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

const URGENCY_STYLES: Record<
  UrgencyLevel,
  { bar: string; badge: string; badgeText: string; cardBg: string }
> = {
  NORMAL: {
    bar: 'bg-gray-300',
    badge: 'bg-gray-100 text-gray-700',
    badgeText: 'text-gray-600',
    cardBg: 'bg-white',
  },
  URGENT: {
    bar: 'bg-gradient-to-b from-[#CBB57B] to-amber-400',
    badge: 'bg-[#CBB57B]/15 text-[#8B7355]',
    badgeText: 'text-[#CBB57B]',
    cardBg: 'bg-white',
  },
  EMERGENCY: {
    bar: 'bg-gradient-to-b from-red-500 to-red-400',
    badge: 'bg-red-50 text-red-700',
    badgeText: 'text-red-600',
    cardBg: 'bg-white',
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
      setText(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
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
  const urgencyStyle = URGENCY_STYLES[deal.urgency];
  const catConf = CATEGORY_CONFIG[deal.category];
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isUrgent = deal.urgency === 'URGENT';
  const responseCount = deal._count?.responses ?? 0;
  const images = (deal as any).images as string[] | undefined;
  const firstImage = images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 overflow-hidden"
    >
      {/* Left urgency bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgencyStyle.bar} rounded-l-2xl`} />

      {/* Emergency pulse ring */}
      {isEmergency && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-red-200 animate-pulse" />
        </div>
      )}

      {/* Image header */}
      {firstImage ? (
        <div className="ml-1 h-36 overflow-hidden bg-gray-100">
          <img
            src={firstImage}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {images && images.length > 1 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
              <ImageIcon className="w-3 h-3" />
              {images.length}
            </div>
          )}
        </div>
      ) : null}

      <div className="pl-4 pr-4 pt-4 pb-0 flex-1 flex flex-col">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${urgencyStyle.badge}`}
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
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed flex-1">
          {deal.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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
      </div>

      {/* Footer */}
      <div className="ml-4 mr-4 mb-4 flex items-center justify-between pt-3 border-t border-gray-100">
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
          View Details
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
      <div className="ml-1 h-1 bg-gray-200" />
      <div className="p-5">
        <div className="flex justify-between mb-3">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-4/5 bg-gray-200 rounded mb-1.5" />
        <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
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
        <div className="relative bg-[#0D0D0D] overflow-hidden">
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Gold glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#CBB57B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#CBB57B]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left: copy */}
              <div className="flex-1 max-w-2xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 text-xs font-semibold text-white/70 mb-5">
                  <span className="w-1.5 h-1.5 bg-[#CBB57B] rounded-full animate-pulse" />
                  Live Urgent Services Marketplace
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#CBB57B]/30 to-[#CBB57B]/10 rounded-2xl border border-[#CBB57B]/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#CBB57B]/10">
                    <Flame className="w-7 h-7 text-[#CBB57B]" />
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
                    Hot <span className="text-[#CBB57B]">Deals</span>
                  </h1>
                </div>

                <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-md">
                  Post urgent service requests, connect with local providers instantly.
                  <span className="text-[#CBB57B] font-semibold"> Only $1 per post.</span>
                </p>

                {/* Stats */}
                {!isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-0 mb-8"
                  >
                    {[
                      {
                        value: pagination.total.toString(),
                        label: 'Active deals',
                        icon: TrendingUp,
                      },
                      { value: categories.length.toString(), label: 'Categories', icon: Filter },
                      { value: '$1', label: 'Per post', icon: Flame },
                    ].map(({ value, label, icon: Icon }, i) => (
                      <div key={label} className="flex items-center">
                        {i > 0 && <div className="w-px h-8 bg-white/10 mx-5" />}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-white/6 rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#CBB57B]" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white leading-none">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Search bar */}
                <div className="flex gap-2 max-w-xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search by city or location…"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                      className="w-full pl-11 pr-10 py-3.5 bg-white/8 border border-white/12 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B]/50 focus:bg-white/12 transition-all"
                    />
                    <AnimatePresence>
                      {citySearch && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={clearCityFilter}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={handleCitySearch}
                    className="px-5 py-3.5 bg-[#CBB57B] text-black rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>

              {/* Right: CTA card */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="bg-white/6 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#CBB57B]/20 rounded-xl flex items-center justify-center mb-4">
                    <Flame className="w-5 h-5 text-[#CBB57B]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Need help fast?</h3>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                    Post your service request in under 2 minutes. Get responses within the hour.
                  </p>
                  <Link
                    href={
                      isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'
                    }
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#CBB57B] text-black rounded-xl font-bold text-sm hover:bg-amber-400 active:scale-[0.98] transition-all shadow-lg shadow-[#CBB57B]/20"
                  >
                    <Plus className="w-4 h-4" />
                    Post a Deal — $1
                  </Link>
                  <p className="text-xs text-gray-600 text-center mt-3">
                    Active for 24 hours · Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="h-8 bg-gradient-to-b from-transparent to-[#F8F7F4]" />
        </div>

        {/* ── STICKY FILTER BAR ────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* All */}
              <button
                onClick={() => handleCategoryChange('')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !filters.category
                    ? 'bg-[#0D0D0D] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                All Deals
              </button>

              {/* Category pills with icons */}
              {categories.map(([key, label]) => {
                const conf = CATEGORY_CONFIG[key];
                const isActive = filters.category === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(isActive ? '' : key)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? `${conf.bg} ${conf.color} shadow-sm ring-1 ring-current/20`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <conf.Icon className="w-3 h-3" />
                    {label}
                  </button>
                );
              })}

              {/* Clear filters */}
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

        {/* ── CONTENT ──────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toolbar row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Count */}
              {!isLoading && !error && (
                <p className="text-sm text-gray-500 font-medium">
                  <span className="text-gray-900 font-bold">{pagination.total}</span> deal
                  {pagination.total !== 1 ? 's' : ''} found
                  {filters.category && (
                    <span>
                      {' '}
                      in{' '}
                      <span className="text-[#CBB57B] font-semibold">
                        {CATEGORY_LABELS[filters.category]}
                      </span>
                    </span>
                  )}
                  {filters.city && (
                    <span>
                      {' '}
                      near <span className="text-[#CBB57B] font-semibold">{filters.city}</span>
                    </span>
                  )}
                </p>
              )}

              {/* Active city chip */}
              {filters.city && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#CBB57B]/10 text-[#8B7355] rounded-full text-xs font-semibold border border-[#CBB57B]/20">
                  <MapPin className="w-3 h-3" />
                  {filters.city}
                  <button onClick={clearCityFilter} className="hover:text-[#CBB57B] ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* My Deals */}
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

          {/* Loading skeleton */}
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
              className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-gray-800 font-semibold mb-1">Failed to load deals</p>
              <p className="text-sm text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          )}

          {/* Empty state */}
          {!isLoading && !error && deals.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm py-20 px-8 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#CBB57B]/20 to-amber-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Flame className="w-10 h-10 text-[#CBB57B]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {hasActiveFilters ? 'No matches found' : 'No active deals yet'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search in a different city.'
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
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-[#CBB57B] to-amber-500 text-black rounded-xl font-bold text-sm shadow-md shadow-[#CBB57B]/25 hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Post a Deal
                </Link>
              </div>
            </motion.div>
          )}

          {/* Deals grid */}
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
                    Page {pagination.page} of {pagination.totalPages}
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

          {/* Bottom CTA */}
          {!isLoading && deals.length > 0 && (
            <div className="mt-12 bg-gradient-to-br from-[#0D0D0D] to-neutral-900 rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#CBB57B]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="w-12 h-12 bg-[#CBB57B]/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-[#CBB57B]" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Have an urgent need?</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  Post your service request in minutes. Local providers respond fast.
                </p>
                <Link
                  href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#CBB57B] text-black rounded-xl font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-[#CBB57B]/25"
                >
                  <Plus className="w-4 h-4" />
                  Post a Deal — Just $1
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
