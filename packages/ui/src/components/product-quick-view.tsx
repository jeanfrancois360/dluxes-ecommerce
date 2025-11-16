'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    brand?: string;
    price: number;
    compareAtPrice?: number;
    description: string;
    images: string[];
    colors?: Array<{ name: string; hex: string; available: boolean }>;
    sizes?: Array<{ name: string; available: boolean }>;
    rating?: number;
    reviewCount?: number;
    badges?: string[];
    inStock: boolean;
    stockCount?: number;
  };
  onAddToCart?: (productId: string, options: { color?: string; size?: string; quantity: number }) => void;
  onAddToWishlist?: (productId: string) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onAddToWishlist,
}) => {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = () => {
    onAddToCart?.(product.id, {
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      quantity,
    });
    onClose();
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Left - Images */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-[4/5] bg-neutral-100 rounded-xl overflow-hidden">
                    <motion.img
                      key={selectedImage}
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Badges */}
                    {product.badges && product.badges.length > 0 && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.badges.map((badge) => (
                          <span
                            key={badge}
                            className={cn(
                              'px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm',
                              badge === 'New' && 'bg-black/80 text-white',
                              badge === 'Sale' && 'bg-error-DEFAULT/90 text-white',
                              badge === 'Featured' && 'bg-gold/90 text-black'
                            )}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {product.images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={cn(
                            'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                            selectedImage === index ? 'border-gold' : 'border-transparent hover:border-neutral-300'
                          )}
                        >
                          <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right - Product Details */}
                <div className="flex flex-col">
                  {/* Brand */}
                  {product.brand && (
                    <p className="text-sm uppercase tracking-wider text-neutral-500 mb-2 font-medium">
                      {product.brand}
                    </p>
                  )}

                  {/* Product Name */}
                  <h2 className="font-display text-3xl font-bold text-black mb-4">
                    {product.name}
                  </h2>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={cn(
                              'w-5 h-5',
                              i < Math.floor(product.rating!) ? 'fill-gold text-gold' : 'fill-neutral-200 text-neutral-200'
                            )}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-neutral-600">
                        {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-display text-4xl font-bold text-black">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.compareAtPrice && (
                      <>
                        <span className="text-lg text-neutral-400 line-through">
                          €{product.compareAtPrice.toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-error-DEFAULT">
                          Save {discount}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Color Selection */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-black mb-3">
                        Color: {selectedColor && <span className="font-normal text-neutral-600">{selectedColor}</span>}
                      </label>
                      <div className="flex gap-3">
                        {product.colors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => color.available && setSelectedColor(color.name)}
                            disabled={!color.available}
                            className={cn(
                              'relative w-10 h-10 rounded-full border-2 transition-all',
                              selectedColor === color.name ? 'border-gold scale-110' : 'border-neutral-200',
                              !color.available && 'opacity-40 cursor-not-allowed'
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            {!color.available && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-0.5 bg-neutral-400 rotate-45 absolute" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-black mb-3">
                        Size: {selectedSize && <span className="font-normal text-neutral-600">{selectedSize}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size.name}
                            onClick={() => size.available && setSelectedSize(size.name)}
                            disabled={!size.available}
                            className={cn(
                              'px-6 py-3 rounded-lg border-2 font-medium text-sm transition-all',
                              selectedSize === size.name
                                ? 'border-gold bg-gold/10 text-black'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400',
                              !size.available && 'opacity-40 cursor-not-allowed line-through'
                            )}
                          >
                            {size.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-black mb-3">Quantity</label>
                    <div className="inline-flex items-center border-2 border-neutral-200 rounded-lg">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-4 py-2 hover:bg-neutral-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-6 py-2 font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-4 py-2 hover:bg-neutral-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stock Status */}
                  {product.stockCount !== undefined && (
                    <div className="mb-6">
                      {product.inStock ? (
                        <div className="flex items-center gap-2 text-success-DEFAULT text-sm">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium">
                            In Stock {product.stockCount <= 5 && `(Only ${product.stockCount} left)`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-error-DEFAULT text-sm">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-auto">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex-1 py-4 rounded-lg font-semibold text-white transition-all',
                        product.inStock
                          ? 'bg-gradient-to-r from-black to-neutral-800 hover:from-gold hover:to-accent-600'
                          : 'bg-neutral-300 cursor-not-allowed'
                      )}
                    >
                      {product.inStock ? 'Add to Bag' : 'Out of Stock'}
                    </motion.button>

                    <motion.button
                      onClick={() => onAddToWishlist?.(product.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-4 border-2 border-neutral-200 rounded-lg hover:border-gold transition-colors"
                    >
                      <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
