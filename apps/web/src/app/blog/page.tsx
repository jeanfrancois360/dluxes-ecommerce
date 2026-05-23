'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { usePublishedBlogPosts } from '@/hooks/use-blog';
import { useLocale } from '@/contexts/locale-context';
import { ScrollToTop } from '@/components/scroll-to-top';
import { Search, X, FileText, Tag, Calendar } from 'lucide-react';
import type { BlogPost } from '@/lib/api/blog';
import { formatDate } from '@/lib/utils/date-format';

const LIMIT = 12;

// ---------------------------------------------------------------------------
// Blog post card
// ---------------------------------------------------------------------------

function BlogCard({ post }: { post: BlogPost }) {
  const translation = post.translations?.find((t) => t.locale === 'en') ?? post.translations?.[0];
  const title = translation?.title ?? post.slug;
  const excerpt = translation?.excerpt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md hover:border-neutral-200 transition-all duration-200 flex flex-col"
    >
      {/* Cover image */}
      <div className="aspect-[16/9] bg-neutral-100 overflow-hidden flex-shrink-0">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-neutral-200" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[11px] font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-base font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-[#CBB57B] transition-colors mb-2">
          {title}
        </h2>

        {/* Excerpt */}
        {excerpt && <p className="text-sm text-neutral-500 line-clamp-2 flex-1 mb-4">{excerpt}</p>}

        {/* Footer */}
        {post.publishedAt && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-auto pt-3 border-t border-neutral-50">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.publishedAt)}
          </div>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-neutral-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-2/3" />
        <div className="h-3 bg-neutral-100 rounded w-1/2 mt-4" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function buildParams(page: number, tag: string): URLSearchParams {
  const p = new URLSearchParams();
  if (page > 1) p.set('page', String(page));
  if (tag.trim()) p.set('tag', tag.trim());
  return p;
}

export default function BlogListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language: locale } = useLocale();

  const [page, setPage] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    setPage(parseInt(searchParams.get('page') || '1', 10));
    const t = searchParams.get('tag') || '';
    setTagInput(t);
    setActiveTag(t);
  }, [searchParams]);

  const pushParams = useCallback(
    (nextPage: number, nextTag: string) => {
      const p = buildParams(nextPage, nextTag);
      const qs = p.toString();
      router.push(`/blog${qs ? '?' + qs : ''}`);
    },
    [router]
  );

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams(1, tagInput);
  };

  const handleClearTag = () => {
    setTagInput('');
    pushParams(1, '');
  };

  const handlePageChange = (p: number) => {
    pushParams(p, activeTag);
  };

  const queryParams = useMemo(
    () => ({ page, limit: LIMIT, tag: activeTag || undefined, locale }),
    [page, activeTag, locale]
  );

  const { posts, pagination, loading, error } = usePublishedBlogPosts(queryParams);

  const hasActiveFilters = Boolean(activeTag);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900">Blog</h1>
            <p className="text-neutral-500 mt-1.5">
              {pagination.total > 0
                ? `${pagination.total} article${pagination.total !== 1 ? 's' : ''}`
                : 'Insights, stories and updates'}
            </p>
          </div>

          {/* Tag filter */}
          <form onSubmit={handleTagSearch} className="flex items-center gap-2">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Filter by tag…"
                className="pl-9 pr-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] w-44 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
            {activeTag && (
              <button
                type="button"
                onClick={handleClearTag}
                className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Active tag chip */}
        {activeTag && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Filtered by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded-full">
              {activeTag}
              <button onClick={handleClearTag} className="hover:text-neutral-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(LIMIT)].map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
            <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-700 mb-1">
              {hasActiveFilters ? `No posts tagged "${activeTag}"` : 'No posts yet'}
            </h2>
            <p className="text-sm text-neutral-400">
              {hasActiveFilters ? 'Try a different tag.' : 'Check back soon.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearTag}
                className="mt-4 text-sm text-neutral-500 hover:text-neutral-800 underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
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
              of <span className="font-medium">{pagination.total}</span>
            </p>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-black text-white border border-black'
                          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (
                  (p === 2 && page > 3) ||
                  (p === pagination.totalPages - 1 && page < pagination.totalPages - 2)
                ) {
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
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </nav>
          </div>
        )}
      </div>

      <ScrollToTop />
    </PageLayout>
  );
}
