'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import { useAffiliateProducts, useAffiliateAdvertisers } from '@/hooks/use-affiliate';
import { affiliateApi } from '@/lib/api/affiliate';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/date-format';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { toast } from '@/lib/utils/toast';
import {
  Filter,
  Tag,
  X,
  Upload,
  ImageIcon,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Languages,
  RefreshCw,
} from 'lucide-react';
import type { AffiliateProduct } from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Image upload helper — matches apps/web/src/app/admin/categories/page.tsx
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
  const response = await api.post<{ url: string }>(
    '/upload/image?folder=affiliate-products',
    formData
  );
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return response.url.startsWith('http') ? response.url : `${apiUrl}${response.url}`;
}

// ---------------------------------------------------------------------------
// ProductThumbnail — matches apps/web/src/app/admin/products/page.tsx pattern
// ---------------------------------------------------------------------------

function ProductThumbnail({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  return (
    <div className="w-12 h-12 min-w-[48px] min-h-[48px] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-neutral-200">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <svg
          className="w-6 h-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </div>
  );
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

type ProductFormData = {
  advertiserId: string;
  slug: string;
  awinDeepLink: string;
  imageUrl: string;
  galleryUrls: string[];
  displayPrice: string;
  displayCurrency: string;
  originalPrice: string;
  tags: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: string;
};

const emptyProductForm: ProductFormData = {
  advertiserId: '',
  slug: '',
  awinDeepLink: '',
  imageUrl: '',
  galleryUrls: [],
  displayPrice: '',
  displayCurrency: 'EUR',
  originalPrice: '',
  tags: '',
  isActive: true,
  isFeatured: false,
  displayOrder: '0',
};

function validateProductForm(data: ProductFormData, isEdit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit) {
    if (!data.advertiserId) errors.advertiserId = 'Advertiser is required.';
    if (!data.slug.trim()) {
      errors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug.trim())) {
      errors.slug = 'Slug must be lowercase letters, numbers, and hyphens only.';
    }
  }
  if (!data.awinDeepLink.trim()) {
    errors.awinDeepLink = 'Awin deep link is required.';
  } else if (!data.awinDeepLink.trim().startsWith('https://')) {
    errors.awinDeepLink = 'Must start with https://';
  }
  if (!data.imageUrl) errors.imageUrl = 'Cover image is required.';
  if (data.displayPrice !== '') {
    const v = parseFloat(data.displayPrice);
    if (isNaN(v) || v < 0) errors.displayPrice = 'Must be a number ≥ 0.';
  }
  if (data.originalPrice !== '') {
    const v = parseFloat(data.originalPrice);
    if (isNaN(v) || v < 0) errors.originalPrice = 'Must be a number ≥ 0.';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// GalleryUploadField — upload one at a time, show thumbnails, remove button
// ---------------------------------------------------------------------------

function GalleryUploadField({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange([...urls, url]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gallery upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>
        Gallery images <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {urls.map((url, i) => (
            <div
              key={i}
              className="relative w-14 h-14 rounded-lg overflow-hidden ring-1 ring-neutral-200 bg-neutral-100 flex-shrink-0"
            >
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                className="absolute top-0 right-0 bg-red-600/80 hover:bg-red-700 text-white rounded-bl-lg p-0.5"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading…' : 'Add image'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductForm — shared create / edit form body
// ---------------------------------------------------------------------------

function ProductForm({
  data,
  errors,
  apiError,
  submitting,
  isEdit,
  editAdvertiserName,
  approvedAdvertisers,
  advertisersLoading,
  onChange,
  onSubmit,
  onCancel,
}: {
  data: ProductFormData;
  errors: Record<string, string>;
  apiError: string | null;
  submitting: boolean;
  isEdit: boolean;
  editAdvertiserName?: string;
  approvedAdvertisers: Array<{ id: string; name: string }>;
  advertisersLoading: boolean;
  onChange: (patch: Partial<ProductFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = async (file: File) => {
    setImageUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ imageUrl: url });
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

      {/* Advertiser */}
      <div>
        <label className={labelCls}>
          Advertiser {!isEdit && <span className="text-red-500">*</span>}
        </label>
        {isEdit ? (
          <input
            type="text"
            value={editAdvertiserName ?? data.advertiserId}
            readOnly
            className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
          />
        ) : (
          <>
            <select
              value={data.advertiserId}
              onChange={(e) => onChange({ advertiserId: e.target.value })}
              disabled={advertisersLoading}
              className={`${inputCls} disabled:opacity-50`}
            >
              <option value="">Select advertiser…</option>
              {approvedAdvertisers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <FieldError msg={errors.advertiserId} />
          </>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className={labelCls}>
          Slug {!isEdit && <span className="text-red-500">*</span>}
        </label>
        {isEdit ? (
          <input
            type="text"
            value={data.slug}
            readOnly
            className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed font-mono`}
          />
        ) : (
          <>
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
              placeholder="e.g. nike-air-max-90"
            />
            <FieldError msg={errors.slug} />
            <p className="mt-1 text-xs text-gray-400">
              Lowercase letters, numbers, and hyphens only.
            </p>
          </>
        )}
      </div>

      {/* Awin Deep Link */}
      <div>
        <label className={labelCls}>
          Awin Deep Link <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.awinDeepLink}
          onChange={(e) => onChange({ awinDeepLink: e.target.value })}
          className={inputCls}
          placeholder="https://www.awin1.com/cread.php?..."
        />
        <FieldError msg={errors.awinDeepLink} />
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>
          Cover image <span className="text-red-500">*</span>
        </label>
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 min-w-[64px] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-neutral-200 flex-shrink-0">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
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
              {imageUploading ? 'Uploading…' : data.imageUrl ? 'Replace image' : 'Upload image'}
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
        <FieldError msg={errors.imageUrl} />
      </div>

      {/* Gallery */}
      <GalleryUploadField
        urls={data.galleryUrls}
        onChange={(urls) => onChange({ galleryUrls: urls })}
      />

      {/* Price row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Display Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.displayPrice}
            onChange={(e) => onChange({ displayPrice: e.target.value })}
            className={inputCls}
            placeholder="0.00"
          />
          <FieldError msg={errors.displayPrice} />
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <input
            type="text"
            maxLength={3}
            value={data.displayCurrency}
            onChange={(e) => onChange({ displayCurrency: e.target.value.toUpperCase() })}
            className={`${inputCls} font-mono uppercase`}
            placeholder="EUR"
          />
        </div>
        <div>
          <label className={labelCls}>Original Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.originalPrice}
            onChange={(e) => onChange({ originalPrice: e.target.value })}
            className={inputCls}
            placeholder="0.00"
          />
          <FieldError msg={errors.originalPrice} />
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
          placeholder="sneakers, sport, nike (comma-separated)"
        />
        <p className="mt-1 text-xs text-gray-400">Comma-separated list of tags.</p>
      </div>

      {/* Display order */}
      <div>
        <label className={labelCls}>Display Order</label>
        <input
          type="number"
          step="1"
          value={data.displayOrder}
          onChange={(e) => onChange({ displayOrder: e.target.value })}
          className={inputCls}
          placeholder="0"
        />
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <input
            id="product-active"
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-[#CBB57B]"
          />
          <label htmlFor="product-active" className="text-sm text-gray-700">
            Active
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="product-featured"
            type="checkbox"
            checked={data.isFeatured}
            onChange={(e) => onChange({ isFeatured: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-[#CBB57B]"
          />
          <label htmlFor="product-featured" className="text-sm text-gray-700">
            Featured
          </label>
        </div>
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
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// buildColumns — factory closes over action handlers
// ---------------------------------------------------------------------------

function buildColumns(
  onEdit: (product: AffiliateProduct) => void,
  onStatusToggle: (product: AffiliateProduct) => void,
  onDelete: (product: AffiliateProduct) => void,
  onTranslations: (id: string) => void
) {
  return [
    {
      key: 'image',
      label: 'Image',
      render: (item: AffiliateProduct) => (
        <ProductThumbnail imageUrl={item.imageUrl} alt={item.title ?? item.slug} />
      ),
    },
    {
      key: 'title',
      label: 'Name',
      render: (item: AffiliateProduct) => (
        <div>
          <div className="font-semibold text-gray-900">{item.title ?? item.slug}</div>
          {item.brandName && (
            <div className="text-xs text-gray-500 font-medium">{item.brandName}</div>
          )}
          {item.title && (
            <div className="text-xs text-gray-400 font-mono truncate max-w-[180px]">
              {item.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'advertiser',
      label: 'Advertiser',
      render: (item: AffiliateProduct) => (
        <span className="text-sm text-gray-700">
          {item.advertiser?.name ?? <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: AffiliateProduct) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
              item.isActive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </span>
          {item.inStock !== undefined && (
            <span
              title={item.inStock ? 'In stock' : 'Out of stock'}
              className={`w-2 h-2 rounded-full ${item.inStock ? 'bg-green-500' : 'bg-red-400'}`}
            />
          )}
          {item.isFeatured && (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              Featured
            </span>
          )}
          <span
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
              item.fulfillmentSource === 'FEED'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {item.fulfillmentSource === 'FEED' ? 'Feed' : 'Manual'}
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right' as const,
      render: (item: AffiliateProduct) =>
        item.displayPrice != null ? (
          <span className="text-gray-700 text-sm">
            {formatCurrencyAmount(item.displayPrice)}{' '}
            <span className="text-gray-400 text-xs">{item.displayCurrency ?? ''}</span>
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'clickCount',
      label: 'Clicks',
      align: 'right' as const,
      render: (item: AffiliateProduct) => (
        <span className="text-gray-700 text-sm">{item.clickCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: AffiliateProduct) => (
        <span className="text-gray-500 text-sm">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: AffiliateProduct) => (
        <div className="flex items-center gap-1">
          {item.isActive ? (
            <button
              onClick={() => onStatusToggle(item)}
              title="Deactivate"
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onStatusToggle(item)}
              title="Activate"
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onTranslations(item.id)}
            title="Translations"
            className="p-1.5 text-gray-400 hover:text-[#CBB57B] hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(item)}
            title="Edit"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function AffiliateProductsContent() {
  const router = useRouter();

  // List state
  const [page, setPage] = useState(1);
  const [advertiserIdFilter, setAdvertiserIdFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'FEED' | 'MANUAL'>('all');

  const limit = 20;

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      advertiserId: advertiserIdFilter || undefined,
      isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
      isFeatured: isFeaturedFilter === 'all' ? undefined : true,
      fulfillmentSource: sourceFilter === 'all' ? undefined : (sourceFilter as 'FEED' | 'MANUAL'),
    }),
    [page, advertiserIdFilter, isActiveFilter, isFeaturedFilter, sourceFilter]
  );

  const { products, pagination, loading, error, refetch } = useAffiliateProducts(queryParams);

  // Advertiser list — shared between filter bar and create modal dropdown
  const { advertisers: approvedAdvertisers, loading: advertisersLoading } = useAffiliateAdvertisers(
    useMemo(() => ({ limit: 100, approvalStatus: 'APPROVED' }), [])
  );

  // Feed sync state
  const [syncingFeeds, setSyncingFeeds] = useState(false);

  const handleSyncFeeds = async () => {
    try {
      setSyncingFeeds(true);
      const result = await affiliateApi.triggerFeedSync();
      if ('totalUpserted' in result) {
        toast.success(
          `Feed sync complete — ${result.totalUpserted} upserted, ${result.totalErrors} errors`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Feed sync complete — ${result.productsUpserted} upserted`);
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Feed sync failed.');
    } finally {
      setSyncingFeeds(false);
    }
  };

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const patchForm = (patch: Partial<ProductFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setFormData(emptyProductForm);
    setFormErrors({});
    setFormApiError(null);
    setShowCreateModal(true);
  };

  const openEdit = useCallback((product: AffiliateProduct) => {
    setFormData({
      advertiserId: product.advertiserId,
      slug: product.slug,
      awinDeepLink: product.awinDeepLink,
      imageUrl: product.imageUrl,
      galleryUrls: product.galleryUrls,
      displayPrice: product.displayPrice?.toString() ?? '',
      displayCurrency: product.displayCurrency ?? 'EUR',
      originalPrice: product.originalPrice?.toString() ?? '',
      tags: product.tags.join(', '),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      displayOrder: product.displayOrder.toString(),
    });
    setFormErrors({});
    setFormApiError(null);
    setEditingProduct(product);
  }, []);

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
  };

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const handleCreate = async () => {
    const errs = validateProductForm(formData, false);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setFormSubmitting(true);
      setFormApiError(null);
      await affiliateApi.createProduct({
        slug: formData.slug.trim(),
        advertiserId: formData.advertiserId,
        awinDeepLink: formData.awinDeepLink.trim(),
        imageUrl: formData.imageUrl,
        galleryUrls: formData.galleryUrls.length ? formData.galleryUrls : undefined,
        displayPrice: formData.displayPrice !== '' ? parseFloat(formData.displayPrice) : undefined,
        displayCurrency: formData.displayCurrency || undefined,
        originalPrice:
          formData.originalPrice !== '' ? parseFloat(formData.originalPrice) : undefined,
        tags: formData.tags ? parseTags(formData.tags) : undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder:
          formData.displayOrder !== '' ? parseInt(formData.displayOrder, 10) : undefined,
      });
      closeModal();
      refetch();
      toast.success('Product created. Add a title and description via the Translations button.', {
        duration: 7000,
      });
    } catch (err) {
      setFormApiError(err instanceof Error ? err.message : 'Failed to create product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    const errs = validateProductForm(formData, true);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setFormSubmitting(true);
      setFormApiError(null);
      await affiliateApi.updateProduct(editingProduct.id, {
        awinDeepLink: formData.awinDeepLink.trim(),
        imageUrl: formData.imageUrl,
        galleryUrls: formData.galleryUrls,
        displayPrice: formData.displayPrice !== '' ? parseFloat(formData.displayPrice) : undefined,
        displayCurrency: formData.displayCurrency || undefined,
        originalPrice:
          formData.originalPrice !== '' ? parseFloat(formData.originalPrice) : undefined,
        tags: formData.tags ? parseTags(formData.tags) : undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        displayOrder:
          formData.displayOrder !== '' ? parseInt(formData.displayOrder, 10) : undefined,
      });
      closeModal();
      refetch();
      toast.success('Product updated.');
    } catch (err) {
      setFormApiError(err instanceof Error ? err.message : 'Failed to update product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusToggle = useCallback(
    async (product: AffiliateProduct) => {
      const newActive = !product.isActive;
      const name = product.title ?? product.slug;
      const message = newActive
        ? `Activate ${name}? It will become visible on the public listing.`
        : `Deactivate ${name}? It will be hidden from the public listing.`;
      if (!window.confirm(message)) return;
      try {
        await affiliateApi.updateProduct(product.id, { isActive: newActive });
        refetch();
      } catch (err) {
        console.error('Status toggle failed:', err);
        toast.error('Failed to update product status.');
      }
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (product: AffiliateProduct) => {
      const name = product.title ?? product.slug;
      if (
        !window.confirm(
          `Delete ${name}? This soft-deletes the product. Click history is preserved.`
        )
      )
        return;
      try {
        await affiliateApi.deleteProduct(product.id);
        refetch();
      } catch (err) {
        console.error('Delete failed:', err);
        toast.error('Failed to delete product.');
      }
    },
    [refetch]
  );

  const handleTranslations = useCallback(
    (id: string) => {
      router.push(`/admin/affiliate/products/${id}/translations`);
    },
    [router]
  );

  const columns = useMemo(
    () => buildColumns(openEdit, handleStatusToggle, handleDelete, handleTranslations),
    [openEdit, handleStatusToggle, handleDelete, handleTranslations]
  );

  const hasActiveFilters =
    advertiserIdFilter ||
    isActiveFilter !== 'all' ||
    isFeaturedFilter !== 'all' ||
    sourceFilter !== 'all';

  const clearFilters = () => {
    setAdvertiserIdFilter('');
    setIsActiveFilter('all');
    setIsFeaturedFilter('all');
    setSourceFilter('all');
    setPage(1);
  };

  const handleFilterChange = () => setPage(1);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Products</h1>
          <p className="text-gray-500 mt-1">
            Manage affiliate product listings ({pagination.total} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncFeeds}
            disabled={syncingFeeds}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingFeeds ? 'animate-spin' : ''}`} />
            {syncingFeeds ? 'Syncing…' : 'Sync Feeds'}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            + Create Product
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Advertiser dropdown */}
          <select
            value={advertiserIdFilter}
            onChange={(e) => {
              setAdvertiserIdFilter(e.target.value);
              handleFilterChange();
            }}
            disabled={advertisersLoading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B] disabled:opacity-50"
          >
            <option value="">All advertisers</option>
            {approvedAdvertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Active state */}
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as 'all' | 'active' | 'inactive');
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
          >
            <option value="all">Active &amp; inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {/* Featured */}
          <select
            value={isFeaturedFilter}
            onChange={(e) => {
              setIsFeaturedFilter(e.target.value as 'all' | 'featured');
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
          >
            <option value="all">All products</option>
            <option value="featured">Featured only</option>
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as 'all' | 'FEED' | 'MANUAL');
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CBB57B]"
          >
            <option value="all">All sources</option>
            <option value="FEED">Feed only</option>
            <option value="MANUAL">Manual only</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <ModernTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage={
          hasActiveFilters
            ? 'No products match your filters.'
            : 'No affiliate products yet. Create your first product.'
        }
        getRowId={(item) => item.id}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> –{' '}
              <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> products
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        p === page
                          ? 'z-10 bg-gray-100 border-gray-900 text-gray-900'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Empty state when no products and no filters */}
      {!loading && !error && products.length === 0 && !hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No affiliate products yet</h2>
          <p className="text-sm text-gray-500">
            Create your first affiliate product to start tracking clicks and commissions.
          </p>
        </div>
      )}

      {/* Create Modal */}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Product</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              <ProductForm
                data={formData}
                errors={formErrors}
                apiError={formApiError}
                submitting={formSubmitting}
                isEdit={false}
                approvedAdvertisers={approvedAdvertisers}
                advertisersLoading={advertisersLoading}
                onChange={patchForm}
                onSubmit={handleCreate}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Product —{' '}
                <span className="text-gray-500 font-normal font-mono">{editingProduct.slug}</span>
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              <ProductForm
                data={formData}
                errors={formErrors}
                apiError={formApiError}
                submitting={formSubmitting}
                isEdit
                editAdvertiserName={editingProduct.advertiser?.name}
                approvedAdvertisers={approvedAdvertisers}
                advertisersLoading={advertisersLoading}
                onChange={patchForm}
                onSubmit={handleUpdate}
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

export default function AdminAffiliateProductsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AffiliateProductsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
