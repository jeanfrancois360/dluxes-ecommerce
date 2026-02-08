'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Review } from '@nextpik/shared';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface ReviewCardProps {
  review: Review;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

export function ReviewCard({ review, onMarkHelpful, onReport }: ReviewCardProps) {
  const t = useTranslations('components.reviewCard');
  const [showFullText, setShowFullText] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const MAX_TEXT_LENGTH = 300;
  const shouldTruncate = review.comment.length > MAX_TEXT_LENGTH;
  const displayText =
    shouldTruncate && !showFullText
      ? review.comment.slice(0, MAX_TEXT_LENGTH) + '...'
      : review.comment;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-[#CBB57B]' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Use userName and userAvatar from review
  const userName = review.userName || 'Anonymous';
  const userAvatar = review.userAvatar || null;

  const relativeDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#CBB57B]/20 text-[#CBB57B] flex items-center justify-center font-semibold text-sm">
                {getInitials(userName)}
              </div>
            )}
          </div>

          {/* User Info & Rating */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-black">{userName}</h4>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('verifiedPurchase')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(review.rating)}</div>
              <span className="text-sm text-neutral-500">{relativeDate}</span>
            </div>
          </div>

          {/* Report Button */}
          <button
            onClick={() => onReport?.(review.id)}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={t('reportReview')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
          </button>
        </div>

        {/* Title */}
        {review.title && <h5 className="font-bold text-black mb-2">{review.title}</h5>}

        {/* Comment */}
        <p className="text-neutral-700 leading-relaxed mb-4">{displayText}</p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="text-[#CBB57B] hover:text-[#A89968] font-medium text-sm mb-4 transition-colors"
          >
            {showFullText ? t('showLess') : t('readMore')}
          </button>
        )}

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {review.images.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(image)}
                  className="w-20 h-20 rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-[#CBB57B] transition-colors"
                >
                  <img
                    src={image}
                    alt={t('reviewImage', { number: index + 1 })}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
          <button
            onClick={() => onMarkHelpful?.(review.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              review.isHelpful
                ? 'bg-[#CBB57B]/20 text-[#CBB57B]'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span className="text-sm font-medium">
              {review.helpfulCount > 0
                ? t('helpfulWithCount', { count: review.helpfulCount })
                : t('helpful')}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-neutral-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <img
                src={selectedImage}
                alt={t('reviewImage', { number: '' })}
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
