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
  CheckCircle,
  Maximize2,
  Info,
  Sparkles,
  Search,
  ShoppingCart,
} from 'lucide-react';
import api from '@/lib/api/client';

// Placement configuration with icons, descriptions, and image specs
const PLACEMENT_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    shortLabel: string;
    description: string;
    imageSize: string;
    aspectRatio: string;
    previewAspect: string;
    tip: string;
  }
> = {
  HOMEPAGE_FEATURED: {
    icon: Sparkles,
    label: 'Homepage banner',
    shortLabel: 'Homepage Featured',
    description: 'Full-width banner below the featured products carousel',
    imageSize: '1200 × 240px',
    aspectRatio: '5:1',
    previewAspect: 'aspect-[5/1]',
    tip: 'Use a wide, landscape image. Text should be large and legible at small sizes.',
  },
  PRODUCTS_INLINE: {
    icon: LayoutGrid,
    label: 'Homepage inline',
    shortLabel: 'Homepage Inline',
    description: 'Full-width banner between product sections on homepage',
    imageSize: '1200 × 240px',
    aspectRatio: '5:1',
    previewAspect: 'aspect-[5/1]',
    tip: 'Same format as Homepage Featured. Great for seasonal promotions.',
  },
  PRODUCTS_BANNER: {
    icon: Monitor,
    label: 'Products page banner',
    shortLabel: 'Products Banner',
    description: 'Banner at the top of the products listing page',
    imageSize: '1200 × 240px',
    aspectRatio: '5:1',
    previewAspect: 'aspect-[5/1]',
    tip: 'Shown to shoppers actively browsing products. High intent audience.',
  },
  PRODUCT_DETAIL_SIDEBAR: {
    icon: Eye,
    label: 'Product page sidebar',
    shortLabel: 'Product Sidebar',
    description: 'Square ad in the sidebar of individual product pages',
    imageSize: '300 × 300px',
    aspectRatio: '1:1',
    previewAspect: 'aspect-square',
    tip: 'Use a square image with your product or brand front and center.',
  },
  CHECKOUT_UPSELL: {
    icon: ShoppingCart,
    label: 'Checkout upsell',
    shortLabel: 'Checkout Upsell',
    description: 'Small card shown during the checkout process',
    imageSize: '200 × 200px',
    aspectRatio: '1:1',
    previewAspect: 'aspect-square',
    tip: 'Buyers are ready to purchase. Show complementary products or deals.',
  },
  SEARCH_RESULTS: {
    icon: Search,
    label: 'Search sponsored',
    shortLabel: 'Search Sponsored',
    description: 'Sponsored card within search results',
    imageSize: '200 × 200px',
    aspectRatio: '1:1',
    previewAspect: 'aspect-square',
    tip: 'Appears alongside organic results. Use a clean product image.',
  },
};

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
  const [uploading, setUploading] = useState(false);

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

  // Placements that are actually integrated on the storefront
  const FUNCTIONAL_PLACEMENTS = [
    'HOMEPAGE_FEATURED',
    'PRODUCTS_INLINE',
    'PRODUCTS_BANNER',
    'PRODUCT_DETAIL_SIDEBAR',
    'CHECKOUT_UPSELL',
    'SEARCH_RESULTS',
  ];

  // Get allowed placements from subscription, filtered to only functional ones
  const allowedPlacements = (subscription?.plan?.allowedPlacements || ['PRODUCTS_BANNER']).filter(
    (p: string) => FUNCTIONAL_PLACEMENTS.includes(p)
  );
  const maxActiveAds = subscription?.plan?.maxActiveAds || 1;
  const maxAdDurationDays = subscription?.plan?.maxAdDurationDays || 30;
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
      endDate: new Date(Date.now() + maxAdDurationDays * 86400000).toISOString().split('T')[0],
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
      price: Number(ad.pricePerUnit) || 0,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: ad.endDate
        ? ad.endDate.split('T')[0]
        : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
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

                  {/* Actions — sellers can edit/delete; toggle is admin-only */}
                  <div className="flex items-center gap-2">
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
        {showModal &&
          (() => {
            const pc = PLACEMENT_CONFIG[formData.placement] || PLACEMENT_CONFIG.HOMEPAGE_FEATURED;
            const isBanner = ['HOMEPAGE_FEATURED', 'PRODUCTS_INLINE', 'PRODUCTS_BANNER'].includes(
              formData.placement
            );

            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl">
                  {/* Header */}
                  <div className="px-6 py-5 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
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
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
                      {/* Left: Form Fields */}
                      <div className="lg:col-span-3 space-y-6">
                        {/* Step 1: Placement Selection */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-[#CBB57B] text-white rounded-full flex items-center justify-center text-xs font-bold">
                              1
                            </div>
                            Where should your ad appear? <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allowedPlacements.map((placement) => {
                              const config = PLACEMENT_CONFIG[placement];
                              if (!config) return null;
                              const isSelected = formData.placement === placement;
                              const PlacementIcon = config.icon;
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
                                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                      ? 'border-[#CBB57B] bg-white shadow-sm ring-1 ring-[#CBB57B]/20'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#CBB57B]/15' : 'bg-gray-100'}`}
                                  >
                                    <PlacementIcon
                                      className={`w-4.5 h-4.5 ${isSelected ? 'text-[#CBB57B]' : 'text-gray-400'}`}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className={`text-xs font-bold ${isSelected ? 'text-[#8B7355]' : 'text-gray-700'}`}
                                    >
                                      {config.shortLabel}
                                    </p>
                                    <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                                      {config.description}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-[#CBB57B] flex-shrink-0 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step 2: Ad Content */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
                            <div className="w-6 h-6 bg-[#CBB57B] text-white rounded-full flex items-center justify-center text-xs font-bold">
                              2
                            </div>
                            Ad content
                          </label>
                          <div className="space-y-4">
                            {/* Title */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                  Title <span className="text-red-500">*</span>
                                </label>
                                <span
                                  className={`text-xs tabular-nums ${formData.title.length > 90 ? 'text-amber-600' : 'text-gray-400'}`}
                                >
                                  {formData.title.length}/100
                                </span>
                              </div>
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
                            </div>

                            {/* Description */}
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                                Description
                              </label>
                              <textarea
                                value={formData.description}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none transition-all hover:border-gray-300 resize-none"
                                rows={2}
                                maxLength={200}
                                placeholder="Short compelling description"
                              />
                            </div>

                            {/* Image Upload */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                  Image <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Maximize2 className="w-3 h-3" />
                                  {pc.imageSize} ({pc.aspectRatio})
                                </span>
                              </div>
                              {formData.imageUrl ? (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                  <div className={isBanner ? 'aspect-[5/1]' : 'aspect-video'}>
                                    <img
                                      src={formData.imageUrl}
                                      alt="Ad preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({ ...prev, imageUrl: '' }))
                                    }
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-[10px] text-white font-medium backdrop-blur-sm">
                                    {pc.imageSize}
                                  </div>
                                </div>
                              ) : (
                                <label
                                  className={`flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 hover:border-[#CBB57B] rounded-xl cursor-pointer transition-colors bg-gray-50 hover:bg-[#CBB57B]/5 group ${isBanner ? 'aspect-[5/1]' : 'h-48'}`}
                                >
                                  {uploading ? (
                                    <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#CBB57B] transition-colors mb-2" />
                                      <p className="text-sm font-medium text-gray-600 group-hover:text-[#CBB57B]">
                                        Click to upload
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Recommended: {pc.imageSize} · Max 5MB
                                      </p>
                                    </>
                                  )}
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
                                      setUploading(true);
                                      try {
                                        const fd = new FormData();
                                        fd.append('image', file);
                                        const res = await api.post(
                                          '/upload/image?folder=advertisements',
                                          fd
                                        );
                                        const url = res?.data?.url ?? res?.url;
                                        if (url)
                                          setFormData((prev) => ({ ...prev, imageUrl: url }));
                                        else toast.error('Upload failed — try a smaller image');
                                      } catch {
                                        toast.error(
                                          'Upload failed — try a smaller image (under 5MB)'
                                        );
                                      } finally {
                                        setUploading(false);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Link URL + Text */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
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
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
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
                          </div>
                        </div>

                        {/* Step 3: Schedule */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
                            <div className="w-6 h-6 bg-[#CBB57B] text-white rounded-full flex items-center justify-center text-xs font-bold">
                              3
                            </div>
                            Campaign schedule
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
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
                              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
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
                          {formData.startDate &&
                            formData.endDate &&
                            (() => {
                              const days = Math.max(
                                0,
                                Math.ceil(
                                  (new Date(formData.endDate).getTime() -
                                    new Date(formData.startDate).getTime()) /
                                    86400000
                                )
                              );
                              const overLimit = days > maxAdDurationDays;
                              return (
                                <div className="mt-2 space-y-1">
                                  <p
                                    className={`text-xs flex items-center gap-1.5 ${overLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}
                                  >
                                    <Calendar
                                      className={`w-3.5 h-3.5 ${overLimit ? 'text-red-500' : 'text-gray-400'}`}
                                    />
                                    {days} days · max {maxAdDurationDays} days on your plan
                                  </p>
                                  {overLimit && (
                                    <p className="text-xs text-red-500">
                                      Exceeds your plan limit. Shorten the end date or upgrade your
                                      plan.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                        </div>
                      </div>

                      {/* Right: Preview & Guide */}
                      <div className="lg:col-span-2">
                        <div className="sticky top-24 space-y-4">
                          {/* Live Preview */}
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                                <Eye className="w-3.5 h-3.5 text-[#CBB57B]" />
                                Preview
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {pc.shortLabel}
                              </span>
                            </div>
                            <div className="p-4">
                              {formData.imageUrl ? (
                                <div className="space-y-3">
                                  <div
                                    className={`rounded-xl overflow-hidden border border-gray-100 bg-gray-50 ${isBanner ? 'aspect-[5/1]' : pc.previewAspect} max-h-48`}
                                  >
                                    <img
                                      src={formData.imageUrl}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
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
                                  <span className="block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400 w-fit">
                                    Sponsored
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className={`flex flex-col items-center justify-center text-center ${isBanner ? 'aspect-[5/1]' : 'py-10'}`}
                                >
                                  <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                  <p className="text-xs text-gray-400">
                                    Upload an image to preview
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Image Guide Card */}
                          <div className="bg-gradient-to-br from-[#CBB57B]/5 to-amber-50 border border-[#CBB57B]/20 rounded-xl p-4">
                            <p className="text-xs font-bold text-[#8B7355] mb-3 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" />
                              Image requirements
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-600">Size</span>
                                <span className="text-xs font-bold text-gray-900">
                                  {pc.imageSize}
                                </span>
                              </div>
                              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-600">Ratio</span>
                                <span className="text-xs font-bold text-gray-900">
                                  {pc.aspectRatio}
                                </span>
                              </div>
                              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-600">Format</span>
                                <span className="text-xs font-bold text-gray-900">
                                  JPEG, PNG, WebP
                                </span>
                              </div>
                              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-600">Max size</span>
                                <span className="text-xs font-bold text-gray-900">5 MB</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-[#A89968] mt-3 leading-relaxed">
                              {pc.tip}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-white hover:border-gray-300 transition-all text-sm"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !formData.imageUrl ||
                          !formData.title ||
                          !formData.linkUrl ||
                          !!(
                            formData.startDate &&
                            formData.endDate &&
                            Math.ceil(
                              (new Date(formData.endDate).getTime() -
                                new Date(formData.startDate).getTime()) /
                                86400000
                            ) > maxAdDurationDays
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-[#CBB57B] rounded-xl font-bold text-sm hover:bg-neutral-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#CBB57B]/30"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {editingAd ? t('update') : t('create')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
