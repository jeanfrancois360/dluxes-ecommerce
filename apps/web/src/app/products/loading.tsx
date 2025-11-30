import { ProductGridSkeleton } from '@/components/loading/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Skeleton */}
      <div className="relative h-[40vh] min-h-[300px] bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center z-10 px-4 space-y-4">
            <div className="h-12 w-96 max-w-full bg-neutral-300 rounded mx-auto" />
            <div className="h-6 w-[600px] max-w-full bg-neutral-300 rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-neutral-200 rounded" />
            <div className="h-4 w-4 bg-neutral-200 rounded" />
            <div className="h-4 w-24 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="space-y-6">
              <div className="h-8 w-32 bg-neutral-200 rounded" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-40 bg-neutral-200 rounded" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 w-full bg-neutral-200 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-neutral-200 rounded" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-24 bg-neutral-200 rounded" />
                  <div className="h-10 w-40 bg-neutral-200 rounded" />
                </div>
              </div>
            </div>

            {/* Products */}
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
