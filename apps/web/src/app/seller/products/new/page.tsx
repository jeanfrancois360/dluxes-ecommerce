'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Lock,
  AlertCircle,
  Crown,
  Package,
  Loader2,
  X,
  ArrowRight,
  CreditCard,
  CheckCircle,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';
import { api, APIError } from '@/lib/api/client';
import { useMySubscription, useCanListProductType } from '@/hooks/use-subscription';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/utils/toast';

// Error modal state type
interface ErrorModalState {
  isOpen: boolean;
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

// Parse API error into user-friendly format
function parseProductError(
  error: any,
  t: any
): {
  title: string;
  message: string;
  action?: { label: string; href: string };
} {
  // Check if it's a structured error from our backend
  const errorData = error?.data || error;

  if (errorData?.userMessage) {
    return {
      title: getErrorTitle(errorData.code, t),
      message: errorData.userMessage,
      action: errorData.actionUrl
        ? {
            label: getActionLabel(errorData.action, t),
            href: errorData.actionUrl,
          }
        : undefined,
    };
  }

  // Fallback: parse the error message string
  const errorMessage = error?.message || error?.toString() || t('errors.messages.unexpectedError');

  // Check for common error patterns
  if (errorMessage.includes('subscription') || errorMessage.includes('credits')) {
    return {
      title: t('errors.titles.subscriptionRequired'),
      message: t('errors.messages.needSubscription'),
      action: { label: t('errors.actions.getSubscription'), href: '/seller/selling-credits' },
    };
  }

  if (
    errorMessage.includes('plan') &&
    (errorMessage.includes('VEHICLE') ||
      errorMessage.includes('REAL_ESTATE') ||
      errorMessage.includes('SERVICE') ||
      errorMessage.includes('RENTAL'))
  ) {
    return {
      title: t('errors.titles.planUpgradeRequired'),
      message: t('errors.messages.planDoesntSupport'),
      action: { label: t('errors.actions.viewPlans'), href: '/seller/subscription/plans' },
    };
  }

  if (errorMessage.includes('listing') && errorMessage.includes('limit')) {
    return {
      title: t('errors.titles.limitReached'),
      message: t('errors.messages.reachedLimit'),
      action: { label: t('errors.actions.upgradePlan'), href: '/seller/subscription/plans' },
    };
  }

  if (
    errorMessage.includes('store') &&
    (errorMessage.includes('approved') || errorMessage.includes('ACTIVE'))
  ) {
    return {
      title: t('errors.titles.storeNotActive'),
      message: t('errors.messages.storeNotApproved'),
      action: { label: t('errors.actions.viewStoreStatus'), href: '/seller/dashboard' },
    };
  }

  // Default error
  return {
    title: t('errors.titles.createFailed'),
    message: errorMessage.length > 200 ? t('errors.messages.genericError') : errorMessage,
  };
}

function getErrorTitle(code: string, t: any): string {
  const titles: Record<string, string> = {
    NO_SUBSCRIPTION: t('errors.titles.subscriptionRequired'),
    PRODUCT_TYPE_NOT_ALLOWED: t('errors.titles.typeNotAvailable'),
    TIER_UPGRADE_REQUIRED: t('errors.titles.upgradeRequired'),
    LISTING_LIMIT_REACHED: t('errors.titles.limitReached'),
    CANNOT_LIST_PRODUCT: t('errors.titles.cannotList'),
  };
  return titles[code] || t('errors.titles.default');
}

function getActionLabel(action: string, t: any): string {
  const labels: Record<string, string> = {
    subscribe: t('errors.actions.getSubscription'),
    upgrade: t('errors.actions.upgradePlan'),
    contact: t('errors.actions.contactSupport'),
  };
  return labels[action] || t('errors.actions.learnMore');
}

export default function NewProductPage() {
  const router = useRouter();
  const t = useTranslations('sellerProductsNew');
  const [selectedProductType, setSelectedProductType] = useState('PHYSICAL');
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);
  const [canCreate, setCanCreate] = useState<any>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const { subscription, plan, isLoading: subLoading } = useMySubscription();
  const {
    canList,
    reasons,
    isLoading: canListLoading,
  } = useCanListProductType(selectedProductType);

  useEffect(() => {
    if (!subLoading && !canListLoading) {
      setCanCreate({
        allowed: canList,
        reasons,
        subscription,
        plan,
      });
      setIsCheckingLimits(false);
    }
  }, [canList, reasons, subscription, plan, subLoading, canListLoading]);

  const handleSubmit = async (formData: any) => {
    try {
      // Backend will handle images automatically
      const response = await api.post('/seller/products', formData);
      toast.success('Product created successfully! 🎉');
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      const parsed = parseProductError(error, t);
      setErrorModal({
        isOpen: true,
        title: parsed.title,
        message: parsed.message,
        action: parsed.action,
      });
    }
  };

  const handleCancel = () => {
    if (confirm(t('form.cancelConfirm'))) {
      router.push('/seller/products');
    }
  };

  const closeErrorModal = () => {
    setErrorModal({ isOpen: false, title: '', message: '' });
  };

  // Show loading state
  if (isCheckingLimits) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('loading.title')}</p>
        </div>
      </div>
    );
  }

  // Show upgrade message if can't create
  if (canCreate && !canCreate.allowed) {
    const { reasons } = canCreate;

    // ── Store pending approval ───────────────────────────────────────────
    if (!reasons.storeApproved) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Dark hero */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-10 text-center">
                <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg
                    className="w-8 h-8 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Account Pending Approval</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Your seller application is under review. You&apos;ll be able to list products once
                  approved.
                </p>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                    What happens next
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Our team reviews your seller application',
                      'You receive an approval email (1–2 business days)',
                      'After approval you can immediately start listing',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1 space-y-2">
                  <Link
                    href="/seller/onboarding"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors"
                  >
                    View Application Status <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/seller/products"
                    className="flex items-center justify-center w-full py-3 text-neutral-500 text-sm font-medium hover:text-black transition-colors"
                  >
                    Back to Products
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    // ── No store credits (PHYSICAL products — primary gate) ──────────────
    if (!reasons.hasMonthlyCredits && reasons.productTypeAllowed && reasons.meetsTierRequirement) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Dark hero */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-10 text-center">
                <div className="w-16 h-16 bg-[#CBB57B]/20 border border-[#CBB57B]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CreditCard className="w-8 h-8 text-[#CBB57B]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Selling Credits Required</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Activate your seller account by purchasing credits to start listing products on
                  NextPik.
                </p>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-5">
                {/* Balance card */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                      Current Balance
                    </p>
                    <p className="text-3xl font-bold text-black mt-0.5">
                      0 <span className="text-base font-normal text-neutral-400">credits</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {[
                    '1 credit = 1 month of full platform access',
                    'List unlimited products simultaneously',
                    'Credits never expire mid-month',
                    'Top up anytime — no contracts',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-[#CBB57B]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[#CBB57B]" />
                      </div>
                      <p className="text-sm text-neutral-600">{benefit}</p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="pt-1 space-y-2">
                  <Link
                    href="/seller/selling-credits"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors shadow-sm"
                  >
                    Purchase Credits <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/seller/products"
                    className="flex items-center justify-center w-full py-3 text-neutral-500 text-sm font-medium hover:text-black transition-colors"
                  >
                    Back to Products
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    // ── Subscription required (SERVICE / VEHICLE / REAL_ESTATE / RENTAL) ─
    if (!reasons.productTypeAllowed || !reasons.meetsTierRequirement) {
      const productTypeLabel = selectedProductType.replace(/_/g, ' ');
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Dark hero */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-10 text-center">
                <div className="w-16 h-16 bg-[#CBB57B]/20 border border-[#CBB57B]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Crown className="w-8 h-8 text-[#CBB57B]" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Subscription Required</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {productTypeLabel} listings require an active subscription plan on NextPik.
                </p>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                      Current Plan
                    </p>
                    <p className="text-lg font-bold text-black mt-0.5">No active plan</p>
                  </div>
                  <span className="px-2.5 py-1 bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-full">
                    Inactive
                  </span>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {[
                    `List ${productTypeLabel} products immediately`,
                    'Priority placement in search results',
                    'Advanced analytics & insights',
                    'Dedicated seller support',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-[#CBB57B]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[#CBB57B]" />
                      </div>
                      <p className="text-sm text-neutral-600">{benefit}</p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="pt-1 space-y-2">
                  <Link
                    href="/seller/subscription/plans"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors shadow-sm"
                  >
                    View Subscription Plans <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/seller/products"
                    className="flex items-center justify-center w-full py-3 text-neutral-500 text-sm font-medium hover:text-black transition-colors"
                  >
                    Back to Products
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    // ── Listing capacity reached (has credits, hit plan limit) ───────────
    if (!reasons.hasListingCapacity) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-10 text-center">
                <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <ShoppingBag className="w-8 h-8 text-orange-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Listing Limit Reached</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  You&apos;ve used all available listing slots on your current plan. Upgrade to list
                  more products.
                </p>
              </div>

              <div className="px-8 py-6 space-y-5">
                <div className="space-y-3">
                  {[
                    'More simultaneous active listings',
                    'Higher visibility in search results',
                    'Bulk listing tools & automation',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-[#CBB57B]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3 h-3 text-[#CBB57B]" />
                      </div>
                      <p className="text-sm text-neutral-600">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-1 space-y-2">
                  <Link
                    href="/seller/subscription/plans"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors shadow-sm"
                  >
                    Upgrade Plan <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/seller/products"
                    className="flex items-center justify-center w-full py-3 text-neutral-500 text-sm font-medium hover:text-black transition-colors"
                  >
                    Back to Products
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    // ── Generic fallback ─────────────────────────────────────────────────
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Cannot Create Listing</h1>
            <p className="text-neutral-400 text-sm">
              Your account does not currently meet the requirements to create a new listing.
            </p>
          </div>
          <div className="px-8 py-6 space-y-2">
            <Link
              href="/seller/selling-credits"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors"
            >
              Purchase Credits <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/seller/products"
              className="flex items-center justify-center w-full py-3 text-neutral-500 text-sm font-medium hover:text-black transition-colors"
            >
              Back to Products
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show form if allowed
  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push('/seller/products')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-black">{t('pageTitle')}</h1>
              </div>
              <div className="ml-14 flex items-center justify-between">
                <p className="text-neutral-600">{t('pageSubtitle')}</p>
                {subscription && plan && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {t('listingInfo.using')}{' '}
                      <strong className="text-gray-900">{subscription.activeListingsCount}</strong>{' '}
                      {t('listingInfo.of')}{' '}
                      <strong className="text-gray-900">
                        {plan.maxActiveListings === -1
                          ? t('listingInfo.unlimited')
                          : plan.maxActiveListings}
                      </strong>{' '}
                      {t('listingInfo.listings')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subscription Info Banner */}
        {subscription &&
          plan &&
          plan.maxActiveListings !== -1 &&
          subscription.activeListingsCount >= plan.maxActiveListings * 0.7 && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {t('banner.usingCapacity', {
                        percentage: Math.round(
                          (subscription.activeListingsCount / plan.maxActiveListings) * 100
                        ),
                      })}
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      {t('banner.considerUpgrade')}{' '}
                      <Link
                        href="/seller/subscription/plans"
                        className="font-semibold underline hover:text-amber-900"
                      >
                        {t('banner.viewPlans')}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Form */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
          </motion.div>
        </div>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {errorModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={closeErrorModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{errorModal.title}</h3>
                  </div>
                  <button
                    onClick={closeErrorModal}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <p className="text-gray-600 leading-relaxed">{errorModal.message}</p>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={closeErrorModal}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.close')}
                </button>
                {errorModal.action && (
                  <Link
                    href={errorModal.action.href}
                    className="px-4 py-2 bg-[#CBB57B] text-black font-semibold rounded-lg hover:bg-[#b9a369] transition-colors flex items-center gap-2"
                  >
                    {errorModal.action.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
