'use client';

import { useTranslations } from 'next-intl';
import { useMySubscription, useCreditBalance } from '@/hooks/use-subscription';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format } from 'date-fns';
import { Crown, Zap, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import PageHeader from '@/components/seller/page-header';

export default function SellerSubscriptionPage() {
  const t = useTranslations('sellerSubscription');
  const { subscription, plan, tier, isActive, isLoading: subLoading } = useMySubscription();
  const { availableCredits, isLoading: creditsLoading } = useCreditBalance();

  const isLoading = subLoading || creditsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const usagePercentage = {
    listings:
      plan?.maxActiveListings === -1
        ? 0
        : ((subscription?.activeListingsCount || 0) / (plan?.maxActiveListings || 1)) * 100,
    credits: ((subscription?.creditsUsed || 0) / (subscription?.creditsAllocated || 1)) * 100,
    featured: ((subscription?.featuredSlotsUsed || 0) / (plan?.featuredSlotsPerMonth || 1)) * 100,
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.subscription') },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#CBB57B]/20 rounded-xl">
                  <Crown className="w-8 h-8 text-[#CBB57B]" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{t('currentPlan')}</p>
                  <h2 className="text-2xl font-bold">{plan?.name || 'Free'}</h2>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
                  isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                )}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-400'}`}
                />
                {isActive ? t('status.active') : t('status.inactive')}
              </span>
            </div>
            {subscription && (
              <p className="text-gray-400 text-sm mt-4">
                {t('renewsOn')} {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Usage Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Active Listings */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase">
                    {t('usage.listings')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription?.activeListingsCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {t('usage.of')}{' '}
                  {plan?.maxActiveListings === -1 ? t('usage.unlimited') : plan?.maxActiveListings}
                </p>
                <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(usagePercentage.listings, 100)}%` }}
                  />
                </div>
              </div>

              {/* Credits */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-purple-700 uppercase">
                    {t('usage.credits')}
                  </p>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{availableCredits}</p>
                <p className="text-sm text-gray-600">{t('usage.available')}</p>
                <div className="mt-2 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${100 - Math.min(usagePercentage.credits, 100)}%` }}
                  />
                </div>
              </div>

              {/* Featured Slots */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-700 uppercase">
                    {t('usage.featured')}
                  </p>
                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription?.featuredSlotsUsed || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {t('usage.of')} {plan?.featuredSlotsPerMonth || 0}
                </p>
                <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(usagePercentage.featured, 100)}%` }}
                  />
                </div>
              </div>

              {/* Listing Duration */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-green-700 uppercase">
                    {t('usage.duration')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {plan?.listingDurationDays || 30}
                </p>
                <p className="text-sm text-gray-600">{t('usage.daysPerListing')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/seller/subscription/plans"
            className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-[#CBB57B] hover:shadow-lg transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#CBB57B] transition-colors">
                {tier === 'FREE' ? t('actions.upgradePlan') : t('actions.changePlan')}
              </h3>
              <p className="text-sm text-gray-500">{t('actions.viewPlans')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#CBB57B] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/seller/selling-credits"
            className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-[#CBB57B] hover:shadow-lg transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#CBB57B] transition-colors">
                {t('actions.buyCredits')}
              </h3>
              <p className="text-sm text-gray-500">{t('actions.purchaseCredits')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#CBB57B] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
