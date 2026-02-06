'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { WishlistItem } from '@nextpik/shared';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useTranslations } from 'next-intl';

interface WishlistItemProps {
  item: WishlistItem;
  onRemove?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function WishlistItemComponent({
  item,
  onRemove,
  onAddToCart,
  onQuickView,
}: WishlistItemProps) {
  const t = useTranslations('components.wishlistItem');
  const { product, addedAt, createdAt } = item as any;
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = isOnSale
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Handle both addedAt and createdAt field names, with fallback
  const dateValue = addedAt || createdAt;
  let relativeDate = t('recentlyAdded');
  if (dateValue) {
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        relativeDate = formatDistanceToNow(date, { addSuffix: true });
      }
    } catch {
      // Keep default value
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-[#CBB57B]' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden group hover:shadow-xl transition-all"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        <Link href={`/products/${product.slug}`}>
          <img
            src={product.heroImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOnSale && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              {t('save', { percent: discountPercent })}
            </span>
          )}
          {!product.isAvailable && (
            <span className="px-2 py-1 bg-neutral-900 text-white text-xs font-semibold rounded">
              {t('outOfStock')}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onQuickView && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onQuickView(product.id)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
              aria-label={t('quickView')}
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemove?.(product.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition-all shadow-lg group/remove"
            aria-label={t('removeFromWishlist')}
          >
            <svg
              className="w-5 h-5 text-neutral-600 group-hover/remove:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`} className="block group/link">
          {product.brand && (
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover/link:text-[#CBB57B] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && product.reviewCount !== undefined && product.reviewCount > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars(product.rating)}</div>
            <span className="text-xs text-neutral-500">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-black">${formatCurrencyAmount(Number(product.price || 0), 2)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-neutral-400 line-through">${formatCurrencyAmount(Number(product.compareAtPrice || 0), 2)}</span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${product.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {product.isAvailable ? t('inStock', { count: product.inventory }) : t('outOfStock')}
          </span>
        </div>

        {/* Added Date */}
        <p className="text-xs text-neutral-500 mb-4">{t('added', { date: relativeDate })}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart?.(product.id)}
            disabled={!product.isAvailable}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all ${
              product.isAvailable
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {product.isAvailable ? t('addToCart') : t('outOfStock')}
          </motion.button>
          <Link href={`/products/${product.slug}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 border-2 border-neutral-200 rounded-lg hover:border-[#CBB57B] transition-colors"
              aria-label={t('viewDetails')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
