'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveAdvertisements } from '@/hooks/use-advertisements';
import { advertisementsApi, type AdvertisementDetail as Advertisement, type AdPlacement } from '@/lib/api';
import { ChevronLeft, ChevronRight, X, ExternalLink, Sparkles, Megaphone } from 'lucide-react';

// ============================================================================
// Analytics Tracking (with session-based deduplication)
// ============================================================================

const impressionCache = new Map<string, number>();
const clickCache = new Set<string>();
const IMPRESSION_COOLDOWN = 30000; // 30 seconds between same ad impressions

async function trackImpression(adId: string) {
  const now = Date.now();
  const lastTracked = impressionCache.get(adId) || 0;

  if (now - lastTracked < IMPRESSION_COOLDOWN) return;

  impressionCache.set(adId, now);
  try {
    await advertisementsApi.trackEvent(adId, 'IMPRESSION');
  } catch (error) {
    // Silent fail for analytics
  }
}

async function trackClick(adId: string) {
  if (clickCache.has(adId)) return;

  clickCache.add(adId);
  try {
    await advertisementsApi.trackEvent(adId, 'CLICK');
  } catch (error) {
    // Silent fail for analytics
  }
}

// ============================================================================
// Shared Components
// ============================================================================

interface AdImageProps {
  src: string;
  mobileSrc?: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

function AdImage({ src, mobileSrc, alt, fill = true, className = '', priority = false }: AdImageProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Ad</span>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={`object-cover ${mobileSrc ? 'hidden md:block' : ''} ${className}`}
        priority={priority}
        onError={() => setImgError(true)}
        unoptimized
      />
      {/* Mobile */}
      {mobileSrc && (
        <Image
          src={mobileSrc}
          alt={alt}
          fill={fill}
          className={`object-cover block md:hidden ${className}`}
          priority={priority}
          onError={() => setImgError(true)}
          unoptimized
        />
      )}
    </>
  );
}

function SponsoredBadge({ variant = 'light' }: { variant?: 'light' | 'dark' | 'glass' }) {
  const styles = {
    light: 'bg-white/90 text-gray-600 border border-gray-200',
    dark: 'bg-gray-900 text-white border border-gray-700',
    glass: 'bg-white/20 text-white backdrop-blur-md border border-white/30',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full ${styles[variant]}`}>
      Sponsored
    </span>
  );
}

// ============================================================================
// UNIFIED PLACEHOLDER DESIGN SYSTEM
// ============================================================================

// Shared styles and constants
const placeholderStyles = {
  base: 'relative overflow-hidden rounded-2xl',
  background: 'bg-gradient-to-br from-slate-50/80 via-gray-50/50 to-slate-100/80',
  border: 'border border-slate-200/40',
  shadow: 'shadow-sm',
};

// Placement information
const placementInfo: Record<AdPlacement, { title: string; description: string; icon: string }> = {
  HOMEPAGE_HERO: {
    title: 'Premium Hero Space',
    description: 'Maximum visibility for your brand',
    icon: 'hero'
  },
  HOMEPAGE_FEATURED: {
    title: 'Featured Banner',
    description: 'Highlight your best products',
    icon: 'featured'
  },
  HOMEPAGE_SIDEBAR: {
    title: 'Homepage Sidebar',
    description: 'Persistent brand presence',
    icon: 'sidebar'
  },
  PRODUCTS_BANNER: {
    title: 'Products Banner',
    description: 'Reach active shoppers',
    icon: 'banner'
  },
  PRODUCTS_INLINE: {
    title: 'Inline Promotion',
    description: 'Native product feed placement',
    icon: 'inline'
  },
  PRODUCTS_SIDEBAR: {
    title: 'Sidebar Ad',
    description: 'Capture browsing attention',
    icon: 'sidebar'
  },
  CATEGORY_BANNER: {
    title: 'Category Banner',
    description: 'Target specific categories',
    icon: 'category'
  },
  PRODUCT_DETAIL_SIDEBAR: {
    title: 'Product Page Ad',
    description: 'High-intent shoppers',
    icon: 'product'
  },
  CHECKOUT_UPSELL: {
    title: 'Checkout Upsell',
    description: 'Last-minute conversions',
    icon: 'checkout'
  },
  SEARCH_RESULTS: {
    title: 'Sponsored Result',
    description: 'Top search placement',
    icon: 'search'
  },
};

// ============================================================================
// BASE PLACEHOLDER - Used for inline banners (Products Banner, Category Banner, etc.)
// ============================================================================

interface AdPlaceholderProps {
  placement: AdPlacement;
  className?: string;
  aspectRatio?: string;
  showCTA?: boolean;
}

function AdPlaceholder({
  placement,
  className = '',
  aspectRatio = 'aspect-[3/1] sm:aspect-[4/1] md:aspect-[5/1]',
  showCTA = true
}: AdPlaceholderProps) {
  const info = placementInfo[placement] || {
    title: 'Ad Space',
    description: 'Promote your products',
    icon: 'default'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${placeholderStyles.base} ${aspectRatio} ${className}`}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${placeholderStyles.background} ${placeholderStyles.border}`}>
        {/* Subtle gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-slate-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gray-200/30 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Icon */}
        <div className="w-12 h-12 md:w-14 md:h-14 mb-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 flex items-center justify-center">
          <Megaphone className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
        </div>

        {/* Text */}
        <h4 className="text-sm md:text-base font-semibold text-slate-600 mb-1 text-center">
          {info.title}
        </h4>
        <p className="text-xs md:text-sm text-slate-400 mb-4 text-center max-w-xs">
          {info.description}
        </p>

        {/* CTA */}
        {showCTA && (
          <Link
            href="/seller/advertisements"
            className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-slate-800 text-white text-xs md:text-sm font-medium rounded-full hover:bg-slate-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Advertise Here
          </Link>
        )}
      </div>

      {/* Badge */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4">
        <span className="px-2 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50">
          Ad Space
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HERO PLACEHOLDER - Full-width premium placement
// ============================================================================

function HeroPlaceholder({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] ${className}`}
    >
      {/* Dark elegant background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-gradient-to-bl from-indigo-500/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-gradient-to-tr from-violet-500/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[600px] md:w-[900px] h-[500px] sm:h-[600px] md:h-[900px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8 rounded-2xl md:rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center"
        >
          <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-white/40" />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 tracking-tight"
        >
          Premium Ad Space
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-base md:text-lg text-white/40 mb-8 md:mb-10 max-w-md"
        >
          Showcase your brand in our most visible placement
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-4 sm:gap-6 md:gap-10 mb-6 sm:mb-8 md:mb-10"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">50K+</div>
            <div className="text-xs md:text-sm text-white/30 mt-1">Daily Views</div>
          </div>
          <div className="w-px h-10 md:h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">4.5%</div>
            <div className="text-xs md:text-sm text-white/30 mt-1">Avg CTR</div>
          </div>
          <div className="w-px h-10 md:h-12 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">#1</div>
            <div className="text-xs md:text-sm text-white/30 mt-1">Visibility</div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            href="/seller/advertisements"
            className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-slate-900 text-sm md:text-base font-semibold rounded-full hover:bg-slate-100 transition-all duration-300 shadow-lg shadow-black/20 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            Start Advertising
          </Link>
        </motion.div>
      </div>

      {/* Badge */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <span className="px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium text-white/30 uppercase tracking-wider bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
          Premium Placement
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SIDEBAR PLACEHOLDER - Compact vertical card
// ============================================================================

function SidebarPlaceholder({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${placeholderStyles.base} ${placeholderStyles.border} bg-gradient-to-b from-white to-slate-50/50 p-5 ${className}`}
    >
      {/* Subtle background element */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-slate-100/50 rounded-full blur-2xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="w-10 h-10 mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-slate-400" />
        </div>
        <h4 className="font-medium text-slate-600 text-sm mb-1">Sidebar Ad</h4>
        <p className="text-xs text-slate-400 mb-3">Reach browsing shoppers</p>
        <Link
          href="/seller/advertisements"
          className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          Advertise <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CHECKOUT PLACEHOLDER - Warm upsell design
// ============================================================================

function CheckoutPlaceholder({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${placeholderStyles.base} bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200/40 p-4 ${className}`}
    >
      {/* Subtle glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-amber-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">
            Upsell Opportunity
          </p>
          <h4 className="font-medium text-slate-700 text-sm">
            Promote products at checkout
          </h4>
          <Link
            href="/seller/advertisements"
            className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-1 transition-colors"
          >
            Learn more <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SEARCH PLACEHOLDER - Sponsored result style
// ============================================================================

function SearchPlaceholder({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${placeholderStyles.base} bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-200/40 p-5 ${className}`}
    >
      {/* Subtle glow */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl" />

      <div className="relative flex items-center gap-5">
        <div className="w-20 h-20 rounded-xl bg-white shadow-sm border border-blue-100 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-7 h-7 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 text-[9px] font-semibold text-blue-600 uppercase tracking-wide bg-blue-100/80 rounded-full mb-2">
            Sponsored
          </span>
          <h4 className="font-semibold text-slate-700 mb-1">
            Sponsored Result Space
          </h4>
          <p className="text-sm text-slate-500 mb-2">
            Get top placement in search results
          </p>
          <Link
            href="/seller/advertisements"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            Advertise Here <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PRODUCT DETAIL PLACEHOLDER - Contextual recommendation style
// ============================================================================

function ProductDetailPlaceholder({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${placeholderStyles.base} ${placeholderStyles.border} bg-gradient-to-b from-white to-slate-50/80 p-5 ${className}`}
    >
      {/* Subtle glow */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-slate-100/50 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Recommended</span>
        </div>

        <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-slate-300" />
        </div>

        <h4 className="font-medium text-slate-600 text-sm mb-1">Product Page Ad</h4>
        <p className="text-xs text-slate-400 mb-4">Reach high-intent shoppers</p>

        <Link
          href="/seller/advertisements"
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-slate-800 text-white text-xs font-medium rounded-full hover:bg-slate-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Advertise
        </Link>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HOMEPAGE HERO - Premium Full-Width Carousel
// ============================================================================

interface HeroBannerAdProps {
  className?: string;
  autoRotate?: boolean;
  rotationInterval?: number;
  fallback?: React.ReactNode;
}

export function HeroBannerAd({
  className = '',
  autoRotate = true,
  rotationInterval = 6000,
  fallback
}: HeroBannerAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('HOMEPAGE_HERO');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const ads = advertisements || [];

  useEffect(() => {
    if (!autoRotate || ads.length <= 1 || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRotate, ads.length, rotationInterval, isPaused]);

  useEffect(() => {
    if (ads[currentIndex]) {
      trackImpression(ads[currentIndex].id);
    }
  }, [currentIndex, ads]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (isLoading) {
    return (
      <div className={`relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-gray-100 animate-pulse ${className}`} />
    );
  }

  if (ads.length === 0) {
    return fallback || <HeroPlaceholder className={className} />;
  }

  const currentAd = ads[currentIndex];

  return (
    <div
      className={`relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Link
            href={currentAd.linkUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(currentAd.id)}
            className="block w-full h-full group"
          >
            <AdImage
              src={currentAd.imageUrl}
              mobileSrc={currentAd.mobileImageUrl}
              alt={currentAd.title}
              priority
              className="transition-transform duration-700 group-hover:scale-105"
            />

            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 lg:p-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-3xl"
              >
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {currentAd.title}
                </h2>
                {currentAd.description && (
                  <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl leading-relaxed">
                    {currentAd.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 hover:gap-3 group-hover:shadow-2xl">
                  {currentAd.linkText || 'Discover Now'}
                  <ExternalLink className="w-4 h-4" />
                </span>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {ads.length > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={() => goTo((currentIndex - 1 + ads.length) % ads.length)}
            className="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 md:p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 group"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => goTo((currentIndex + 1) % ads.length)}
            className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 md:p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 group"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Progress Indicators */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-10 right-4 sm:right-6 md:right-10 flex gap-2">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className="group relative h-1 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: index === currentIndex ? '40px' : '16px' }}
                aria-label={`Go to slide ${index + 1}`}
              >
                <div className="absolute inset-0 bg-white/30" />
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: rotationInterval / 1000, ease: 'linear' }}
                    style={{ transformOrigin: 'left' }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Sponsored Badge */}
      <div className="absolute top-6 right-6">
        <SponsoredBadge variant="glass" />
      </div>
    </div>
  );
}

// ============================================================================
// INLINE BANNER - Premium Section Divider
// ============================================================================

interface InlineAdProps {
  placement: AdPlacement;
  className?: string;
}

export function InlineAd({ placement, className = '' }: InlineAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements(placement);
  const ad = advertisements?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  if (isLoading) {
    return <div className={`h-32 bg-gray-100 rounded-2xl animate-pulse ${className}`} />;
  }

  if (!ad) {
    return <AdPlaceholder placement={placement} className={className} aspectRatio="aspect-[3/1] sm:aspect-[4/1] md:aspect-[5/1] lg:aspect-[6/1]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      <Link
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        className="block relative aspect-[3/1] sm:aspect-[4/1] md:aspect-[5/1] lg:aspect-[6/1] group"
      >
        <AdImage
          src={ad.imageUrl}
          mobileSrc={ad.mobileImageUrl}
          alt={ad.title}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="text-white max-w-lg">
            <h3 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 line-clamp-2">{ad.title}</h3>
            {ad.description && (
              <p className="text-xs sm:text-sm md:text-base text-white/80 mb-3 sm:mb-4 hidden sm:block line-clamp-2">
                {ad.description}
              </p>
            )}
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors">
              {ad.linkText || 'Shop Now'}
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute top-4 right-4">
          <SponsoredBadge variant="glass" />
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// SIDEBAR AD - Elegant Vertical Cards
// ============================================================================

interface SidebarAdProps {
  placement?: AdPlacement;
  className?: string;
  maxAds?: number;
}

export function SidebarAd({
  placement = 'PRODUCTS_SIDEBAR',
  className = '',
  maxAds = 2
}: SidebarAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements(placement);
  const ads = (advertisements || []).slice(0, maxAds);

  useEffect(() => {
    ads.forEach(ad => trackImpression(ad.id));
  }, [ads]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(maxAds)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return <SidebarPlaceholder className={className} />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad, index) => (
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="relative group"
        >
          <Link
            href={ad.linkUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(ad.id)}
            className="block rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <AdImage
                src={ad.imageUrl}
                mobileSrc={ad.mobileImageUrl}
                alt={ad.title}
                className="transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {ad.title}
              </h4>
              {ad.description && (
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{ad.description}</p>
              )}
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600">
                <span>{ad.linkText || 'Learn More'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Badge */}
            <div className="absolute top-3 right-3">
              <SponsoredBadge variant="dark" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// PRODUCT DETAIL SIDEBAR - Contextual Recommendation
// ============================================================================

interface ProductDetailAdProps {
  categoryId?: string;
  className?: string;
}

export function ProductDetailAd({ categoryId, className = '' }: ProductDetailAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('PRODUCT_DETAIL_SIDEBAR');

  const filteredAds = categoryId
    ? advertisements?.filter(ad => !ad.categoryId || ad.categoryId === categoryId)
    : advertisements;

  const ad = filteredAds?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  if (isLoading) {
    return <div className={`h-64 bg-gray-100 rounded-xl animate-pulse ${className}`} />;
  }

  if (!ad) {
    return <ProductDetailPlaceholder className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 ${className}`}
    >
      <Link
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        className="block p-5 group"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommended</span>
        </div>

        <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-md">
          <AdImage
            src={ad.imageUrl}
            mobileSrc={ad.mobileImageUrl}
            alt={ad.title}
            className="transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {ad.title}
        </h4>
        {ad.description && (
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{ad.description}</p>
        )}

        <div className="mt-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full group-hover:bg-gray-800 transition-colors">
            {ad.linkText || 'View Offer'}
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// CHECKOUT UPSELL - Non-intrusive Suggestion
// ============================================================================

interface CheckoutUpsellAdProps {
  className?: string;
  onDismiss?: () => void;
}

export function CheckoutUpsellAd({ className = '', onDismiss }: CheckoutUpsellAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('CHECKOUT_UPSELL');
  const [dismissed, setDismissed] = useState(false);
  const ad = advertisements?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (isLoading || dismissed) return null;

  if (!ad) {
    return <CheckoutPlaceholder className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 rounded-xl p-4 shadow-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 hover:bg-amber-100 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Complete Your Look</span>
        </div>

        <Link
          href={ad.linkUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(ad.id)}
          className="flex gap-4 group"
        >
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              width={80}
              height={80}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
              {ad.title}
            </h4>
            {ad.description && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{ad.description}</p>
            )}
            <span className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 group-hover:gap-2 transition-all">
              {ad.linkText || 'Add to Order'}
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SEARCH RESULTS - Sponsored Product Card
// ============================================================================

interface SearchResultsAdProps {
  className?: string;
}

export function SearchResultsAd({ className = '' }: SearchResultsAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('SEARCH_RESULTS');
  const ad = advertisements?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  if (isLoading) {
    return <div className={`h-32 bg-gray-100 rounded-xl animate-pulse ${className}`} />;
  }

  if (!ad) {
    return <SearchPlaceholder className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 ${className}`}
    >
      <Link
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        className="flex gap-5 p-5 group"
      >
        <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-md bg-white">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            width={112}
            height={112}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold uppercase tracking-wide rounded-full">
              Sponsored
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {ad.title}
          </h4>
          {ad.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.description}</p>
          )}
          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600">
            <span>{ad.linkText || 'View Details'}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// CATEGORY BANNER - Full-width Category Header
// ============================================================================

interface CategoryBannerAdProps {
  categoryId?: string;
  className?: string;
}

export function CategoryBannerAd({ categoryId, className = '' }: CategoryBannerAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('CATEGORY_BANNER');

  const filteredAds = advertisements?.filter(ad => {
    if (!ad.categoryId) return true;
    return ad.categoryId === categoryId;
  });

  const ad = filteredAds?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  if (isLoading) {
    return <div className={`h-24 bg-gray-100 rounded-xl animate-pulse ${className}`} />;
  }

  if (!ad) {
    return <AdPlaceholder placement="CATEGORY_BANNER" className={className} aspectRatio="aspect-[5/1] md:aspect-[6/1]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl shadow-md ${className}`}
    >
      <Link
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        className="block relative aspect-[5/1] md:aspect-[6/1] group"
      >
        <AdImage
          src={ad.imageUrl}
          mobileSrc={ad.mobileImageUrl}
          alt={ad.title}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex items-center p-6 md:p-8">
          <div className="text-white">
            <h3 className="text-lg md:text-2xl font-bold">{ad.title}</h3>
            <span className="inline-flex items-center gap-1 mt-2 text-sm font-medium opacity-90 group-hover:opacity-100 group-hover:gap-2 transition-all">
              {ad.linkText || 'Shop Now'}
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <SponsoredBadge variant="glass" />
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// FEATURED PRODUCTS AD - Grid Item Style
// ============================================================================

interface FeaturedProductAdProps {
  className?: string;
}

export function FeaturedProductAd({ className = '' }: FeaturedProductAdProps) {
  const { advertisements, isLoading } = useActiveAdvertisements('HOMEPAGE_FEATURED');
  const ad = advertisements?.[0];

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad]);

  if (isLoading) return null;

  if (!ad) {
    return <AdPlaceholder placement="HOMEPAGE_FEATURED" className={className} aspectRatio="aspect-[3/4]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative group ${className}`}
    >
      <Link
        href={ad.linkUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        className="block rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div className="relative aspect-[3/4]">
          <AdImage
            src={ad.imageUrl}
            mobileSrc={ad.mobileImageUrl}
            alt={ad.title}
            className="opacity-90 mix-blend-overlay"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">Featured</span>
            </div>
            <h4 className="font-bold text-lg line-clamp-2">{ad.title}</h4>
            {ad.description && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{ad.description}</p>
            )}
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium group-hover:gap-2 transition-all">
              {ad.linkText || 'Explore'}
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <SponsoredBadge variant="glass" />
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { trackImpression, trackClick };
