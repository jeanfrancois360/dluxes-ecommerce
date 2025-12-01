'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

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
  variants?: {
    colors?: Array<{ name: string; value: string; hex: string }>;
    sizes?: Array<{ name: string; value: string; inStock: boolean }>;
  };
  inStock?: boolean;
  badges?: string[];
}

export interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | null;
  onAddToCart?: (productId: string, variant?: { color?: string; size?: string }) => void;
  onViewDetails?: (slug: string) => void;
  currencySymbol?: string;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onViewDetails,
  currencySymbol = '$',
}) => {
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
      setSelectedSize(product.variants?.sizes?.find(s => s.inStock)?.value || null);
      setQuantity(1);
    }
  }, [product]);

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

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const validPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
  const validCompareAtPrice = typeof product.compareAtPrice === 'number' && !isNaN(product.compareAtPrice) ? product.compareAtPrice : undefined;
  const discount = validCompareAtPrice && validPrice > 0 && validCompareAtPrice > validPrice
    ? Math.round(((validCompareAtPrice - validPrice) / validCompareAtPrice) * 100)
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-neutral-100 transition-all duration-200 group"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6 text-neutral-700 group-hover:text-black transition-colors"
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
                <div className="grid lg:grid-cols-2 gap-8 p-6 sm:p-8 lg:p-12">
                  {/* Left Side - Image Gallery */}
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square bg-neutral-50 rounded-2xl overflow-hidden">
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
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {product.badges.map((badge) => (
                            <span
                              key={badge}
                              className={cn(
                                'px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md shadow-lg',
                                badge.toLowerCase() === 'new' && 'bg-black/90 text-white',
                                badge.toLowerCase() === 'sale' && 'bg-red-500/90 text-white',
                                badge.toLowerCase() === 'featured' && 'bg-gold/95 text-black',
                                badge.toLowerCase() === 'bestseller' && 'bg-accent-700/90 text-white',
                                !['new', 'sale', 'featured', 'bestseller'].includes(badge.toLowerCase()) &&
                                  'bg-neutral-800/90 text-white'
                              )}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute bottom-4 right-4">
                          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
                            <span className="text-white font-bold text-sm">-{discount}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {allImages.length > 1 && (
                      <div className="grid grid-cols-5 gap-3">
                        {allImages.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              'relative aspect-square rounded-lg overflow-hidden transition-all duration-200',
                              'border-2',
                              currentImageIndex === index
                                ? 'border-gold shadow-lg scale-105'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side - Product Details */}
                  <div className="flex flex-col">
                    {/* Brand */}
                    {product.brand && (
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">
                        {product.brand}
                      </p>
                    )}

                    {/* Product Name */}
                    <h2 id="modal-title" className="font-serif text-3xl lg:text-4xl font-bold text-black mb-4 leading-tight">
                      {product.name}
                    </h2>

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                'w-5 h-5',
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
                          <span className="text-sm text-neutral-500">({product.reviewCount} reviews)</span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200">
                      <span className="font-serif text-4xl font-bold text-black">{currencySymbol}{Number(product.price || 0).toFixed(2)}</span>
                      {product.compareAtPrice && (
                        <span className="text-xl text-neutral-400 line-through font-medium">
                          {currencySymbol}{Number(product.compareAtPrice || 0).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-neutral-600 text-base leading-relaxed mb-8">{product.description}</p>
                    )}

                    {/* Color Variants */}
                    {product.variants?.colors && product.variants.colors.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-black mb-3">
                          Color: {product.variants.colors.find((c) => c.value === selectedColor)?.name || 'Select'}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {product.variants.colors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setSelectedColor(color.value)}
                              className={cn(
                                'w-12 h-12 rounded-full border-2 transition-all duration-200',
                                selectedColor === color.value
                                  ? 'border-gold ring-4 ring-gold/20 scale-110'
                                  : 'border-neutral-300 hover:border-neutral-400'
                              )}
                              style={{ backgroundColor: color.hex }}
                              aria-label={`Select color ${color.name}`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Variants */}
                    {product.variants?.sizes && product.variants.sizes.length > 0 && (
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-black mb-3">
                          Size: {product.variants.sizes.find((s) => s.value === selectedSize)?.name || 'Select'}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {product.variants.sizes.map((size) => (
                            <button
                              key={size.value}
                              onClick={() => size.inStock && setSelectedSize(size.value)}
                              disabled={!size.inStock}
                              className={cn(
                                'px-6 py-3 rounded-lg border-2 font-medium transition-all duration-200',
                                selectedSize === size.value
                                  ? 'border-gold bg-gold/10 text-black'
                                  : size.inStock
                                  ? 'border-neutral-300 hover:border-neutral-400 text-neutral-700'
                                  : 'border-neutral-200 text-neutral-300 cursor-not-allowed line-through'
                              )}
                            >
                              {size.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-black mb-3">Quantity</label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-12 h-12 flex items-center justify-center border-2 border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-12 h-12 flex items-center justify-center border-2 border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                      <motion.button
                        onClick={handleAddToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!product.inStock}
                        className={cn(
                          'flex-1 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200',
                          product.inStock
                            ? 'bg-gradient-to-r from-black to-neutral-800 text-white hover:from-gold hover:to-accent-700 hover:text-black shadow-lg'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        )}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </motion.button>

                      <motion.button
                        onClick={handleViewDetails}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-4 bg-white border-2 border-neutral-300 text-black rounded-xl font-bold text-base hover:border-gold hover:bg-gold/5 transition-all duration-200"
                      >
                        View Full Details
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
