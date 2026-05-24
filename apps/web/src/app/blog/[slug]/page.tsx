'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import {
  ChevronRight,
  Calendar,
  Tag,
  ArrowLeft,
  Clock,
  Link2,
  Check,
  Heart,
  Eye,
  MessageCircle,
  Send,
  Trash2,
  CornerDownRight,
  LogIn,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { usePublishedBlogPost, useBlogEngagement, useBlogComments } from '@/hooks/use-blog';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/contexts/locale-context';
import { useAuth } from '@/hooks/use-auth';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDate } from '@/lib/utils/date-format';
import { ScrollToTop } from '@/components/scroll-to-top';
import { AffiliateProductCard } from '@/components/affiliate/affiliate-product-card';
import { blogApi } from '@/lib/api/blog';
import { toast } from '@/lib/utils/toast';
import type { BlogPostProduct, BlogComment } from '@/lib/api/blog';
import type { AffiliateProduct } from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Engagement bar — views / likes / comment count
// ---------------------------------------------------------------------------

function EngagementBar({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { engagement, likeLoading, toggleLike } = useBlogEngagement(postId);

  const handleLike = () => {
    if (!user) {
      toast.error('Sign in to like this post');
      return;
    }
    toggleLike();
  };

  return (
    <div className="flex items-center gap-5 py-4 border-y border-neutral-100">
      {/* Views */}
      <div className="flex items-center gap-1.5 text-sm text-neutral-400">
        <Eye className="w-4 h-4" />
        <span>{engagement.viewCount.toLocaleString()}</span>
      </div>

      {/* Likes */}
      <button
        onClick={handleLike}
        disabled={likeLoading}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          engagement.liked ? 'text-rose-500 font-medium' : 'text-neutral-400 hover:text-rose-500'
        }`}
        title={user ? (engagement.liked ? 'Unlike' : 'Like') : 'Sign in to like'}
      >
        <Heart className={`w-4 h-4 transition-all ${engagement.liked ? 'fill-rose-500' : ''}`} />
        <span>{engagement.likeCount.toLocaleString()}</span>
      </button>

      {/* Comment count */}
      <div className="flex items-center gap-1.5 text-sm text-neutral-400">
        <MessageCircle className="w-4 h-4" />
        <span>{engagement.commentCount.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single comment
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  isReply = false,
}: {
  comment: BlogComment;
  currentUserId?: string;
  onDelete: (id: string, parentId?: string) => void;
  onReply: (parentId: string, authorName: string) => void;
  isReply?: boolean;
}) {
  const authorName = `${comment.user.firstName} ${comment.user.lastName}`.trim();
  const initial = comment.user.firstName?.charAt(0).toUpperCase() ?? '?';
  const isOwn = currentUserId === comment.user.id;
  const deleted = comment.isDeleted;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      {/* Avatar */}
      {comment.user.avatar ? (
        <img
          src={comment.user.avatar}
          alt={authorName}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <span className="w-8 h-8 rounded-full bg-[#CBB57B]/15 border border-[#CBB57B]/30 flex items-center justify-center text-xs font-bold text-[#CBB57B] shrink-0 mt-0.5">
          {initial}
        </span>
      )}

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-800">
            {deleted ? 'Deleted' : authorName}
          </span>
          <span className="text-xs text-neutral-400">{formatDate(comment.createdAt)}</span>
          {isOwn && !deleted && (
            <button
              onClick={() => onDelete(comment.id, comment.parentId ?? undefined)}
              className="ml-auto p-1 text-neutral-300 hover:text-red-500 rounded transition-colors"
              title="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Body */}
        <p
          className={`mt-1 text-sm leading-relaxed ${deleted ? 'text-neutral-400 italic' : 'text-neutral-700'}`}
        >
          {comment.body}
        </p>

        {/* Reply button */}
        {!deleted && !isReply && (
          <button
            onClick={() => onReply(comment.id, authorName)}
            className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400 hover:text-[#CBB57B] transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        )}

        {/* Replies */}
        {!isReply && comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReply={onReply}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comments section
// ---------------------------------------------------------------------------

function CommentsSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { comments, loading, submitting, submitComment, removeComment } = useBlogComments(postId);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReply = (parentId: string, authorName: string) => {
    setReplyTo({ id: parentId, name: authorName });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await submitComment(body.trim(), replyTo?.id);
      setBody('');
      setReplyTo(null);
    } catch {
      toast.error('Failed to post comment. Please try again.');
    }
  };

  const handleDelete = async (id: string, parentId?: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await removeComment(id, parentId);
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  const totalCount = comments.length + comments.reduce((s, c) => s + (c.replies?.length ?? 0), 0);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="w-1 h-5 bg-[#CBB57B] rounded-full shrink-0" />
        <h2 className="text-base font-semibold text-neutral-900">Comments</h2>
        {!loading && (
          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full">
            {totalCount}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-neutral-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-100 rounded w-32" />
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2 text-center">
          <MessageCircle className="w-8 h-8 text-neutral-200" />
          <p className="text-sm font-medium text-neutral-400">No comments yet</p>
          <p className="text-xs text-neutral-300">Be the first to share your thoughts</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* Compose */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-neutral-100">
          {/* Reply context banner */}
          {replyTo && (
            <div className="flex items-center justify-between px-3 py-2 bg-[#CBB57B]/8 border border-[#CBB57B]/20 rounded-lg text-xs text-neutral-600">
              <span className="flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3 text-[#CBB57B]" />
                Replying to <span className="font-semibold">{replyTo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Author row */}
          <div className="flex items-start gap-3">
            {user.avatar ? (
              <img
                src={user.avatar as string}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-[#CBB57B]/15 border border-[#CBB57B]/30 flex items-center justify-center text-xs font-bold text-[#CBB57B] shrink-0 mt-1">
                {(user.firstName as string)?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
            <div className="flex-1 space-y-2">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#CBB57B] resize-none bg-neutral-50"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{body.length}/2000</span>
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600">
          <span>Sign in to join the conversation</span>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </Link>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Featured products strip
// ---------------------------------------------------------------------------

function FeaturedStrip({ items, locale }: { items: BlogPostProduct[]; locale: string }) {
  const t = useTranslations('blog');
  if (items.length === 0) return null;
  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-1 h-5 bg-[#CBB57B] rounded-full shrink-0" />
          <h2 className="text-base font-semibold text-neutral-900">{t('featuredProducts')}</h2>
          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full">
            {items.length}
          </span>
        </div>
        <p className="mt-1 ml-4 text-xs text-neutral-400">{t('featuredProductsDisclosure')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const product = item.affiliateProduct as unknown as AffiliateProduct;
          return <AffiliateProductCard key={item.id} product={product} locale={locale} />;
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-[420px] sm:h-[520px] bg-neutral-200" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-neutral-100 rounded"
                style={{ width: `${80 + (i % 4) * 5}%` }}
              />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-24 bg-neutral-100 rounded-xl" />
            <div className="h-20 bg-neutral-100 rounded-xl" />
            <div className="h-16 bg-neutral-100 rounded-xl" />
          </div>
        </div>
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
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  // Record view once when the post is available — MUST be before all early returns
  useEffect(() => {
    if (post?.id) blogApi.recordView(post.id);
  }, [post?.id]);

  if (loading)
    return (
      <PageLayout>
        <DetailSkeleton />
      </PageLayout>
    );

  if (!loading && (error || !post)) notFound();

  const p = post!;

  const translation =
    p.translations?.find((t) => t.locale === locale) ??
    p.translations?.find((t) => t.isOriginal) ??
    p.translations?.[0];

  const title = translation?.title ?? p.slug;
  const body = translation?.body ?? '';
  const excerpt = translation?.excerpt;
  const authorName = p.author ? `${p.author.firstName} ${p.author.lastName}`.trim() : null;
  const authorInitial = p.author?.firstName?.charAt(0).toUpperCase() ?? null;

  const wordCount = body
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const hasCover = Boolean(p.coverImageUrl);

  const tagPillLight =
    'inline-flex items-center gap-1 px-2.5 py-1 border border-neutral-200 text-neutral-500 text-xs font-medium rounded-full hover:border-[#CBB57B] hover:text-[#CBB57B] hover:bg-[#CBB57B]/5 transition-colors';
  const tagPillDark =
    'inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium rounded-full border border-white/20 hover:bg-[#CBB57B]/20 hover:border-[#CBB57B]/60 hover:text-[#CBB57B] transition-colors';

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <PageLayout>
      {/* ── Full-bleed hero ── */}
      {hasCover && (
        <div className="relative w-full h-[420px] sm:h-[520px] overflow-hidden bg-neutral-900">
          <img
            src={p.coverImageUrl!}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-3">
              <nav className="flex items-center gap-1 text-xs text-white/50">
                <Link href="/blog" className="hover:text-white/80 transition-colors">
                  Blog
                </Link>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-white/70 truncate max-w-sm">{title}</span>
              </nav>
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className={tagPillDark}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {title}
              </h1>
              {excerpt && (
                <p className="text-sm sm:text-base text-white/65 leading-relaxed max-w-2xl line-clamp-2">
                  {excerpt}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/55 pt-0.5">
                {authorName && (
                  <span className="flex items-center gap-2">
                    {authorInitial && (
                      <span className="w-6 h-6 rounded-full bg-[#CBB57B]/25 border border-[#CBB57B]/50 flex items-center justify-center text-[10px] font-bold text-[#CBB57B] shrink-0">
                        {authorInitial}
                      </span>
                    )}
                    <span className="text-white/80 font-medium">{authorName}</span>
                  </span>
                )}
                {p.publishedAt && (
                  <>
                    {authorName && <span className="text-white/25">·</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(p.publishedAt)}
                    </span>
                  </>
                )}
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 items-start">
          {/* ── Body column ── */}
          <div className="space-y-8 min-w-0">
            {/* Header (no-cover fallback) */}
            {!hasCover && (
              <>
                <nav className="flex items-center gap-1 text-sm text-neutral-500">
                  <Link href="/blog" className="hover:text-neutral-800 transition-colors">
                    Blog
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-neutral-800 truncate max-w-xs">{title}</span>
                </nav>
                <header className="space-y-4">
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          className={tagPillLight}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
                    {title}
                  </h1>
                  {excerpt && <p className="text-lg text-neutral-500 leading-relaxed">{excerpt}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                    {authorName && (
                      <span className="flex items-center gap-2">
                        {authorInitial && (
                          <span className="w-7 h-7 rounded-full bg-[#CBB57B]/15 border border-[#CBB57B]/30 flex items-center justify-center text-xs font-bold text-[#CBB57B] shrink-0">
                            {authorInitial}
                          </span>
                        )}
                        <span className="font-medium text-neutral-600">{authorName}</span>
                      </span>
                    )}
                    {p.publishedAt && (
                      <>
                        {authorName && <span className="text-neutral-200">·</span>}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(p.publishedAt)}
                        </span>
                      </>
                    )}
                    <span className="text-neutral-200">·</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {readingTime} min read
                    </span>
                  </div>
                </header>
              </>
            )}

            {/* Prose body */}
            {body ? (
              <div
                className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-[#CBB57B] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-pre:bg-neutral-900 prose-code:text-neutral-800 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:border-l-[#CBB57B] prose-blockquote:text-neutral-500"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
              />
            ) : (
              <p className="text-neutral-400 text-sm">No content available.</p>
            )}

            {/* Engagement bar */}
            <EngagementBar postId={p.id} />

            {/* Featured products */}
            {p.featuredProducts && p.featuredProducts.length > 0 && (
              <div className="pt-2 border-t border-neutral-100">
                <FeaturedStrip items={p.featuredProducts} locale={locale} />
              </div>
            )}

            {/* Comments */}
            <div className="pt-2 border-t border-neutral-100">
              <CommentsSection postId={p.id} />
            </div>

            {/* Back link */}
            <div className="pt-6 border-t border-neutral-100">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-full hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Blog
              </Link>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Author */}
            {authorName && (
              <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Author
                </p>
                <div className="flex items-center gap-3">
                  {authorInitial && (
                    <span className="w-10 h-10 rounded-full bg-[#CBB57B]/15 border border-[#CBB57B]/30 flex items-center justify-center text-sm font-bold text-[#CBB57B] shrink-0">
                      {authorInitial}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{authorName}</p>
                    <p className="text-xs text-neutral-400">Contributor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Article stats */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Article
              </p>
              <div className="space-y-2.5">
                {p.publishedAt && (
                  <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    {formatDate(p.publishedAt)}
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  {readingTime} min read
                </div>
              </div>
            </div>

            {/* Tags */}
            {p.tags.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className={tagPillLight}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 space-y-3">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Share
              </p>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <ScrollToTop />
    </PageLayout>
  );
}
