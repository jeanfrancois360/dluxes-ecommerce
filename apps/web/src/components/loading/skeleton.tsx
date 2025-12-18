'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  shimmer?: boolean;
}

export function Skeleton({ className, variant = 'rectangular', shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-neutral-200',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-100 overflow-hidden shadow-sm">
      {/* Image skeleton */}
      <Skeleton className="aspect-[3/4] w-full" />

      {/* Content skeleton */}
      <div className="p-6 space-y-3">
        {/* Brand */}
        <Skeleton className="h-3 w-20" />

        {/* Product name - 2 lines */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4" />
          ))}
          <Skeleton className="h-3 w-12 ml-2" />
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-screen min-h-[600px] bg-neutral-200 animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-20 w-full max-w-3xl mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-14 w-40" />
            <Skeleton className="h-14 w-56" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCarouselSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-6 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-none w-[280px]">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryBannerSkeleton() {
  return (
    <div className="relative h-64 bg-neutral-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-12 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
            <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
            <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-neutral-200">
      {/* Product Image */}
      <Skeleton className="w-24 h-24 flex-shrink-0" />

      {/* Product Info */}
      <div className="flex-1 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Remove Button */}
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4 sticky top-24">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="border-t pt-4 mt-4">
                <Skeleton className="h-6 w-full" />
              </div>
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" variant="circular" />
              {i < 2 && <Skeleton className="h-1 w-24 mx-4" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4 sticky top-24">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-16" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
