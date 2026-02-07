'use client';

import { useRef, useState, memo, useCallback } from 'react';
import { ProductCard, type QuickViewProduct } from '@nextpik/ui';
import { useTranslations } from 'next-intl';

export interface ProductCarouselProps {
  title: string;
  products: QuickViewProduct[];
  viewAllHref?: string;
  onQuickView?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onQuickAdd?: (productId: string) => void;
  onNavigate?: (slug: string) => void;
  isLoading?: boolean;
  currencySymbol?: string;
}

export const ProductCarousel = memo(function ProductCarousel({
  title,
  products,
  viewAllHref,
  onQuickView,
  onAddToWishlist,
  onQuickAdd,
  onNavigate,
  isLoading = false,
  currencySymbol = '$',
}: ProductCarouselProps) {
  const tCard = useTranslations('productCard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
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

        setTimeout(checkScrollPosition, 300);
      }
    },
    [checkScrollPosition]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="relative py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-black">
              {title}
            </h2>
            <div className="h-0.5 sm:h-1 w-16 sm:w-20 bg-gradient-to-r from-[#CBB57B] to-transparent mt-2 sm:mt-3" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-none w-[160px] sm:w-[220px] md:w-[260px] lg:w-[280px] animate-pulse"
            >
              <div className="bg-gray-200 rounded-xl sm:rounded-2xl aspect-[3/4]" />
              <div className="mt-2 sm:mt-3 md:mt-4 space-y-1.5 sm:space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="relative py-6 sm:py-8 md:py-10 lg:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-black">
            {title}
          </h2>
          <div className="h-0.5 sm:h-1 w-16 sm:w-20 bg-gradient-to-r from-[#CBB57B] to-transparent mt-2 sm:mt-3" />
        </div>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[#CBB57B] hover:text-black transition-colors text-sm sm:text-base font-semibold group"
          >
            <span className="hidden xs:inline">View All</span>
            <span className="xs:hidden">All</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-xl items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#CBB57B] hover:text-white"
            aria-label="Scroll left"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-xl items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#CBB57B] hover:text-white"
            aria-label="Scroll right"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Products Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-none w-[160px] sm:w-[220px] md:w-[260px] lg:w-[280px] snap-start"
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
                purchaseType={product.purchaseType}
                inStock={product.inStock}
                stockQuantity={product.stockQuantity}
                lowStockThreshold={product.lowStockThreshold}
                inWishlist={product.inWishlist}
                priority={index < 4}
                currencySymbol={currencySymbol}
                onQuickView={onQuickView ? () => onQuickView(product.id) : undefined}
                onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product.id) : undefined}
                onQuickAdd={onQuickAdd ? () => onQuickAdd(product.id) : undefined}
                onNavigate={onNavigate ? () => onNavigate(product.slug) : undefined}
                translations={{
                  addToWishlist: tCard('addToWishlist'),
                  removeFromWishlist: tCard('removeFromWishlist'),
                  quickView: tCard('quickView'),
                  outOfStock: tCard('outOfStock'),
                  onlyLeft: tCard('onlyLeft', { count: 'COUNT_PLACEHOLDER' }).replace(
                    'COUNT_PLACEHOLDER',
                    '{count}'
                  ),
                  contactForPrice: tCard('contactForPrice'),
                  inquiryRequired: tCard('inquiryRequired'),
                  contactSeller: tCard('contactSeller'),
                  contact: tCard('contact'),
                  addToBag: tCard('addToBag'),
                  add: tCard('add'),
                  by: tCard('by'),
                  new: tCard('new'),
                  sale: tCard('sale'),
                  featured: tCard('featured'),
                  bestseller: tCard('bestseller'),
                  limitedEdition: tCard('limitedEdition'),
                }}
              />
            </div>
          ))}

          {/* View All Card */}
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="flex-none w-[160px] sm:w-[220px] md:w-[260px] lg:w-[280px] snap-start"
            >
              <div className="h-full min-h-[320px] sm:min-h-[360px] md:min-h-[380px] lg:min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 sm:gap-4 hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 transition-all duration-300 cursor-pointer group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#CBB57B] transition-colors">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
                <div className="text-center px-3 sm:px-4 md:px-6">
                  <p className="text-base sm:text-lg md:text-xl font-serif font-bold text-gray-800 mb-1 sm:mb-2">
                    View All Products
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Discover more amazing items</p>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-3 sm:mt-4 md:mt-6 gap-1.5 sm:gap-2">
          {canScrollLeft && <div className="h-0.5 sm:h-1 w-6 sm:w-8 bg-[#CBB57B] rounded-full" />}
          {canScrollRight && <div className="h-0.5 sm:h-1 w-6 sm:w-8 bg-gray-300 rounded-full" />}
        </div>
      </div>
    </div>
  );
});
