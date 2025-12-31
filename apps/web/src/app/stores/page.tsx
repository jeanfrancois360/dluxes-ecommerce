'use client';

/**
 * Store Directory Page
 *
 * Browse all active stores on the platform
 * URL: /stores
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { PageLayout } from '@/components/layout/page-layout';
import { storesAPI, Store } from '@/lib/api/stores';
import {
  Search,
  Star,
  MapPin,
  Package,
  ShoppingBag,
  CheckCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
  Store as StoreIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface StoresResponse {
  data: Store[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Store Card Component
function StoreCard({ store }: { store: Store }) {
  const averageRating = store.rating ? Number(store.rating) : 0;
  const location = [store.city, store.country].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/store/${store.slug}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 hover:border-gold/30 group"
      >
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
          {store.banner ? (
            <img
              src={store.banner}
              alt={`${store.name} banner`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`grid-${store.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${store.id})`} />
                </svg>
              </div>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Verified Badge on Banner */}
          {store.verified && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">Verified</span>
            </div>
          )}
        </div>

        {/* Store Info */}
        <div className="relative px-4 pb-4">
          {/* Logo */}
          <div className="relative -mt-10 mb-3">
            <div className="w-20 h-20 rounded-xl bg-white shadow-lg border-4 border-white overflow-hidden">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {store.name[0]}
                  </span>
                </div>
              )}
            </div>
            {store.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Store Name & Rating */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-black group-hover:text-gold transition-colors line-clamp-1">
              {store.name}
            </h3>
            {averageRating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-gold text-gold'
                          : 'fill-neutral-200 text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600 ml-1">
                  {averageRating.toFixed(1)} ({store.reviewCount})
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {store.description && (
            <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
              {store.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>{store.totalProducts} products</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{store.totalOrders} sales</span>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Loading Skeleton
function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 animate-pulse">
      <div className="h-32 bg-neutral-200" />
      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3">
          <div className="w-20 h-20 rounded-xl bg-neutral-300 border-4 border-white" />
        </div>
        <div className="h-5 w-3/4 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-neutral-200 rounded mb-3" />
        <div className="h-3 w-full bg-neutral-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <StoreIcon className="w-10 h-10 text-neutral-400" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2">No stores found</h3>
      <p className="text-neutral-500 max-w-md mx-auto">
        {searchQuery
          ? `No stores match "${searchQuery}". Try a different search term.`
          : 'There are no stores available at the moment. Check back later!'}
      </p>
    </div>
  );
}

export default function StoresDirectoryPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const pageSize = 12;

  // Fetch stores
  const { data: storesData, isLoading, error } = useSWR<StoresResponse>(
    `stores-${page}-${verifiedOnly}`,
    () => storesAPI.getStores({
      page,
      limit: pageSize,
      verified: verifiedOnly || undefined,
    }) as Promise<StoresResponse>,
    { keepPreviousData: true }
  );

  const stores = storesData?.data || [];
  const totalPages = storesData?.meta?.totalPages || 1;
  const totalStores = storesData?.meta?.total || 0;

  // Filter stores by search query (client-side for now)
  const filteredStores = searchQuery
    ? stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stores;

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Discover Amazing Stores</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
                Store Directory
              </h1>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Explore our curated collection of verified sellers offering premium products
              </p>

              {/* Search Bar */}
              <div className="mt-8 max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search stores by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <p className="text-neutral-600">
                {isLoading ? (
                  'Loading stores...'
                ) : (
                  <>
                    <span className="font-semibold text-black">{totalStores}</span> stores found
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Verified Filter */}
              <button
                onClick={() => {
                  setVerifiedOnly(!verifiedOnly);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  verifiedOnly
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Only</span>
                {verifiedOnly && (
                  <CheckCircle className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                  <StoreIcon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{totalStores}</p>
                  <p className="text-xs text-neutral-500">Total Stores</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {stores.filter(s => s.verified).length}+
                  </p>
                  <p className="text-xs text-neutral-500">Verified Sellers</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {stores.reduce((sum, s) => sum + (s.totalProducts || 0), 0).toLocaleString()}+
                  </p>
                  <p className="text-xs text-neutral-500">Products</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {stores.reduce((sum, s) => sum + (s.totalOrders || 0), 0).toLocaleString()}+
                  </p>
                  <p className="text-xs text-neutral-500">Total Sales</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stores Grid */}
          {error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <StoreIcon className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Failed to load stores</h3>
              <p className="text-neutral-500">Please try again later.</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredStores.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredStores.map((store, index) => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <StoreCard store={store} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && !searchQuery && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-gold text-black'
                              : 'hover:bg-neutral-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-16" />
      </div>
    </PageLayout>
  );
}
