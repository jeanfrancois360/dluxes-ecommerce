'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useBlogPosts } from '@/hooks/use-blog';
import { blogApi, type BlogPost, type BlogPostStatus } from '@/lib/api/blog';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/date-format';
import { toast } from '@/lib/utils/toast';
import {
  FileText,
  X,
  Upload,
  ImageIcon,
  Globe,
  Search,
  Loader2,
  PenLine,
  Pencil,
  Trash2,
  Languages,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: BlogPostStatus }) {
  const styles: Record<BlogPostStatus, string> = {
    PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
    DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span
      className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full border ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

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
// Form helpers
// ---------------------------------------------------------------------------

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

type PostFormData = {
  slug: string;
  coverImageUrl: string;
  tags: string;
};

const emptyForm: PostFormData = { slug: '', coverImageUrl: '', tags: '' };

function validatePostForm(data: PostFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.slug.trim()) {
    errors.slug = 'Slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug.trim())) {
    errors.slug = 'Slug must be lowercase letters, numbers, and hyphens only.';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// CreatePostForm
// ---------------------------------------------------------------------------

function CreatePostForm({
  data,
  errors,
  apiError,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: {
  data: PostFormData;
  errors: Record<string, string>;
  apiError: string | null;
  submitting: boolean;
  onChange: (patch: Partial<PostFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = async (file: File) => {
    setImageUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ coverImageUrl: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Slug */}
      <div>
        <label className={labelCls}>
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.slug}
          onChange={(e) =>
            onChange({
              slug: e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-'),
            })
          }
          className={`${inputCls} font-mono`}
          placeholder="e.g. how-to-style-luxury-watches"
        />
        <FieldError msg={errors.slug} />
        <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>Cover image</label>
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 min-w-[64px] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-neutral-200 flex-shrink-0">
            {data.coverImageUrl ? (
              <img
                src={data.coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-neutral-300" />
            )}
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {imageUploading
                ? 'Uploading…'
                : data.coverImageUrl
                  ? 'Replace image'
                  : 'Upload image'}
            </button>
            <p className="mt-1 text-xs text-gray-400">JPEG, PNG, WebP or GIF · max 5MB</p>
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
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags</label>
        <input
          type="text"
          value={data.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          className={inputCls}
          placeholder="style, watches, luxury (comma-separated)"
        />
        <p className="mt-1 text-xs text-gray-400">Comma-separated list of tags.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || imageUploading}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Post'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

const STATUS_TABS: { label: string; value: BlogPostStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

function BlogPostsContent() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | ''>('');
  const [search, setSearch] = useState('');

  const limit = 20;

  const queryParams = useMemo(
    () => ({ page, limit, status: statusFilter || undefined }),
    [page, statusFilter]
  );

  const { posts, pagination, loading, error, refetch } = useBlogPosts(queryParams);

  // Client-side search across loaded page
  const visiblePosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter((post) => {
      const title = post.translations?.find((t) => t.locale === 'en')?.title?.toLowerCase() ?? '';
      return post.slug.toLowerCase().includes(q) || title.includes(q);
    });
  }, [posts, search]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<PostFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const patchForm = (patch: Partial<PostFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setFormApiError(null);
    setShowCreateModal(true);
  };

  const closeModal = () => setShowCreateModal(false);

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const handleCreate = async () => {
    const errs = validatePostForm(formData);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setFormSubmitting(true);
      setFormApiError(null);
      const post = await blogApi.createPost({
        slug: formData.slug.trim(),
        coverImageUrl: formData.coverImageUrl || undefined,
        tags: formData.tags ? parseTags(formData.tags) : undefined,
      });
      closeModal();
      toast.success('Post created as draft. Add content via the editor.', { duration: 6000 });
      router.push(`/admin/blog/${post.id}`);
    } catch (err) {
      setFormApiError(err instanceof Error ? err.message : 'Failed to create post.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLifecycle = useCallback(
    async (post: BlogPost, action: 'publish' | 'unpublish' | 'archive') => {
      const messages = {
        publish: `Publish "${post.slug}"? It will become visible to the public.`,
        unpublish: `Unpublish "${post.slug}"? It will revert to draft.`,
        archive: `Archive "${post.slug}"? It will be hidden from the public.`,
      };
      if (!window.confirm(messages[action])) return;
      try {
        await (action === 'publish'
          ? blogApi.publishPost(post.id)
          : action === 'unpublish'
            ? blogApi.unpublishPost(post.id)
            : blogApi.archivePost(post.id));
        refetch();
      } catch (err) {
        console.error(`${action} failed:`, err);
        toast.error(`Failed to ${action} post.`);
      }
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (post: BlogPost) => {
      if (
        !window.confirm(
          `Delete "${post.slug}"? This is soft-deletable — translations are preserved.`
        )
      )
        return;
      try {
        await blogApi.deletePost(post.id);
        refetch();
        toast.success('Post deleted.');
      } catch (err) {
        console.error('Delete failed:', err);
        toast.error('Failed to delete post.');
      }
    },
    [refetch]
  );

  const hasActiveFilters = !!statusFilter || !!search;
  const clearFilters = () => {
    setStatusFilter('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {pagination.total} post{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <PenLine className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] bg-gray-50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value || 'all'}
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[minmax(0,2.5fr)_120px_110px_90px_110px_132px] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['Post', 'Status', 'Published', 'Locales', 'Created', ''].map((h) => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        )}

        {/* Empty */}
        {!loading && visiblePosts.length === 0 && (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {hasActiveFilters
                ? 'No posts match your filters.'
                : 'No blog posts yet. Create your first one.'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={openCreate}
                className="mt-4 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
              >
                New Post
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading &&
          visiblePosts.map((post) => {
            const enTitle =
              post.translations?.find((t) => t.locale === 'en')?.title ??
              post.translations?.[0]?.title;

            return (
              <div
                key={post.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,2.5fr)_120px_110px_90px_110px_132px] px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors items-center gap-y-2"
              >
                {/* Post */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[50px] flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden ring-1 ring-neutral-200">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <button
                      onClick={() => router.push(`/admin/blog/${post.id}`)}
                      className={`block text-left text-sm hover:underline underline-offset-2 truncate max-w-[280px] ${
                        enTitle ? 'font-semibold text-gray-900' : 'font-mono text-gray-500'
                      }`}
                    >
                      {enTitle ?? post.slug}
                    </button>
                    {enTitle && (
                      <div className="font-mono text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5">
                        /{post.slug}
                      </div>
                    )}
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {post.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-medium rounded border border-neutral-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 4 && (
                          <span className="text-[10px] text-neutral-400 font-medium">
                            +{post.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={post.status} />
                </div>

                {/* Published */}
                <div>
                  {post.publishedAt ? (
                    <span className="text-gray-600 text-sm">{formatDate(post.publishedAt)}</span>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>

                {/* Locales */}
                <div>
                  {(post._count?.translations ?? 0) > 0 ? (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm">{post._count?.translations}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>

                {/* Created */}
                <div>
                  <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  {post.status === 'DRAFT' && (
                    <button
                      title="Publish"
                      onClick={() => handleLifecycle(post, 'publish')}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {post.status === 'PUBLISHED' && (
                    <button
                      title="Unpublish"
                      onClick={() => handleLifecycle(post, 'unpublish')}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  {post.status === 'ARCHIVED' && (
                    <button
                      title="Re-publish"
                      onClick={() => handleLifecycle(post, 'publish')}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button
                    title="Edit"
                    onClick={() => router.push(`/admin/blog/${post.id}`)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    title="Translations"
                    onClick={() => router.push(`/admin/blog/${post.id}/translations`)}
                    className="p-1.5 text-gray-400 hover:text-[#CBB57B] hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => handleDelete(post)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of{' '}
            <span className="font-medium text-gray-700">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-sm border rounded-lg ${
                      p === page
                        ? 'bg-black border-black text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeModal();
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">New Blog Post</h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-65px)]">
              <CreatePostForm
                data={formData}
                errors={formErrors}
                apiError={formApiError}
                submitting={formSubmitting}
                onChange={patchForm}
                onSubmit={handleCreate}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminBlogPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <BlogPostsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
