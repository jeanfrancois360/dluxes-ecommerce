'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Lock, AlertCircle, Crown, Package, Loader2, X, ArrowRight } from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';
import { api, APIError } from '@/lib/api/client';
import { useMySubscription, useCanListProductType } from '@/hooks/use-subscription';

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
function parseProductError(error: any): {
  title: string;
  message: string;
  action?: { label: string; href: string };
} {
  // Check if it's a structured error from our backend
  const errorData = error?.data || error;

  if (errorData?.userMessage) {
    return {
      title: getErrorTitle(errorData.code),
      message: errorData.userMessage,
      action: errorData.actionUrl
        ? {
            label: getActionLabel(errorData.action),
            href: errorData.actionUrl,
          }
        : undefined,
    };
  }

  // Fallback: parse the error message string
  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';

  // Check for common error patterns
  if (errorMessage.includes('subscription') || errorMessage.includes('credits')) {
    return {
      title: 'Subscription Required',
      message: 'You need an active subscription to list this type of product.',
      action: { label: 'Get Subscription', href: '/seller/selling-credits' },
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
      title: 'Plan Upgrade Required',
      message:
        "Your current plan doesn't support this product type. Upgrade to unlock this feature.",
      action: { label: 'View Plans', href: '/seller/subscription/plans' },
    };
  }

  if (errorMessage.includes('listing') && errorMessage.includes('limit')) {
    return {
      title: 'Listing Limit Reached',
      message: "You've reached the maximum number of listings for your plan.",
      action: { label: 'Upgrade Plan', href: '/seller/subscription/plans' },
    };
  }

  if (
    errorMessage.includes('store') &&
    (errorMessage.includes('approved') || errorMessage.includes('ACTIVE'))
  ) {
    return {
      title: 'Store Not Active',
      message: 'Your store must be approved before you can add products.',
      action: { label: 'View Store Status', href: '/seller/dashboard' },
    };
  }

  // Default error
  return {
    title: 'Failed to Create Product',
    message:
      errorMessage.length > 200
        ? 'There was a problem creating your product. Please try again.'
        : errorMessage,
  };
}

function getErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    NO_SUBSCRIPTION: 'Subscription Required',
    PRODUCT_TYPE_NOT_ALLOWED: 'Product Type Not Available',
    TIER_UPGRADE_REQUIRED: 'Upgrade Required',
    LISTING_LIMIT_REACHED: 'Listing Limit Reached',
    CANNOT_LIST_PRODUCT: 'Cannot Create Listing',
  };
  return titles[code] || 'Error';
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    subscribe: 'Get Subscription',
    upgrade: 'Upgrade Plan',
    contact: 'Contact Support',
  };
  return labels[action] || 'Learn More';
}

export default function NewProductPage() {
  const router = useRouter();
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
      await api.post('/seller/products', formData);
      router.push('/seller/products?success=created');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      const parsed = parseProductError(error);
      setErrorModal({
        isOpen: true,
        title: parsed.title,
        message: parsed.message,
        action: parsed.action,
      });
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
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
          <p className="text-gray-600">Checking subscription limits...</p>
        </div>
      </div>
    );
  }

  // Show upgrade message if can't create
  if (canCreate && !canCreate.allowed) {
    const { reasons } = canCreate;
    const reason = !reasons.hasMonthlyCredits
      ? 'You need a platform subscription to create products'
      : !reasons.hasListingCapacity
        ? 'You have reached your listing limit'
        : !reasons.productTypeAllowed
          ? `Your plan doesn't support ${selectedProductType} listings`
          : !reasons.meetsTierRequirement
            ? 'Your plan tier is too low for this product type'
            : 'Cannot create listing';

    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Listing Limit Reached</h1>
              <p className="text-lg text-gray-600 mb-6">{reason}</p>

              {/* Current Plan Info */}
              {plan && subscription && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-5 h-5 text-[#CBB57B]" />
                    <h3 className="font-semibold text-gray-900">Your Current Plan: {plan.name}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Listings</span>
                      <span className="font-semibold text-gray-900">
                        {subscription.activeListingsCount} /{' '}
                        {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width:
                            plan.maxActiveListings === -1
                              ? '0%'
                              : `${Math.min(100, (subscription.activeListingsCount / plan.maxActiveListings) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-600">Available Credits</span>
                      <span className="font-semibold text-gray-900">
                        {subscription.creditsAllocated - subscription.creditsUsed}
                      </span>
                    </div>

                    {plan.allowedProductTypes && (
                      <div className="pt-2">
                        <span className="text-sm text-gray-600">Allowed Product Types:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(plan.allowedProductTypes as string[]).map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Limitation Details */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Why can't I create a listing?</p>
                    <ul className="space-y-1 list-disc list-inside">
                      {!reasons.hasMonthlyCredits && (
                        <li>You need an active platform subscription to list products</li>
                      )}
                      {!reasons.hasListingCapacity && (
                        <li>You've reached your maximum active listings limit</li>
                      )}
                      {!reasons.productTypeAllowed && (
                        <li>Your plan doesn't include {selectedProductType} product listings</li>
                      )}
                      {!reasons.meetsTierRequirement && (
                        <li>This product type requires a higher subscription tier</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Link
                  href="/seller/products"
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Products
                </Link>
                <Link
                  href={
                    !reasons.hasMonthlyCredits
                      ? '/seller/selling-credits'
                      : '/seller/subscription/plans'
                  }
                  className="px-6 py-3 bg-[#CBB57B] text-black rounded-xl font-semibold hover:bg-[#b9a369] transition-colors shadow-md"
                >
                  {!reasons.hasMonthlyCredits ? 'Purchase Credits' : 'Upgrade Plan'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
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
                <h1 className="text-3xl font-bold text-black">Add New Product</h1>
              </div>
              <div className="ml-14 flex items-center justify-between">
                <p className="text-neutral-600">Create a new product for your store</p>
                {subscription && plan && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Using{' '}
                      <strong className="text-gray-900">{subscription.activeListingsCount}</strong>{' '}
                      of{' '}
                      <strong className="text-gray-900">
                        {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}
                      </strong>{' '}
                      listings
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
                      You're using{' '}
                      {Math.round(
                        (subscription.activeListingsCount / plan.maxActiveListings) * 100
                      )}
                      % of your listing capacity
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      Consider upgrading your plan to add more products.{' '}
                      <Link
                        href="/seller/subscription/plans"
                        className="font-semibold underline hover:text-amber-900"
                      >
                        View Plans
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
                  Close
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
