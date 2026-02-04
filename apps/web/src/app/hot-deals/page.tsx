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
  Filter,
  ChevronDown,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  hotDealsApi,
  HotDeal,
  HotDealFilters,
  CATEGORY_LABELS,
  URGENCY_CONFIG,
  HotDealCategory,
} from '@/lib/api/hot-deals';

// Calculate time remaining
function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

// Hot Deal Card Component
function HotDealCard({ deal }: { deal: HotDeal }) {
  const urgencyConfig = URGENCY_CONFIG[deal.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
        >
          {urgencyConfig.label}
        </span>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          {getTimeRemaining(deal.expiresAt)}
        </div>
      </div>

      <Link href={`/hot-deals/${deal.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-[#CBB57B] transition-colors line-clamp-2">
          {deal.title}
        </h3>
      </Link>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{deal.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {CATEGORY_LABELS[deal.category]}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <MapPin className="w-3 h-3 mr-1" />
          {deal.city}{deal.state ? `, ${deal.state}` : ''}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <MessageCircle className="w-4 h-4 mr-1" />
          {deal._count?.responses || 0} responses
        </div>
        <Link
          href={`/hot-deals/${deal.id}`}
          className="text-sm font-medium text-[#CBB57B] hover:text-[#b9a369] transition-colors"
        >
          View Details →
        </Link>
      </div>
    </motion.div>
  );
}

export default function HotDealsPage() {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HotDealFilters>({});
  const [citySearch, setCitySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const categories = Object.entries(CATEGORY_LABELS) as [HotDealCategory, string][];

  // Fetch hot deals
  useEffect(() => {
    async function fetchDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await hotDealsApi.getAll(filters);
        setDeals(response.deals);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hot deals');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeals();
  }, [filters]);

  // Handle city search
  const handleCitySearch = () => {
    if (citySearch.trim()) {
      setFilters((prev) => ({ ...prev, city: citySearch.trim(), page: 1 }));
    } else {
      const { city, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    }
  };

  // Handle category filter
  const handleCategoryChange = (category: HotDealCategory | '') => {
    if (category) {
      setFilters((prev) => ({ ...prev, category, page: 1 }));
    } else {
      const { category: _, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setCitySearch('');
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Flame className="w-8 h-8" />
                  </div>
                  <h1 className="text-4xl font-bold">Hot Deals</h1>
                </div>
                <p className="text-lg text-white/90 max-w-xl">
                  Emergency services marketplace - Post your urgent needs and get help fast. Only $1 per post!
                </p>
              </div>
              <Link
                href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Post a Hot Deal ($1)
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden px-4 py-4 bg-white border-b">
          <Link
            href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Post a Hot Deal ($1)
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* City Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">
                    {filters.category ? CATEGORY_LABELS[filters.category] : 'All Categories'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showFilters && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleCategoryChange('');
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          !filters.category ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            handleCategoryChange(key);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                            filters.category === key
                              ? 'bg-orange-50 text-orange-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                onClick={handleCitySearch}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Search
              </button>

              {/* Clear Filters */}
              {(filters.category || filters.city) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Active Filters */}
            {(filters.category || filters.city) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {CATEGORY_LABELS[filters.category]}
                    <button
                      onClick={() => handleCategoryChange('')}
                      className="ml-1 hover:text-orange-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.city && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    <MapPin className="w-3 h-3" />
                    {filters.city}
                    <button
                      onClick={() => {
                        setCitySearch('');
                        const { city, ...rest } = filters;
                        setFilters(rest);
                      }}
                      className="ml-1 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* My Deals Link */}
          {isAuthenticated && (
            <div className="mb-6 flex justify-end">
              <Link
                href="/hot-deals/my-deals"
                className="text-sm font-medium text-[#CBB57B] hover:text-[#b9a369] transition-colors"
              >
                View My Deals →
              </Link>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-24 bg-gray-200 rounded-full" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setFilters({ ...filters })}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && deals.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hot Deals Found</h3>
              <p className="text-gray-600 mb-6">
                {filters.category || filters.city
                  ? 'No hot deals match your filters. Try adjusting your search.'
                  : 'Be the first to post a hot deal in your area!'}
              </p>
              <Link
                href={isAuthenticated ? '/hot-deals/new' : '/auth/login?redirect=/hot-deals/new'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Post a Hot Deal
              </Link>
            </div>
          )}

          {/* Deals Grid */}
          {!isLoading && !error && deals.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <HotDealCard key={deal.id} deal={deal} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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
