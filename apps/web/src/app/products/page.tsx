'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductGrid, QuickViewModal, type QuickViewProduct } from '@luxury/ui';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { SearchFilters } from '@/lib/api/types';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Parse URL parameters
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 12,
    sortBy: 'relevance',
  });

  useEffect(() => {
    const newFilters: SearchFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      category: searchParams.get('category') || undefined,
      query: searchParams.get('q') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      brands: searchParams.getAll('brand'),
      tags: searchParams.getAll('tag'),
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      onSale: searchParams.get('onSale') === 'true' ? true : undefined,
    };
    setFilters(newFilters);
  }, [searchParams]);

  // Fetch products and categories
  const { products: productsData, isLoading, error, total, totalPages, page } = useProducts(filters);
  const { categories } = useCategories();

  // Transform products for UI
  const products = useMemo(() => transformToQuickViewProducts(productsData), [productsData]);

  // Extract unique brands from products
  const brands = useMemo(() => {
    if (!productsData) return [];
    const brandSet = new Set(productsData.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet) as string[];
  }, [productsData]);

  // Local filter state for UI
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 10000
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.category ? [filters.category] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filters.brands || []);
  const [sortBy, setSortBy] = useState(filters.sortBy || 'relevance');
  const [inStockOnly, setInStockOnly] = useState(filters.inStock || false);
  const [onSaleOnly, setOnSaleOnly] = useState(filters.onSale || false);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  // Apply filters
  const applyFilters = () => {
    updateFilters({
      category: selectedCategories[0],
      brands: selectedBrands,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
      inStock: inStockOnly || undefined,
      onSale: onSaleOnly || undefined,
      page: 1, // Reset to first page when filters change
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    router.push('/products');
  };

  // Handlers
  const handleQuickView = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) setQuickViewProduct(product);
  };

  const handleNavigate = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const handleAddToCart = (productId: string, variant?: { color?: string; size?: string }) => {
    console.log('Add to cart:', { productId, variant });
    // TODO: Implement cart context
  };

  const handleAddToWishlist = (id: string) => {
    console.log('Add to wishlist:', id);
    // TODO: Implement wishlist context
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as any);

    // Map frontend sort values to backend values
    let sortByValue = 'relevance';
    let sortOrder: 'asc' | 'desc' = 'desc';

    switch (value) {
      case 'price-asc':
        sortByValue = 'price';
        sortOrder = 'asc';
        break;
      case 'price-desc':
        sortByValue = 'price';
        sortOrder = 'desc';
        break;
      case 'newest':
        sortByValue = 'createdAt';
        sortOrder = 'desc';
        break;
      case 'popular':
        sortByValue = 'viewCount';
        sortOrder = 'desc';
        break;
      case 'rating':
        sortByValue = 'rating';
        sortOrder = 'desc';
        break;
      default:
        sortByValue = 'relevance';
        sortOrder = 'desc';
    }

    updateFilters({ sortBy: sortByValue as any, sortOrder, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || inStockOnly || onSaleOnly || priceRange[0] > 0 || priceRange[1] < 10000;

  return (
    <PageLayout>
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-800 text-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 px-4"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-4">
            Luxury Collection
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Curated furniture and decor for distinguished living spaces
          </p>
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-black font-medium">Products</span>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-black">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-neutral-600 hover:text-gold transition-colors underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="pb-6 border-b border-neutral-200">
                <h4 className="text-lg font-semibold text-black mb-4">Categories</h4>
                <div className="space-y-3">
                  {categories && categories.length > 0 && categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.slug)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([category.slug]);
                          } else {
                            setSelectedCategories([]);
                          }
                        }}
                        className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                      />
                      <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="pb-6 border-b border-neutral-200">
                <h4 className="text-lg font-semibold text-black mb-4">Price Range</h4>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-gold"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-neutral-600 mb-1 block">Min</label>
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-neutral-600 mb-1 block">Max</label>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="10000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="pb-6 border-b border-neutral-200">
                  <h4 className="text-lg font-semibold text-black mb-4">Brands</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand]);
                            } else {
                              setSelectedBrands(selectedBrands.filter(b => b !== brand));
                            }
                          }}
                          className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                        />
                        <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="pb-6 border-b border-neutral-200">
                <h4 className="text-lg font-semibold text-black mb-4">Availability</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                    />
                    <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                      className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                    />
                    <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">On Sale</span>
                  </label>
                </div>
              </div>

              {/* Apply Filters */}
              <button
                onClick={applyFilters}
                className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded" />
                    ) : (
                      <span className="text-sm text-neutral-600">
                        <span className="font-semibold text-black">{total}</span> products
                        {total > 0 && (
                          <span className="text-neutral-400 ml-2">
                            (Page {page} of {totalPages})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Layout Toggle */}
                  <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setLayout('grid')}
                      className={`p-2 rounded-md transition-all ${layout === 'grid'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-600 hover:text-black'
                        }`}
                      aria-label="Grid layout"
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setLayout('list')}
                      className={`p-2 rounded-md transition-all ${layout === 'list'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-600 hover:text-black'
                        }`}
                      aria-label="List layout"
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="popular">Best Selling</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-600 font-medium">Active filters:</span>
                {selectedCategories.map((cat) => (
                  <motion.span
                    key={cat}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-gold/10 text-gold text-sm rounded-full flex items-center gap-2 font-medium"
                  >
                    {cat}
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        applyFilters();
                      }}
                      className="hover:text-gold/70"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.span>
                ))}
                {selectedBrands.map((brand) => (
                  <motion.span
                    key={brand}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-gold/10 text-gold text-sm rounded-full flex items-center gap-2 font-medium"
                  >
                    {brand}
                    <button
                      onClick={() => {
                        setSelectedBrands(selectedBrands.filter(b => b !== brand));
                        applyFilters();
                      }}
                      className="hover:text-gold/70"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.span>
                ))}
                {inStockOnly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-gold/10 text-gold text-sm rounded-full flex items-center gap-2 font-medium"
                  >
                    In Stock
                    <button
                      onClick={() => {
                        setInStockOnly(false);
                        applyFilters();
                      }}
                      className="hover:text-gold/70"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.span>
                )}
                {onSaleOnly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-gold/10 text-gold text-sm rounded-full flex items-center gap-2 font-medium"
                  >
                    On Sale
                    <button
                      onClick={() => {
                        setOnSaleOnly(false);
                        applyFilters();
                      }}
                      className="hover:text-gold/70"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.span>
                )}
              </div>
            )}

            {/* Product Grid */}
            {error ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Error loading products</h3>
                <p className="text-neutral-600 mb-6">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : products && products.length === 0 && !isLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
                <p className="text-neutral-600 mb-6">Try adjusting your filters or search criteria</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <ProductGrid
                  products={products}
                  layout={layout === 'list' ? 'masonry' : layout}
                  onQuickView={handleQuickView}
                  onAddToWishlist={handleAddToWishlist}
                  onQuickAdd={handleAddToCart}
                  onNavigate={handleNavigate}
                  isLoading={isLoading}
                />

                {/* Pagination */}
                {totalPages > 1 && !isLoading && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 rounded-lg text-sm transition-colors ${pageNum === page
                                ? 'bg-black text-white'
                                : 'border border-neutral-200 hover:border-gold'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile filter content - same as desktop sidebar */}
              <div className="space-y-6">
                {/* Categories */}
                <div className="pb-6 border-b border-neutral-200">
                  <h4 className="text-lg font-semibold text-black mb-4">Categories</h4>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([category.slug]);
                            } else {
                              setSelectedCategories([]);
                            }
                          }}
                          className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                        />
                        <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                {brands.length > 0 && (
                  <div className="pb-6 border-b border-neutral-200">
                    <h4 className="text-lg font-semibold text-black mb-4">Brands</h4>
                    <div className="space-y-3">
                      {brands.map((brand) => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBrands([...selectedBrands, brand]);
                              } else {
                                setSelectedBrands(selectedBrands.filter(b => b !== brand));
                              }
                            }}
                            className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                          />
                          <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div className="pb-6 border-b border-neutral-200">
                  <h4 className="text-lg font-semibold text-black mb-4">Availability</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                      />
                      <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={onSaleOnly}
                        onChange={(e) => setOnSaleOnly(e.target.checked)}
                        className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                      />
                      <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">On Sale</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="space-y-3 mt-8">
                <button
                  onClick={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                  className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                  className="w-full px-6 py-3 border border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:border-gold transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
        onAddToCart={handleAddToCart}
        onViewDetails={handleNavigate}
      />
    </PageLayout>
  );
}
