'use client';

/**
 * Public Store Page
 *
 * Display store profile, products, reviews, and policies
 * URL: /store/[slug]
 */

import { useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCard } from '@nextpik/ui';
import { storesAPI, Store } from '@/lib/api/stores';
import { productsAPI } from '@/lib/api/products';
import { Product, SearchResult } from '@/lib/api/types';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  Star,
  MapPin,
  Calendar,
  Package,
  ShoppingBag,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  MessageCircle,
  AlertCircle,
  Store as StoreIcon,
} from 'lucide-react';

type TabType = 'products' | 'about' | 'reviews' | 'policies';

interface StoreReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  product?: {
    name: string;
    heroImage: string;
  };
}

// Star Rating Component
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.floor(rating)
              ? 'fill-gold text-gold'
              : i < rating
                ? 'fill-gold/50 text-gold'
                : 'fill-neutral-200 text-neutral-200'
          }`}
        />
      ))}
    </div>
  );
}

// Rating Breakdown Component
function RatingBreakdown({ reviews }: { reviews: StoreReview[] }) {
  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    return counts.reverse(); // 5 to 1
  }, [reviews]);

  const total = reviews.length;

  return (
    <div className="space-y-2">
      {breakdown.map((count, i) => {
        const stars = 5 - i;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={stars} className="flex items-center gap-3">
            <span className="text-sm text-neutral-600 w-12">{stars} star</span>
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-full bg-gold rounded-full"
              />
            </div>
            <span className="text-sm text-neutral-500 w-8">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: StoreReview }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-100">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={`${review.user.firstName} ${review.user.lastName}`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-neutral-500">
              {review.user?.firstName?.[0] || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-black">
              {review.user?.firstName} {review.user?.lastName?.[0]}.
            </h4>
            <span className="text-sm text-neutral-500">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" />
          <p className="text-neutral-700 mt-3">{review.comment}</p>
          {review.product && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <Package className="w-4 h-4" />
              <span>Purchased: {review.product.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Policy Section Component
function PolicySection({ title, content }: { title: string; content: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) {
    return (
      <div className="border border-neutral-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
        <p className="text-neutral-500 italic">No {title.toLowerCase()} provided by this store.</p>
      </div>
    );
  }

  const isLong = content.length > 500;
  const displayContent = isLong && !isExpanded ? content.slice(0, 500) + '...' : content;

  return (
    <div className="border border-neutral-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-black mb-4">{title}</h3>
      <div className="prose prose-neutral max-w-none">
        <p className="text-neutral-700 whitespace-pre-wrap">{displayContent}</p>
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-gold font-medium hover:text-gold/80 transition-colors"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

// Loading Skeleton
function StoreSkeleton() {
  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-48 md:h-64 bg-neutral-200" />

        {/* Store Info Skeleton */}
        <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-6 mb-8">
            <div className="w-32 h-32 rounded-2xl bg-neutral-300 border-4 border-white" />
            <div className="space-y-2 pb-2">
              <div className="h-8 w-48 bg-neutral-300 rounded" />
              <div className="h-4 w-32 bg-neutral-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [productPage, setProductPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const pageSize = 12;

  // Fetch store data
  const { data: store, error: storeError, isLoading: storeLoading } = useSWR<Store>(
    slug ? `store-${slug}` : null,
    () => storesAPI.getStoreBySlug(slug)
  );

  // Fetch store products
  const { data: productsData, isLoading: productsLoading } = useSWR<SearchResult<Product>>(
    store?.id ? `store-products-${store.id}-${productPage}-${sortBy}` : null,
    () => {
      const sortConfig: Record<string, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
        'newest': { sortBy: 'createdAt', sortOrder: 'desc' },
        'price-asc': { sortBy: 'price', sortOrder: 'asc' },
        'price-desc': { sortBy: 'price', sortOrder: 'desc' },
        'popular': { sortBy: 'viewCount', sortOrder: 'desc' },
      };
      const sort = sortConfig[sortBy];
      return productsAPI.getAll({
        storeId: store!.id,
        page: productPage,
        limit: pageSize,
        sortBy: sort.sortBy as any,
        sortOrder: sort.sortOrder,
      });
    },
    { keepPreviousData: true }
  );

  // Fetch store reviews (using product reviews from this store)
  const { data: reviewsData, isLoading: reviewsLoading } = useSWR<{ data: StoreReview[]; total: number }>(
    store?.id ? `store-reviews-${store.id}` : null,
    async () => {
      // For now, return empty reviews - this endpoint would need to be implemented
      // In production, you'd aggregate product reviews or have store-level reviews
      return { data: [], total: 0 };
    }
  );

  // Handle store not found or error
  if (storeError) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Store Not Found</h1>
            <p className="text-neutral-600 mb-6">
              The store you're looking for doesn't exist or is no longer available.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (storeLoading || !store) {
    return <StoreSkeleton />;
  }

  // Check if store is active
  if (store.status !== 'ACTIVE' || !store.isActive) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <StoreIcon className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Store Unavailable</h1>
            <p className="text-neutral-600 mb-6">
              This store is currently unavailable. Please check back later.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const reviews = reviewsData?.data || [];
  const averageRating = store.rating ? Number(store.rating) : 0;

  const memberSince = new Date(store.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const location = [store.city, store.country].filter(Boolean).join(', ');

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Store Banner */}
        <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-black to-neutral-800 overflow-hidden">
          {store.banner ? (
            <img
              src={store.banner}
              alt={`${store.name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Store Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 md:-mt-24 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Store Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden">
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {store.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                {store.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>

              {/* Store Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-black">{store.name}</h1>
                      {store.verified && (
                        <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                      {averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <StarRating rating={averageRating} size="sm" />
                          <span className="font-medium">{averageRating.toFixed(1)}</span>
                          <span>({store.reviewCount} reviews)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{store.totalProducts} products</span>
                      </div>
                      {location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {memberSince}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <Link
                    href={`mailto:${store.email}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact Seller
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-neutral-200 mb-8">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'products', label: 'Products', icon: ShoppingBag },
                { id: 'about', label: 'About', icon: StoreIcon },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'policies', label: 'Policies', icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-gold text-gold'
                      : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'products' && totalProducts > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                      {totalProducts}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <p className="text-neutral-600">
                    Showing {products.length} of {totalProducts} products
                  </p>
                  <div className="flex items-center gap-4">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as any);
                          setProductPage(1);
                        }}
                        className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                      >
                        <option value="newest">Newest</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                      </select>
                    </div>

                    {/* Grid Toggle */}
                    <div className="hidden md:flex items-center gap-1 border border-neutral-200 rounded-lg p-1">
                      <button
                        onClick={() => setGridCols(3)}
                        className={`p-2 rounded ${gridCols === 3 ? 'bg-neutral-100' : ''}`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGridCols(4)}
                        className={`p-2 rounded ${gridCols === 4 ? 'bg-neutral-100' : ''}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                {productsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] bg-neutral-200 rounded-2xl mb-4" />
                        <div className="h-4 bg-neutral-200 rounded mb-2" />
                        <div className="h-4 w-2/3 bg-neutral-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className={`grid grid-cols-2 gap-4 md:gap-6 ${
                      gridCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
                    }`}>
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          brand={product.brand}
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          image={product.heroImage}
                          images={product.images?.map(img => img.url) || []}
                          badges={product.badges}
                          rating={product.variants?.[0]?.stock > 0 ? 4.5 : undefined}
                          slug={product.slug}
                          purchaseType={product.purchaseType}
                          inStock={product.stock > 0}
                          stockQuantity={product.stock}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-12">
                        <button
                          onClick={() => setProductPage(p => Math.max(1, p - 1))}
                          disabled={productPage === 1}
                          className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (productPage <= 3) {
                              pageNum = i + 1;
                            } else if (productPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = productPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setProductPage(pageNum)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                  productPage === pageNum
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
                          onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                          disabled={productPage === totalPages}
                          className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon={Package}
                    title="No products yet"
                    description="This store hasn't added any products yet. Check back later!"
                  />
                )}
              </motion.div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Description */}
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-black mb-4">About {store.name}</h2>
                    {store.description ? (
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                        {store.description}
                      </p>
                    ) : (
                      <p className="text-neutral-500 italic">
                        This store hasn't added a description yet.
                      </p>
                    )}
                  </div>

                  {/* Store Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Products', value: store.totalProducts, icon: Package },
                      { label: 'Total Sales', value: store.totalOrders, icon: ShoppingBag },
                      { label: 'Rating', value: averageRating > 0 ? averageRating.toFixed(1) : 'N/A', icon: Star },
                      { label: 'Reviews', value: store.reviewCount, icon: MessageCircle },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-white rounded-xl p-4 text-center shadow-sm"
                      >
                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-gold" />
                        <p className="text-2xl font-bold text-black">{stat.value}</p>
                        <p className="text-sm text-neutral-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <a
                        href={`mailto:${store.email}`}
                        className="flex items-center gap-3 text-neutral-600 hover:text-gold transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        <span className="truncate">{store.email}</span>
                      </a>
                      {store.phone && (
                        <a
                          href={`tel:${store.phone}`}
                          className="flex items-center gap-3 text-neutral-600 hover:text-gold transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          <span>{store.phone}</span>
                        </a>
                      )}
                      {store.website && (
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-neutral-600 hover:text-gold transition-colors"
                        >
                          <Globe className="w-5 h-5" />
                          <span className="truncate">{store.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      )}
                      {location && (
                        <div className="flex items-center gap-3 text-neutral-600">
                          <MapPin className="w-5 h-5" />
                          <span>{location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Badge */}
                  {store.verified && (
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Verified Seller</h3>
                          <p className="text-sm text-blue-700">
                            Since {new Date(store.verifiedAt!).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800">
                        This seller has been verified by our team and meets our quality standards.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {reviewsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-neutral-200 h-32 rounded-xl" />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Reviews Summary */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                        <div className="text-center mb-6">
                          <p className="text-5xl font-bold text-black mb-2">
                            {averageRating.toFixed(1)}
                          </p>
                          <StarRating rating={averageRating} size="lg" />
                          <p className="text-neutral-500 mt-2">
                            Based on {store.reviewCount} reviews
                          </p>
                        </div>
                        <RatingBreakdown reviews={reviews} />
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-2 space-y-4">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description="This store doesn't have any reviews yet. Be the first to leave a review after making a purchase!"
                  />
                )}
              </motion.div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <motion.div
                key="policies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <PolicySection title="Return Policy" content={store.returnPolicy} />
                <PolicySection title="Shipping Policy" content={store.shippingPolicy} />
                <PolicySection title="Terms & Conditions" content={store.termsConditions} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Spacing */}
        <div className="h-16" />
      </div>
    </PageLayout>
  );
}
