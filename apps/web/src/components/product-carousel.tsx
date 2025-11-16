'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard, type QuickViewProduct } from '@luxury/ui';

export interface ProductCarouselProps {
  title: string;
  products: QuickViewProduct[];
  viewAllHref?: string;
  onQuickView?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onQuickAdd?: (productId: string) => void;
  onNavigate?: (slug: string) => void;
}

export function ProductCarousel({
  title,
  products,
  viewAllHref,
  onQuickView,
  onAddToWishlist,
  onQuickAdd,
  onNavigate,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft =
        direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      // Update scroll buttons after animation
      setTimeout(checkScrollPosition, 300);
    }
  };

  // Show empty state if no products
  if (!products || products.length === 0) {
    return null; // Don't render the carousel if there are no products
  }

  return (
    <div className="relative py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-black">{title}</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-[#CBB57B] to-transparent mt-3" />
        </div>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="flex items-center gap-2 text-[#CBB57B] hover:text-black transition-colors font-semibold group"
          >
            <span>View All</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#CBB57B] hover:text-white"
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}

        {/* Scroll Right Button */}
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#CBB57B] hover:text-white"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}

        {/* Products Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex-none w-[280px] snap-start"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                brand={product.brand}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                image={product.image}
                images={product.images}
                badges={product.badges}
                rating={product.rating}
                reviewCount={product.reviewCount}
                slug={product.slug}
                onQuickView={onQuickView ? () => onQuickView(product.id) : undefined}
                onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product.id) : undefined}
                onQuickAdd={onQuickAdd ? () => onQuickAdd(product.id) : undefined}
                onNavigate={onNavigate ? () => onNavigate(product.slug) : undefined}
              />
            </motion.div>
          ))}

          {/* View All Card */}
          {viewAllHref && (
            <motion.a
              href={viewAllHref}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: products.length * 0.1 }}
              className="flex-none w-[280px] snap-start"
            >
              <div className="h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 transition-all duration-300 cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#CBB57B] transition-colors">
                  <svg
                    className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="text-center px-6">
                  <p className="text-xl font-serif font-bold text-gray-800 mb-2">View All Products</p>
                  <p className="text-sm text-gray-600">Discover more amazing items</p>
                </div>
              </div>
            </motion.a>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-6 gap-2">
          {canScrollLeft && <div className="h-1 w-8 bg-[#CBB57B] rounded-full" />}
          {canScrollRight && <div className="h-1 w-8 bg-gray-300 rounded-full" />}
        </div>
      </div>
    </div>
  );
}
