'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { TiptapEditor } from '@/components/blog/tiptap-editor';
import { useBlogPost } from '@/hooks/use-blog';
import { blogApi, type BlogTranslationStatus } from '@/lib/api/blog';
import { api } from '@/lib/api/client';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, Languages, Loader2, Save, CheckCircle, Globe } from 'lucide-react';

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
  const response = await api.post<{ url: string }>('/upload/image?folder=blog-content', formData);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return response.url.startsWith('http') ? response.url : `${apiUrl}${response.url}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCALES: { code: string; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
];

const STATUS_LABELS: Record<BlogTranslationStatus, string> = {
  ORIGINAL: 'Original',
  MACHINE_TRANSLATED: 'Machine Translated',
  HUMAN_REVIEWED: 'Human Reviewed',
  PUBLISHED: 'Published',
};

const STATUS_COLORS: Record<BlogTranslationStatus, string> = {
  ORIGINAL: 'bg-gray-100 text-gray-700',
  MACHINE_TRANSLATED: 'bg-yellow-100 text-yellow-700',
  HUMAN_REVIEWED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
};

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  body: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  body: '',
  excerpt: '',
  seoTitle: '',
  seoDescription: '',
};

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]';

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function BlogTranslationsContent() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const { post, translations, loading, error, refetch } = useBlogPost(postId);

  const [activeLocale, setActiveLocale] = useState('en');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const activeTranslation = translations.find((t) => t.locale === activeLocale) ?? null;

  // Repopulate form when active locale or translations change
  useEffect(() => {
    if (activeTranslation) {
      setForm({
        title: activeTranslation.title,
        body: activeTranslation.body,
        excerpt: activeTranslation.excerpt ?? '',
        seoTitle: activeTranslation.seoTitle ?? '',
        seoDescription: activeTranslation.seoDescription ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [activeTranslation]);

  const uploadImage = useCallback(async (file: File) => uploadImageFile(file), []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      // EN stays ORIGINAL; others: preserve PUBLISHED, otherwise promote to HUMAN_REVIEWED
      const translationStatus: BlogTranslationStatus =
        activeLocale === 'en'
          ? 'ORIGINAL'
          : activeTranslation?.translationStatus === 'PUBLISHED'
            ? 'PUBLISHED'
            : 'HUMAN_REVIEWED';

      await blogApi.upsertTranslation(postId, {
        locale: activeLocale,
        title: form.title.trim(),
        body: form.body,
        excerpt: form.excerpt.trim() || undefined,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        translationStatus,
        isOriginal: activeLocale === 'en',
      });
      toast.success('Translation saved.');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save translation.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetStatus = async (status: 'HUMAN_REVIEWED' | 'PUBLISHED') => {
    if (!activeTranslation) return;
    setUpdatingStatus(true);
    try {
      await blogApi.updateTranslation(postId, activeLocale, { translationStatus: status });
      toast.success(status === 'PUBLISHED' ? 'Marked as published.' : 'Marked as human reviewed.');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const postTitle =
    translations.find((t) => t.locale === 'en')?.title ??
    translations.find((t) => t.isOriginal)?.title ??
    translations[0]?.title ??
    post?.slug ??
    postId;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/blog/${postId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Post
        </Link>
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{postTitle}</h1>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{post?.slug}</p>
          </div>
        </div>
      </div>

      {/* Locale tabs + form card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {LOCALES.map(({ code, label }) => {
            const t = translations.find((tr) => tr.locale === code);
            const statusDotColor = t
              ? t.translationStatus === 'PUBLISHED' || t.translationStatus === 'ORIGINAL'
                ? 'bg-green-500'
                : t.translationStatus === 'HUMAN_REVIEWED'
                  ? 'bg-blue-500'
                  : 'bg-amber-400'
              : null;
            return (
              <button
                key={code}
                onClick={() => setActiveLocale(code)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeLocale === code
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {statusDotColor ? (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                ) : (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-200" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form body */}
        <div className="p-6 space-y-5">
          {/* Status badge */}
          {activeTranslation && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status:</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  STATUS_COLORS[activeTranslation.translationStatus]
                }`}
              >
                {STATUS_LABELS[activeTranslation.translationStatus]}
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Post title"
              className={inputCls}
            />
          </div>

          {/* Body — rich text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <TiptapEditor
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              uploadImage={uploadImage}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary shown in post listings…"
              rows={3}
              className={`${inputCls} resize-y`}
            />
          </div>

          {/* SEO */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SEO</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title <span className="text-xs text-gray-400 font-normal">(max 255 chars)</span>
              </label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                maxLength={255}
                placeholder="Override meta title (optional)"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description{' '}
                <span className="text-xs text-gray-400 font-normal">(max 500 chars)</span>
              </label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                maxLength={500}
                placeholder="Override meta description (optional)"
                rows={3}
                className={`${inputCls} resize-y`}
              />
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>

            {activeLocale !== 'en' && (
              <>
                <button
                  onClick={() => handleSetStatus('HUMAN_REVIEWED')}
                  disabled={!activeTranslation || updatingStatus}
                  title={!activeTranslation ? 'Save the translation first' : undefined}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Mark Reviewed
                </button>

                <button
                  onClick={() => handleSetStatus('PUBLISHED')}
                  disabled={!activeTranslation || updatingStatus}
                  title={!activeTranslation ? 'Save the translation first' : undefined}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  Mark Published
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!loading && translations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Languages className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No translations yet</h2>
          <p className="text-sm text-gray-500">
            Fill in the form above to add your first translation.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminBlogTranslationsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <BlogTranslationsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
