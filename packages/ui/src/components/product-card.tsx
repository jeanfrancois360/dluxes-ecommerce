'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  slug: string;
  onQuickView?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickAdd?: (id: string) => void;
  onNavigate?: (slug: string) => void;
  inWishlist?: boolean;
  className?: string;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
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
  onQuickView,
  onAddToWishlist,
  onQuickAdd,
  onNavigate,
  inWishlist = false,
  className,
  priority = false,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isWishlisted, setIsWishlisted] = React.useState(inWishlist);
  const [isHovered, setIsHovered] = React.useState(false);

  const allImages = [image, ...images].filter(Boolean);
  const discount = compareAtPrice && price && price > 0 && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden cursor-pointer',
        'border-2 border-neutral-100 hover:border-gold/50',
        'shadow-sm hover:shadow-2xl',
        'transition-all duration-500 ease-out',
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
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {badges.map((badge, index) => (
              <motion.span
                key={`${badge}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full',
                  'backdrop-blur-md shadow-lg',
                  badge.toLowerCase() === 'new' && 'bg-black/90 text-white',
                  badge.toLowerCase() === 'sale' && 'bg-red-500/90 text-white',
                  badge.toLowerCase() === 'featured' && 'bg-gold/95 text-black',
                  badge.toLowerCase() === 'bestseller' && 'bg-accent-700/90 text-white',
                  !['new', 'sale', 'featured', 'bestseller'].includes(badge.toLowerCase()) && 'bg-neutral-800/90 text-white'
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
          scale: isHovered ? 1 : 0.8
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-4 right-4 z-20',
          'w-11 h-11 rounded-full flex items-center justify-center',
          'bg-white/95 backdrop-blur-md shadow-xl',
          'border-2 transition-colors duration-200',
          isWishlisted ? 'border-red-500' : 'border-neutral-200'
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <motion.svg
          className={cn(
            'w-5 h-5 transition-all duration-200',
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
              scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            className="relative w-full h-full"
          >
            <img
              src={allImages[currentImageIndex]}
              alt={name}
              className="w-full h-full object-cover"
              loading={priority ? 'eager' : 'lazy'}
            />
          </motion.div>
        </AnimatePresence>

        {/* Image Navigation Dots */}
        {allImages.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4"
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
                  'h-2 rounded-full transition-all duration-300',
                  currentImageIndex === index
                    ? 'w-8 bg-gold shadow-lg'
                    : 'w-2 bg-white/60 hover:bg-white/90'
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
                className="px-8 py-3.5 bg-white text-black rounded-xl font-bold text-sm shadow-2xl hover:bg-gold transition-colors duration-200"
              >
                Quick View
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute bottom-4 right-4 z-10">
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-xl"
            >
              <span className="text-white font-bold text-sm">
                -{discount}%
              </span>
            </motion.div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 space-y-3">
        {/* Brand */}
        {brand && (
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
            {brand}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-serif text-lg font-bold text-black line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-200">
          {name}
        </h3>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.svg
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'w-4 h-4 transition-colors',
                    i < Math.floor(rating) ? 'fill-gold text-gold' : 'fill-neutral-200 text-neutral-200'
                  )}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </div>
            {reviewCount && (
              <span className="text-xs text-neutral-500 font-medium">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3 pt-2">
          <span className="font-serif text-2xl font-bold text-black">
            ${(price ?? 0).toFixed(2)}
          </span>
          {compareAtPrice && (
            <span className="text-sm text-neutral-400 line-through font-medium">
              ${(compareAtPrice ?? 0).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Button */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isHovered ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0"
      >
        <button
          onClick={handleQuickAdd}
          className={cn(
            'w-full py-4 bg-gradient-to-r from-black to-neutral-800',
            'text-white font-bold text-sm',
            'flex items-center justify-center gap-2.5',
            'hover:from-gold hover:to-accent-700 hover:text-black',
            'transition-all duration-300',
            'shadow-2xl'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          Add to Bag
        </button>
      </motion.div>
    </motion.article>
  );
};
