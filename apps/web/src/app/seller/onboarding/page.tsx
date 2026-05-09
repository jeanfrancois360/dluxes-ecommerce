'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Calendar,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/seller/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return data.data || data;
};

type StepStatus = 'done' | 'active' | 'waiting' | 'locked' | 'blocked';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const t = useTranslations('sellerOnboarding');

  const {
    data: dashboardData,
    error,
    isLoading,
  } = useSWR(`${API_URL}/seller/dashboard`, fetcher, {
    refreshInterval: 10000,
    shouldRetryOnError: false,
  });

  const { data: creditsData } = useSWR(`${API_URL}/seller/credits`, fetcher, {
    refreshInterval: 10000,
    shouldRetryOnError: false,
  });

  const { data: appStatus } = useSWR(`${API_URL}/seller/application-status`, fetcher, {
    refreshInterval: 15000,
    shouldRetryOnError: false,
  });

  // Payout settings — tells us if step 2 is complete
  const { data: payoutData } = useSWR(`${API_URL}/seller/payout-settings`, fetcher, {
    shouldRetryOnError: false,
    onErrorRetry: () => {}, // don't retry on auth errors
  });

  const store = dashboardData?.store;
  const credits = creditsData;
  const products = dashboardData?.products;
  const kycComplete = appStatus?.kycComplete !== false;
  // hasPayout = settings exist (id is non-null) and a method is configured
  const hasPayout = !!(payoutData && payoutData.id !== null && payoutData.paymentMethod);

  // Each step resolves its own status independently — no linear currentStep
  const getStatus = (id: number): StepStatus => {
    if (!store) return 'locked';
    switch (id) {
      case 1:
        if (store.status === 'REJECTED') return 'blocked';
        if (store.status === 'PENDING' && !kycComplete) return 'active';
        if (store.status === 'PENDING') return 'waiting';
        return 'done';
      case 2:
        return hasPayout ? 'done' : 'active';
      case 3:
        if (store.status === 'REJECTED') return 'blocked';
        return store.status === 'ACTIVE' ? 'done' : 'waiting';
      case 4:
        if (store.status !== 'ACTIVE') return 'locked';
        return (credits?.creditsBalance ?? 0) > 0 ? 'done' : 'active';
      case 5:
        if (store.status !== 'ACTIVE') return 'locked';
        if (!((credits?.creditsBalance ?? 0) > 0)) return 'locked';
        return (products?.total ?? 0) > 0 ? 'done' : 'active';
      default:
        return 'locked';
    }
  };

  const doneCount = [1, 2, 3, 4, 5].filter((id) => getStatus(id) === 'done').length;
  const progress = Math.round((doneCount / 5) * 100);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('errorTitle')}</h2>
          <p className="text-neutral-600 mb-6">{t('errorMessage')}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
          >
            {t('goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.onboarding') },
        ]}
      />

      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium text-neutral-600">
              {doneCount} of 5 steps complete
            </span>
            <span className="text-sm font-bold text-neutral-900">{progress}%</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-black rounded-full"
            />
          </div>
        </motion.div>

        {/* Step timeline */}
        <div>
          {/* Step 1 — Application */}
          <Step
            id={1}
            status={getStatus(1)}
            title="Application Submitted"
            description="Submit your seller details for review"
            index={0}
            isLast={false}
          >
            {getStatus(1) === 'active' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Application incomplete</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Complete your business details and verification documents.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/become-seller')}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Complete <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {getStatus(1) === 'waiting' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Under Review</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Being reviewed by our team. Expected: 24–48 hours.
                  </p>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Applied {fmt(store.createdAt)}
                  </p>
                </div>
              </div>
            )}
            {getStatus(1) === 'done' && (
              <p className="mt-2 text-sm text-neutral-500">Submitted {fmt(store.createdAt)}</p>
            )}
            {getStatus(1) === 'blocked' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Application Rejected</p>
                  <p className="text-sm text-red-700 mt-0.5">Update your details and resubmit.</p>
                </div>
                <button
                  onClick={() => router.push('/become-seller')}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Resubmit <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Step>

          {/* Step 2 — Payout */}
          <Step
            id={2}
            status={getStatus(2)}
            title="Set Up Payout Details"
            description="Add your bank account to receive earnings"
            index={1}
            isLast={false}
          >
            {getStatus(2) === 'active' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-neutral-600">
                  Do this now while you wait for approval — no payout fires until your store goes
                  live.
                </p>
                <button
                  onClick={() => router.push('/seller/payout-settings')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Set Up Payouts <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {getStatus(2) === 'done' && (
              <p className="mt-2 text-sm text-neutral-500">
                <span className="capitalize">{payoutData?.paymentMethod?.replace('_', ' ')}</span>{' '}
                configured &middot;{' '}
                <button
                  onClick={() => router.push('/seller/payout-settings')}
                  className="text-xs underline hover:text-neutral-700"
                >
                  Edit
                </button>
              </p>
            )}
          </Step>

          {/* Step 3 — Approval */}
          <Step
            id={3}
            status={getStatus(3)}
            title="Account Approved"
            description="Our team reviews and approves your store"
            index={2}
            isLast={false}
          >
            {getStatus(3) === 'waiting' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Awaiting Approval</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Typically 24–48 hours. You&apos;ll receive an email once a decision is made.
                  </p>
                </div>
              </div>
            )}
            {getStatus(3) === 'done' && (
              <p className="mt-2 text-sm text-neutral-500">
                Approved {store.verifiedAt ? fmt(store.verifiedAt) : 'recently'} — your store is
                live.
              </p>
            )}
            {getStatus(3) === 'blocked' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-semibold text-red-900">Not approved</p>
                <p className="text-sm text-red-700 mt-0.5">
                  Complete your application to be reconsidered.
                </p>
              </div>
            )}
          </Step>

          {/* Step 4 — Credits */}
          <Step
            id={4}
            status={getStatus(4)}
            title="Purchase Credits"
            description="Buy credits to activate your product listings"
            index={3}
            isLast={false}
          >
            {getStatus(4) === 'active' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-neutral-600">
                  Credits activate your listings. $29.99/month — cancel anytime.
                </p>
                <button
                  onClick={() => router.push('/seller/selling-credits')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Purchase Credits <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {getStatus(4) === 'done' && (
              <p className="mt-2 text-sm text-neutral-500">
                {credits?.creditsBalance} month{credits?.creditsBalance !== 1 ? 's' : ''} active
                &middot;{' '}
                <button
                  onClick={() => router.push('/seller/selling-credits')}
                  className="text-xs underline hover:text-neutral-700"
                >
                  View details
                </button>
              </p>
            )}
            {getStatus(4) === 'locked' && (
              <p className="mt-2 text-sm text-neutral-400">
                Available after your store is approved
              </p>
            )}
          </Step>

          {/* Step 5 — Products */}
          <Step
            id={5}
            status={getStatus(5)}
            title="Create Products"
            description="List your first product and start selling"
            index={4}
            isLast={true}
          >
            {getStatus(5) === 'active' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-neutral-600">
                  Add images, descriptions, pricing, and inventory to go live.
                </p>
                <button
                  onClick={() => router.push('/seller/products/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Create First Product <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {getStatus(5) === 'done' && (
              <p className="mt-2 text-sm text-neutral-500">
                {products?.total} product{products?.total !== 1 ? 's' : ''} ({products?.active}{' '}
                active) &middot;{' '}
                <button
                  onClick={() => router.push('/seller/products')}
                  className="text-xs underline hover:text-neutral-700"
                >
                  Manage
                </button>
              </p>
            )}
            {getStatus(5) === 'locked' && (
              <p className="mt-2 text-sm text-neutral-400">
                {store.status !== 'ACTIVE'
                  ? 'Available after your store is approved'
                  : 'Purchase credits first to list products'}
              </p>
            )}
          </Step>
        </div>

        {/* All-done banner */}
        {doneCount === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 p-8 bg-black text-white rounded-2xl text-center"
          >
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your store is live. Manage products, track orders, and grow your business.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => router.push('/seller/products')}
                className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-neutral-100 transition-colors text-sm"
              >
                View Products
              </button>
              <button
                onClick={() => router.push('/seller')}
                className="px-5 py-2.5 bg-neutral-800 text-white rounded-lg font-semibold hover:bg-neutral-700 transition-colors text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step sub-component
// ---------------------------------------------------------------------------

interface StepProps {
  id: number;
  status: StepStatus;
  title: string;
  description: string;
  index: number;
  isLast: boolean;
  children?: ReactNode;
}

function Step({ id, status, title, description, index, isLast, children }: StepProps) {
  const done = status === 'done';
  const active = status === 'active';
  const waiting = status === 'waiting';
  const locked = status === 'locked';
  const blocked = status === 'blocked';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.06 }}
      className="flex gap-4"
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0 z-10
            ${done ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
            ${active ? 'bg-black border-black text-white' : ''}
            ${waiting ? 'bg-amber-50 border-amber-400 text-amber-600' : ''}
            ${locked ? 'bg-neutral-100 border-neutral-300 text-neutral-400' : ''}
            ${blocked ? 'bg-red-50 border-red-400 text-red-500' : ''}
          `}
        >
          {done && <CheckCircle className="w-5 h-5" />}
          {blocked && <AlertCircle className="w-5 h-5" />}
          {locked && <Lock className="w-4 h-4" />}
          {waiting && <Clock className="w-4 h-4" />}
          {active && <span>{id}</span>}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 mt-1 ${done ? 'bg-emerald-300' : 'bg-neutral-200'}`}
            style={{ minHeight: '1.5rem' }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`
          flex-1 mb-5 p-5 rounded-2xl border bg-white transition-all duration-200
          ${done ? 'border-emerald-200' : ''}
          ${active ? 'border-black shadow-[0_0_0_1px_rgba(0,0,0,1)]' : ''}
          ${waiting ? 'border-neutral-200' : ''}
          ${locked ? 'border-neutral-200 opacity-50' : ''}
          ${blocked ? 'border-red-200' : ''}
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`font-bold text-base leading-tight ${locked ? 'text-neutral-400' : 'text-neutral-900'}`}
            >
              {title}
            </h3>
            <p className={`text-sm mt-0.5 ${locked ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {description}
            </p>
          </div>

          {/* Status badge */}
          <span
            className={`
              flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
              ${done ? 'bg-emerald-100 text-emerald-700' : ''}
              ${active ? 'bg-black text-white' : ''}
              ${waiting ? 'bg-amber-100 text-amber-700' : ''}
              ${locked ? 'bg-neutral-100 text-neutral-400' : ''}
              ${blocked ? 'bg-red-100 text-red-700' : ''}
            `}
          >
            {done && (
              <>
                <CheckCircle className="w-3 h-3" /> Done
              </>
            )}
            {active && (
              <>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Action needed
              </>
            )}
            {waiting && (
              <>
                <Clock className="w-3 h-3" /> In progress
              </>
            )}
            {locked && (
              <>
                <Lock className="w-3 h-3" /> Locked
              </>
            )}
            {blocked && (
              <>
                <AlertCircle className="w-3 h-3" /> Action required
              </>
            )}
          </span>
        </div>

        {children}
      </div>
    </motion.div>
  );
}
