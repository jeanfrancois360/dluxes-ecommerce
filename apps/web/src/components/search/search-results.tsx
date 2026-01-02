'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@nextpik/ui';
import { useSearch } from '@/hooks/use-search';
import { FiltersSidebar } from '@/components/filters-sidebar';
import { Product } from '@/lib/api/types';
import { SearchResultsAd } from '@/components/ads';

interface SearchResultsProps {
  initialQuery: string;
  initialCategory?: string;
}

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Most Popular', value: 'popular' },
];

export function SearchResults({ initialQuery, initialCategory }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    brands: [] as string[],
    tags: [] as string[],
    inStock: undefined as boolean | undefined,
    onSale: undefined as boolean | undefined,
  });

  const { data, isLoading, error, search } = useSearch();

  // Perform search when params change
  useEffect(() => {
    if (query) {
      search({
        q: query,
        category,
        sortBy,
        page,
        limit: 24,
        ...filters,
      });
    }
  }, [query, category, sortBy, page, filters]);

  // Update when initial query changes
  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    setCategory(initialCategory);
    setPage(1);
  }, [initialCategory]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearAll = () => {
    setFilters({
      minPrice: undefined,
      maxPrice: undefined,
      brands: [],
      tags: [],
      inStock: undefined,
      onSale: undefined,
    });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <svg
            className="mx-auto w-16 h-16 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Error</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while searching. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#B8A468] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2"
        >
          Search Results for "{query}"
        </motion.h1>
        {data && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600"
          >
            {isLoading ? 'Searching...' : `${data.total} ${data.total === 1 ? 'result' : 'results'} found`}
          </motion.p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-32">
            <FiltersSidebar
              filters={filters as any}
              onFiltersChange={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          {/* Sort and View Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {data && (
              <span className="text-sm text-gray-600">
                Page {data.page} of {data.totalPages}
              </span>
            )}
          </div>

          {/* Sponsored Search Result Ad */}
          {data && data.products.length > 0 && (
            <div className="mb-6">
              <SearchResultsAd />
            </div>
          )}

          {/* Loading State */}
          {isLoading && !data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Results Grid */}
          {data && data.products.length > 0 && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${query}-${page}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
                >
                  {data.products.map((product: Product, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        brand={product.brand}
                        price={product.price}
                        compareAtPrice={product.compareAtPrice}
                        image={product.heroImage}
                        images={product.images?.map((img) => img.url) || []}
                        badges={product.badges}
                        slug={product.slug}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                      let pageNum: number;
                      if (data.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= data.totalPages - 2) {
                        pageNum = data.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-[#CBB57B] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === data.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {data && data.products.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <svg
                className="mx-auto w-20 h-20 text-gray-300 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No results found for "{query}"
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We couldn't find any products matching your search. Try different keywords or check
                your spelling.
              </p>

              {/* Search Suggestions */}
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Try searching for:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Designer Bags', 'Watches', 'Jewelry', 'Shoes', 'Accessories'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-[#CBB57B] hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
