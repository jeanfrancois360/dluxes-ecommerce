'use client';

import { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCarousel } from '@/components/product-carousel';
import { type QuickViewProduct, QuickViewModal } from '@nextpik/ui';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Home as HomeIcon, Car } from 'lucide-react';
import {
  useFeaturedProducts,
  useNewArrivals,
  useTrendingProducts,
  useOnSaleProducts,
} from '@/hooks/use-products';
import { useProduct } from '@/hooks/use-product';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCurrencyProducts } from '@/hooks/use-currency-products';
import { useSelectedCurrency } from '@/hooks/use-currency';
import { toast, standardToasts } from '@/lib/utils/toast';
import { navigateWithLoading } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// Lazy load heavy components
const InlineAd = lazy(() => import('@/components/ads').then((m) => ({ default: m.InlineAd })));
const HeroBannerAd = lazy(() =>
  import('@/components/ads').then((m) => ({ default: m.HeroBannerAd }))
);
const CreativeHeroCarousel = lazy(() =>
  import('@/components/home/creative-hero-carousel').then((m) => ({
    default: m.CreativeHeroCarousel,
  }))
);

export default function Home() {
  const router = useRouter();
  const t = useTranslations('common');
  const tHero = useTranslations('common.home.hero');
  const tModal = useTranslations('quickViewModal');
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);

  // Cart and Wishlist hooks
  const { addItem: addToCartApi } = useCart();
  const {
    addToWishlist: addToWishlistApi,
    removeFromWishlist: removeFromWishlistApi,
    isInWishlist,
  } = useWishlist();

  // Get currency symbol
  const { currency } = useSelectedCurrency();
  const currencySymbol = currency?.symbol || '$';

  // Fetch data from API
  const { products: featuredData, isLoading: featuredLoading } = useFeaturedProducts(8);
  const { products: newArrivalsData, isLoading: newArrivalsLoading } = useNewArrivals(8);
  const { products: trendingData, isLoading: trendingLoading } = useTrendingProducts(8);
  const { products: onSaleData, isLoading: onSaleLoading } = useOnSaleProducts(8);

  // Transform products to UI format
  const featuredTransformed = useMemo(
    () => transformToQuickViewProducts(featuredData),
    [featuredData]
  );
  const newArrivalsTransformed = useMemo(
    () => transformToQuickViewProducts(newArrivalsData),
    [newArrivalsData]
  );
  const trendingTransformed = useMemo(
    () => transformToQuickViewProducts(trendingData),
    [trendingData]
  );
  const onSaleTransformed = useMemo(() => transformToQuickViewProducts(onSaleData), [onSaleData]);

  // Convert prices to selected currency
  const featuredProductsCurrency = useCurrencyProducts(featuredTransformed);
  const newArrivalsCurrency = useCurrencyProducts(newArrivalsTransformed);
  const trendingProductsCurrency = useCurrencyProducts(trendingTransformed);
  const onSaleProductsCurrency = useCurrencyProducts(onSaleTransformed);

  // Add wishlist status to products
  const featuredProducts = useMemo(
    () =>
      featuredProductsCurrency.map((product) => ({
        ...product,
        inWishlist: isInWishlist(product.id),
      })),
    [featuredProductsCurrency, isInWishlist]
  );
  const newArrivals = useMemo(
    () =>
      newArrivalsCurrency.map((product) => ({ ...product, inWishlist: isInWishlist(product.id) })),
    [newArrivalsCurrency, isInWishlist]
  );
  const trendingProducts = useMemo(
    () =>
      trendingProductsCurrency.map((product) => ({
        ...product,
        inWishlist: isInWishlist(product.id),
      })),
    [trendingProductsCurrency, isInWishlist]
  );
  const onSaleProducts = useMemo(
    () =>
      onSaleProductsCurrency.map((product) => ({
        ...product,
        inWishlist: isInWishlist(product.id),
      })),
    [onSaleProductsCurrency, isInWishlist]
  );

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

  const handleQuickView = useCallback(
    (productId: string) => {
      const allProducts = [
        ...featuredProducts,
        ...newArrivals,
        ...trendingProducts,
        ...onSaleProducts,
      ];
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        // Trigger fresh data fetch by setting the slug
        setQuickViewSlug(product.slug);
      }
    },
    [featuredProducts, newArrivals, trendingProducts, onSaleProducts]
  );

  const handleNavigate = useCallback(
    (slug: string) => {
      navigateWithLoading(router, `/products/${slug}`);
    },
    [router]
  );

  const handleAddToCart = useCallback(
    async (productId: string) => {
      if (addingToCart) return;
      setAddingToCart(productId);
      try {
        await addToCartApi(productId, 1);
        toast.success(t('toast.addedToCart'));
      } catch (error: any) {
        console.error('Failed to add to cart:', error);
        toast.error(t('toast.error'), error.message || t('toast.failedAddCart'));
      } finally {
        setAddingToCart(null);
      }
    },
    [addingToCart, addToCartApi]
  );

  const handleAddToWishlist = useCallback(
    async (productId: string) => {
      if (addingToWishlist) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        toast.error(t('toast.loginRequired'));
        router.push('/auth/login');
        return;
      }
      setAddingToWishlist(productId);
      try {
        // Check if item is already in wishlist
        const inWishlist = isInWishlist(productId);

        if (inWishlist) {
          // Remove from wishlist
          await removeFromWishlistApi(productId);
          toast.success(t('toast.removedFromWishlist'));
        } else {
          // Add to wishlist
          await addToWishlistApi(productId);
          toast.success(t('toast.addedToWishlist'));
        }
      } catch (error: any) {
        console.error('Failed to update wishlist:', error);
        toast.error(t('toast.error'), error.message || t('toast.failedAddWishlist'));
      } finally {
        setAddingToWishlist(null);
      }
    },
    [addingToWishlist, addToWishlistApi, removeFromWishlistApi, isInWishlist, router, t]
  );

  // Creative Hero Carousel Slides - All using Split Layout for Consistency
  const heroSlides = useMemo(
    () => [
      // 1. Accessories - Split Layout (Dark Gray)
      {
        id: 'accessories',
        layout: 'split' as const,
        gradient: 'linear-gradient(135deg, #2d3436 0%, #1e272e 100%)',
        accentColor: '#CBB57B',
        title: tHero('accessories.title'),
        subtitle: tHero('accessories.subtitle'),
        ctaText: tHero('accessories.cta'),
        ctaHref: '/products?category=accessories',
        icon: <Sparkles className="h-8 w-8 text-[#CBB57B]" />,
        images: [
          {
            src: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=500&fit=crop&q=80',
            alt: 'Luxury Watches',
          },
          {
            src: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=500&fit=crop&q=80',
            alt: 'Designer Bags',
          },
          {
            src: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop&q=80',
            alt: 'Fine Jewelry',
          },
        ],
        shapes: [
          {
            type: 'circle' as const,
            color: '#CBB57B',
            size: 250,
            position: { x: 75, y: 15 },
            blur: true,
          },
          {
            type: 'blob' as const,
            color: '#3a3a3a',
            size: 200,
            position: { x: 10, y: 70 },
            blur: true,
          },
        ],
      },
      // 2. Fashion - Split Layout (Pure Black)
      {
        id: 'fashion',
        layout: 'split' as const,
        gradient: 'linear-gradient(135deg, #0f0f0f 0%, #000000 100%)',
        accentColor: '#ffffff',
        title: tHero('fashion.title'),
        subtitle: tHero('fashion.subtitle'),
        ctaText: tHero('fashion.cta'),
        ctaHref: '/products?category=fashion',
        icon: <TrendingUp className="h-8 w-8 text-white" />,
        images: [
          {
            src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop&q=80',
            alt: 'Fashion Collection',
          },
          {
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop&q=80',
            alt: 'Stylish Outfits',
          },
          {
            src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=500&fit=crop&q=80',
            alt: 'Fashion Trends',
          },
        ],
        shapes: [
          {
            type: 'circle' as const,
            color: '#1a1a1a',
            size: 350,
            position: { x: 20, y: 25 },
            blur: true,
          },
          {
            type: 'circle' as const,
            color: '#2a2a2a',
            size: 250,
            position: { x: 70, y: 60 },
            blur: true,
          },
        ],
      },
      // 3. Electronics - Split Layout (Charcoal)
      {
        id: 'electronics',
        layout: 'split' as const,
        gradient: 'linear-gradient(135deg, #232526 0%, #0f1419 100%)',
        accentColor: '#60a5fa',
        title: tHero('electronics.title'),
        subtitle: tHero('electronics.subtitle'),
        ctaText: tHero('electronics.cta'),
        ctaHref: '/products?category=electronics',
        icon: <Zap className="h-8 w-8 text-[#60a5fa]" />,
        images: [
          {
            src: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=500&fit=crop&q=80',
            alt: 'PlayStation 5',
          },
          {
            src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=500&fit=crop&q=80',
            alt: 'MacBook Pro M4 Max',
          },
          {
            src: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=500&fit=crop&q=80',
            alt: 'JBL Flip Speaker',
          },
        ],
        shapes: [
          {
            type: 'square' as const,
            color: '#1a1a1a',
            size: 120,
            position: { x: 25, y: 35 },
            blur: false,
          },
          {
            type: 'circle' as const,
            color: '#2a3a4a',
            size: 300,
            position: { x: 65, y: 10 },
            blur: true,
          },
        ],
      },
      // 4. Real Estate - Split Layout (Slate Gray)
      {
        id: 'realEstate',
        layout: 'split' as const,
        gradient: 'linear-gradient(135deg, #36454f 0%, #1a1f25 100%)',
        accentColor: '#CBB57B',
        title: tHero('realEstate.title'),
        subtitle: tHero('realEstate.subtitle'),
        ctaText: tHero('realEstate.cta'),
        ctaHref: '/products?category=real-estate',
        icon: <HomeIcon className="h-8 w-8 text-[#CBB57B]" />,
        images: [
          {
            src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=500&fit=crop&q=80',
            alt: 'Luxury Homes',
          },
          {
            src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=500&fit=crop&q=80',
            alt: 'Commercial',
          },
          {
            src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=500&fit=crop&q=80',
            alt: 'Apartments',
          },
        ],
        shapes: [
          {
            type: 'blob' as const,
            color: '#2a2a2a',
            size: 280,
            position: { x: 12, y: 75 },
            blur: true,
          },
          {
            type: 'circle' as const,
            color: '#3a3a3a',
            size: 180,
            position: { x: 82, y: 12 },
            blur: true,
          },
        ],
      },
      // 5. Vehicles - Split Layout (Deep Black with Gold)
      {
        id: 'vehicles',
        layout: 'split' as const,
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
        accentColor: '#CBB57B',
        title: tHero('vehicles.title'),
        subtitle: tHero('vehicles.subtitle'),
        ctaText: tHero('vehicles.cta'),
        ctaHref: '/products?category=vehicles',
        icon: <Car className="h-8 w-8 text-[#CBB57B]" />,
        images: [
          {
            src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=500&fit=crop&q=80',
            alt: 'Luxury Cars',
          },
          {
            src: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=500&fit=crop&q=80',
            alt: 'SUVs',
          },
          {
            src: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=500&fit=crop&q=80',
            alt: 'Classic Cars',
          },
        ],
        shapes: [
          {
            type: 'circle' as const,
            color: '#CBB57B',
            size: 220,
            position: { x: 45, y: 45 },
            blur: true,
          },
          {
            type: 'blob' as const,
            color: '#2a2a2a',
            size: 150,
            position: { x: 18, y: 18 },
            blur: true,
          },
        ],
      },
    ],
    [tHero]
  );

  return (
    <PageLayout>
      {/* Hero Section - Creative Carousel */}
      <Suspense
        fallback={
          <div className="relative h-[400px] sm:h-[420px] md:h-[450px] lg:h-[450px] bg-gradient-to-br from-gray-900 to-black animate-pulse -mt-[168px] pt-[168px]" />
        }
      >
        <CreativeHeroCarousel slides={heroSlides} autoPlayInterval={6000} />
      </Suspense>

      {/* Featured Products */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 pt-8 pb-0 bg-white">
        <ProductCarousel
          title={t('home.featuredProducts')}
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
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="HOMEPAGE_FEATURED" />
        </Suspense>
      </section>

      {/* New Arrivals */}
      <section className="bg-gray-50 py-4">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <ProductCarousel
            title={t('home.newArrivals')}
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
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="PRODUCTS_INLINE" />
        </Suspense>
      </section>

      {/* Trending Products */}
      <section className="max-w-[1920px] mx-auto px-4 lg:px-8 py-4">
        <ProductCarousel
          title={t('home.trendingNow')}
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
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <InlineAd placement="PRODUCTS_BANNER" />
        </Suspense>
      </section>

      {/* On Sale Products */}
      <section className="bg-gray-50 py-4">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <ProductCarousel
            title={t('home.onSale')}
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
      <section className="relative py-8 bg-gradient-to-br from-[#CBB57B] to-[#A89968] text-white overflow-hidden">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('home.stayUpdated')}</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">{t('home.subscribeDescription')}</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="email"
                  placeholder={t('home.enterEmail')}
                  className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors">
                  {t('buttons.subscribe')}
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
          translations={{
            color: tModal('color'),
            size: tModal('size'),
            quantity: tModal('quantity'),
            inStock: tModal('inStock'),
            available: tModal('available'),
            outOfStock: tModal('outOfStock'),
            onlyLeftInStock: tModal('onlyLeftInStock', { count: 0 }),
            addToCart: tModal('addToCart'),
            viewFullDetails: tModal('viewFullDetails'),
            reviews: tModal('reviews'),
            review: tModal('review'),
            save: tModal('save', { percent: 0 }),
            new: tModal('new'),
            sale: tModal('sale'),
            featured: tModal('featured'),
            bestseller: tModal('bestseller'),
          }}
        />
      </Suspense>
    </PageLayout>
  );
}
