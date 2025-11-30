import { HeroSkeleton, ProductCarouselSkeleton } from '@/components/loading/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <HeroSkeleton />

      {/* Content Sections */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-16 space-y-24">
        {/* Featured Products Carousel */}
        <ProductCarouselSkeleton />

        {/* New Arrivals Carousel */}
        <ProductCarouselSkeleton />

        {/* Trending Products Carousel */}
        <ProductCarouselSkeleton />

        {/* On Sale Products Carousel */}
        <ProductCarouselSkeleton />
      </div>
    </div>
  );
}
