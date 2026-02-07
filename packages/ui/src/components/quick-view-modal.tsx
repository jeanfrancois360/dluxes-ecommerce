'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { formatCurrencyAmount } from '../lib/utils/number-format';
import { isLightColor, calculateDiscountPercentage } from '../lib/utils/color-utils';
import { framerMotion } from '@nextpik/design-system/animations';

export interface QuickViewProduct {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  description?: string;
  rating?: number;
  reviewCount?: number;
  slug: string;
  purchaseType?: 'INSTANT' | 'INQUIRY';
  variants?: {
    colors?: Array<{ name: string; value: string; hex: string }>;
    sizes?: Array<{ name: string; value: string; inStock: boolean }>;
  };
  inStock?: boolean;
  badges?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  inWishlist?: boolean;
}

export interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | null;
  onAddToCart?: (productId: string, variant?: { color?: string; size?: string }) => void;
  onViewDetails?: (slug: string) => void;
  currencySymbol?: string;
  translations?: {
    color: string;
    size: string;
    quantity: string;
    inStock: string;
    available: string;
    outOfStock: string;
    onlyLeftInStock: string;
    addToCart: string;
    viewFullDetails: string;
    reviews: string;
    review: string;
    save: string;
  };
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onViewDetails,
  currencySymbol = '$',
  translations,
}) => {
  // Default English translations (fallback)
  const t = translations || {
    color: 'Color',
    size: 'Size',
    quantity: 'Quantity',
    inStock: 'In Stock',
    available: 'available',
    outOfStock: 'Out of Stock',
    onlyLeftInStock: 'Only {count} left in stock!',
    addToCart: 'Add to Cart',
    viewFullDetails: 'View Full Details',
    reviews: 'reviews',
    review: 'review',
    save: 'Save {percent}%',
  };
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when product changes
  React.useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
      setSelectedColor(product.variants?.colors?.[0]?.value || null);
      setSelectedSize(product.variants?.sizes?.find((s) => s.inStock)?.value || null);
      setQuantity(1);
    }
  }, [product]);

  // Auto-switch to first image when variant changes (shows variant-specific image)
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColor, selectedSize]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!product || !mounted) return null;

  // Note: Since this is in the UI package, we can't use product.variants with backend variant structure
  // The product already has transformed variants in the QuickViewProduct format
  // So we calculate based on the selected color/size but don't have access to variant-specific prices/images
  // For now, we'll use the base product price and images
  // TODO: If variant-specific prices are needed, pass them through the QuickViewProduct interface

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const validPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
  const validCompareAtPrice =
    typeof product.compareAtPrice === 'number' && !isNaN(product.compareAtPrice)
      ? product.compareAtPrice
      : undefined;
  const discount = validCompareAtPrice
    ? calculateDiscountPercentage(validCompareAtPrice, validPrice)
    : 0;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id, {
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      });
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.slug);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/products/${product.slug}`;
    }
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...framerMotion.modal.backdrop}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
              <motion.div
                {...framerMotion.modal.content}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 xs:top-4 xs:right-4 sm:top-5 sm:right-5 lg:top-6 lg:right-6 z-10 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-neutral-100 transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-neutral-700 group-hover:text-black transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Modal Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 p-4 xs:p-5 sm:p-6 md:p-8 lg:p-12">
                  {/* Left Side - Image Gallery */}
                  <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square bg-neutral-50 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={allImages[currentImageIndex]}
                          alt={product.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full object-cover"
                        />
                      </AnimatePresence>

                      {/* Badges */}
                      {product.badges && product.badges.length > 0 && (
                        <div className="absolute top-2 left-2 xs:top-3 xs:left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2">
                          {product.badges.map((badge) => (
                            <span
                              key={badge}
                              className={cn(
                                'px-2 py-0.5 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 md:px-4 md:py-1.5 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-lg',
                                badge.toLowerCase() === 'new' && 'bg-black/90 text-white',
                                badge.toLowerCase() === 'sale' && 'bg-red-500/90 text-white',
                                badge.toLowerCase() === 'featured' && 'bg-gold/95 text-black',
                                badge.toLowerCase() === 'bestseller' &&
                                  'bg-accent-700/90 text-white',
                                !['new', 'sale', 'featured', 'bestseller'].includes(
                                  badge.toLowerCase()
                                ) && 'bg-neutral-800/90 text-white'
                              )}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute bottom-2 right-2 xs:bottom-3 xs:right-3 sm:bottom-4 sm:right-4">
                          <div className="w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
                            <span className="text-white font-bold text-[10px] xs:text-xs sm:text-sm">
                              -{discount}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {allImages.length > 1 && (
                      <div className="grid grid-cols-4 xs:grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3">
                        {allImages.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              'relative aspect-square rounded-md sm:rounded-lg overflow-hidden transition-all duration-200',
                              'border-2',
                              currentImageIndex === index
                                ? 'border-gold shadow-lg scale-105'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <img
                              src={img}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side - Product Details */}
                  <div className="flex flex-col">
                    {/* Brand */}
                    {product.brand && (
                      <p className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-neutral-500 font-semibold mb-2 sm:mb-3">
                        {product.brand}
                      </p>
                    )}

                    {/* Product Name */}
                    <h2
                      id="modal-title"
                      className="font-serif text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4 leading-tight"
                    >
                      {product.name}
                    </h2>

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                'w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5',
                                i < Math.floor(product.rating!)
                                  ? 'fill-gold text-gold'
                                  : 'fill-neutral-200 text-neutral-200'
                              )}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {product.reviewCount && (
                          <span className="text-xs sm:text-sm text-neutral-500">
                            ({product.reviewCount}{' '}
                            {product.reviewCount === 1 ? t.review : t.reviews})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-neutral-200">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${validPrice}-${validCompareAtPrice}`}
                          {...framerMotion.priceChange}
                          className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4"
                        >
                          <span className="font-serif text-2xl xs:text-3xl sm:text-4xl font-bold text-black">
                            {currencySymbol}
                            {formatCurrencyAmount(validPrice, 2)}
                          </span>
                          {validCompareAtPrice && (
                            <>
                              <span className="text-lg xs:text-xl sm:text-2xl text-neutral-400 line-through font-medium">
                                {currencySymbol}
                                {formatCurrencyAmount(validCompareAtPrice, 2)}
                              </span>
                              {discount > 0 && (
                                <span className="px-2 py-0.5 xs:px-2.5 xs:py-1 sm:px-3 sm:py-1 bg-red-100 text-red-600 text-xs sm:text-sm font-semibold rounded-full">
                                  {t.save.replace('{percent}', String(discount))}
                                </span>
                              )}
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                        {product.description}
                      </p>
                    )}

                    {/* Color Variants */}
                    {product.variants?.colors && product.variants.colors.length > 0 && (
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                          {t.color}
                          {selectedColor && (
                            <span className="text-neutral-600 font-normal ml-1.5 sm:ml-2 capitalize text-xs sm:text-sm">
                              (
                              {product.variants.colors.find((c) => c.value === selectedColor)?.name}
                              )
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {product.variants.colors.map((color) => {
                            const isLight = isLightColor(color.hex);

                            return (
                              <motion.button
                                key={`quickview-color-${color.value}`}
                                onClick={() => setSelectedColor(color.value)}
                                whileHover={framerMotion.interactions.swatchHover}
                                whileTap={framerMotion.interactions.swatchTap}
                                className={cn(
                                  'w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 relative',
                                  selectedColor === color.value
                                    ? 'border-gold ring-2 ring-gold/20 scale-110'
                                    : isLight
                                      ? 'border-neutral-400 hover:border-neutral-500'
                                      : 'border-neutral-300 hover:border-gold/50'
                                )}
                                style={{ backgroundColor: color.hex }}
                                aria-label={`Select color ${color.name}`}
                                title={color.name}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Size Variants */}
                    {product.variants?.sizes && product.variants.sizes.length > 0 && (
                      <div className="mb-6 sm:mb-8">
                        <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                          {t.size}
                          {selectedSize && (
                            <span className="text-neutral-600 font-normal ml-1.5 sm:ml-2 uppercase text-xs sm:text-sm">
                              ({product.variants.sizes.find((s) => s.value === selectedSize)?.name})
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {product.variants.sizes.map((size) => (
                            <motion.button
                              key={`quickview-size-${size.value}`}
                              onClick={() => size.inStock && setSelectedSize(size.value)}
                              disabled={!size.inStock}
                              whileHover={size.inStock ? framerMotion.interactions.sizeHover : {}}
                              whileTap={size.inStock ? framerMotion.interactions.sizeTap : {}}
                              className={cn(
                                'px-3 py-2 xs:px-4 xs:py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-md sm:rounded-lg border-2 font-medium text-xs sm:text-sm transition-all duration-200',
                                selectedSize === size.value
                                  ? 'border-gold bg-gold text-black'
                                  : size.inStock
                                    ? 'border-neutral-300 hover:border-gold'
                                    : 'border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                              )}
                            >
                              {size.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                        {t.quantity}
                      </label>
                      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-neutral-300 rounded-md sm:rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="text-lg xs:text-xl sm:text-xl font-semibold w-10 xs:w-12 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          disabled={
                            product.stockQuantity ? quantity >= product.stockQuantity : false
                          }
                          className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-neutral-300 rounded-md sm:rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {product.inStock ? (
                          <>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                            <span className="text-xs sm:text-sm text-green-600 font-medium">
                              {product.stockQuantity && product.stockQuantity > 0
                                ? `${t.inStock} (${product.stockQuantity} ${t.available})`
                                : t.inStock}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
                            <span className="text-xs sm:text-sm text-red-600 font-medium">
                              {t.outOfStock}
                            </span>
                          </>
                        )}
                      </div>
                      {product.inStock &&
                        product.stockQuantity &&
                        product.lowStockThreshold &&
                        product.stockQuantity <= product.lowStockThreshold && (
                          <p className="text-[10px] xs:text-xs text-orange-600 mt-1">
                            {t.onlyLeftInStock.replace('{count}', String(product.stockQuantity))}
                          </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 sm:gap-4 mt-auto">
                      <motion.button
                        onClick={handleAddToCart}
                        whileHover={framerMotion.interactions.buttonHover}
                        whileTap={framerMotion.interactions.buttonTap}
                        disabled={!product.inStock}
                        className={cn(
                          'flex-1 py-2.5 xs:py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm xs:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200',
                          product.inStock
                            ? 'bg-gradient-to-r from-black to-neutral-800 text-white hover:from-gold hover:to-accent-700 hover:text-black shadow-lg'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        )}
                      >
                        <svg
                          className="w-4 h-4 xs:w-5 xs:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        {product.inStock ? t.addToCart : t.outOfStock}
                      </motion.button>

                      <motion.button
                        onClick={handleViewDetails}
                        whileHover={framerMotion.interactions.buttonHover}
                        whileTap={framerMotion.interactions.buttonTap}
                        className="flex-1 py-2.5 xs:py-3 sm:py-4 bg-white border-2 border-neutral-300 text-black rounded-lg sm:rounded-xl font-bold text-sm xs:text-base hover:border-gold hover:bg-gold/5 transition-all duration-200"
                      >
                        {t.viewFullDetails}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
