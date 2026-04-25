'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import useSWR from 'swr';
import { subscriptionApi } from '@/lib/api/subscription';
import { formatInteger } from '@/lib/utils/number-format';
import { formatDate } from '@/lib/utils/date-format';
import Link from 'next/link';

interface CreditSummaryData {
  storeCredits: {
    balance: number;
    expiresAt: Date | null;
    graceEndsAt: Date | null;
    inGracePeriod: boolean;
    canListPhysical: boolean;
  };
  subscriptionCredits: {
    allocated: number;
    used: number;
    remaining: number;
    resetDate: Date;
    planName: string;
    planTier: string;
    allowedTypes: string[];
    canListService: boolean;
    canListRealEstate: boolean;
    canListVehicle: boolean;
    canListRental: boolean;
  };
  subscription: {
    status: string;
    planName: string;
    nextBillingDate: Date | null;
    cancelAtPeriodEnd: boolean;
  };
}

export default function CreditSummary() {
  const { data, error, isLoading } = useSWR<CreditSummaryData>(
    '/subscription/seller/credit-summary',
    subscriptionApi.getSellerCreditSummary,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  // Calculate days remaining in grace period
  const getDaysInGrace = () => {
    if (!data?.storeCredits.graceEndsAt) return 0;
    const now = new Date();
    const graceEnd = new Date(data.storeCredits.graceEndsAt);
    const diffTime = graceEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Calculate progress percentage for store credits
  const getStoreCreditsProgress = () => {
    if (!data?.storeCredits.balance) return 0;
    // Assume purchased credits is stored somewhere, for now use a simple calculation
    return Math.min(100, (data.storeCredits.balance / 100) * 100);
  };

  // Calculate progress percentage for subscription credits
  const getSubscriptionCreditsProgress = () => {
    if (!data?.subscriptionCredits.allocated) return 0;
    return (data.subscriptionCredits.used / data.subscriptionCredits.allocated) * 100;
  };

  // Get status badge for store credits
  const getStoreStatus = () => {
    if (!data) return { text: 'Unknown', color: 'text-neutral-600 bg-neutral-100' };

    if (data.storeCredits.inGracePeriod) {
      return { text: 'Grace Period', color: 'text-orange-700 bg-orange-100' };
    }

    if (data.storeCredits.balance === 0) {
      return { text: 'Expired', color: 'text-red-700 bg-red-100' };
    }

    return { text: 'Active', color: 'text-green-700 bg-green-100' };
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Credits Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-neutral-200 rounded w-32"></div>
                <div className="h-8 bg-neutral-200 rounded w-24"></div>
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-10 bg-neutral-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Credits Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Failed to load credit information</p>
            <p className="text-sm text-red-700 mt-1">
              {error?.message || 'Please try refreshing the page'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const storeStatus = getStoreStatus();
  const daysInGrace = getDaysInGrace();

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Credits Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Store Credits (Physical Products) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-[#CBB57B]/30 transition-all duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">Store Credits</h3>
              <p className="text-sm text-neutral-600">For Physical Products</p>
            </div>
            <div className="p-2 bg-black/5 rounded-lg border border-[#CBB57B]/20">
              <Coins className="w-6 h-6 text-[#CBB57B]" />
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900">
                {formatInteger(data.storeCredits.balance)}
              </span>
              <span className="text-lg text-neutral-600">credits</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${storeStatus.color}`}
            >
              {storeStatus.text === 'Active' && <CheckCircle className="w-4 h-4" />}
              {storeStatus.text === 'Grace Period' && <Clock className="w-4 h-4" />}
              {storeStatus.text === 'Expired' && <AlertCircle className="w-4 h-4" />}
              {storeStatus.text}
            </span>
          </div>

          {/* Grace Period Warning */}
          {data.storeCredits.inGracePeriod && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-900 font-medium">
                {daysInGrace} {daysInGrace === 1 ? 'day' : 'days'} remaining in grace period
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Purchase more credits to continue listing physical products
              </p>
            </div>
          )}

          {/* Expiry Information */}
          {data.storeCredits.expiresAt && (
            <div className="mb-4">
              <p className="text-sm text-neutral-600">
                Expires:{' '}
                <span className="font-medium text-neutral-900">
                  {formatDate(data.storeCredits.expiresAt)}
                </span>
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>Credit Balance</span>
              <span>{formatInteger(data.storeCredits.balance)} available</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div
                className="bg-[#CBB57B] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, getStoreCreditsProgress())}%` }}
              ></div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href="/seller/selling-credits"
            className="block w-full text-center px-4 py-2.5 bg-black text-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all duration-200 border border-[#CBB57B] font-medium"
          >
            Buy More Credits
          </Link>
        </motion.div>

        {/* Card 2: Subscription Credits (Inquiry Products) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-[#CBB57B]/30 transition-all duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">Listing Credits</h3>
              <p className="text-sm text-neutral-600">For Services, Real Estate, Vehicles</p>
            </div>
            <div className="p-2 bg-black/5 rounded-lg border border-[#CBB57B]/20">
              <CreditCard className="w-6 h-6 text-[#CBB57B]" />
            </div>
          </div>

          {/* Credits Used/Allocated */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900">
                {formatInteger(data.subscriptionCredits.remaining)}
              </span>
              <span className="text-lg text-neutral-600">
                / {formatInteger(data.subscriptionCredits.allocated)}
              </span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">credits remaining</p>
          </div>

          {/* Plan Info */}
          <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">Current Plan:</span>
              <span className="text-sm font-semibold text-neutral-900">
                {data.subscription.planName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Resets:</span>
              <span className="text-sm font-medium text-neutral-900">
                {new Date(data.subscriptionCredits.resetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Allowed Types Badges */}
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">Allowed Product Types:</p>
            <div className="flex flex-wrap gap-2">
              {data.subscriptionCredits.allowedTypes.map((type) => (
                <span
                  key={type}
                  className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>Credits Used</span>
              <span>
                {formatInteger(data.subscriptionCredits.used)} /{' '}
                {formatInteger(data.subscriptionCredits.allocated)}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, getSubscriptionCreditsProgress())}%` }}
              ></div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href="/seller/subscription"
            className="block w-full text-center px-4 py-2.5 bg-black text-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all duration-200 border border-[#CBB57B] font-medium"
          >
            Upgrade Plan
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
