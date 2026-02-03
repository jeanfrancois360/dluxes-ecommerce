'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { motion } from 'framer-motion';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  const handleRetry = () => {
    router.push('/seller/plans');
  };

  const handleDashboard = () => {
    router.push('/dashboard/seller');
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6"
              >
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-3"
              >
                Checkout Cancelled
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-200"
              >
                Your subscription purchase was not completed
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  What happened?
                </h2>
                <p className="text-gray-600 mb-6">
                  You cancelled the checkout process or closed the payment window before completing your subscription purchase.
                  No charges have been made to your payment method.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        No worries!
                      </h3>
                      <p className="text-blue-800 text-sm">
                        Your account is safe and you can retry the subscription purchase anytime. All our plans come with a 14-day free trial.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Common Reasons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Common reasons for cancellation:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Changed your mind about the plan</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Need to compare plans or pricing</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Technical issue or payment method problem</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Accidentally closed the checkout window</span>
                  </div>
                </div>
              </motion.div>

              {/* Benefits Reminder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8 p-6 bg-gradient-to-r from-[#CBB57B]/10 to-[#a89968]/10 rounded-xl border border-[#CBB57B]/20"
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why upgrade your plan?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#CBB57B] font-bold">•</span>
                    <span>List more products and reach more customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CBB57B] font-bold">•</span>
                    <span>Get featured placement for better visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CBB57B] font-bold">•</span>
                    <span>Access premium seller tools and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CBB57B] font-bold">•</span>
                    <span>14-day free trial - no commitment required</span>
                  </li>
                </ul>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-[#CBB57B] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#a89968] transition-colors shadow-lg hover:shadow-xl"
                >
                  View Plans & Try Again
                </button>
                <button
                  onClick={handleDashboard}
                  className="flex-1 bg-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
                >
                  Back to Dashboard
                </button>
              </motion.div>

              {/* Help Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8 pt-8 border-t border-gray-200 text-center"
              >
                <p className="text-sm text-gray-600 mb-3">
                  Need help choosing the right plan or have questions?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/help"
                    className="text-[#CBB57B] hover:text-[#a89968] font-semibold text-sm inline-flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View Help Center
                  </a>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <a
                    href="/contact"
                    className="text-[#CBB57B] hover:text-[#a89968] font-semibold text-sm inline-flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
