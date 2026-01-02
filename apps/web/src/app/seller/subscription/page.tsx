'use client';

import { useState } from 'react';
import { useMySubscription, useSubscriptionPlans, useCreditBalance } from '@/hooks/use-subscription';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format } from 'date-fns';
import { Check, Crown, Zap, Star, CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellerSubscriptionPage() {
  const { subscription, plan, tier, isActive, isLoading: subLoading } = useMySubscription();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { availableCredits, isLoading: creditsLoading } = useCreditBalance();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const isLoading = subLoading || plansLoading || creditsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-gray-600">Manage your subscription plan and credits</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Current Plan: {plan?.name || 'Free'}
            </h2>
            <p className="text-sm text-gray-500">
              {subscription ? `Renews ${format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}` : 'No active subscription'}
            </p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          )}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Active Listings</p>
            <p className="text-2xl font-bold">
              {subscription?.activeListingsCount || 0}
              <span className="text-sm font-normal text-gray-400">
                / {plan?.maxActiveListings === -1 ? '∞' : plan?.maxActiveListings}
              </span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Credits Available</p>
            <p className="text-2xl font-bold">{availableCredits}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Featured Slots</p>
            <p className="text-2xl font-bold">
              {subscription?.featuredSlotsUsed || 0}
              <span className="text-sm font-normal text-gray-400">
                / {plan?.featuredSlotsPerMonth || 0}
              </span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Listing Duration</p>
            <p className="text-2xl font-bold">{plan?.listingDurationDays || 30} days</p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              billingCycle === 'MONTHLY' ? 'bg-white shadow' : 'text-gray-600'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              billingCycle === 'YEARLY' ? 'bg-white shadow' : 'text-gray-600'
            )}
          >
            Yearly <span className="text-green-600 text-xs">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div
            key={p.tier}
            className={cn(
              'bg-white rounded-lg border p-6 relative',
              p.isPopular && 'border-blue-500 ring-2 ring-blue-500',
              tier === p.tier && 'bg-blue-50'
            )}
          >
            {p.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">{p.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{p.description}</p>

            <div className="mb-4">
              <span className="text-3xl font-bold">
                ${formatCurrencyAmount(billingCycle === 'MONTHLY' ? p.monthlyPrice : p.yearlyPrice)}
              </span>
              <span className="text-gray-500">/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
            </div>

            <ul className="space-y-2 mb-6">
              {(p.features as string[]).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={cn(
                'w-full py-2 rounded-lg font-medium transition-colors',
                tier === p.tier
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
              disabled={tier === p.tier}
            >
              {tier === p.tier ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
