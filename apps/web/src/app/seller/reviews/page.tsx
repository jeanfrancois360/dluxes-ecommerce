'use client';

/**
 * Seller Reviews Page
 *
 * View and manage reviews received on products
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { sellerAPI, SellerReview, SellerReviewStats } from '@/lib/api/seller';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Star,
  Package,
  MessageSquare,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
} from 'lucide-react';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-600 w-8">{rating} star</span>
      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-neutral-500 w-10 text-right">{count}</span>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SellerReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerReviews');
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const limit = 10;

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useSWR(
    user?.role === 'SELLER' ? ['seller-reviews', page, ratingFilter] : null,
    () => sellerAPI.getReviews({ page, limit, rating: ratingFilter }),
    { revalidateOnFocus: false }
  );

  // Fetch review stats
  const { data: stats, isLoading: statsLoading } = useSWR<SellerReviewStats>(
    user?.role === 'SELLER' ? 'seller-review-stats' : null,
    () => sellerAPI.getReviewStats(),
    { revalidateOnFocus: false }
  );

  // Redirect non-sellers
  React.useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  const isLoading = authLoading || reviewsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const reviews = reviewsData?.data || [];
  const totalPages = reviewsData?.totalPages || 1;
  const totalReviews = reviewsData?.total || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard/seller"
            className="text-neutral-300 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">Product Reviews</h1>
            <p className="text-neutral-300 mt-2">
              See what customers are saying about your products
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Overall Rating Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Overall Rating</h2>
              {stats ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-black mb-2">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <StarRating rating={Math.round(stats.averageRating)} size="lg" />
                    <p className="text-sm text-neutral-500 mt-2">
                      Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <RatingBar
                        key={rating}
                        rating={rating}
                        count={
                          stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
                        }
                        total={stats.total}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-neutral-500 text-center">No reviews yet</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Review Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Total Reviews</span>
                  <span className="font-semibold text-black">{stats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Approved</span>
                  <span className="font-semibold text-green-600">{stats?.approved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Pending</span>
                  <span className="font-semibold text-yellow-600">{stats?.pending || 0}</span>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter by Rating
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRatingFilter(undefined);
                    setPage(1);
                  }}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    ratingFilter === undefined
                      ? 'bg-gold text-black font-medium'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  All Reviews
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      setRatingFilter(rating);
                      setPage(1);
                    }}
                    className={`w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                      ratingFilter === rating
                        ? 'bg-gold text-black font-medium'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <StarRating rating={rating} size="sm" />
                    <span className="ml-2">{rating} Star</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Reviews ({totalReviews})
                  </h2>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {reviews.map((review: SellerReview) => (
                    <div key={review.id} className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link href={`/products/${review.product.slug}`} className="flex-shrink-0">
                          {review.product.heroImage ? (
                            <img
                              src={review.product.heroImage}
                              alt={review.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-neutral-400" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          {/* Product Name & Rating */}
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <Link
                                href={`/products/${review.product.slug}`}
                                className="font-medium text-black hover:text-gold transition-colors"
                              >
                                {review.product.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={review.rating} size="sm" />
                                {review.isVerified && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Verified Purchase
                                  </span>
                                )}
                                {!review.isApproved && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                    Pending Approval
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-neutral-500 flex-shrink-0">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>

                          {/* Reviewer */}
                          <div className="flex items-center gap-2 mb-3">
                            {review.user.avatar ? (
                              <img
                                src={review.user.avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-neutral-500" />
                              </div>
                            )}
                            <span className="text-sm text-neutral-600">
                              {review.user.firstName || 'Anonymous'} {review.user.lastName || ''}
                            </span>
                          </div>

                          {/* Review Title & Comment */}
                          {review.title && (
                            <h3 className="font-medium text-black mb-1">{review.title}</h3>
                          )}
                          <p className="text-neutral-600 text-sm whitespace-pre-wrap">
                            {review.comment}
                          </p>

                          {/* Review Images */}
                          {review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Review image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          {/* Helpful Count */}
                          {review.helpfulCount > 0 && (
                            <div className="flex items-center gap-1 mt-3 text-sm text-neutral-500">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{review.helpfulCount} found this helpful</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">No reviews yet</h3>
                  <p className="text-neutral-500">
                    {ratingFilter
                      ? `No ${ratingFilter}-star reviews found`
                      : "Your products haven't received any reviews yet"}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
