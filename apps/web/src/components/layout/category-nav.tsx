'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const categories = [
  { name: 'All Products', value: '', icon: '🔍' },
  { name: 'Fashion', value: 'fashion', icon: '👔' },
  { name: 'Home & Décor', value: 'home-decor', icon: '🏠' },
  { name: 'Electronics', value: 'electronics', icon: '📱' },
  { name: 'Beauty', value: 'beauty', icon: '💄' },
  { name: 'Sports', value: 'sports', icon: '⚽' },
  { name: 'Books', value: 'books', icon: '📚' },
  { name: 'Toys', value: 'toys', icon: '🧸' },
  { name: 'Jewelry', value: 'jewelry', icon: '💍' },
  { name: 'Watches', value: 'watches', icon: '⌚' },
  { name: 'Bags', value: 'bags', icon: '👜' },
  { name: 'Shoes', value: 'shoes', icon: '👟' },
];

export function CategoryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const category = searchParams.get('category') || '';
    setSelectedCategory(category);
  }, [searchParams]);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
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
  };

  const handleCategoryClick = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="sticky top-[128px] z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="relative max-w-[1920px] mx-auto">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Categories Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 lg:px-8 py-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.value}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleCategoryClick(category.value)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category.value
                ? 'bg-[#CBB57B] text-white shadow-md'
                : 'bg-white/60 text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
            >
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Gradient overlays for scroll indication */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/80 to-transparent pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
