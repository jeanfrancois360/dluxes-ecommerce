'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCarousel } from '@/components/product-carousel';
import { useFeaturedProducts } from '@/hooks/use-products';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch popular products to display
  const { products: featuredData, isLoading } = useFeaturedProducts(4);
  const popularProducts = useMemo(() => transformToQuickViewProducts(featuredData), [featuredData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNavigate = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const categories = [
    { name: 'Fashion', href: '/products?category=fashion', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { name: 'Home & Living', href: '/products?category=home-living', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Electronics', href: '/products?category=electronics', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'Help Center', href: '/help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-neutral-50 via-white to-accent-50 px-4 py-16">
        <div className="max-w-7xl mx-auto">
          {/* 404 Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-[150px] sm:text-[200px] md:text-[240px] font-serif font-bold leading-none bg-gradient-to-br from-[#CBB57B] via-[#A89968] to-[#8B7E5A] bg-clip-text text-transparent">
                404
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-black">
                Page Not Found
              </h2>
              <p className="text-xl text-neutral-600 leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
                <br />
                Let's help you find what you need.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mt-12"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full px-6 py-5 pr-32 text-lg border-2 border-neutral-200 rounded-2xl focus:outline-none focus:border-[#CBB57B] focus:ring-4 focus:ring-[#CBB57B]/10 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-3 bg-[#CBB57B] text-black font-bold rounded-xl hover:bg-[#A89968] transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.form>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-20"
          >
            <h3 className="text-2xl font-serif font-bold text-center mb-8">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link key={category.name} href={category.href} className="group">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-white rounded-2xl p-8 border-2 border-neutral-200 hover:border-[#CBB57B] transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CBB57B] to-[#A89968] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    <div className="w-14 h-14 bg-gradient-to-br from-[#CBB57B]/20 to-[#A89968]/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-[#CBB57B] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-neutral-600 text-sm">Explore our {category.name.toLowerCase()}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Popular Products */}
          {popularProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-black mb-4">
                  Popular Products
                </h2>
                <p className="text-lg text-neutral-600">Check out our most loved items</p>
              </div>
              <ProductCarousel
                products={popularProducts}
                onNavigate={handleNavigate}
                onQuickView={(id) => console.log('Quick view:', id)}
                onAddToWishlist={(id) => console.log('Wishlist:', id)}
                onQuickAdd={(id) => console.log('Add to cart:', id)}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {/* Quick Links Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 pt-8 border-t border-neutral-200 text-center"
          >
            <p className="text-sm text-neutral-600 mb-4">You might also be looking for:</p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/account" className="text-gold hover:text-[#A89968] font-medium transition-colors">
                My Account
              </Link>
              <Link href="/account/orders" className="text-gold hover:text-[#A89968] font-medium transition-colors">
                Orders
              </Link>
              <Link href="/cart" className="text-gold hover:text-[#A89968] font-medium transition-colors">
                Shopping Cart
              </Link>
              <Link href="/contact" className="text-gold hover:text-[#A89968] font-medium transition-colors">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
