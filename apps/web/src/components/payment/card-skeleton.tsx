/**
 * Card Skeleton Loader
 * Beautiful loading state for payment methods
 */

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-100 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Card Icon Skeleton */}
          <div className="w-12 h-8 bg-neutral-200 rounded" />

          {/* Card Details Skeleton */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-32 bg-neutral-200 rounded" />
              <div className="h-4 w-16 bg-neutral-200 rounded-full" />
            </div>
            <div className="h-3 w-24 bg-neutral-200 rounded mb-1" />
            <div className="h-3 w-48 bg-neutral-200 rounded" />
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-neutral-200 rounded-lg" />
          <div className="h-8 w-8 bg-neutral-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default CardSkeleton;
