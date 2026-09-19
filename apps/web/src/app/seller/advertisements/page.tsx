'use client';

import { useState } from 'react';
import {
  useMyAdvertisements,
  useAdvertisementMutations,
  useMyAdSubscription,
} from '@/hooks/use-advertisements';
import {
  type AdvertisementDetail,
  type CreateAdvertisementDto,
  type AdPlacement,
  type AdStatus,
} from '@/lib/api';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/seller/page-header';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  CreditCard,
  Upload,
  Link as LinkIcon,
  Type,
  LayoutGrid,
  Monitor,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api/client';

const statusColors: Record<AdStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-purple-100 text-purple-700',
};

export default function SellerAdvertisementsPage() {
  const t = useTranslations('sellerAds');
  const { advertisements: ads, isLoading, error, refresh } = useMyAdvertisements();
  const { subscription, isActive: hasActiveSubscription } = useMyAdSubscription();
  const {
    create: createAd,
    update: updateAd,
    delete: deleteAd,
    toggle: toggleAd,
  } = useAdvertisementMutations();

  const placementLabels: Record<AdPlacement, string> = {
    HOMEPAGE_HERO: t('placements.HOMEPAGE_HERO'),
    HOMEPAGE_FEATURED: t('placements.HOMEPAGE_FEATURED'),
    HOMEPAGE_SIDEBAR: t('placements.HOMEPAGE_SIDEBAR'),
    PRODUCTS_BANNER: t('placements.PRODUCTS_BANNER'),
    PRODUCTS_INLINE: t('placements.PRODUCTS_INLINE'),
    PRODUCTS_SIDEBAR: t('placements.PRODUCTS_SIDEBAR'),
    CATEGORY_BANNER: t('placements.CATEGORY_BANNER'),
    PRODUCT_DETAIL_SIDEBAR: t('placements.PRODUCT_DETAIL_SIDEBAR'),
    CHECKOUT_UPSELL: t('placements.CHECKOUT_UPSELL'),
    SEARCH_RESULTS: t('placements.SEARCH_RESULTS'),
  };

  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<AdvertisementDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateAdvertisementDto>({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    linkText: t('placeholder.learnMore'),
    placement: 'PRODUCTS_SIDEBAR',
    pricingModel: 'FIXED',
    price: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Get allowed placements from subscription
  const allowedPlacements = subscription?.plan?.allowedPlacements || ['PRODUCTS_SIDEBAR'];
  const maxActiveAds = subscription?.plan?.maxActiveAds || 1;
  const activeAdsCount = ads.filter((ad) => ad.status === 'ACTIVE').length;
  const canCreateMoreAds = maxActiveAds === -1 || activeAdsCount < maxActiveAds;

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      linkText: t('placeholder.learnMore'),
      placement: (allowedPlacements[0] as AdPlacement) || 'PRODUCTS_SIDEBAR',
      pricingModel: 'FIXED',
      price: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingAd(null);
  };

  const openCreateModal = () => {
    if (!hasActiveSubscription) {
      toast.error(t('toast.subscribeFirst'));
      return;
    }
    if (!canCreateMoreAds) {
      toast.error(t('toast.limitReached', { max: maxActiveAds }));
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (ad: AdvertisementDetail) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      linkText: ad.linkText || t('placeholder.learnMore'),
      placement: ad.placement,
      pricingModel: ad.pricingModel || 'FIXED',
      price: 0,
      startDate: ad.startDate.split('T')[0],
      endDate: ad.endDate.split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAd) {
        await updateAd(editingAd.id, formData);
        toast.success(t('toast.updateSuccess'));
      } else {
        await createAd(formData);
        toast.success(t('toast.createSuccess'));
      }
      setShowModal(false);
      resetForm();
      refresh();
    } catch (error: any) {
      toast.error(error.message || t('toast.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await deleteAd(id);
      toast.success(t('toast.deleteSuccess'));
      refresh();
    } catch (error: any) {
      toast.error(error.message || t('toast.deleteFailed'));
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await toggleAd(id, currentStatus !== 'ACTIVE');
      toast.success(t('toast.statusUpdated'));
      refresh();
    } catch (error: any) {
      toast.error(error.message || t('toast.statusFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.advertisements') },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            disabled={!hasActiveSubscription || !canCreateMoreAds}
            className="flex items-center gap-2 px-4 py-2 bg-black text-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all border border-[#CBB57B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {t('createAd')}
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Subscription Status */}
        {!hasActiveSubscription && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{t('noSubscription')}</p>
              <p className="text-sm text-amber-700 mt-1">{t('noSubscriptionDesc')}</p>
              <Link
                href="/seller/advertisement-plans"
                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                <CreditCard className="w-4 h-4" />
                {t('viewPlans')}
              </Link>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {hasActiveSubscription && subscription && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">{t('currentPlan')}</p>
              <p className="text-lg font-semibold">{subscription.plan?.name}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">{t('activeAds')}</p>
              <p className="text-lg font-semibold">
                {activeAdsCount} / {maxActiveAds === -1 ? '∞' : maxActiveAds}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">{t('impressionsUsed')}</p>
              <p className="text-lg font-semibold">
                {subscription.impressionsUsed?.toLocaleString()} /{' '}
                {subscription.plan?.maxImpressions?.toLocaleString() || '∞'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">{t('periodEnds')}</p>
              <p className="text-lg font-semibold">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Ads List */}
        {ads.length > 0 ? (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white rounded-lg border p-4">
                <div className="flex gap-4">
                  {/* Ad Image */}
                  <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Ad Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{ad.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ad.status]}`}
                      >
                        {t(`statuses.${ad.status}`)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ad.startDate).toLocaleDateString()} -{' '}
                        {new Date(ad.endDate).toLocaleDateString()}
                      </span>
                      <span>{placementLabels[ad.placement]}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span>
                          {ad.impressions.toLocaleString()} {t('views')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MousePointer className="w-4 h-4 text-gray-400" />
                        <span>
                          {ad.clicks.toLocaleString()} {t('clicks')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span>
                          {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}
                          % CTR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {ad.status === 'ACTIVE' || ad.status === 'PAUSED' ? (
                      <button
                        onClick={() => handleToggle(ad.id, ad.status)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title={ad.status === 'ACTIVE' ? t('pause') : t('resume')}
                      >
                        {ad.status === 'ACTIVE' ? (
                          <Pause className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Play className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    ) : null}
                    <button
                      onClick={() => openEditModal(ad)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title={t('edit')}
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title={t('previewLink')}
                    >
                      <ExternalLink className="w-5 h-5 text-gray-600" />
                    </a>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title={t('delete')}
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{t('noAdsYet')}</p>
            {hasActiveSubscription && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                {t('createFirstAd')}
              </button>
            )}
          </div>
        )}

        {/* Create/Edit Modal — Enhanced */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="px-6 py-5 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingAd ? t('editAdvertisement') : t('createAdvertisement')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editingAd
                        ? 'Update your advertisement details'
                        : 'Create a new ad to promote your products'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:gap-6 p-6">
                  {/* Left: Form Fields */}
                  <div className="lg:col-span-3 space-y-5">
                    {/* Title */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <Type className="w-3.5 h-3.5 text-[#CBB57B]" />
                        {t('formTitle')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300"
                        required
                        maxLength={100}
                        placeholder="e.g. Summer Collection — 30% Off"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {formData.title.length}/100 characters
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        {t('formDescription')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300 resize-none"
                        rows={3}
                        maxLength={200}
                        placeholder="Short description of your ad — what makes it compelling?"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#CBB57B]" />
                        Ad Image <span className="text-red-500">*</span>
                      </label>
                      {formData.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                          <img
                            src={formData.imageUrl}
                            alt="Ad preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 hover:border-[#CBB57B] rounded-xl cursor-pointer transition-colors bg-gray-50 hover:bg-[#CBB57B]/5 group">
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#CBB57B] transition-colors mb-2" />
                          <p className="text-sm font-medium text-gray-600 group-hover:text-[#CBB57B]">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG or WebP — max 5MB</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error(
                                  'Image must be under 5MB. Please compress or resize it first.'
                                );
                                return;
                              }
                              try {
                                const fd = new FormData();
                                fd.append('image', file);
                                const res = await api.post(
                                  '/upload/image?folder=advertisements',
                                  fd
                                );
                                const url = res?.data?.url ?? res?.url;
                                if (url) setFormData((prev) => ({ ...prev, imageUrl: url }));
                                else toast.error('Upload failed — try a smaller image (under 5MB)');
                              } catch {
                                toast.error('Upload failed — try a smaller image (under 5MB)');
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Link URL + Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-[#CBB57B]" />
                          Link URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={formData.linkUrl}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300"
                          required
                          placeholder="https://your-store.com/sale"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={formData.linkText}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, linkText: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300"
                          placeholder="Shop Now"
                        />
                      </div>
                    </div>

                    {/* Placement */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-[#CBB57B]" />
                        Placement <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allowedPlacements.map((placement) => {
                          const isSelected = formData.placement === placement;
                          return (
                            <button
                              key={placement}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  placement: placement as AdPlacement,
                                }))
                              }
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                                isSelected
                                  ? 'border-[#CBB57B] bg-[#CBB57B]/5 ring-2 ring-[#CBB57B]/20'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#CBB57B]" />}
                              <span
                                className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[#8B7355]' : 'text-gray-600'}`}
                              >
                                {placementLabels[placement as AdPlacement] || placement}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#CBB57B]" />
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                          End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="lg:col-span-2 mt-6 lg:mt-0">
                    <div className="sticky top-24 space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#CBB57B]" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Live Preview
                          </span>
                        </div>
                        <div className="p-4">
                          {formData.imageUrl ? (
                            <div className="space-y-3">
                              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                <img
                                  src={formData.imageUrl}
                                  alt="Preview"
                                  className="w-full h-40 object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm leading-tight">
                                  {formData.title || 'Your ad title'}
                                </p>
                                {formData.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {formData.description}
                                  </p>
                                )}
                              </div>
                              {formData.linkText && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#CBB57B]">
                                  {formData.linkText} <ExternalLink className="w-3 h-3" />
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium">
                                  Sponsored
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center">
                              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">
                                Upload an image to see the preview
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Placement info */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5" />
                          Recommended image sizes
                        </p>
                        <ul className="space-y-1 text-xs text-amber-700">
                          <li>Banner: 1200 x 240px (5:1)</li>
                          <li>Sidebar: 300 x 250px (6:5)</li>
                          <li>Featured: 600 x 800px (3:4)</li>
                          <li>Hero: 1920 x 600px (16:5)</li>
                        </ul>
                      </div>

                      {/* Duration display */}
                      {formData.startDate && formData.endDate && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Campaign duration
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {Math.max(
                              0,
                              Math.ceil(
                                (new Date(formData.endDate).getTime() -
                                  new Date(formData.startDate).getTime()) /
                                  86400000
                              )
                            )}{' '}
                            days
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(formData.startDate).toLocaleDateString()} —{' '}
                            {new Date(formData.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-none px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-white hover:border-gray-300 transition-all text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.imageUrl}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-[#CBB57B] rounded-xl font-bold text-sm hover:bg-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#CBB57B]/30"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingAd ? t('update') : t('create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
