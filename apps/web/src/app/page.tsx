'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCarousel } from '@/components/product-carousel';
import { QuickViewModal, type QuickViewProduct } from '@luxury/ui';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFeaturedProducts, useNewArrivals, useTrendingProducts, useOnSaleProducts } from '@/hooks/use-products';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';

export default function Home() {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);

  // Fetch data from API
  const { products: featuredData, isLoading: featuredLoading } = useFeaturedProducts(8);
  const { products: newArrivalsData, isLoading: newArrivalsLoading } = useNewArrivals(8);
  const { products: trendingData, isLoading: trendingLoading } = useTrendingProducts(8);
  const { products: onSaleData, isLoading: onSaleLoading } = useOnSaleProducts(8);

  // Transform products to UI format
  const featuredProducts = useMemo(() => transformToQuickViewProducts(featuredData), [featuredData]);
  const newArrivals = useMemo(() => transformToQuickViewProducts(newArrivalsData), [newArrivalsData]);
  const trendingProducts = useMemo(() => transformToQuickViewProducts(trendingData), [trendingData]);
  const onSaleProducts = useMemo(() => transformToQuickViewProducts(onSaleData), [onSaleData]);

  const handleQuickView = (productId: string) => {
    const allProducts = [...featuredProducts, ...newArrivals, ...trendingProducts, ...onSaleProducts];
    const product = allProducts.find((p) => p.id === productId);
    if (product) setQuickViewProduct(product);
  };

  const handleNavigate = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
  };

  const handleAddToWishlist = (productId: string) => {
    console.log('Add to wishlist:', productId);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden text-white -mt-[168px] pt-[168px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/default-hero-bg.jpg"
            alt="Luxury Hero Background"
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
              Luxury Marketplace
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Discover Extraordinary
              <br />
              <span className="bg-gradient-to-r from-[#CBB57B] to-white bg-clip-text text-transparent">
                Lifestyle Products
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Curated collections of premium fashion, home décor, electronics, and more
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
        />
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
          />
        </div>
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
        />
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
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                Join Our Luxury Community
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Subscribe for exclusive offers, early access to new collections, and personalized recommendations
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
