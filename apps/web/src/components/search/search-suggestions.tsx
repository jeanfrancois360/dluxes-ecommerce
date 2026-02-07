'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRecentSearches, useTrendingSearches } from '@/hooks/use-search';

interface SearchSuggestionsProps {
  onSelectSearch: (query: string) => void;
}

const popularCategories = [
  { name: 'Designer Bags', slug: 'bags', icon: '👜' },
  { name: 'Watches', slug: 'watches', icon: '⌚' },
  { name: 'Jewelry', slug: 'jewelry', icon: '💎' },
  { name: 'Shoes', slug: 'shoes', icon: '👞' },
];

export function SearchSuggestions({ onSelectSearch }: SearchSuggestionsProps) {
  const router = useRouter();
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const { trending } = useTrendingSearches();

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

      {/* Popular Categories */}
      <div>
        <h3 className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 xs:mb-2.5 sm:mb-3">
          Browse by Category
        </h3>
        <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3">
          {popularCategories.map((category, index) => (
            <motion.button
              key={category.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay:
                  (recentSearches.length > 0 ? 0.25 : 0) +
                  (trending.length > 0 ? 0.25 : 0) +
                  index * 0.05,
              }}
              onClick={() => handleCategoryClick(category.slug)}
              className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 p-2 xs:p-2.5 sm:p-3 rounded-lg xs:rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-[#CBB57B]/5 hover:to-[#CBB57B]/10 border border-gray-100 hover:border-[#CBB57B]/30 transition-all group"
            >
              <span className="text-lg xs:text-xl sm:text-2xl flex-shrink-0">{category.icon}</span>
              <span className="text-xs xs:text-sm font-medium text-gray-700 group-hover:text-[#CBB57B] text-left leading-tight">
                {category.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
