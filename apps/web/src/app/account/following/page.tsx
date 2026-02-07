'use client';

/**
 * Followed Stores Page
 *
 * Shows all stores the buyer is following
 * URL: /account/following
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/buyer/page-header';
import { storesAPI, Store } from '@/lib/api/stores';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  Heart,
  Star,
  MapPin,
  Package,
  ShoppingBag,
  CheckCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Store as StoreIcon,
  Palmtree,
  Loader2,
} from 'lucide-react';

interface FollowedStore extends Store {
  followedAt: string;
}

interface FollowingResponse {
  data: FollowedStore[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Store Card Component
function FollowedStoreCard({
  store,
  onUnfollow,
}: {
  store: FollowedStore;
  onUnfollow: (storeId: string) => void;
}) {
  const t = useTranslations('account.following');
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const averageRating = store.rating ? Number(store.rating) : 0;
  const location = [store.city, store.country].filter(Boolean).join(', ');

  const handleUnfollow = async () => {
    setIsUnfollowing(true);
    try {
      await storesAPI.unfollowStore(store.id);
      toast.success(t('unfollowed', { name: store.name }));
      onUnfollow(store.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('failedUnfollow'));
    } finally {
      setIsUnfollowing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-lg transition-all group"
    >
      {/* Banner */}
      <Link href={`/store/${store.slug}`} className="block">
        <div className="relative h-28 bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
          {store.banner ? (
            <img
              src={store.banner}
              alt={`${store.name} banner`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Vacation Badge */}
          {store.vacationMode && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
              <Palmtree className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">{t('onVacation')}</span>
            </div>
          )}

          {/* Verified Badge */}
          {store.verified && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">{t('verified')}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Store Info */}
      <div className="relative px-4 pb-4">
        {/* Logo */}
        <Link href={`/store/${store.slug}`} className="block">
          <div className="relative -mt-8 mb-3">
            <div className="w-16 h-16 rounded-xl bg-white shadow-lg border-4 border-white overflow-hidden">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{store.name[0]}</span>
                </div>
              )}
            </div>
            {store.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </Link>

        {/* Store Name & Rating */}
        <Link href={`/store/${store.slug}`} className="block mb-2">
          <h3 className="text-lg font-bold text-black group-hover:text-gold transition-colors line-clamp-1">
            {store.name}
          </h3>
          {averageRating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(averageRating)
                        ? 'fill-gold text-gold'
                        : 'fill-neutral-200 text-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-600">
                {averageRating.toFixed(1)} ({store.reviewCount})
              </span>
            </div>
          )}
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            <span>
              {store.totalProducts} {t('products')}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{location}</span>
            </div>
          )}
        </div>

        {/* Followed date & Unfollow button */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            {t('followingSince')}{' '}
            {new Date(store.followedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={handleUnfollow}
            disabled={isUnfollowing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isUnfollowing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 fill-pink-500" />
            )}
            <span>{isUnfollowing ? t('unfollowing') : t('unfollow')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 animate-pulse">
      <div className="h-28 bg-neutral-200" />
      <div className="px-4 pb-4">
        <div className="relative -mt-8 mb-3">
          <div className="w-16 h-16 rounded-xl bg-neutral-300 border-4 border-white" />
        </div>
        <div className="h-5 w-3/4 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-neutral-200 rounded mb-3" />
        <div className="h-3 w-full bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  const t = useTranslations('account.following');
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-6">
        <Heart className="w-10 h-10 text-pink-300" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2">{t('noStoresFollowed')}</h3>
      <p className="text-neutral-500 max-w-md mx-auto mb-6">{t('startExploring')}</p>
      <Link
        href="/stores"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-colors"
      >
        <StoreIcon className="w-5 h-5" />
        {t('browseStores')}
      </Link>
    </div>
  );
}

export default function FollowingStoresPage() {
  const t = useTranslations('account.following');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Fetch followed stores
  const { data, isLoading, error, mutate } = useSWR<FollowingResponse>(
    isAuthenticated ? `following-stores-${page}` : null,
    () => storesAPI.getFollowingStores({ page, limit: pageSize })
  );

  const stores = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalStores = data?.meta?.total || 0;

  // Handle unfollow - optimistically update the list
  const handleUnfollow = (storeId: string) => {
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.filter((s) => s.id !== storeId),
          meta: {
            ...current.meta,
            total: current.meta.total - 1,
          },
        };
      },
      { revalidate: true }
    );
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-neutral-400" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('signInRequired')}</h1>
            <p className="text-neutral-600 mb-6">{t('signInToView')}</p>
            <Link
              href="/auth/login?redirect=/account/following"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-colors"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={
          totalStores > 0
            ? totalStores === 1
              ? t('storesYouFollow', { count: totalStores })
              : t('storesYouFollowPlural', { count: totalStores })
            : t('storesYouLove')
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/buyer' }, { label: t('title') }]}
      />

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/dashboard/buyer"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-black mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('backToDashboard')}</span>
          </Link>

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <StoreIcon className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{t('failedLoadStores')}</h3>
              <p className="text-neutral-500">{t('tryAgainLater')}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Stores Grid */}
          {!isLoading && !error && stores.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {stores.map((store) => (
                    <FollowedStoreCard key={store.id} store={store} onUnfollow={handleUnfollow} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                            page === pageNum ? 'bg-pink-500 text-white' : 'hover:bg-neutral-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && stores.length === 0 && <EmptyState />}
        </div>
      </div>
    </div>
  );
}
