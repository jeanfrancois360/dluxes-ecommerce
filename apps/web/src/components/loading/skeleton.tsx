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
