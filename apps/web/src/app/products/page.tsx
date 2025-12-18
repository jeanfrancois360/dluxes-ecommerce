'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductGrid, QuickViewModal, type QuickViewProduct } from '@luxury/ui';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { useSidebarCategories } from '@/hooks/use-categories';
import { useCart } from '@/hooks/use-cart';
import { useAddToWishlist } from '@/hooks/use-wishlist';
import { useCurrencyProducts } from '@/hooks/use-currency-products';
import { useSelectedCurrency } from '@/hooks/use-currency';
import { toast } from '@/lib/toast';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { SearchFilters } from '@/lib/api/types';
import { SidebarAd, CategoryBannerAd } from '@/components/ads';
import { ProductGridSkeleton } from '@/components/loading/skeleton';
import { ScrollToTop } from '@/components/scroll-to-top';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [applyingFilters, setApplyingFilters] = useState(false);

  // Cart and Wishlist hooks
  const { addItem: addToCartApi } = useCart();
  const { addToWishlist: addToWishlistApi } = useAddToWishlist();

  // Get currency symbol
  const { currency } = useSelectedCurrency();
  const currencySymbol = currency?.symbol || '$';

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
  const { categories, isLoading: categoriesLoading } = useSidebarCategories();

  // Transform products for UI
  const transformedProducts = useMemo(() => transformToQuickViewProducts(productsData), [productsData]);

  // Convert prices to selected currency
  const products = useCurrencyProducts(transformedProducts);

  // Extract unique brands from products
  // Note: Brand field not implemented in database yet
  const brands = useMemo(() => {
    return [];
  }, []);

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

  // Sync local state with URL parameters
  useEffect(() => {
    setPriceRange([filters.minPrice || 0, filters.maxPrice || 10000]);
    setSelectedCategories(filters.category ? [filters.category] : []);
    setSelectedBrands(filters.brands || []);
    setSortBy(filters.sortBy || 'relevance');
    setInStockOnly(filters.inStock || false);
    setOnSaleOnly(filters.onSale || false);
  }, [filters]);

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

  // Apply filters with loading state
  const applyFilters = async () => {
    setApplyingFilters(true);
    updateFilters({
      category: selectedCategories[0],
      brands: selectedBrands,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
      inStock: inStockOnly || undefined,
      onSale: onSaleOnly || undefined,
      page: 1, // Reset to first page when filters change
    });
    // Short delay for visual feedback
    setTimeout(() => setApplyingFilters(false), 300);
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

  // Handlers - memoized for performance
  const handleQuickView = useCallback((id: string) => {
    const product = products.find(p => p.id === id);
    if (product) setQuickViewProduct(product);
  }, [products]);

  const handleNavigate = useCallback((slug: string) => {
    router.push(`/products/${slug}`);
  }, [router]);

  const handleAddToCart = useCallback(async (productId: string, variant?: { color?: string; size?: string }) => {
    if (addingToCart) return; // Prevent double-click

    setAddingToCart(productId);
    try {
      await addToCartApi(productId, 1);
      toast.success('Added to Cart', 'Item has been added to your cart');
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error('Error', error.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  }, [addingToCart, addToCartApi]);

  const handleAddToWishlist = useCallback(async (id: string) => {
    if (addingToWishlist) return; // Prevent double-click

    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      toast.error('Login Required', 'Please login to add items to wishlist');
      router.push('/auth/login');
      return;
    }

    setAddingToWishlist(id);
    try {
      await addToWishlistApi(id);
      toast.success('Added to Wishlist', 'Item has been added to your wishlist');
    } catch (error: any) {
      console.error('Failed to add to wishlist:', error);
      toast.error('Error', error.message || 'Failed to add item to wishlist');
    } finally {
      setAddingToWishlist(null);
    }
  }, [addingToWishlist, addToWishlistApi, router]);

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
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center bg-black text-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 bg-[#CBB57B]/20 border border-[#CBB57B]/30 rounded-full text-[#CBB57B] text-sm font-semibold backdrop-blur-sm">
              Premium Collection 2025
            </span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-serif font-bold mb-6 bg-gradient-to-r from-white via-white to-[#CBB57B] bg-clip-text text-transparent leading-tight">
            Luxury Collection
          </h1>
          <p className="text-base md:text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover our exquisite selection of premium watches, jewelry, accessories, and fashion pieces crafted for the discerning individual
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10"
            >
              <svg className="w-5 h-5 text-[#CBB57B]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white/90 font-medium">Authentic Products</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10"
            >
              <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-white/90 font-medium">Free Shipping</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10"
            >
              <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-white/90 font-medium">Secure Payment</span>
            </motion.div>
          </div>
        </motion.div>
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
                    className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="pb-6 border-b border-neutral-200">
                <h4 className="text-lg font-semibold text-black mb-4">Categories</h4>
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 bg-neutral-200 rounded animate-pulse flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-3 cursor-pointer group hover:bg-neutral-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.slug)}
                            onChange={(e) => {
                              const newCategories = e.target.checked ? [category.slug] : [];
                              setSelectedCategories(newCategories);
                              // Apply filter immediately
                              updateFilters({
                                category: newCategories[0],
                                brands: selectedBrands,
                                minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                                maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                                inStock: inStockOnly || undefined,
                                onSale: onSaleOnly || undefined,
                                page: 1,
                              });
                            }}
                            className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20 cursor-pointer"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-neutral-800 group-hover:text-black transition-colors font-medium">
                              {category.name}
                            </span>
                            {category._count && category._count.products > 0 && (
                              <span className="ml-auto text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                {category._count.products}
                              </span>
                            )}
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500 italic">No categories available</p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="pb-6 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-black">Price Range</h4>
                  <span className="text-sm font-bold text-gold">
                    ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-gold"
                      style={{
                        background: `linear-gradient(to right, #CBB57B 0%, #CBB57B ${(priceRange[1] / 10000) * 100}%, #e5e5e5 ${(priceRange[1] / 10000) * 100}%, #e5e5e5 100%)`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Min Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">$</span>
                        <input
                          type="number"
                          min="0"
                          max={priceRange[1]}
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-neutral-300 rounded-lg text-sm font-semibold text-black focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Max Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">$</span>
                        <input
                          type="number"
                          min={priceRange[0]}
                          max="10000"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-neutral-300 rounded-lg text-sm font-semibold text-black focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
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
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-neutral-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20 cursor-pointer"
                    />
                    <span className="text-neutral-800 group-hover:text-black transition-colors font-medium flex items-center gap-2">
                      In Stock Only
                      {inStockOnly && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-neutral-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                      className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20 cursor-pointer"
                    />
                    <span className="text-neutral-800 group-hover:text-black transition-colors font-medium flex items-center gap-2">
                      On Sale
                      {onSaleOnly && (
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Apply Filters */}
              <button
                onClick={applyFilters}
                disabled={applyingFilters}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-black to-neutral-800 text-white rounded-lg hover:from-gold hover:to-accent-700 hover:text-black transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {applyingFilters ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 mb-8 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CBB57B] to-[#A89968] flex items-center justify-center shadow-md">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-black text-2xl">{total.toLocaleString()}</span>
                            <span className="text-neutral-600 text-sm font-medium">product{total !== 1 ? 's' : ''}</span>
                          </div>
                          {total > 0 && (
                            <span className="text-neutral-500 text-xs">
                              Page {page} of {totalPages}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Filter Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-5 py-3 bg-gradient-to-r from-black to-neutral-800 text-white rounded-xl hover:from-[#CBB57B] hover:to-[#A89968] transition-all duration-300 flex items-center gap-2.5 font-semibold shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-white text-black rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold px-2">
                        {[selectedCategories.length, selectedBrands.length, inStockOnly ? 1 : 0, onSaleOnly ? 1 : 0].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </motion.button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Layout Toggle */}
                  <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1.5 shadow-inner">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLayout('grid')}
                      className={`p-3 rounded-lg transition-all ${layout === 'grid'
                        ? 'bg-gradient-to-br from-[#CBB57B] to-[#A89968] text-white shadow-lg'
                        : 'text-neutral-600 hover:text-black hover:bg-white/80'
                        }`}
                      aria-label="Grid layout"
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLayout('list')}
                      className={`p-3 rounded-lg transition-all ${layout === 'list'
                        ? 'bg-gradient-to-br from-[#CBB57B] to-[#A89968] text-white shadow-lg'
                        : 'text-neutral-600 hover:text-black hover:bg-white/80'
                        }`}
                      aria-label="List layout"
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="flex-1 sm:flex-initial px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm font-semibold text-black focus:outline-none focus:border-[#CBB57B] focus:ring-2 focus:ring-[#CBB57B]/20 bg-white shadow-sm hover:border-neutral-300 transition-all cursor-pointer"
                  >
                    <option value="relevance">🎯 Relevance</option>
                    <option value="popular">⭐ Best Selling</option>
                    <option value="rating">💎 Highest Rated</option>
                    <option value="newest">✨ Newest First</option>
                    <option value="price-asc">💰 Price: Low to High</option>
                    <option value="price-desc">💸 Price: High to Low</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-600 font-medium">Active filters:</span>
                {selectedCategories.map((cat) => {
                  const category = categories.find(c => c.slug === cat);
                  return (
                    <motion.span
                      key={cat}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-3 py-1.5 bg-gold/10 text-gold text-sm rounded-full flex items-center gap-2 font-medium"
                    >
                      {category?.name || cat}
                      <button
                        onClick={() => {
                          setSelectedCategories([]);
                          updateFilters({
                            category: undefined,
                            brands: selectedBrands,
                            minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                            maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                            inStock: inStockOnly || undefined,
                            onSale: onSaleOnly || undefined,
                            page: 1,
                          });
                        }}
                        className="hover:text-gold/70"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.span>
                  );
                })}
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
                        const newBrands = selectedBrands.filter(b => b !== brand);
                        setSelectedBrands(newBrands);
                        updateFilters({
                          category: selectedCategories[0],
                          brands: newBrands,
                          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                          maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                          inStock: inStockOnly || undefined,
                          onSale: onSaleOnly || undefined,
                          page: 1,
                        });
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
                        updateFilters({
                          category: selectedCategories[0],
                          brands: selectedBrands,
                          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                          maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                          inStock: undefined,
                          onSale: onSaleOnly || undefined,
                          page: 1,
                        });
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
                        updateFilters({
                          category: selectedCategories[0],
                          brands: selectedBrands,
                          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                          maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                          inStock: inStockOnly || undefined,
                          onSale: undefined,
                          page: 1,
                        });
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
            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mb-6 shadow-xl"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-serif font-bold text-black mb-3">Unable to Load Products</h3>
                <p className="text-neutral-700 mb-2 font-medium">{error.message}</p>
                {error.status && (
                  <p className="text-sm text-neutral-600 mb-8 max-w-md mx-auto">
                    {error.status === 0 || error.message.includes('Network')
                      ? 'Unable to connect to the server. Please ensure the API is running on http://localhost:4000 and try again.'
                      : `Error code: ${error.status}`}
                  </p>
                )}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3.5 bg-gradient-to-r from-black to-neutral-800 text-white rounded-lg hover:from-gold hover:to-accent-700 hover:text-black transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  <Link href="/" className="px-8 py-3.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:border-gold hover:text-black transition-all duration-300 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Go Home
                  </Link>
                </div>
              </motion.div>
            ) : products && products.length === 0 ? (
              <div className="text-center py-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-500 mb-6 shadow-lg"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-serif font-bold text-black mb-3">No Products Found</h3>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">We couldn't find any products matching your criteria. Try adjusting your filters or search terms.</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={clearFilters}
                    className="px-8 py-3.5 bg-gradient-to-r from-black to-neutral-800 text-white rounded-lg hover:from-gold hover:to-accent-700 hover:text-black transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                  <Link href="/products" className="px-8 py-3.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:border-gold hover:text-black transition-all duration-300 font-semibold flex items-center gap-2">
                    View All Products
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-8">
                  <div className="flex-1">
                    <ProductGrid
                      products={products}
                      layout={layout}
                      onQuickView={handleQuickView}
                      onAddToWishlist={handleAddToWishlist}
                      onQuickAdd={handleAddToCart}
                      onNavigate={handleNavigate}
                      loading={false}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                  <div className="hidden xl:block w-64 flex-shrink-0">
                    <SidebarAd className="sticky top-40" />
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center items-center gap-3 mt-16"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-6 py-3 border-2 border-neutral-200 rounded-xl text-sm font-semibold hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:bg-transparent flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </motion.button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <motion.button
                              key={pageNum}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handlePageChange(pageNum)}
                              className={`min-w-[44px] h-11 rounded-xl text-sm font-bold transition-all shadow-sm ${pageNum === page
                                ? 'bg-gradient-to-br from-[#CBB57B] to-[#A89968] text-white shadow-lg scale-110'
                                : 'border-2 border-neutral-200 hover:border-[#CBB57B] hover:bg-[#CBB57B]/5'
                                }`}
                            >
                              {pageNum}
                            </motion.button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="px-2 text-neutral-400 font-bold">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-6 py-3 border-2 border-neutral-200 rounded-xl text-sm font-semibold hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:bg-transparent flex items-center gap-2"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </motion.div>
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
                  {categoriesLoading ? (
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
                          <div className="h-4 bg-neutral-200 rounded animate-pulse flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.slug)}
                              onChange={(e) => {
                                const newCategories = e.target.checked ? [category.slug] : [];
                                setSelectedCategories(newCategories);
                                // Apply filter immediately
                                updateFilters({
                                  category: newCategories[0],
                                  brands: selectedBrands,
                                  minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                                  maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                                  inStock: inStockOnly || undefined,
                                  onSale: onSaleOnly || undefined,
                                  page: 1,
                                });
                                // Close mobile modal after selecting
                                setShowFilters(false);
                              }}
                              className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-neutral-700 group-hover:text-black transition-colors font-medium">
                                {category.name}
                              </span>
                              {category._count && category._count.products > 0 && (
                                <span className="ml-auto text-xs text-neutral-500">
                                  ({category._count.products})
                                </span>
                              )}
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">No categories available</p>
                      )}
                    </div>
                  )}
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
                  disabled={applyingFilters}
                  className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {applyingFilters ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Applying...
                    </>
                  ) : (
                    'Apply Filters'
                  )}
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
        currencySymbol={currencySymbol}
      />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </PageLayout>
  );
}
