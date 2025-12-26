'use client';

import { motion } from 'framer-motion';
import type { ReviewSummary } from '@nextpik/shared';
import { formatNumber } from '@/lib/utils/number-format';

interface ReviewSummaryProps {
  summary: ReviewSummary;
  onWriteReview?: () => void;
}

export function ReviewSummaryComponent({ summary, onWriteReview }: ReviewSummaryProps) {
  const { averageRating, totalReviews, ratingDistribution } = summary;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= Math.floor(rating);
      const isHalf = !isFilled && starValue <= Math.ceil(rating);

      return (
        <svg
          key={index}
          className={`w-6 h-6 ${isFilled ? 'text-[#CBB57B]' : isHalf ? 'text-[#CBB57B]' : 'text-neutral-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {isHalf ? (
            <>
              <defs>
                <linearGradient id={`half-${index}`}>
                  <stop offset="50%" stopColor="#CBB57B" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#half-${index})`}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </>
          ) : (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          )}
        </svg>
      );
    });
  };

  const getRatingPercentage = (stars: number) => {
    if (totalReviews === 0) return 0;
    return (ratingDistribution[stars as keyof typeof ratingDistribution] / totalReviews) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-neutral-200 p-8"
    >
      <div className="grid md:grid-cols-2 gap-8">
        {/* Overall Rating */}
        <div className="flex flex-col items-center justify-center text-center border-r border-neutral-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-4"
          >
            <div className="text-6xl font-bold text-black mb-2">
              {formatNumber(averageRating, 1)}
            </div>
            <div className="flex justify-center mb-2">{renderStars(averageRating)}</div>
            <p className="text-neutral-600">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </motion.div>

          {onWriteReview && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onWriteReview}
              className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-lg"
            >
              Write a Review
            </motion.button>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          <h3 className="font-semibold text-black mb-4">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const percentage = getRatingPercentage(stars);
            const count = ratingDistribution[stars as keyof typeof ratingDistribution];

            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-neutral-700">{stars}</span>
                  <svg className="w-4 h-4 text-[#CBB57B]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>

                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-[#CBB57B] rounded-full"
                  />
                </div>

                <div className="w-12 text-sm text-neutral-600 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
