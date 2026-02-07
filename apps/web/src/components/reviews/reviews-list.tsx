'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewCard } from './review-card';
import type { Review, ReviewFilters } from '@nextpik/shared';
import { useTranslations } from 'next-intl';

interface ReviewsListProps {
  reviews: Review[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onFiltersChange?: (filters: Partial<ReviewFilters>) => void;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

export function ReviewsList({
  reviews,
  total,
  currentPage,
  pageSize,
  isLoading,
  onFiltersChange,
  onMarkHelpful,
  onReport,
}: ReviewsListProps) {
  const t = useTranslations('components.reviewsList');
  const [sortBy, setSortBy] = useState<ReviewFilters['sortBy']>('recent');
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);

  const totalPages = Math.ceil(total / pageSize);

  const handleSortChange = (newSortBy: ReviewFilters['sortBy']) => {
    setSortBy(newSortBy);
    onFiltersChange?.({ sortBy: newSortBy, page: 1 });
  };

  const handleFilterChange = (rating: number | undefined) => {
    setFilterRating(rating);
    onFiltersChange?.({ rating, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onFiltersChange?.({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/4" />
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-neutral-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-neutral-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-100 text-neutral-400 mb-4">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-black mb-2">
        {filterRating ? t('noRatingReviews', { rating: filterRating }) : t('noReviews')}
      </h3>
      <p className="text-neutral-600 mb-6">{filterRating ? t('adjustFilters') : t('beFirst')}</p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Rating Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange(undefined)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filterRating === undefined
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {t('allReviews')}
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleFilterChange(rating)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1 ${
                filterRating === rating
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {rating}
              <svg className="w-4 h-4 text-[#CBB57B]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">{t('sortBy')}</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as ReviewFilters['sortBy'])}
            className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-[#CBB57B] transition-colors"
          >
            <option value="recent">{t('mostRecent')}</option>
            <option value="highest">{t('highestRated')}</option>
            <option value="lowest">{t('lowestRated')}</option>
            <option value="helpful">{t('mostHelpful')}</option>
          </select>
        </div>
      </div>

      {/* Reviews */}
      {isLoading ? (
        renderSkeleton()
      ) : !reviews || reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ReviewCard review={review} onMarkHelpful={onMarkHelpful} onReport={onReport} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border-2 border-neutral-200 rounded-lg hover:border-[#CBB57B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-black text-white'
                      : 'border-2 border-neutral-200 hover:border-[#CBB57B]'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className="px-2 text-neutral-400">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border-2 border-neutral-200 rounded-lg hover:border-[#CBB57B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
