'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRecentSearches, useTrendingSearches } from '@/hooks/use-search';
import { useCategories } from '@/hooks/use-categories';

interface SearchSuggestionsProps {
  onSelectSearch: (query: string) => void;
}

/** Pastel background colours cycled when a category has no image */
const FALLBACK_COLORS = [
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
  'bg-sky-50 text-sky-700',
  'bg-emerald-50 text-emerald-700',
  'bg-violet-50 text-violet-700',
  'bg-orange-50 text-orange-700',
];

export function SearchSuggestions({ onSelectSearch }: SearchSuggestionsProps) {
  const router = useRouter();
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const { trending } = useTrendingSearches();
  const { categories, isLoading: categoriesLoading } = useCategories();

  // Top 6 categories sorted by priority desc → displayOrder asc
  const topCategories = [...categories]
    .sort((a, b) => b.priority - a.priority || a.displayOrder - b.displayOrder)
    .slice(0, 6);

  const handleCategoryClick = (slug: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation:start'));
    }
    router.push(`/products?category=${slug}`);
  };

  return (
    <div className="p-3 xs:p-4 sm:p-5 space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 xs:mb-2.5 sm:mb-3">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <svg
                className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Searches
              </h3>
            </div>
            <button
              onClick={clearRecentSearches}
              className="text-[10px] xs:text-xs text-gray-400 hover:text-[#CBB57B] transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((term, index) => (
              <motion.div
                key={term}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-1.5 xs:gap-2 group"
              >
                <button
                  onClick={() => onSelectSearch(term)}
                  className="flex-1 text-left px-2 py-1.5 xs:px-3 xs:py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs xs:text-sm text-gray-700 group-hover:text-[#CBB57B]">
                    {term}
                  </span>
                </button>
                <button
                  onClick={() => removeRecentSearch(term)}
                  className="p-1 xs:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all"
                  aria-label="Remove"
                >
                  <svg
                    className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-gray-400"
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
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Searches */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-2.5 sm:mb-3">
            <svg
              className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h3 className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Trending Now
            </h3>
          </div>
          <div className="space-y-1">
            {trending.slice(0, 5).map((item, index) => (
              <motion.button
                key={item.term}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (recentSearches.length > 0 ? 0.25 : 0) + index * 0.05 }}
                onClick={() => onSelectSearch(item.term)}
                className="w-full text-left px-2 py-1.5 xs:px-3 xs:py-2 rounded-lg hover:bg-gray-50 transition-colors group flex items-center justify-between"
              >
                <span className="text-xs xs:text-sm text-gray-700 group-hover:text-[#CBB57B]">
                  {item.term}
                </span>
                <span className="text-[10px] xs:text-xs text-gray-400">
                  {item.count > 0 && `${item.count} searches`}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Category */}
      <div>
        <div className="flex items-center justify-between mb-2 xs:mb-2.5 sm:mb-3">
          <h3 className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Browse by Category
          </h3>
          <button
            onClick={() => router.push('/products')}
            className="text-[10px] xs:text-xs text-[#CBB57B] hover:text-[#b89f60] transition-colors font-medium"
          >
            View all
          </button>
        </div>

        {/* Skeleton */}
        {categoriesLoading && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-16" />
            ))}
          </div>
        )}

        {/* Category cards */}
        {!categoriesLoading && topCategories.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {topCategories.map((category, index) => {
              const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              const baseDelay =
                (recentSearches.length > 0 ? 0.2 : 0) + (trending.length > 0 ? 0.2 : 0);

              return (
                <motion.button
                  key={category.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: baseDelay + index * 0.04 }}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-100 hover:border-[#CBB57B]/40 bg-white hover:bg-[#CBB57B]/5 transition-all overflow-hidden"
                >
                  {/* Image or coloured initial */}
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center rounded-lg text-sm font-bold ${fallback}`}
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-[10px] xs:text-xs font-medium text-gray-700 group-hover:text-[#CBB57B] text-center leading-tight line-clamp-2 transition-colors">
                    {category.name}
                  </span>

                  {/* Product count badge */}
                  {category._count && category._count.products > 0 && (
                    <span className="text-[9px] text-gray-400 group-hover:text-[#CBB57B]/70 transition-colors">
                      {category._count.products} items
                    </span>
                  )}

                  {/* Featured indicator */}
                  {category.isFeatured && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#CBB57B]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Empty state (categories loaded but none returned) */}
        {!categoriesLoading && topCategories.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No categories available</p>
        )}
      </div>
    </div>
  );
}
