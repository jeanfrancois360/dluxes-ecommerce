'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useAffiliateProductTranslations } from '@/hooks/use-affiliate';
import { affiliateApi, type TranslationStatus } from '@/lib/api/affiliate';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, Languages, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCALES: { code: string; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
];

const STATUS_LABELS: Record<TranslationStatus, string> = {
  ORIGINAL: 'Original',
  MACHINE_TRANSLATED: 'Machine Translated',
  HUMAN_REVIEWED: 'Human Reviewed',
  PUBLISHED: 'Published',
};

const STATUS_COLORS: Record<TranslationStatus, string> = {
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
  description: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  longDescription: '',
  seoTitle: '',
  seoDescription: '',
};

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function TranslationsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;

  const { product, translations, loading, error, refetch } =
    useAffiliateProductTranslations(productId);

  const [activeLocale, setActiveLocale] = useState('en');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Derive the active translation from the loaded list
  const activeTranslation = translations.find((t) => t.locale === activeLocale) ?? null;

  // Repopulate form when active locale or translations change
  useEffect(() => {
    if (activeTranslation) {
      setForm({
        title: activeTranslation.title,
        description: activeTranslation.description,
        longDescription: activeTranslation.longDescription ?? '',
        seoTitle: activeTranslation.seoTitle ?? '',
        seoDescription: activeTranslation.seoDescription ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [activeTranslation]);

  // Reset form + switch locale tab
  const switchLocale = (locale: string) => {
    setActiveLocale(locale);
    // form is repopulated by the useEffect above
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      // Preserve PUBLISHED status; otherwise promote to HUMAN_REVIEWED
      const translationStatus: TranslationStatus =
        activeTranslation?.translationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'HUMAN_REVIEWED';

      await affiliateApi.upsertTranslation(productId, {
        locale: activeLocale,
        title: form.title.trim(),
        description: form.description.trim(),
        longDescription: form.longDescription.trim() || undefined,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        translationStatus,
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
      await affiliateApi.updateTranslation(productId, activeLocale, {
        translationStatus: status,
      });
      toast.success(status === 'PUBLISHED' ? 'Marked as published.' : 'Marked as human reviewed.');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  const productTitle =
    product?.title ??
    translations.find((t) => t.isOriginal)?.title ??
    translations[0]?.title ??
    product?.slug ??
    productId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/affiliate/products"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Translations</h1>
          <p className="text-gray-500 mt-1">
            {productTitle}{' '}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{productId}</span>
          </p>
        </div>
      </div>

      {/* Locale tabs + content card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {LOCALES.map(({ code, label }) => {
            const exists = translations.some((t) => t.locale === code);
            return (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeLocale === code
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {exists && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
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
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[activeTranslation.translationStatus]}`}
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
              placeholder="Product title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short product description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Long description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
            <textarea
              value={form.longDescription}
              onChange={(e) => setForm((f) => ({ ...f, longDescription: e.target.value }))}
              placeholder="Full product description (optional)"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* SEO section */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>

            <button
              onClick={() => handleSetStatus('HUMAN_REVIEWED')}
              disabled={!activeTranslation || updatingStatus}
              title={!activeTranslation ? 'Save the translation first' : undefined}
              className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updatingStatus && <Loader2 className="w-3 h-3 animate-spin" />}
              Mark as Human Reviewed
            </button>

            <button
              onClick={() => handleSetStatus('PUBLISHED')}
              disabled={!activeTranslation || updatingStatus}
              title={!activeTranslation ? 'Save the translation first' : undefined}
              className="px-4 py-2 border border-green-400 text-sm font-medium text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updatingStatus && <Loader2 className="w-3 h-3 animate-spin" />}
              Mark as Published
            </button>
          </div>
        </div>
      </div>

      {/* Empty state — no translations at all */}
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

export default function AdminAffiliateProductTranslationsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <TranslationsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
