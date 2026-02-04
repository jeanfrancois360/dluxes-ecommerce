'use client';

import { useState } from 'react';
import { useMySubscription, useSubscriptionPlans, useCreditBalance } from '@/hooks/use-subscription';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format } from 'date-fns';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellerSubscriptionPage() {
  const { subscription, plan, tier, isActive, isLoading: subLoading } = useMySubscription();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { availableCredits, isLoading: creditsLoading } = useCreditBalance();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const isLoading = subLoading || plansLoading || creditsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="animate-pulse space-y-6">
          {/* Hero Skeleton */}
          <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer" />

          {/* Current Plan Skeleton */}
          <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer" />

          {/* Plans Skeleton */}
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = {
    listings: plan?.maxActiveListings === -1 ? 0 : ((subscription?.activeListingsCount || 0) / (plan?.maxActiveListings || 1)) * 100,
    credits: ((subscription?.creditsUsed || 0) / (subscription?.creditsAllocated || 1)) * 100,
    featured: ((subscription?.featuredSlotsUsed || 0) / (plan?.featuredSlotsPerMonth || 1)) * 100,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#CBB57B]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#CBB57B]/10 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[#CBB57B]/20 rounded-xl">
              <Crown className="w-7 h-7 text-[#CBB57B]" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Feature Plans</h1>
          </div>
          <p className="text-gray-300 text-lg ml-14">Unlock advanced product types and premium features</p>
        </div>
      </div>

      {/* Current Plan Status Card */}
      <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#CBB57B]/5 via-transparent to-blue-500/5" />

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-[#CBB57B]" />
                <h2 className="text-2xl font-bold text-gray-900">Current Plan: {plan?.name || 'Free'}</h2>
              </div>
              <p className="text-gray-600 font-medium">
                {subscription ? (
                  <>
                    Renews on {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                  </>
                ) : (
                  'No active subscription'
                )}
              </p>
            </div>
            <span className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md',
              isActive
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
            )}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Usage Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Active Listings */}
            <div className="relative group">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Active Listings</p>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {subscription?.activeListingsCount || 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  of {plan?.maxActiveListings === -1 ? '∞' : plan?.maxActiveListings}
                </p>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(usagePercentage.listings, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Credits Available */}
            <div className="relative group">
              <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Credits</p>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{availableCredits}</p>
                <p className="text-sm text-gray-600 font-medium">available</p>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                    style={{ width: `${100 - Math.min(usagePercentage.credits, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Featured Slots */}
            <div className="relative group">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-xl border-2 border-amber-100 hover:border-amber-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Featured Slots</p>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {subscription?.featuredSlotsUsed || 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  of {plan?.featuredSlotsPerMonth || 0}
                </p>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(usagePercentage.featured, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Listing Duration */}
            <div className="relative group">
              <div className="p-5 bg-gradient-to-br from-green-50 to-green-50/50 rounded-xl border-2 border-green-100 hover:border-green-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Duration</p>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{plan?.listingDurationDays || 30}</p>
                <p className="text-sm text-gray-600 font-medium">days per listing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 bg-white p-2 rounded-xl shadow-lg border-2 border-gray-200">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={cn(
              'px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300',
              billingCycle === 'MONTHLY'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={cn(
              'px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
              billingCycle === 'YEARLY'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            Yearly
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Plans Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {plans.map((p, index) => {
          const isCurrentPlan = tier === p.tier;
          const isPopular = index === 2; // Third plan is popular
          const price = billingCycle === 'MONTHLY' ? p.monthlyPrice : p.yearlyPrice;
          const savingsPercent = billingCycle === 'YEARLY' ? Math.round((1 - (p.yearlyPrice / 12) / p.monthlyPrice) * 100) : 0;

          return (
            <div
              key={p.tier}
              className={cn(
                'group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden',
                isPopular && 'ring-2 ring-[#CBB57B] scale-105',
                isCurrentPlan && 'bg-gradient-to-br from-blue-50 to-white',
                !isCurrentPlan && 'hover:-translate-y-2'
              )}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-[#CBB57B] to-[#a89158] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                isPopular ? 'bg-gradient-to-br from-[#CBB57B]/5 to-[#CBB57B]/10' : 'bg-gradient-to-br from-gray-50/50 to-transparent'
              )} />

              {/* Content */}
              <div className={cn('relative p-6', isPopular && 'pt-8')}>
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{p.description || `Perfect for ${p.tier.toLowerCase()} sellers`}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">
                      {formatCurrencyAmount(price)}
                    </span>
                    <span className="text-gray-600 font-medium">
                      /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {savingsPercent > 0 && billingCycle === 'YEARLY' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Save {savingsPercent}% yearly
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {p.maxActiveListings === -1 ? 'Unlimited' : p.maxActiveListings} active listings
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 font-medium">{p.monthlyCredits} credits per month</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 font-medium">{p.featuredSlotsPerMonth} featured slots/month</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 font-medium">{p.listingDurationDays} days listing duration</span>
                  </li>
                  {(p.features as string[]).slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={cn(
                    'w-full py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2',
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200'
                      : isPopular
                      ? 'bg-gradient-to-r from-[#CBB57B] to-[#a89158] text-white hover:from-[#a89158] hover:to-[#8a7542]'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  )}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="w-5 h-5" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      Upgrade to {p.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
