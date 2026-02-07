'use client';

/**
 * Public Store Page
 *
 * Display store profile, products, reviews, and policies
 * URL: /store/[slug]
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductGrid, QuickViewModal, type QuickViewProduct } from '@nextpik/ui';
import { storesAPI, Store } from '@/lib/api/stores';
import { productsAPI } from '@/lib/api/products';
import { Product, SearchResult } from '@/lib/api/types';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCurrencyProducts } from '@/hooks/use-currency-products';
import { useSelectedCurrency } from '@/hooks/use-currency';
import { useProduct } from '@/hooks/use-product';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { toast } from 'sonner';
import { navigateWithLoading } from '@/lib/navigation';
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
  Palmtree,
  Heart,
  Users,
  Search,
  X,
  Filter,
} from 'lucide-react';

type TabType = 'products' | 'about' | 'reviews' | 'policies';

interface StoreReview {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerified?: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    heroImage: string;
  };
}

interface StoreReviewsResponse {
  data: StoreReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    averageRating: number;
    totalReviews: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
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
function RatingBreakdown({
  breakdown,
  total,
}: {
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
  total: number;
}) {
  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-2">
      {stars.map((star, i) => {
        const count = breakdown[star];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-neutral-600 w-12">{star} star</span>
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
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
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
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();
  const tModal = useTranslations('quickViewModal');

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [productPage, setProductPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const pageSize = 12;

  // Cart and Wishlist hooks
  const { addItem: addToCartApi } = useCart();
  const { addToWishlist: addToWishlistApi } = useWishlist();

  // Currency
  const { currency } = useSelectedCurrency();
  const currencySymbol = currency?.symbol || '$';

  // Fetch store data
  const {
    data: store,
    error: storeError,
    isLoading: storeLoading,
  } = useSWR<Store>(slug ? `store-${slug}` : null, () => storesAPI.getStoreBySlug(slug));

  // Fetch store products with pagination and filters
  const { data: productsData, isLoading: productsLoading } = useSWR<SearchResult<Product>>(
    store?.id
      ? `store-products-${store.id}-${productPage}-${sortBy}-${searchQuery}-${selectedCategory}`
      : null,
    () => {
      const sortConfig: Record<string, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
        newest: { sortBy: 'createdAt', sortOrder: 'desc' },
        'price-asc': { sortBy: 'price', sortOrder: 'asc' },
        'price-desc': { sortBy: 'price', sortOrder: 'desc' },
        popular: { sortBy: 'viewCount', sortOrder: 'desc' },
      };
      const sort = sortConfig[sortBy];

      // Build query params
      const params: any = {
        storeId: store!.id,
        page: productPage,
        limit: pageSize,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      };

      // Add search filter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter if provided
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      return productsAPI.getAll(params);
    },
    { keepPreviousData: true }
  );

  // Fetch store reviews (aggregated from product reviews)
  const { data: reviewsData, isLoading: reviewsLoading } = useSWR<StoreReviewsResponse>(
    store?.id ? `store-reviews-${store.id}` : null,
    () => storesAPI.getStoreReviews(store!.id, { page: 1, limit: 50 })
  );

  // Fetch follow status (only if authenticated)
  const { data: followData, mutate: mutateFollowStatus } = useSWR<{ isFollowing: boolean }>(
    store?.id && isAuthenticated ? `store-follow-${store.id}` : null,
    () => storesAPI.isFollowing(store!.id)
  );

  // Fetch follower count
  const { data: followerData, mutate: mutateFollowerCount } = useSWR<{ count: number }>(
    store?.id ? `store-followers-${store.id}` : null,
    () => storesAPI.getFollowerCount(store!.id)
  );

  const isFollowing = followData?.isFollowing ?? false;
  const followerCount = followerData?.count ?? 0;

  // Fetch fresh product data for Quick View
  const { product: quickViewFullProduct, isLoading: quickViewLoading } = useProduct(
    quickViewSlug || '',
    true
  );

  // Transform fresh product data for Quick View when it's loaded
  useEffect(() => {
    if (quickViewSlug && quickViewFullProduct && !quickViewLoading) {
      const transformed = transformToQuickViewProducts([quickViewFullProduct])[0];
      setQuickViewProduct(transformed || null);
    }
  }, [quickViewFullProduct, quickViewLoading, quickViewSlug]);

  // Prepare data (must be before conditional returns to maintain hook order)
  // Products from API are already filtered by storeId and paginated
  const products = productsData?.products || [];

  // Use API total as the true count (backend already filters by storeId)
  const totalProducts = productsData?.total || 0;
  const currentPage = productsData?.page || productPage;
  const totalPages = productsData?.totalPages || Math.ceil(totalProducts / pageSize);

  // Calculate range for "Showing X-Y of Z products"
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalProducts);

  // Get unique categories from current page products
  const categories = useMemo(() => {
    if (!products.length) return [];
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Transform products for UI (server-side filtering and pagination)
  const transformedProducts = useMemo(() => transformToQuickViewProducts(products), [products]);

  // Convert prices to selected currency
  const currencyProducts = useCurrencyProducts(transformedProducts);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== '';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setProductPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setProductPage(1);
  }, [searchQuery, selectedCategory]);

  // Handlers
  const handleAddToCart = useCallback(
    async (productId: string) => {
      if (addingToCart) return; // Prevent double-click

      setAddingToCart(productId);
      try {
        await addToCartApi(productId, 1);
        toast.success('Added to Cart');
      } catch (error: any) {
        console.error('Failed to add to cart:', error);
        toast.error(error.message || 'Failed to add item to cart');
      } finally {
        setAddingToCart(null);
      }
    },
    [addingToCart, addToCartApi]
  );

  const handleQuickView = useCallback(
    (id: string) => {
      const product = currencyProducts.find((p) => p.id === id);
      if (product?.slug) {
        setQuickViewSlug(product.slug);
      }
    },
    [currencyProducts]
  );

  const handleNavigate = useCallback(
    (slug: string) => {
      navigateWithLoading(router, `/products/${slug}`);
    },
    [router]
  );

  const handleAddToWishlist = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        toast.error('Please sign in to add items to wishlist');
        return;
      }
      try {
        await addToWishlistApi(id);
        toast.success('Added to Wishlist');
      } catch (error: any) {
        toast.error(error.message || 'Failed to add to wishlist');
      }
    },
    [isAuthenticated, addToWishlistApi]
  );

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to follow stores');
      return;
    }

    if (!store?.id) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await storesAPI.unfollowStore(store.id);
        toast.success(`Unfollowed ${store.name}`);
      } else {
        await storesAPI.followStore(store.id);
        toast.success(`Now following ${store.name}`);
      }
      // Refresh follow status and count
      mutateFollowStatus();
      mutateFollowerCount();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

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

  // Data derived from API responses (safe to compute after conditional returns)
  const reviews = reviewsData?.data || [];
  const reviewsSummary = reviewsData?.summary;
  const averageRating = reviewsSummary?.averageRating ?? (store.rating ? Number(store.rating) : 0);
  const totalReviews = reviewsSummary?.totalReviews ?? store.reviewCount ?? 0;

  const memberSince = new Date(store.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const location = [store.city, store.country].filter(Boolean).join(', ');

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Store Header */}
        <div className="relative">
          {/* Cover Image / Banner */}
          <div className="relative h-56 md:h-72 lg:h-80 w-full overflow-hidden bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
            {store.banner ? (
              <>
                <img
                  src={store.banner}
                  alt={`${store.name} banner`}
                  className="w-full h-full object-cover"
                />
                {/* Dark overlay for better contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </div>
            )}
          </div>

          {/* Store Info Card - Overlaps cover */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative -mt-16 md:-mt-20 z-10"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Store Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                          <span className="text-3xl md:text-4xl font-bold text-white">
                            {store.name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    {store.verified && (
                      <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Store Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 truncate">
                            {store.name}
                          </h1>
                          {store.verified && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                              <Shield className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
                          {averageRating > 0 && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <StarRating rating={averageRating} size="sm" />
                                <span className="font-semibold text-neutral-900">
                                  {averageRating.toFixed(1)}
                                </span>
                                <span className="text-neutral-500">({totalReviews})</span>
                              </div>
                              <span className="text-neutral-300">•</span>
                            </>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-neutral-500" />
                            <span className="font-medium">{totalProducts} products</span>
                          </div>
                          {location && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-neutral-500" />
                                <span>{location}</span>
                              </div>
                            </>
                          )}
                          <span className="text-neutral-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <span>Member since {memberSince}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Desktop */}
                      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        {/* Follow Button */}
                        <motion.button
                          onClick={handleFollowToggle}
                          disabled={isFollowLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all ${
                            isFollowing
                              ? 'bg-white text-neutral-700 border-2 border-neutral-200 hover:bg-neutral-50'
                              : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 transition-all ${
                              isFollowing ? 'fill-pink-500 text-pink-500' : 'text-neutral-400'
                            } ${isFollowLoading ? 'animate-pulse' : ''}`}
                          />
                          <span>{isFollowing ? 'Following' : 'Follow'}</span>
                          {followerCount > 0 && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full font-medium">
                              {followerCount.toLocaleString()}
                            </span>
                          )}
                        </motion.button>

                        {/* Contact Button */}
                        <Link
                          href={`mailto:${store.email}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-black font-semibold text-sm rounded-xl hover:bg-gold/90 transition-all shadow-md shadow-gold/10"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Contact Seller
                        </Link>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile */}
                    <div className="flex sm:hidden items-center gap-3 pt-2 border-t border-neutral-100">
                      {/* Follow Button */}
                      <motion.button
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition-all ${
                          isFollowing
                            ? 'bg-white text-neutral-700 border-2 border-neutral-200'
                            : 'bg-white text-neutral-700 border-2 border-neutral-200'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-all ${
                            isFollowing ? 'fill-pink-500 text-pink-500' : 'text-neutral-400'
                          } ${isFollowLoading ? 'animate-pulse' : ''}`}
                        />
                        <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        {followerCount > 0 && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full font-medium">
                            {followerCount.toLocaleString()}
                          </span>
                        )}
                      </motion.button>

                      {/* Contact Button */}
                      <Link
                        href={`mailto:${store.email}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold text-black font-semibold text-sm rounded-xl hover:bg-gold/90 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contact Seller
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vacation Mode Banner */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {store.vacationMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Palmtree className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Store on Vacation</h3>
                    <p className="text-amber-800 text-sm">
                      {store.vacationMessage ||
                        'This store is currently on vacation. Orders may be delayed.'}
                    </p>
                    {store.vacationEndDate && (
                      <p className="text-amber-600 text-xs mt-2">
                        Expected return:{' '}
                        {new Date(store.vacationEndDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
                  {/* Search and Filter Bar */}
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search products in this store..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-10 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Category Filter */}
                      {categories.length > 0 && (
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="px-4 py-3 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold min-w-[180px] transition-all"
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Sort By */}
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as any);
                          setProductPage(1); // Reset to first page when sorting changes
                        }}
                        className="px-4 py-3 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold min-w-[180px] transition-all"
                      >
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                      </select>

                      {/* View Mode Toggle */}
                      <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setLayout('grid')}
                          className={`p-3 transition-colors ${layout === 'grid' ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                          title="Grid View"
                        >
                          <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setLayout('list')}
                          className={`p-3 transition-colors ${layout === 'list' ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                          title="List View"
                        >
                          <LayoutGrid className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                        <span className="text-sm font-medium text-neutral-500">
                          Active filters:
                        </span>
                        {searchQuery && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                            Search: <span className="font-medium">{searchQuery}</span>
                            <button onClick={() => setSearchQuery('')} className="hover:text-black">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                        {selectedCategory && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                            <span className="font-medium">{selectedCategory}</span>
                            <button
                              onClick={() => setSelectedCategory('')}
                              className="hover:text-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                        <button
                          onClick={clearFilters}
                          className="ml-auto px-4 py-1.5 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Results Count */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-neutral-600">
                      {totalProducts > 0 ? (
                        <>
                          Showing{' '}
                          <span className="font-semibold text-neutral-900">
                            {startIndex}-{endIndex}
                          </span>{' '}
                          of <span className="font-semibold text-neutral-900">{totalProducts}</span>{' '}
                          products
                        </>
                      ) : (
                        <>No products found</>
                      )}
                    </p>
                  </div>

                  {/* Products Grid */}
                  {currencyProducts.length > 0 ? (
                    <>
                      <ProductGrid
                        products={currencyProducts}
                        layout={layout}
                        columns={gridCols}
                        gap="md"
                        loading={productsLoading}
                        onQuickView={handleQuickView}
                        onQuickAdd={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                        onNavigate={handleNavigate}
                        currencySymbol={currencySymbol}
                      />

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center items-center gap-3 mt-12"
                        >
                          {/* Previous Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:border-gold hover:bg-gold/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-neutral-200 transition-all flex items-center gap-2 font-medium text-neutral-700"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </motion.button>

                          {/* Page Numbers */}
                          <div className="flex gap-2">
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                              // Show: 1 ... current-1 current current+1 ... last
                              let pageNum: number;
                              if (totalPages <= 7) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i < 5 ? i + 1 : totalPages - (6 - i);
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = i < 2 ? i + 1 : totalPages - (6 - i);
                              } else {
                                if (i === 0) pageNum = 1;
                                else if (i === 6) pageNum = totalPages;
                                else pageNum = currentPage - 3 + i;
                              }

                              const isCurrentPage = pageNum === currentPage;
                              const showEllipsis =
                                totalPages > 7 &&
                                ((i === 1 && currentPage > 3) ||
                                  (i === 5 && currentPage < totalPages - 2));

                              if (showEllipsis) {
                                return (
                                  <span
                                    key={`ellipsis-${i}`}
                                    className="px-3 py-2 text-neutral-400"
                                  >
                                    ...
                                  </span>
                                );
                              }

                              return (
                                <motion.button
                                  key={pageNum}
                                  whileHover={{ scale: isCurrentPage ? 1 : 1.05 }}
                                  whileTap={{ scale: isCurrentPage ? 1 : 0.95 }}
                                  onClick={() => setProductPage(pageNum)}
                                  className={`min-w-[40px] h-10 rounded-xl font-medium transition-all ${
                                    isCurrentPage
                                      ? 'bg-gold text-white shadow-lg shadow-gold/30'
                                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-gold hover:bg-gold/5'
                                  }`}
                                >
                                  {pageNum}
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Next Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setProductPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:border-gold hover:bg-gold/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-neutral-200 transition-all flex items-center gap-2 font-medium text-neutral-700"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
                      <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {hasActiveFilters ? 'No products found' : 'No products yet'}
                      </h3>
                      <p className="text-neutral-500 mb-4 max-w-md mx-auto">
                        {hasActiveFilters
                          ? searchQuery
                            ? `No products match "${searchQuery}"`
                            : 'No products match your filters'
                          : "This store hasn't added any products yet. Check back later!"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors font-medium"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Products', value: totalProducts, icon: Package },
                        { label: 'Total Sales', value: store.totalOrders, icon: ShoppingBag },
                        { label: 'Followers', value: followerCount, icon: Users },
                        {
                          label: 'Rating',
                          value: averageRating > 0 ? averageRating.toFixed(1) : 'N/A',
                          icon: Star,
                        },
                        { label: 'Reviews', value: totalReviews, icon: MessageCircle },
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
                            <span className="truncate">
                              {store.website.replace(/^https?:\/\//, '')}
                            </span>
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
                              Since{' '}
                              {new Date(store.verifiedAt!).toLocaleDateString('en-US', {
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
                            <p className="text-neutral-500 mt-2">Based on {totalReviews} reviews</p>
                          </div>
                          {reviewsSummary && (
                            <RatingBreakdown
                              breakdown={reviewsSummary.breakdown}
                              total={totalReviews}
                            />
                          )}
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
        </div>

        {/* Bottom Spacing */}
        <div className="h-16" />
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={!!quickViewSlug}
        onClose={() => {
          setQuickViewSlug(null);
          setQuickViewProduct(null);
        }}
        product={quickViewProduct}
        onAddToCart={handleAddToCart}
        onViewDetails={handleNavigate}
        currencySymbol={currencySymbol}
        translations={{
          color: tModal('color'),
          size: tModal('size'),
          quantity: tModal('quantity'),
          inStock: tModal('inStock'),
          available: tModal('available'),
          outOfStock: tModal('outOfStock'),
          onlyLeftInStock: tModal('onlyLeftInStock', { count: 0 }),
          addToCart: tModal('addToCart'),
          viewFullDetails: tModal('viewFullDetails'),
          reviews: tModal('reviews'),
          review: tModal('review'),
          save: tModal('save', { percent: 0 }),
          new: tModal('new'),
          sale: tModal('sale'),
          featured: tModal('featured'),
          bestseller: tModal('bestseller'),
        }}
      />
    </PageLayout>
  );
}
