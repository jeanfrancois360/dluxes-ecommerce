'use client';

import { useState, useEffect, useRef } from 'react';
import { useGelatoCatalog } from '@/hooks/use-gelato';

interface GelatoProductSelectorProps {
  value: string;
  onChange: (uid: string, productName?: string) => void;
  disabled?: boolean;
}

export function GelatoProductSelector({ value, onChange, disabled }: GelatoProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    products,
    total,
    isLoading: loading,
    error,
  } = useGelatoCatalog({
    search: debouncedSearch,
    // Note: E-commerce API doesn't support category filtering for custom store products
    limit: 50,
  });

  // Debug logging
  useEffect(() => {
    if (products.length > 0) {
      console.log('[GelatoProductSelector] Products:', products);
      console.log('[GelatoProductSelector] First product:', products[0]);
    }
  }, [products]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch selected product name if value exists
  useEffect(() => {
    if (value && !selectedName) {
      const product = products.find((p: any) => p.uid === value);
      if (product) {
        setSelectedName(product.title || product.uid);
      }
    }
  }, [value, products, selectedName]);

  function handleSelect(uid: string, name: string) {
    onChange(uid, name);
    setSelectedName(name);
    setIsOpen(false);
    setSearch('');
    setSelectedCategory('');
  }

  function handleClear() {
    onChange('', '');
    setSelectedName('');
    setSearch('');
    setSelectedCategory('');
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <div
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white hover:border-[#CBB57B] hover:shadow-sm'
        } ${value ? 'border-[#CBB57B] bg-amber-50/30' : 'border-gray-300'}`}
        onClick={() => !disabled && setIsOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          {value && selectedName ? (
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">{selectedName}</p>
              <p className="text-xs text-gray-500 truncate">{value}</p>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Search Gelato product catalog...</span>
          )}
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Search & Filters */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                </svg>
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product name or ID..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="max-h-96 overflow-y-auto">
            {error ? (
              <div className="p-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 mb-1">Failed to load products</p>
                    <p className="text-red-600 text-xs">
                      {typeof error === 'string'
                        ? error
                        : 'Unable to connect to Gelato. Please check your settings and try again.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    className="animate-spin h-5 w-5 text-[#CBB57B]"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading products...
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {debouncedSearch || selectedCategory ? 'No products found' : 'Start searching'}
                </p>
                <p className="text-xs text-gray-500">
                  {debouncedSearch || selectedCategory
                    ? 'Try different search terms or filters'
                    : 'Type a product name or select a category to browse'}
                </p>
              </div>
            ) : (
              <>
                {products.map((product: any, index: number) => {
                  // Extract product data with fallbacks for different API response formats
                  const productId =
                    product.uid || product.productUid || product.id || `product-${index}`;
                  const productName =
                    product.title || product.name || product.productName || productId;
                  const productImage =
                    product.previewUrl ||
                    product.imageUrl ||
                    product.thumbnailUrl ||
                    product.image ||
                    null;
                  const productCategory = product.category || product.categoryName || '';

                  return (
                    <button
                      key={productId}
                      type="button"
                      onClick={() => handleSelect(productId, productName)}
                      className={`w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-0 transition-colors ${
                        value === productId ? 'bg-amber-50 border-l-4 border-l-[#CBB57B]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
                          {productImage && !failedImages.has(productId) ? (
                            <>
                              {/* Loading Skeleton */}
                              {loadingImages.has(productId) && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                              )}

                              {/* Actual Image */}
                              <img
                                src={productImage}
                                alt={productName}
                                loading="lazy"
                                className={`w-full h-full object-cover transition-opacity duration-200 ${
                                  loadingImages.has(productId) ? 'opacity-0' : 'opacity-100'
                                }`}
                                onLoadStart={() => {
                                  setLoadingImages((prev) => new Set(prev).add(productId));
                                }}
                                onLoad={() => {
                                  setLoadingImages((prev) => {
                                    const next = new Set(prev);
                                    next.delete(productId);
                                    return next;
                                  });
                                }}
                                onError={() => {
                                  setLoadingImages((prev) => {
                                    const next = new Set(prev);
                                    next.delete(productId);
                                    return next;
                                  });
                                  setFailedImages((prev) => new Set(prev).add(productId));
                                }}
                              />
                            </>
                          ) : (
                            // Fallback Icon for no image or failed load
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {productName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">ID: {productId}</p>
                          {productCategory && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              {productCategory}
                            </span>
                          )}
                        </div>

                        {/* Selected Indicator */}
                        {value === productId && (
                          <svg
                            className="w-5 h-5 text-[#CBB57B] shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Results Summary */}
                {total > 0 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-600">
                      Showing {products.length} of {total} products
                      {total > products.length && ' — refine your search for more specific results'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
