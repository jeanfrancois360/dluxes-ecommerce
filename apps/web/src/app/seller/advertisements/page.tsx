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
} from 'lucide-react';

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

  const handleToggle = async (id: string) => {
    try {
      await toggleAd(id);
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
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Advertisements' }]}
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
                        onClick={() => handleToggle(ad.id)}
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editingAd ? t('editAdvertisement') : t('createAdvertisement')}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('formTitle')} {t('required')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('formDescription')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('formImageUrl')} {t('required')}
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder={t('placeholder.imageUrl')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('formLinkUrl')} {t('required')}
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder={t('placeholder.linkUrl')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('formLinkText')}</label>
                  <input
                    type="text"
                    value={formData.linkText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkText: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('placeholder.learnMore')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('formPlacement')} {t('required')}
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, placement: e.target.value as AdPlacement }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {allowedPlacements.map((placement) => (
                      <option key={placement} value={placement}>
                        {placementLabels[placement as AdPlacement] || placement}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('formStartDate')} {t('required')}
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('formEndDate')} {t('required')}
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
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
