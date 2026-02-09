'use client';

import { useState } from 'react';
import {
  useAdminAdPlans,
  useAdminAdStatistics,
  useAdminAdPlanMutations,
} from '@/hooks/use-advertisements';
import { AdvertisementPlan } from '@/lib/api/advertisement-plans';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Check,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/admin/page-header';

export default function AdminAdvertisementPlansPage() {
  const t = useTranslations('adminAdvertisementPlans');
  const { plans, isLoading, error, refresh } = useAdminAdPlans();
  const { statistics } = useAdminAdStatistics();
  const { createPlan, updatePlan, deletePlan } = useAdminAdPlanMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdvertisementPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    maxActiveAds: 1,
    maxImpressions: 1000,
    priorityBoost: 0,
    allowedPlacements: [] as string[],
    price: 0,
    currency: 'USD',
    billingPeriod: 'MONTHLY' as const,
    trialDays: 0,
    isActive: true,
    isFeatured: false,
    displayOrder: 0,
  });

  const allPlacements = [
    'HOMEPAGE_HERO',
    'HOMEPAGE_FEATURED',
    'HOMEPAGE_SIDEBAR',
    'PRODUCTS_BANNER',
    'PRODUCTS_INLINE',
    'PRODUCTS_SIDEBAR',
    'CATEGORY_BANNER',
    'PRODUCT_DETAIL_SIDEBAR',
    'CHECKOUT_UPSELL',
    'SEARCH_RESULTS',
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      maxActiveAds: 1,
      maxImpressions: 1000,
      priorityBoost: 0,
      allowedPlacements: [],
      price: 0,
      currency: 'USD',
      billingPeriod: 'MONTHLY',
      trialDays: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: 0,
    });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (plan: AdvertisementPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      maxActiveAds: plan.maxActiveAds,
      maxImpressions: plan.maxImpressions || 0,
      priorityBoost: plan.priorityBoost,
      allowedPlacements: plan.allowedPlacements || [],
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod as any,
      trialDays: plan.trialDays,
      isActive: plan.isActive,
      isFeatured: plan.isFeatured,
      displayOrder: plan.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.slug, formData);
        toast.success(t('messages.planUpdated'));
      } else {
        await createPlan(formData);
        toast.success(t('messages.planCreated'));
      }
      setShowModal(false);
      resetForm();
      refresh();
    } catch (error: any) {
      toast.error(error.message || t('messages.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(t('messages.deleteConfirm'))) return;

    try {
      await deletePlan(slug);
      toast.success(t('messages.planDeleted'));
      refresh();
    } catch (error: any) {
      toast.error(error.message || t('messages.deleteFailed'));
    }
  };

  const togglePlacement = (placement: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedPlacements: prev.allowedPlacements.includes(placement)
        ? prev.allowedPlacements.filter((p) => p !== placement)
        : [...prev.allowedPlacements, placement],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{t('error')}</div>;
  }

  return (
    <>
      <PageHeader title={t('header.title')} description={t('header.subtitle')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('header.createButton')}
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('statistics.totalPlans')}</p>
                  <p className="text-xl font-semibold">{statistics.totalPlans}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('statistics.activeSubscriptions')}</p>
                  <p className="text-xl font-semibold">{statistics.activeSubscriptions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('statistics.totalRevenue')}</p>
                  <p className="text-xl font-semibold">
                    ${formatCurrencyAmount(statistics.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('statistics.impressionsServed')}</p>
                  <p className="text-xl font-semibold">
                    {statistics.impressionsServed?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg border-2 p-5 relative ${
                plan.isFeatured ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                  {t('plan.featured')}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {plan.isActive ? t('plan.active') : t('plan.inactive')}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">
                  /{plan.billingPeriod === 'MONTHLY' ? t('plan.perMonth') : t('plan.perYear')}
                </span>
              </div>

              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.maxActiveAds === -1 ? t('plan.unlimited') : plan.maxActiveAds}{' '}
                  {t('plan.activeAds')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.maxImpressions
                    ? plan.maxImpressions.toLocaleString()
                    : t('plan.unlimited')}{' '}
                  {t('plan.impressions')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('plan.priorityBoost', { boost: plan.priorityBoost })}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {t('plan.placements', { count: plan.allowedPlacements?.length || 0 })}
                </li>
                {plan.trialDays > 0 && (
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {t('plan.dayTrial', { days: plan.trialDays })}
                  </li>
                )}
              </ul>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  {t('plan.editButton')}
                </button>
                <button
                  onClick={() => handleDelete(plan.slug)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">{t('empty.message')}</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {t('empty.createButton')}
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editingPlan ? t('modal.editTitle') : t('modal.createTitle')}
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
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('form.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('form.slug')}</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!!editingPlan}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('form.price')}</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('form.currency')}</label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, currency: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('form.billingPeriod')}
                    </label>
                    <select
                      value={formData.billingPeriod}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, billingPeriod: e.target.value as any }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="MONTHLY">{t('form.billingMonthly')}</option>
                      <option value="YEARLY">{t('form.billingYearly')}</option>
                    </select>
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('form.maxActiveAds')}
                    </label>
                    <input
                      type="number"
                      value={formData.maxActiveAds}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxActiveAds: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('form.maxActiveAdsHelp')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('form.maxImpressions')}
                    </label>
                    <input
                      type="number"
                      value={formData.maxImpressions}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxImpressions: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('form.maxImpressionsHelp')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('form.priorityBoost')}
                    </label>
                    <input
                      type="number"
                      value={formData.priorityBoost}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, priorityBoost: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                {/* Trial & Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('form.trialDays')}</label>
                    <input
                      type="number"
                      value={formData.trialDays}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, trialDays: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('form.displayOrder')}
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                    />
                  </div>
                </div>

                {/* Allowed Placements */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('form.allowedPlacements')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allPlacements.map((placement) => (
                      <label
                        key={placement}
                        className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowedPlacements.includes(placement)}
                          onChange={() => togglePlacement(placement)}
                          className="rounded text-blue-500"
                        />
                        <span className="text-sm">{t(`placements.${placement}` as any)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm font-medium">{t('form.isActive')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                      }
                      className="rounded text-blue-500"
                    />
                    <span className="text-sm font-medium">{t('form.isFeatured')}</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {t('form.cancelButton')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingPlan ? t('form.updateButton') : t('form.createButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
