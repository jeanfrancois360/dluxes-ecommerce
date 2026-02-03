'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, AlertCircle, Crown, Package, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import ProductForm from '@/components/seller/ProductForm';
import { api } from '@/lib/api/client';
import { useMySubscription, useCanListProductType } from '@/hooks/use-subscription';

export default function NewProductPage() {
  const router = useRouter();
  const [selectedProductType, setSelectedProductType] = useState('PHYSICAL');
  const [isCheckingLimits, setIsCheckingLimits] = useState(true);
  const [canCreate, setCanCreate] = useState<any>(null);

  const { subscription, plan, isLoading: subLoading } = useMySubscription();
  const { canList, reasons, isLoading: canListLoading } = useCanListProductType(selectedProductType);

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
      const response = await api.post('/seller/products', formData);

      // Show success message
      alert('Product created successfully!');

      // Redirect to products list
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/seller/products');
    }
  };

  // Show loading state
  if (isCheckingLimits) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Checking subscription limits...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show upgrade message if can't create
  if (canCreate && !canCreate.allowed) {
    const { reasons } = canCreate;
    const reason = !reasons.hasListingCapacity
      ? 'You have reached your listing limit'
      : !reasons.productTypeAllowed
      ? `Your plan doesn't support ${selectedProductType} listings`
      : !reasons.hasCredits
      ? 'Insufficient credits to create listing'
      : !reasons.meetsTierRequirement
      ? 'Your plan tier is too low for this product type'
      : 'Cannot create listing';

    return (
      <PageLayout showCategoryNav={false}>
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
                          {subscription.activeListingsCount} / {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: plan.maxActiveListings === -1
                              ? '0%'
                              : `${Math.min(100, (subscription.activeListingsCount / plan.maxActiveListings) * 100)}%`
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
                              <span key={type} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg">
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
                        {!reasons.hasListingCapacity && (
                          <li>You've reached your maximum active listings limit</li>
                        )}
                        {!reasons.productTypeAllowed && (
                          <li>Your plan doesn't include {selectedProductType} product listings</li>
                        )}
                        {!reasons.hasCredits && (
                          <li>You don't have enough credits for this listing</li>
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
                    href="/seller/plans"
                    className="px-6 py-3 bg-[#CBB57B] text-black rounded-xl font-semibold hover:bg-[#b9a369] transition-colors shadow-md"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show form if allowed
  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push('/seller/products')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
                      Using <strong className="text-gray-900">{subscription.activeListingsCount}</strong> of{' '}
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
        {subscription && plan && plan.maxActiveListings !== -1 && subscription.activeListingsCount >= plan.maxActiveListings * 0.7 && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    You're using {Math.round((subscription.activeListingsCount / plan.maxActiveListings) * 100)}% of your listing capacity
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Consider upgrading your plan to add more products.{' '}
                    <Link href="/seller/plans" className="font-semibold underline hover:text-amber-900">
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
            <ProductForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
