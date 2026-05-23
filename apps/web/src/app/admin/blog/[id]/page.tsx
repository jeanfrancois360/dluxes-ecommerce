'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { TiptapEditor } from '@/components/blog/tiptap-editor';
import { useBlogPost } from '@/hooks/use-blog';
import { blogApi, type BlogPostStatus, type BlogTranslationStatus } from '@/lib/api/blog';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/date-format';
import { toast } from '@/lib/utils/toast';
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Languages,
  Loader2,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Trash2,
  Save,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

async function uploadImageFile(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<{ url: string }>('/upload/image?folder=blog-images', formData);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return response.url.startsWith('http') ? response.url : `${apiUrl}${response.url}`;
}

// ---------------------------------------------------------------------------
// Status badge + label
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<BlogPostStatus, string> = {
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
};

function StatusBadge({ status }: { status: BlogPostStatus }) {
  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function BlogPostEditContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params.id;

  const { post, translations, loading, error, refetch } = useBlogPost(postId);

  // EN content form state
  const enTranslation = translations.find((t) => t.locale === 'en') ?? null;
  const [enTitle, setEnTitle] = useState('');
  const [enBody, setEnBody] = useState('');
  const [enExcerpt, setEnExcerpt] = useState('');
  const [enSeoTitle, setEnSeoTitle] = useState('');
  const [enSeoDescription, setEnSeoDescription] = useState('');
  const [enContentSaving, setEnContentSaving] = useState(false);

  // Local metadata form state
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Populate form when post loads
  useEffect(() => {
    if (post) {
      setCoverImageUrl(post.coverImageUrl ?? '');
      setTags(post.tags.join(', '));
    }
  }, [post]);

  // Populate EN content form when translations load
  useEffect(() => {
    if (enTranslation) {
      setEnTitle(enTranslation.title);
      setEnBody(enTranslation.body);
      setEnExcerpt(enTranslation.excerpt ?? '');
      setEnSeoTitle(enTranslation.seoTitle ?? '');
      setEnSeoDescription(enTranslation.seoDescription ?? '');
    } else {
      setEnTitle('');
      setEnBody('');
      setEnExcerpt('');
      setEnSeoTitle('');
      setEnSeoDescription('');
    }
  }, [enTranslation]);

  const uploadImage = useCallback(async (file: File) => uploadImageFile(file), []);

  const handleSaveEnContent = async () => {
    if (!post) return;
    if (!enTitle.trim()) {
      toast.error('Title is required.');
      return;
    }
    setEnContentSaving(true);
    try {
      await blogApi.upsertTranslation(post.id, {
        locale: 'en',
        title: enTitle.trim(),
        body: enBody,
        excerpt: enExcerpt.trim() || undefined,
        seoTitle: enSeoTitle.trim() || undefined,
        seoDescription: enSeoDescription.trim() || undefined,
        translationStatus: 'ORIGINAL' as BlogTranslationStatus,
        isOriginal: true,
      });
      toast.success('Content saved.');
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save content.');
    } finally {
      setEnContentSaving(false);
    }
  };

  const handleCoverFile = async (file: File) => {
    setImageUploading(true);
    try {
      const url = await uploadImageFile(file);
      setCoverImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSaveMetadata = async () => {
    if (!post) return;
    try {
      setSaving(true);
      await blogApi.updatePost(post.id, {
        coverImageUrl: coverImageUrl || undefined,
        tags: parseTags(tags),
      });
      await refetch();
      toast.success('Post updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLifecycle = useCallback(
    async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
      if (!post) return;
      const messages = {
        publish: `Publish "${post.slug}"? It will become visible to the public.`,
        unpublish: `Unpublish "${post.slug}"? It will revert to draft.`,
        archive: `Archive "${post.slug}"? It will be hidden from the public.`,
        delete: `Delete "${post.slug}"? This soft-deletes the post. Translations are preserved.`,
      };
      if (!window.confirm(messages[action])) return;
      try {
        setLifecycleLoading(true);
        if (action === 'delete') {
          await blogApi.deletePost(post.id);
          router.push('/admin/blog');
          return;
        }
        await (action === 'publish'
          ? blogApi.publishPost(post.id)
          : action === 'unpublish'
            ? blogApi.unpublishPost(post.id)
            : blogApi.archivePost(post.id));
        await refetch();
        toast.success(
          action === 'publish'
            ? 'Post published.'
            : action === 'unpublish'
              ? 'Post unpublished.'
              : 'Post archived.'
        );
      } catch (err) {
        console.error(`${action} failed:`, err);
        toast.error(`Failed to ${action} post.`);
      } finally {
        setLifecycleLoading(false);
      }
    },
    [post, refetch, router]
  );

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog Posts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error ?? 'Post not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3 h-3" />
        Blog Posts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {enTranslation?.title ?? post.slug}
        </h1>
        <p className="font-mono text-xs text-gray-400 mt-1">{post.slug}</p>
      </div>

      {/* Two-column layout: content left, sidebar right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-6 items-start">
        {/* ── Main content column ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Content</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                EN
              </span>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className={labelCls}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={enTitle}
                  onChange={(e) => setEnTitle(e.target.value)}
                  placeholder="Post title"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Body</label>
                <TiptapEditor value={enBody} onChange={setEnBody} uploadImage={uploadImage} />
              </div>

              <div>
                <label className={labelCls}>Excerpt</label>
                <textarea
                  value={enExcerpt}
                  onChange={(e) => setEnExcerpt(e.target.value)}
                  placeholder="Short summary shown in post listings…"
                  rows={3}
                  className={`${inputCls} resize-y`}
                />
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SEO</p>
                <div>
                  <label className={labelCls}>
                    SEO Title{' '}
                    <span className="text-xs text-gray-400 font-normal">(max 255 chars)</span>
                  </label>
                  <input
                    type="text"
                    value={enSeoTitle}
                    onChange={(e) => setEnSeoTitle(e.target.value)}
                    maxLength={255}
                    placeholder="Override meta title (optional)"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    SEO Description{' '}
                    <span className="text-xs text-gray-400 font-normal">(max 500 chars)</span>
                  </label>
                  <textarea
                    value={enSeoDescription}
                    onChange={(e) => setEnSeoDescription(e.target.value)}
                    maxLength={500}
                    placeholder="Override meta description (optional)"
                    rows={3}
                    className={`${inputCls} resize-y`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveEnContent}
                  disabled={enContentSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {enContentSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Content
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-3 xl:sticky xl:top-6">
          {/* Status + lifecycle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge status={post.status} />
              {post.publishedAt && (
                <span className="text-xs text-gray-400">{formatDate(post.publishedAt)}</span>
              )}
            </div>
            {post.author && (
              <p className="text-xs text-gray-500">
                by {post.author.firstName} {post.author.lastName}
              </p>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {post.status === 'DRAFT' && (
                <button
                  onClick={() => handleLifecycle('publish')}
                  disabled={lifecycleLoading}
                  className="w-full py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Publish
                </button>
              )}
              {post.status === 'PUBLISHED' && (
                <>
                  <button
                    onClick={() => handleLifecycle('unpublish')}
                    disabled={lifecycleLoading}
                    className="w-full py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" /> Unpublish
                  </button>
                  <button
                    onClick={() => handleLifecycle('archive')}
                    disabled={lifecycleLoading}
                    className="w-full py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                </>
              )}
              {post.status === 'ARCHIVED' && (
                <button
                  onClick={() => handleLifecycle('publish')}
                  disabled={lifecycleLoading}
                  className="w-full py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Re-publish
                </button>
              )}
              <button
                onClick={() => handleLifecycle('delete')}
                disabled={lifecycleLoading}
                className="w-full py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Post
              </button>
            </div>
          </div>

          {/* Translations link */}
          <Link
            href={`/admin/blog/${post.id}/translations`}
            className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#CBB57B] hover:bg-neutral-50 transition-colors group"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-black">
              <Languages className="w-4 h-4" />
              Translations
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#CBB57B]">
              {translations.length > 0
                ? `${translations.length} locale${translations.length > 1 ? 's' : ''}`
                : 'None yet'}
            </span>
          </Link>

          {/* Metadata card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Metadata
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Cover image — full-width preview */}
              <div>
                <label className={labelCls}>Cover image</label>
                <div className="space-y-2">
                  <div className="w-full aspect-video bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-neutral-200">
                    {coverImageUrl ? (
                      <img
                        src={coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {imageUploading ? 'Uploading…' : coverImageUrl ? 'Replace' : 'Upload image'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    JPEG, PNG, WebP or GIF · max 5MB
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverFile(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}>Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputCls}
                  placeholder="style, watches, luxury"
                />
                <p className="mt-1 text-xs text-gray-400">Comma-separated.</p>
              </div>

              {/* Slug read-only */}
              <div>
                <label className={labelCls}>Slug</label>
                <input
                  type="text"
                  value={post.slug}
                  readOnly
                  className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed font-mono text-xs`}
                />
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveMetadata}
                  disabled={saving || imageUploading}
                  className="w-full py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Metadata
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminBlogPostPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <BlogPostEditContent />
      </AdminLayout>
    </AdminRoute>
  );
}
