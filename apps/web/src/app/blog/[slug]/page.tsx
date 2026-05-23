'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ChevronRight, Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { usePublishedBlogPost } from '@/hooks/use-blog';
import { useLocale } from '@/contexts/locale-context';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDate } from '@/lib/utils/date-format';
import { ScrollToTop } from '@/components/scroll-to-top';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
      <div className="h-4 bg-neutral-100 rounded w-48" />
      <div className="space-y-3">
        <div className="h-3 bg-neutral-100 rounded w-24" />
        <div className="h-8 bg-neutral-100 rounded w-full" />
        <div className="h-8 bg-neutral-100 rounded w-3/4" />
        <div className="h-4 bg-neutral-100 rounded w-40 mt-2" />
      </div>
      <div className="aspect-[16/9] bg-neutral-100 rounded-2xl" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-4 bg-neutral-100 rounded"
            style={{ width: `${85 + (i % 3) * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language: locale } = useLocale();
  const { post, loading, error } = usePublishedBlogPost(slug, locale);

  if (loading)
    return (
      <PageLayout>
        <DetailSkeleton />
      </PageLayout>
    );

  if (!loading && (error || !post)) notFound();

  const p = post!;

  // Pick translation matching the current locale, fallback to first available
  const translation =
    p.translations?.find((t) => t.locale === locale) ??
    p.translations?.find((t) => t.isOriginal) ??
    p.translations?.[0];

  const title = translation?.title ?? p.slug;
  const body = translation?.body ?? '';
  const excerpt = translation?.excerpt;
  const authorName = p.author ? `${p.author.firstName} ${p.author.lastName}`.trim() : null;

  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-neutral-500">
          <Link href="/blog" className="hover:text-neutral-800 transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-neutral-800 truncate max-w-xs">{title}</span>
        </nav>

        {/* Header */}
        <header className="space-y-4">
          {/* Tags */}
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full hover:bg-neutral-200 transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">{title}</h1>

          {/* Excerpt */}
          {excerpt && <p className="text-lg text-neutral-500 leading-relaxed">{excerpt}</p>}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 pt-1">
            {authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {authorName}
              </span>
            )}
            {p.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(p.publishedAt)}
              </span>
            )}
          </div>
        </header>

        {/* Cover image */}
        {p.coverImageUrl && (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100">
            <img
              src={p.coverImageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Body */}
        {body ? (
          <div
            className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-[#CBB57B] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-pre:bg-neutral-900 prose-code:text-neutral-800 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:border-l-[#CBB57B] prose-blockquote:text-neutral-500"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
          />
        ) : (
          <p className="text-neutral-400 text-sm">No content available.</p>
        )}

        {/* Back link */}
        <div className="pt-6 border-t border-neutral-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </article>

      <ScrollToTop />
    </PageLayout>
  );
}
