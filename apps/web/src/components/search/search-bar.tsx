'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAutocomplete } from '@/hooks/use-search';
import { SearchAutocompleteItem } from './search-autocomplete-item';
import { SearchSuggestions } from './search-suggestions';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  className = '',
  placeholder,
  autoFocus = false,
  onSearch,
}: SearchBarProps) {
  const t = useTranslations('components.searchBar');
  const defaultPlaceholder = placeholder || t('placeholder');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: rawResults, isLoading } = useAutocomplete(searchQuery, 300);
  const results = rawResults || []; // Ensure results is always an array

  // Auto focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleProductSelect(results[selectedIndex].slug);
          } else if (searchQuery.trim()) {
            handleSearch();
          }
          break;
        case 'Escape':
          setIsFocused(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, selectedIndex, results, searchQuery]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsFocused(false);
    setSelectedIndex(-1);

    if (onSearch) {
      onSearch(query);
    }
  };

  const handleProductSelect = (slug: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation:start'));
    }
    router.push(`/products/${slug}`);
    setIsFocused(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleSuggestionSelect = (query: string) => {
    setSearchQuery(query);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation:start'));
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsFocused(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const showDropdown = isFocused && (searchQuery.length >= 2 || searchQuery.length === 0);

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
        <motion.div
          animate={{ scale: isFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          {/* Main Search Input */}
          <div
            className={`relative flex items-center h-11 rounded-full transition-all duration-300 ${
              isFocused
                ? 'bg-white shadow-lg border-2 border-[#CBB57B]'
                : 'bg-white shadow-sm border border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Search Icon */}
            <div className="absolute left-4 pointer-events-none">
              <motion.svg
                animate={{
                  rotate: isFocused ? [0, 20, 0] : 0,
                  scale: isFocused ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                className={`w-5 h-5 transition-colors duration-300 ${
                  isFocused ? 'text-[#CBB57B]' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </motion.svg>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsFocused(true)}
              placeholder={defaultPlaceholder}
              className="flex-1 h-full pl-12 pr-24 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              aria-label="Search"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
            />

            {/* Loading Spinner / Clear Button / Keyboard Hint */}
            <div className="absolute right-4 flex items-center gap-2">
              {isLoading && searchQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-4 h-4"
                >
                  <svg
                    className="animate-spin text-[#CBB57B]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </motion.div>
              )}

              {searchQuery && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}

              {!searchQuery && !isLoading && (
                <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-gray-500 bg-gray-100/80 rounded border border-gray-200">
                  <span>⌘</span>
                  <span>K</span>
                </kbd>
              )}
            </div>

            {/* Glow effect on focus */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#CBB57B]/10 via-[#CBB57B]/20 to-[#CBB57B]/10 blur-xl -z-10"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[60] max-h-[500px] overflow-y-auto"
          >
            {/* Show autocomplete results when searching */}
            {searchQuery.length >= 2 && (
              <>
                {results.length > 0 ? (
                  <>
                    <div className="py-2">
                      {results.map((product, index) => (
                        <div
                          key={product.id}
                          className={selectedIndex === index ? 'bg-gray-50' : ''}
                        >
                          <SearchAutocompleteItem
                            product={product}
                            searchQuery={searchQuery}
                            onClick={() => handleProductSelect(product.slug)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* View All Results Footer */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleSearch}
                        className="w-full px-4 py-3 text-sm font-medium text-[#CBB57B] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>View all results for "{searchQuery}"</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : !isLoading ? (
                  <div className="px-4 py-8 text-center">
                    <svg
                      className="mx-auto w-12 h-12 text-gray-300 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">No results found</p>
                    <p className="text-xs text-gray-500">
                      Try searching for different keywords
                    </p>
                  </div>
                ) : null}
              </>
            )}

            {/* Show suggestions when not searching */}
            {searchQuery.length === 0 && (
              <SearchSuggestions onSelectSearch={handleSuggestionSelect} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
