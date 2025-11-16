'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ProductCard, ProductCardProps } from './product-card';

export interface ProductGridProps {
  products: ProductCardProps[];
  layout?: 'grid' | 'masonry';
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onQuickView?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onQuickAdd?: (id: string) => void;
  onNavigate?: (slug: string) => void;
  className?: string;
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
    return <MasonryGrid products={products} columns={columns} gap={gap} className={className} onQuickView={onQuickView} onAddToWishlist={onAddToWishlist} onQuickAdd={onQuickAdd} onNavigate={onNavigate} />;
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

// Masonry Grid Component
const MasonryGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 3,
  gap = 'md',
  className,
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
