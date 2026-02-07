'use client';

import { useState } from 'react';
import {
  useAdvertisementPlans,
  useMyAdSubscription,
  useAdPlanSubscriptionMutations,
} from '@/hooks/use-advertisements';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/seller/page-header';

export default function SellerAdvertisementPlansPage() {
  const t = useTranslations('sellerAdPlans');
  const { plans, isLoading: plansLoading } = useAdvertisementPlans();
  const {
    subscription,
    plan: currentPlan,
    isActive,
    isLoading: subLoading,
    refresh: refreshSubscription,
  } = useMyAdSubscription();
  const { subscribe, cancel } = useAdPlanSubscriptionMutations();

  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleSubscribe = async (planSlug: string) => {
    try {
      setSubscribing(planSlug);
      await subscribe(planSlug, billingPeriod);
      toast.success(t('toast.subscribeSuccess'));
      await refreshSubscription();
    } catch (error: any) {
      console.error('Subscribe error:', error);
      toast.error(error?.response?.data?.message || t('toast.subscribeError'));
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);
      await cancel(subscription.id);
      toast.success(t('toast.cancelSuccess'));
      await refreshSubscription();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error?.response?.data?.message || t('toast.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  const activePlans = plans.filter((p) => p.isActive);
  const featuredPlans = activePlans.filter((p) => p.isFeatured);
  const regularPlans = activePlans.filter((p) => !p.isFeatured);
  const sortedPlans = [...featuredPlans, ...regularPlans].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      TRIAL: 'bg-[#CBB57B]/10 text-[#A89968]',
      PAST_DUE: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
      EXPIRED: 'bg-gray-100 text-gray-600',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPlanPrice = (plan: any) => {
    if (billingPeriod === 'YEARLY') {
      const yearlyDiscount = 0.2; // 20% discount for yearly
      const monthlyEquivalent = (plan.price * 12 * (1 - yearlyDiscount)) / 12;
      return monthlyEquivalent;
    }
    return plan.price;
  };

  const getTotalYearlyPrice = (plan: any) => {
    const yearlyDiscount = 0.2;
    return plan.price * 12 * (1 - yearlyDiscount);
  };

  if (plansLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Advertisement Plans' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription Status */}
        {subscription && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('currentSubscription.title')}
                  </h2>
                  {getStatusBadge(subscription.status)}
                  {currentPlan?.isFeatured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {t('currentSubscription.featured')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('currentSubscription.plan')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentPlan?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('currentSubscription.activeAds')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {subscription.adsCreated} /{' '}
                      {currentPlan?.maxActiveAds === -1 ? '∞' : currentPlan?.maxActiveAds}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {t('currentSubscription.impressionsUsed')}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {subscription.impressionsUsed.toLocaleString()} /{' '}
                      {currentPlan?.maxImpressions
                        ? currentPlan.maxImpressions.toLocaleString()
                        : '∞'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('currentSubscription.periodEnds')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {subscription.status === 'TRIAL' && (
                  <div className="bg-[#CBB57B]/10 border border-[#CBB57B]/30 rounded-lg p-4">
                    <p className="text-sm text-[#A89968]">
                      {t('currentSubscription.trialMessage', {
                        date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                )}

                {subscription.status === 'PAST_DUE' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      {t('currentSubscription.pastDueMessage')}
                    </p>
                  </div>
                )}

                {subscription.cancelledAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      {t('currentSubscription.cancelledMessage', {
                        date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                )}
              </div>

              {subscription.status === 'ACTIVE' &&
                subscription.autoRenew &&
                !subscription.cancelledAt && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {t('currentSubscription.cancelButton')}
                  </button>
                )}
            </div>
          </div>
        )}

        {/* Billing Period Toggle */}
        {!isActive && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-[#CBB57B] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('billingPeriod.monthly')}
              </button>
              <button
                onClick={() => setBillingPeriod('YEARLY')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'YEARLY'
                    ? 'bg-[#CBB57B] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('billingPeriod.yearly')}
                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {t('billingPeriod.save')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const price = getPlanPrice(plan);
            const yearlyTotal = getTotalYearlyPrice(plan);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  plan.isFeatured
                    ? 'border-purple-500 shadow-lg scale-105'
                    : isCurrentPlan
                      ? 'border-blue-500'
                      : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  {/* Plan Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      {plan.isFeatured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {t('planCard.popular')}
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCurrency(price, plan.currency)}
                      </span>
                      <span className="ml-2 text-gray-600">{t('planCard.perMonth')}</span>
                    </div>
                    {billingPeriod === 'YEARLY' && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t('planCard.billedAnnually', {
                          amount: formatCurrency(yearlyTotal, plan.currency),
                        })}
                      </p>
                    )}
                    {plan.trialDays > 0 && !isActive && (
                      <p className="mt-2 text-sm text-green-600 font-medium">
                        {t('planCard.freeTrialDays', { days: plan.trialDays })}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        <strong>
                          {plan.maxActiveAds === -1 ? t('planCard.unlimited') : plan.maxActiveAds}
                        </strong>{' '}
                        {plan.maxActiveAds === 1 ? t('planCard.activeAd') : t('planCard.activeAds')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        <strong>
                          {plan.maxImpressions
                            ? plan.maxImpressions.toLocaleString()
                            : t('planCard.unlimited')}
                        </strong>{' '}
                        {t('planCard.impressionsMonth')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        <strong>{plan.priorityBoost}x</strong> {t('planCard.priorityBoost')}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        <strong>{plan.allowedPlacements.length}</strong>{' '}
                        {plan.allowedPlacements.length === 1
                          ? t('planCard.placementLocation')
                          : t('planCard.placementLocations')}
                      </span>
                    </li>
                    {plan.allowedPlacements.length <= 3 && (
                      <li className="ml-7 mt-1">
                        <ul className="space-y-1 text-xs text-gray-600">
                          {plan.allowedPlacements.map((placement) => (
                            <li key={placement}>• {placement.replace(/_/g, ' ').toLowerCase()}</li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      {t('planCard.currentPlan')}
                    </button>
                  ) : isActive ? (
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      {t('planCard.alreadySubscribed')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={subscribing === plan.slug}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        plan.isFeatured
                          ? 'bg-[#CBB57B] hover:bg-[#A89968] text-white'
                          : 'bg-black hover:bg-neutral-900 text-[#CBB57B] border border-[#CBB57B]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {subscribing === plan.slug
                        ? t('planCard.subscribing')
                        : plan.trialDays > 0
                          ? t('planCard.startFreeTrial')
                          : t('planCard.subscribeNow')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedPlans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('empty.message')}</p>
          </div>
        )}

        {/* Feature Comparison */}
        {sortedPlans.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('comparison.title')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      {t('comparison.feature')}
                    </th>
                    {sortedPlans.map((plan) => (
                      <th
                        key={plan.id}
                        className="text-center py-3 px-4 font-semibold text-gray-900"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-700">{t('comparison.activeAds')}</td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900">
                        {plan.maxActiveAds === -1 ? t('comparison.unlimited') : plan.maxActiveAds}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {t('comparison.monthlyImpressions')}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900">
                        {plan.maxImpressions
                          ? plan.maxImpressions.toLocaleString()
                          : t('comparison.unlimited')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {t('comparison.priorityBoost')}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900">
                        {plan.priorityBoost}x
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {t('comparison.placementLocations')}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900">
                        {plan.allowedPlacements.length}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-700">{t('comparison.freeTrial')}</td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-900">
                        {plan.trialDays > 0 ? t('comparison.days', { days: plan.trialDays }) : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('cancelModal.title')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('cancelModal.message', {
                planName: currentPlan?.name || 'your plan',
                date: subscription
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : 'N/A',
              })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                {t('cancelModal.keepButton')}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {cancelling ? t('cancelModal.cancelling') : t('cancelModal.cancelButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
