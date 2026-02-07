'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  ArrowRight,
  AlertCircle,
  Loader2,
  Store,
  Calendar,
} from 'lucide-react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

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

interface OnboardingStatus {
  storeStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
  storeCreatedAt: string;
  approvedAt?: string;
  creditsBalance: number;
  totalProducts: number;
  canPublish: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Application Submitted',
    description: 'Your seller application is under review',
    icon: Store,
  },
  {
    id: 2,
    title: 'Account Approved',
    description: 'Admin has approved your seller account',
    icon: CheckCircle,
  },
  {
    id: 3,
    title: 'Purchase Credits',
    description: 'Get credits to activate your products',
    icon: CreditCard,
  },
  {
    id: 4,
    title: 'Create Products',
    description: 'Add your first product to start selling',
    icon: Package,
  },
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const t = useTranslations('sellerOnboarding');
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch seller dashboard data
  const {
    data: dashboardData,
    error,
    isLoading,
  } = useSWR(`${API_URL}/seller/dashboard`, fetcher, {
    refreshInterval: 10000,
    shouldRetryOnError: false,
  });

  // Fetch credit status
  const { data: creditsData } = useSWR(`${API_URL}/seller/credits`, fetcher, {
    refreshInterval: 10000,
    shouldRetryOnError: false,
  });

  const store = dashboardData?.store;
  const credits = creditsData;
  const products = dashboardData?.products;

  // Calculate current step based on status
  useEffect(() => {
    if (!store) return;

    if (store.status === 'REJECTED') {
      setCurrentStep(1); // Stuck at step 1
    } else if (store.status === 'PENDING') {
      setCurrentStep(1);
    } else if (store.status === 'ACTIVE' || store.status === 'SUSPENDED') {
      // Approved
      if (products?.total > 0) {
        setCurrentStep(4); // Has products
      } else if (credits?.creditsBalance > 0) {
        setCurrentStep(3); // Has credits but no products
      } else {
        setCurrentStep(2); // Approved but no credits
      }
    }
  }, [store, credits, products]);

  const getStepStatus = (stepId: number) => {
    if (store?.status === 'REJECTED' && stepId > 1) return 'blocked';
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-[#CBB57B]" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('errorTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('errorMessage')}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
          >
            {t('goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('title')}</h1>
          <p className="text-lg text-gray-600">{t('subtitle')}</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#CBB57B] to-[#A89968] rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2 px-1">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`text-sm font-medium ${
                  getStepStatus(step.id) === 'completed' || getStepStatus(step.id) === 'current'
                    ? 'text-[#CBB57B]'
                    : 'text-gray-400'
                }`}
              >
                {Math.round((step.id / STEPS.length) * 100)}%
              </span>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`
                  bg-white rounded-2xl shadow-lg p-6 border-2 transition-all
                  ${status === 'completed' ? 'border-green-500' : ''}
                  ${status === 'current' ? 'border-[#CBB57B] shadow-xl' : ''}
                  ${status === 'upcoming' ? 'border-gray-200' : ''}
                  ${status === 'blocked' ? 'border-red-300 bg-red-50/30' : ''}
                `}
              >
                <div className="flex items-start gap-6">
                  {/* Icon */}
                  <div
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                      ${status === 'completed' ? 'bg-green-100' : ''}
                      ${status === 'current' ? 'bg-[#CBB57B]/10' : ''}
                      ${status === 'upcoming' ? 'bg-gray-100' : ''}
                      ${status === 'blocked' ? 'bg-red-100' : ''}
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : status === 'current' ? (
                      <Icon className="w-8 h-8 text-[#CBB57B]" />
                    ) : status === 'blocked' ? (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    ) : (
                      <Clock className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      {status === 'completed' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Completed
                        </span>
                      )}
                      {status === 'current' && (
                        <span className="px-3 py-1 bg-[#CBB57B]/20 text-[#A89968] text-xs font-semibold rounded-full">
                          Current Step
                        </span>
                      )}
                      {status === 'blocked' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Action Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {/* Step-specific content */}
                    {step.id === 1 && (
                      <div className="space-y-3">
                        {store.status === 'PENDING' && (
                          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-yellow-900">Under Review</p>
                              <p className="text-sm text-yellow-700">
                                Your application is being reviewed by our team. Expected time: 24-48
                                hours.
                              </p>
                              <p className="text-xs text-yellow-600 mt-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Applied on {formatDate(store.createdAt)}
                              </p>
                            </div>
                          </div>
                        )}
                        {store.status === 'REJECTED' && (
                          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-red-900">Application Rejected</p>
                              <p className="text-sm text-red-700">
                                Unfortunately, your seller application was not approved. Please
                                contact support for more information.
                              </p>
                            </div>
                          </div>
                        )}
                        {store.status === 'ACTIVE' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              Application submitted on {formatDate(store.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 2 && store.status === 'ACTIVE' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">
                            Approved on{' '}
                            {store.verifiedAt ? formatDate(store.verifiedAt) : 'Recently'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Congratulations! Your seller account has been approved by our team.
                        </p>
                      </div>
                    )}

                    {step.id === 3 && (
                      <div className="space-y-3">
                        {credits?.creditsBalance > 0 ? (
                          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-green-900">Credits Active</p>
                              <p className="text-sm text-green-700">
                                You have {credits.creditsBalance} month
                                {credits.creditsBalance !== 1 ? 's' : ''} of credits
                              </p>
                            </div>
                            <button
                              onClick={() => router.push('/seller/selling-credits')}
                              className="text-sm text-[#CBB57B] hover:text-[#A89968] font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">
                              Purchase credits to activate your products and start selling. Credits
                              are $29.99/month.
                            </p>
                            <button
                              onClick={() => router.push('/seller/selling-credits')}
                              disabled={store.status !== 'ACTIVE'}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Purchase Credits
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {step.id === 4 && (
                      <div className="space-y-3">
                        {products?.total > 0 ? (
                          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-green-900">Products Created</p>
                              <p className="text-sm text-green-700">
                                You have {products.total} product{products.total !== 1 ? 's' : ''} (
                                {products.active} active)
                              </p>
                            </div>
                            <button
                              onClick={() => router.push('/seller/products')}
                              className="text-sm text-[#CBB57B] hover:text-[#A89968] font-medium"
                            >
                              Manage Products
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">
                              Create your first product to start selling. Add images, descriptions,
                              pricing, and inventory.
                            </p>
                            <button
                              onClick={() => router.push('/seller/products/new')}
                              disabled={!credits?.canPublish}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Create First Product
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            {!credits?.canPublish && (
                              <p className="text-xs text-red-600">
                                Purchase credits first to create products
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Message */}
        {currentStep >= 4 && products?.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-2xl p-8 text-white text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Onboarding Complete! 🎉</h2>
            <p className="text-lg mb-6 opacity-90">
              You're all set to start selling on NextPik. Manage your products, track orders, and
              grow your business.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => router.push('/seller/products')}
                className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Products
              </button>
              <button
                onClick={() => router.push('/dashboard/seller')}
                className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors"
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
