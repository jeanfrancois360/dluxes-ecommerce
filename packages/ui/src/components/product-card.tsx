'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrencyAmount } from '../lib/utils/number-format';

export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price?: number | null;
  compareAtPrice?: number | null;
  image: string;
  images?: string[];
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  slug: string;
  purchaseType?: 'INSTANT' | 'INQUIRY';
  onQuickView?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickAdd?: (id: string) => void;
  onNavigate?: (slug: string) => void;
  inWishlist?: boolean;
  className?: string;
  priority?: boolean;
  currencySymbol?: string;
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  // Store info for linking to store page
  store?: {
    name: string;
    slug: string;
    verified?: boolean;
  };
  showStore?: boolean;
  translations?: {
    addToWishlist: string;
    removeFromWishlist: string;
    quickView: string;
    outOfStock: string;
    onlyLeft: string;
    contactForPrice: string;
    inquiryRequired: string;
    contactSeller: string;
    contact: string;
    addToBag: string;
    add: string;
    by: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({
    id,
    name,
    brand,
    price,
    compareAtPrice,
    image,
    images = [],
    badges = [],
    rating,
    reviewCount,
    slug,
    purchaseType = 'INSTANT',
    onQuickView,
    onAddToWishlist,
    onQuickAdd,
    onNavigate,
    inWishlist = false,
    className,
    priority: _priority = false,
    currencySymbol = '$',
    inStock = true,
    stockQuantity,
    lowStockThreshold = 10,
    store,
    showStore = false,
    translations = {
      addToWishlist: 'Add to wishlist',
      removeFromWishlist: 'Remove from wishlist',
      quickView: 'Quick View',
      outOfStock: 'Out of Stock',
      onlyLeft: 'Only {count} Left',
      contactForPrice: 'Contact for Price',
      inquiryRequired: 'Inquiry Required',
      contactSeller: 'Contact Seller',
      contact: 'Contact',
      addToBag: 'Add to Bag',
      add: 'Add',
      by: 'by',
    },
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [isWishlisted, setIsWishlisted] = React.useState(inWishlist);
    const [isHovered, setIsHovered] = React.useState(false);

    // Sync local wishlist state with prop
    React.useEffect(() => {
      setIsWishlisted(inWishlist);
    }, [inWishlist]);

    // Check if this is an inquiry product or has no price
    const isInquiryProduct = purchaseType === 'INQUIRY' || price === null || price === undefined;

    // Calculate stock status
    const isLowStock =
      stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= lowStockThreshold;

    // Ensure price is always a valid number for INSTANT products with multiple safeguards
    const validPrice = typeof price === 'number' && !isNaN(price) && isFinite(price) ? price : 0;
    const validCompareAtPrice =
      typeof compareAtPrice === 'number' && !isNaN(compareAtPrice) && isFinite(compareAtPrice)
        ? compareAtPrice
        : undefined;

    const allImages = [image, ...images].filter(Boolean);
    const discount =
      validCompareAtPrice && validPrice > 0 && validCompareAtPrice > validPrice
        ? Math.round(((validCompareAtPrice - validPrice) / validCompareAtPrice) * 100)
        : 0;

    const handleWishlistToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Optimistically update UI
      setIsWishlisted(!isWishlisted);
      // Call the handler which will handle add/remove logic
      onAddToWishlist?.(id);
    };

    const handleQuickView = (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickView?.(id);
    };

    const handleCardClick = () => {
      if (onNavigate) {
        onNavigate(slug);
      } else if (typeof window !== 'undefined') {
        window.location.href = `/products/${slug}`;
      }
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickAdd?.(id);
    };

    return (
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0);
        }}
        onClick={handleCardClick}
        className={cn(
          'group relative bg-white rounded-2xl overflow-hidden cursor-pointer',
          'border-2 border-neutral-100 hover:border-gold/50',
          'shadow-sm hover:shadow-xl',
          'transition-all duration-300 ease-out',
          'gpu-accelerated will-change-transform',
          className
        )}
        role="button"
        tabIndex={0}
        aria-label={`View ${name}`}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
          }
        }}
      >
        {/* Badges */}
        <AnimatePresence>
          {badges.length > 0 && (
            <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 z-20 flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              {badges.map((badge, index) => (
                <motion.span
                  key={`${badge}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'px-1.5 sm:px-2.5 md:px-3.5 py-0.5 sm:py-1 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full',
                    'backdrop-blur-md shadow-lg',
                    badge.toLowerCase() === 'new' && 'bg-black/90 text-white',
                    badge.toLowerCase() === 'sale' && 'bg-red-500/90 text-white',
                    badge.toLowerCase() === 'featured' && 'bg-gold/95 text-black',
                    badge.toLowerCase() === 'bestseller' && 'bg-accent-700/90 text-white',
                    !['new', 'sale', 'featured', 'bestseller'].includes(badge.toLowerCase()) &&
                      'bg-neutral-800/90 text-white'
                  )}
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Wishlist Button */}
        <motion.button
          onClick={handleWishlistToggle}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-20',
            'w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center',
            'bg-white/95 backdrop-blur-md shadow-xl',
            'border-2 transition-colors duration-200',
            isWishlisted ? 'border-red-500' : 'border-neutral-200'
          )}
          aria-label={isWishlisted ? translations.removeFromWishlist : translations.addToWishlist}
        >
          <motion.svg
            className={cn(
              'w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200',
              isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-neutral-700'
            )}
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </motion.svg>
        </motion.button>

        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50">
          {/* Main Product Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: isHovered ? 1.08 : 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              }}
              className="relative w-full h-full"
            >
              <img
                src={allImages[currentImageIndex] || '/images/placeholder-product.jpg'}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Image Navigation Dots */}
          {allImages.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-0 right-0 flex justify-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4"
            >
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  onMouseEnter={() => setCurrentImageIndex(index)}
                  className={cn(
                    'h-1.5 sm:h-2 rounded-full transition-all duration-300',
                    currentImageIndex === index
                      ? 'w-6 sm:w-8 bg-gold shadow-lg'
                      : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/90'
                  )}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </motion.div>
          )}

          {/* Quick View Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
              >
                <motion.button
                  onClick={handleQuickView}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3.5 bg-white text-black rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-2xl hover:bg-gold transition-colors duration-200"
                >
                  {translations.quickView}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4 z-10">
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-full bg-red-500 flex items-center justify-center shadow-xl"
              >
                <span className="text-white font-bold text-[9px] xs:text-[10px] sm:text-xs md:text-sm">
                  -{discount}%
                </span>
              </motion.div>
            </div>
          )}

          {/* Stock Status Badge */}
          {!inStock && (
            <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 z-10">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-neutral-900/95 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center"
              >
                <span className="text-white font-bold text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider leading-none">
                  {translations.outOfStock}
                </span>
              </motion.div>
            </div>
          )}
          {inStock && isLowStock && (
            <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 z-10">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-orange-500/95 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center"
              >
                <span className="text-white font-bold text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider leading-none">
                  {translations.onlyLeft
                    ? translations.onlyLeft.replace('{count}', String(stockQuantity))
                    : `Only ${stockQuantity} Left`}
                </span>
              </motion.div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3">
          {/* Brand */}
          {brand && (
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-neutral-500 font-semibold">
              {brand}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-serif text-sm sm:text-base md:text-lg font-bold text-black line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-200">
            {name}
          </h3>

          {/* Rating */}
          {rating !== undefined && rating > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      'w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4',
                      i < Math.floor(rating)
                        ? 'fill-gold text-gold'
                        : 'fill-neutral-200 text-neutral-200'
                    )}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {reviewCount !== undefined && reviewCount > 0 && (
                <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">
                  ({reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 pt-1 sm:pt-1.5 md:pt-2">
            {isInquiryProduct ? (
              <div className="flex flex-col">
                <span className="font-serif text-base sm:text-lg md:text-xl font-bold text-gold">
                  {translations.contactForPrice}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                  {translations.inquiryRequired}
                </span>
              </div>
            ) : (
              <>
                <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-black">
                  {currencySymbol}
                  {formatCurrencyAmount(validPrice, 2)}
                </span>
                {validCompareAtPrice && (
                  <span className="text-xs sm:text-sm text-neutral-400 line-through font-medium">
                    {currencySymbol}
                    {formatCurrencyAmount(validCompareAtPrice, 2)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Store Link */}
          {showStore && store && (
            <a
              href={`/store/${store.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-500 hover:text-gold transition-colors pt-0.5 sm:pt-1"
            >
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {translations.by} {store.name}
              </span>
              {store.verified && (
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </a>
          )}
        </div>

        {/* Quick Add Button / Contact Button */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: isHovered ? 0 : '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-0 right-0"
        >
          {isInquiryProduct ? (
            <button
              onClick={handleCardClick}
              className={cn(
                'w-full py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-gold to-accent-700',
                'text-black font-bold text-xs sm:text-sm',
                'flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5',
                'hover:from-black hover:to-neutral-800 hover:text-white',
                'transition-all duration-300',
                'shadow-2xl'
              )}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden xs:inline">{translations.contactSeller}</span>
              <span className="xs:hidden">{translations.contact}</span>
            </button>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={!inStock}
              className={cn(
                'w-full py-2.5 sm:py-3 md:py-4 font-bold text-xs sm:text-sm',
                'flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5',
                'transition-all duration-300',
                'shadow-2xl',
                inStock
                  ? 'bg-gradient-to-r from-black to-neutral-800 text-white hover:from-gold hover:to-accent-700 hover:text-black'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              )}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {inStock ? (
                <>
                  <span className="hidden xs:inline">{translations.addToBag}</span>
                  <span className="xs:hidden">{translations.add}</span>
                </>
              ) : (
                <span>{translations.outOfStock}</span>
              )}
            </button>
          )}
        </motion.div>
      </motion.article>
    );
  }
);

ProductCard.displayName = 'ProductCard';
