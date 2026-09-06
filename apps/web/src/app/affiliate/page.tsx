'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { AffiliateProductCard } from '@/components/affiliate/affiliate-product-card';
import { useAffiliatePublicProducts } from '@/hooks/use-affiliate';
import { affiliateApi } from '@/lib/api/affiliate';
import { useLocale } from '@/contexts/locale-context';
import { ProductGridSkeleton } from '@/components/loading/skeleton';
import { ScrollToTop } from '@/components/scroll-to-top';
import {
  Filter,
  Search,
  Star,
  X,
  Percent,
  CheckCircle2,
  ChevronDown,
  Check,
  Tag,
} from 'lucide-react';

const LIMIT = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildParams(
  page: number,
  isFeatured: boolean,
  inStockOnly: boolean,
  tag: string,
  category: string
): URLSearchParams {
  const p = new URLSearchParams();
  if (page > 1) p.set('page', String(page));
  if (isFeatured) p.set('featured', '1');
  if (inStockOnly) p.set('inStock', '1');
  if (tag.trim()) p.set('tag', tag.trim());
  if (category.trim()) p.set('category', category.trim());
  return p;
}

// ---------------------------------------------------------------------------
// Searchable category combobox
// ---------------------------------------------------------------------------

function CategoryCombobox({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (cat: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = categories.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (cat: string) => {
    onChange(cat === value ? '' : cat);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          value
            ? 'bg-neutral-900 border-neutral-900 text-white'
            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
        }`}
      >
        <Tag className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[140px] truncate">{value || 'Category'}</span>
        {value ? (
          <X
            className="w-3 h-3 shrink-0 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearch('');
            }}
          />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-neutral-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {/* All categories option */}
            <li>
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors ${!value ? 'text-neutral-900 font-medium' : 'text-neutral-600'}`}
              >
                All categories
                {!value && <Check className="w-3.5 h-3.5 text-neutral-900" />}
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-center text-neutral-400">No results</li>
            ) : (
              filtered.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors ${value === cat ? 'text-neutral-900 font-medium' : 'text-neutral-600'}`}
                  >
                    <span className="truncate">{cat}</span>
                    {value === cat && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
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
  const [inStockOnly, setInStockOnly] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    affiliateApi
      .listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(parseInt(searchParams.get('page') || '1', 10));
    setIsFeatured(searchParams.get('featured') === '1');
    setInStockOnly(searchParams.get('inStock') === '1');
    const t = searchParams.get('tag') || '';
    setTagInput(t);
    setActiveTag(t);
    setActiveCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // Push new URL when filters change
  // ---------------------------------------------------------------------------
  const pushParams = useCallback(
    (
      nextPage: number,
      nextFeatured: boolean,
      nextInStock: boolean,
      nextTag: string,
      nextCategory: string
    ) => {
      const p = buildParams(nextPage, nextFeatured, nextInStock, nextTag, nextCategory);
      const qs = p.toString();
      router.push(`/affiliate${qs ? '?' + qs : ''}`);
    },
    [router]
  );

  const handleFeaturedToggle = () => {
    pushParams(1, !isFeatured, inStockOnly, activeTag, activeCategory);
  };

  const handleInStockToggle = () => {
    pushParams(1, isFeatured, !inStockOnly, activeTag, activeCategory);
  };

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams(1, isFeatured, inStockOnly, tagInput, activeCategory);
  };

  const handleClearTag = () => {
    setTagInput('');
    pushParams(1, isFeatured, inStockOnly, '', activeCategory);
  };

  const handleCategoryChange = (cat: string) => {
    pushParams(1, isFeatured, inStockOnly, activeTag, cat);
  };

  const handlePageChange = (p: number) => {
    pushParams(p, isFeatured, inStockOnly, activeTag, activeCategory);
  };

  const hasActiveFilters =
    isFeatured || inStockOnly || Boolean(activeTag) || Boolean(activeCategory);

  const clearAll = () => {
    setTagInput('');
    pushParams(1, false, false, '', '');
  };

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const queryParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      isFeatured: isFeatured || undefined,
      inStock: inStockOnly || undefined,
      tag: activeTag || undefined,
      category: activeCategory || undefined,
      locale,
    }),
    [page, isFeatured, inStockOnly, activeTag, activeCategory, locale]
  );

  const { products, pagination, loading, error } = useAffiliatePublicProducts(queryParams);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#CBB57B]/15 text-[#9A8540] text-xs font-semibold rounded-full border border-[#CBB57B]/30">
                <Percent className="w-3 h-3" />
                Affiliate deals
              </span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Partner Deals</h1>
            <p className="text-neutral-500 mt-1">Curated products from our trusted partners</p>
          </div>
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

            {/* In Stock toggle */}
            <button
              onClick={handleInStockToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                inStockOnly
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              In stock
            </button>

            {/* Category searchable combobox */}
            {(categories?.length ?? 0) > 0 && (
              <CategoryCombobox
                categories={categories}
                value={activeCategory}
                onChange={handleCategoryChange}
              />
            )}

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
