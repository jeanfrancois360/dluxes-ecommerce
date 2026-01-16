'use client';

import { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCarousel } from '@/components/product-carousel';
import { type QuickViewProduct, QuickViewModal } from '@nextpik/ui';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFeaturedProducts, useNewArrivals, useTrendingProducts, useOnSaleProducts } from '@/hooks/use-products';
import { useProduct } from '@/hooks/use-product';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCurrencyProducts } from '@/hooks/use-currency-products';
import { useSelectedCurrency } from '@/hooks/use-currency';
import { toast, standardToasts } from '@/lib/utils/toast';
import { navigateWithLoading } from '@/lib/navigation';

// Lazy load heavy components
const InlineAd = lazy(() => import('@/components/ads').then(m => ({ default: m.InlineAd })));
const HeroBannerAd = lazy(() => import('@/components/ads').then(m => ({ default: m.HeroBannerAd })));

export default function Home() {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);

  // Cart and Wishlist hooks
  const { addItem: addToCartApi } = useCart();
  const { addToWishlist: addToWishlistApi } = useWishlist();

  // Get currency symbol
  const { currency } = useSelectedCurrency();
  const currencySymbol = currency?.symbol || '$';

  // Fetch data from API
  const { products: featuredData, isLoading: featuredLoading } = useFeaturedProducts(8);
  const { products: newArrivalsData, isLoading: newArrivalsLoading } = useNewArrivals(8);
  const { products: trendingData, isLoading: trendingLoading } = useTrendingProducts(8);
  const { products: onSaleData, isLoading: onSaleLoading } = useOnSaleProducts(8);

  // Transform products to UI format
  const featuredTransformed = useMemo(() => transformToQuickViewProducts(featuredData), [featuredData]);
  const newArrivalsTransformed = useMemo(() => transformToQuickViewProducts(newArrivalsData), [newArrivalsData]);
  const trendingTransformed = useMemo(() => transformToQuickViewProducts(trendingData), [trendingData]);
  const onSaleTransformed = useMemo(() => transformToQuickViewProducts(onSaleData), [onSaleData]);

  // Convert prices to selected currency
  const featuredProducts = useCurrencyProducts(featuredTransformed);
  const newArrivals = useCurrencyProducts(newArrivalsTransformed);
  const trendingProducts = useCurrencyProducts(trendingTransformed);
  const onSaleProducts = useCurrencyProducts(onSaleTransformed);

  // Fetch fresh product data for Quick View
  const { product: quickViewFullProduct, isLoading: quickViewLoading } = useProduct(
    quickViewSlug || '',
    true
  );

  // Transform fresh product data for Quick View when it's loaded
  useEffect(() => {
    if (quickViewSlug && quickViewFullProduct && !quickViewLoading) {
      const transformed = transformToQuickViewProducts([quickViewFullProduct])[0];
      setQuickViewProduct(transformed || null);
    }
  }, [quickViewFullProduct, quickViewLoading, quickViewSlug]);

  const handleQuickView = useCallback((productId: string) => {
    const allProducts = [...featuredProducts, ...newArrivals, ...trendingProducts, ...onSaleProducts];
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      // Trigger fresh data fetch by setting the slug
      setQuickViewSlug(product.slug);
    }
  }, [featuredProducts, newArrivals, trendingProducts, onSaleProducts]);

  const handleNavigate = useCallback((slug: string) => {
    navigateWithLoading(router, `/products/${slug}`);
  }, [router]);

  const handleAddToCart = useCallback(async (productId: string) => {
    if (addingToCart) return;
    setAddingToCart(productId);
    try {
      await addToCartApi(productId, 1);
      toast.success('Item has been added to your cart');
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error('Error', error.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  }, [addingToCart, addToCartApi]);

  const handleAddToWishlist = useCallback(async (productId: string) => {
    if (addingToWishlist) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      toast.error('Please login to add items to wishlist');
      router.push('/auth/login');
      return;
    }
    setAddingToWishlist(productId);
    try {
      await addToWishlistApi(productId);
      toast.success('Item has been added to your wishlist');
    } catch (error: any) {
      console.error('Failed to add to wishlist:', error);
      toast.error('Error', error.message || 'Failed to add item to wishlist');
    } finally {
      setAddingToWishlist(null);
    }
  }, [addingToWishlist, addToWishlistApi, router]);

  return (
    <PageLayout>
      {/* Hero Section - Dynamic Ad or Static Fallback */}
      <Suspense
        fallback={
          <div className="relative h-screen min-h-[600px] bg-gray-200 animate-pulse -mt-[168px] pt-[168px]" />
        }
      >
        <HeroBannerAd
          className="-mt-[168px] pt-[168px]"
          fallback={
            <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden text-white -mt-[168px] pt-[168px]">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/default-hero-bg.jpg"
                  alt="Hero Background"
                  fill
                  className="object-cover"
                  priority
                  quality={90}
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Optional grid pattern overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] z-[1]" />

              <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <span className="inline-block px-6 py-2 bg-[#CBB57B]/20 border border-[#CBB57B] text-[#CBB57B] text-sm font-semibold uppercase tracking-wider rounded-full mb-8">
                    Welcome to NextPik
                  </span>
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    Your Modern
                    <br />
                    <span className="bg-gradient-to-r from-[#CBB57B] to-white bg-clip-text text-transparent">
                      Shopping Platform
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
                    Browse quality products from trusted sellers across multiple categories
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/products">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-10 py-4 bg-[#CBB57B] text-black font-bold text-lg rounded-xl hover:bg-[#A89968] transition-colors shadow-xl"
                      >
                        Shop Now
                      </motion.button>
                    </Link>
                    <Link href="/collections">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-colors"
                      >
                        Browse Collections
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </section>
          }
        />
      </Suspense>

      {/* Featured Products */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 pt-16 pb-16 bg-white">
        <ProductCarousel
          title="Featured Products"
          products={featuredProducts}
          viewAllHref="/products?featured=true"
          onQuickView={handleQuickView}
          onAddToWishlist={handleAddToWishlist}
          onQuickAdd={handleAddToCart}
          onNavigate={handleNavigate}
          isLoading={featuredLoading}
          currencySymbol={currencySymbol}
        />
      </section>

      {/* Sponsored Content - After Featured */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 py-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="HOMEPAGE_FEATURED" />
        </Suspense>
      </section>

      {/* New Arrivals */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <ProductCarousel
            title="New Arrivals"
            products={newArrivals}
            viewAllHref="/products?sortBy=newest"
            onQuickView={handleQuickView}
            onAddToWishlist={handleAddToWishlist}
            onQuickAdd={handleAddToCart}
            onNavigate={handleNavigate}
            isLoading={newArrivalsLoading}
            currencySymbol={currencySymbol}
          />
        </div>
      </section>

      {/* Sponsored Content - After New Arrivals */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 py-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="PRODUCTS_INLINE" />
        </Suspense>
      </section>

      {/* Trending Products */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 py-16">
        <ProductCarousel
          title="Trending Now"
          products={trendingProducts}
          viewAllHref="/products?sortBy=popular"
          onQuickView={handleQuickView}
          onAddToWishlist={handleAddToWishlist}
          onQuickAdd={handleAddToCart}
          onNavigate={handleNavigate}
          isLoading={trendingLoading}
          currencySymbol={currencySymbol}
        />
      </section>

      {/* Sponsored Content - After Trending */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 py-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="PRODUCTS_BANNER" />
        </Suspense>
      </section>

      {/* On Sale Products */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <ProductCarousel
            title="On Sale"
            products={onSaleProducts}
            viewAllHref="/products?onSale=true"
            onQuickView={handleQuickView}
            onAddToWishlist={handleAddToWishlist}
            onQuickAdd={handleAddToCart}
            onNavigate={handleNavigate}
            isLoading={onSaleLoading}
            currencySymbol={currencySymbol}
          />
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="relative py-24 bg-gradient-to-br from-[#CBB57B] to-[#A89968] text-white overflow-hidden">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Stay Updated
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Subscribe for special offers, new arrivals, and personalized recommendations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors">
                  Subscribe
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <Suspense fallback={null}>
        <QuickViewModal
          isOpen={!!quickViewSlug}
          onClose={() => {
            setQuickViewSlug(null);
            setQuickViewProduct(null);
          }}
          product={quickViewProduct}
          onAddToCart={handleAddToCart}
          onViewDetails={handleNavigate}
          currencySymbol={currencySymbol}
        />
      </Suspense>
    </PageLayout>
  );
}
