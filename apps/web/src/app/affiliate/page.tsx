'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { AffiliateProductCard } from '@/components/affiliate/affiliate-product-card';
import { useAffiliatePublicProducts } from '@/hooks/use-affiliate';
import { useLocale } from '@/contexts/locale-context';
import { ProductGridSkeleton } from '@/components/loading/skeleton';
import { ScrollToTop } from '@/components/scroll-to-top';
import { Filter, Search, Star, X } from 'lucide-react';

const LIMIT = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildParams(page: number, isFeatured: boolean, tag: string): URLSearchParams {
  const p = new URLSearchParams();
  if (page > 1) p.set('page', String(page));
  if (isFeatured) p.set('featured', '1');
  if (tag.trim()) p.set('tag', tag.trim());
  return p;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AffiliateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language: locale } = useLocale();

  // ---------------------------------------------------------------------------
  // Read filters from URL on mount / param change
  // ---------------------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    setPage(parseInt(searchParams.get('page') || '1', 10));
    setIsFeatured(searchParams.get('featured') === '1');
    const t = searchParams.get('tag') || '';
    setTagInput(t);
    setActiveTag(t);
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // Push new URL when filters change
  // ---------------------------------------------------------------------------
  const pushParams = useCallback(
    (nextPage: number, nextFeatured: boolean, nextTag: string) => {
      const p = buildParams(nextPage, nextFeatured, nextTag);
      const qs = p.toString();
      router.push(`/affiliate${qs ? '?' + qs : ''}`);
    },
    [router]
  );

  const handleFeaturedToggle = () => {
    pushParams(1, !isFeatured, activeTag);
  };

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams(1, isFeatured, tagInput);
  };

  const handleClearTag = () => {
    setTagInput('');
    pushParams(1, isFeatured, '');
  };

  const handlePageChange = (p: number) => {
    pushParams(p, isFeatured, activeTag);
  };

  const hasActiveFilters = isFeatured || Boolean(activeTag);

  const clearAll = () => {
    setTagInput('');
    pushParams(1, false, '');
  };

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const queryParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      isFeatured: isFeatured || undefined,
      tag: activeTag || undefined,
      locale,
    }),
    [page, isFeatured, activeTag, locale]
  );

  const { products, pagination, loading, error } = useAffiliatePublicProducts(queryParams);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Partner Deals</h1>
          <p className="text-neutral-500 mt-1">
            Curated products from our trusted partners
            {pagination.total > 0 && ` · ${pagination.total} products`}
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-neutral-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </div>

            {/* Featured toggle */}
            <button
              onClick={handleFeaturedToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isFeatured
                  ? 'bg-amber-400 border-amber-400 text-amber-900'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-900' : ''}`} />
              Featured
            </button>

            {/* Tag search */}
            <form onSubmit={handleTagSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Filter by tag…"
                  className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 w-44"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-700 transition-colors"
              >
                Go
              </button>
              {activeTag && (
                <button
                  type="button"
                  onClick={handleClearTag}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="ml-auto text-sm text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <ProductGridSkeleton count={LIMIT} />
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
            <p className="text-lg font-semibold text-neutral-700 mb-1">
              {hasActiveFilters ? 'No products match your filters.' : 'No partner products yet.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="mt-3 text-sm text-neutral-500 hover:text-neutral-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <AffiliateProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-neutral-500">
              Showing <span className="font-medium">{(pagination.page - 1) * LIMIT + 1}</span>
              {' – '}
              <span className="font-medium">
                {Math.min(pagination.page * LIMIT, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> products
            </p>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-neutral-900 text-white border border-neutral-900'
                          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === 2 && page > 3) {
                  return (
                    <span key={p} className="px-1 text-neutral-400 text-sm">
                      …
                    </span>
                  );
                }
                if (p === pagination.totalPages - 1 && page < pagination.totalPages - 2) {
                  return (
                    <span key={p} className="px-1 text-neutral-400 text-sm">
                      …
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      <ScrollToTop />
    </PageLayout>
  );
}
