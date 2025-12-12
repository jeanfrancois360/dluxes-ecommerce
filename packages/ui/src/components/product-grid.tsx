'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ProductCard, ProductCardProps } from './product-card';

export interface ProductGridProps {
  products: ProductCardProps[];
  layout?: 'grid' | 'masonry' | 'list';
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onQuickView?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickAdd?: (id: string) => void;
  onNavigate?: (slug: string) => void;
  className?: string;
  currencySymbol?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  layout = 'grid',
  columns = 3,
  gap = 'md',
  loading = false,
  onQuickView,
  onAddToWishlist,
  onQuickAdd,
  onNavigate,
  className,
  currencySymbol = '$',
}) => {
  const gapClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }[gap];

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  if (loading) {
    return (
      <div className={cn('grid', gridCols, gapClass, className)}>
        {[...Array(columns * 2)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
        <p className="text-neutral-600 text-center max-w-md">
          We couldn't find any products matching your criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  if (layout === 'masonry') {
    return <MasonryGrid products={products} columns={columns} gap={gap} className={className} currencySymbol={currencySymbol} onQuickView={onQuickView} onAddToWishlist={onAddToWishlist} onQuickAdd={onQuickAdd} onNavigate={onNavigate} />;
  }

  if (layout === 'list') {
    return <ListView products={products} gap={gap} className={className} currencySymbol={currencySymbol} onQuickView={onQuickView} onAddToWishlist={onAddToWishlist} onQuickAdd={onQuickAdd} onNavigate={onNavigate} />;
  }

  return (
    <motion.div
      className={cn('grid', gridCols, gapClass, className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard
              {...product}
              priority={index < (columns * 2)}
              currencySymbol={currencySymbol}
              onQuickView={onQuickView}
              onAddToWishlist={onAddToWishlist}
              onQuickAdd={onQuickAdd}
              onNavigate={onNavigate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

// List View Layout - Horizontal Cards
const ListView: React.FC<{
  products: ProductCardProps[];
  gap: 'sm' | 'md' | 'lg';
  className?: string;
  currencySymbol?: string;
  onQuickView?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickAdd?: (id: string) => void;
  onNavigate?: (slug: string) => void;
}> = ({ products, gap, className, currencySymbol = '$', onQuickView, onAddToWishlist, onQuickAdd, onNavigate }) => {
  const gapClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }[gap];

  return (
    <div className={cn('flex flex-col', gapClass, className)}>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Product Image */}
            <div className="relative sm:w-80 aspect-square sm:aspect-[4/3] bg-neutral-100 flex-shrink-0 cursor-pointer" onClick={() => onNavigate?.(product.slug || product.id)}>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badges && product.badges.length > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    {product.badges[0]}
                  </span>
                </div>
              )}
              {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                <div className="absolute bottom-4 right-4">
                  <span className="px-3 py-1 bg-black text-white text-sm font-medium rounded-full">
                    -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                {product.brand && (
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    {product.brand}
                  </p>
                )}
                <h3 className="text-xl font-semibold text-black mb-2 line-clamp-2 cursor-pointer hover:text-gold transition-colors" onClick={() => onNavigate?.(product.slug || product.id)}>
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={cn('w-4 h-4', i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-neutral-300')}
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-neutral-600">
                      {product.rating} {product.reviewCount && `(${product.reviewCount})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-200">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-2xl font-bold text-black">
                    {currencySymbol}{(product.price || 0).toFixed(2)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > (product.price || 0) && (
                    <span className="text-sm text-neutral-400 line-through">
                      {currencySymbol}{product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onQuickView && (
                    <button
                      onClick={() => onQuickView(product.id)}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:border-black transition-colors"
                      title="Quick View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  {onAddToWishlist && (
                    <button
                      onClick={() => onAddToWishlist(product.id)}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors"
                      title="Add to Wishlist"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate?.(product.slug || product.id)}
                    className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Masonry Grid Component
const MasonryGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 3,
  gap = 'md',
  className,
  currencySymbol = '$',
  onQuickView,
  onAddToWishlist,
  onQuickAdd,
  onNavigate,
}) => {
  const [columnItems, setColumnItems] = React.useState<ProductCardProps[][]>([]);

  React.useEffect(() => {
    // Distribute products across columns for masonry effect
    const cols: ProductCardProps[][] = Array.from({ length: columns }, () => []);

    products.forEach((product, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(product);
    });

    setColumnItems(cols);
  }, [products, columns]);

  const gapClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }[gap];

  return (
    <div className={cn('grid', `grid-cols-${columns}`, gapClass, className)}>
      {columnItems.map((columnProducts, columnIndex) => (
        <div key={columnIndex} className={cn('flex flex-col', gapClass)}>
          {columnProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (columnIndex + index) * 0.05 }}
            >
              <ProductCard
                {...product}
                priority={index < 2}
                currencySymbol={currencySymbol}
                onQuickView={onQuickView}
                onAddToWishlist={onAddToWishlist}
                onQuickAdd={onQuickAdd}
                onNavigate={onNavigate}
              />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton Loader
const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-neutral-200" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-neutral-200 rounded w-1/4" />
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-7 bg-neutral-200 rounded w-1/3 mt-4" />
      </div>
    </div>
  );
};
