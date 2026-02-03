'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { motion } from 'framer-motion';
import { subscriptionApi } from '@/lib/api/subscription';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    // Fetch subscription data
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionApi.getMySubscription();
        setSubscriptionData(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleContinue = () => {
    router.push('/seller/subscription');
  };

  const handleDashboard = () => {
    router.push('/dashboard/seller');
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Success Icon */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6"
              >
                <svg
                  className="w-16 h-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-3"
              >
                Subscription Activated!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-green-100"
              >
                Welcome to your new subscription plan
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your subscription details...</p>
                </div>
              ) : (
                <>
                  {/* What's Next */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      What happens next?
                    </h2>
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-start gap-4 p-4 bg-green-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Subscription Confirmed
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Your payment has been processed successfully and your subscription is now active.
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Full Access Enabled
                          </h3>
                          <p className="text-gray-600 text-sm">
                            You now have access to all features included in your plan. Start listing products right away!
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Confirmation Email Sent
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Check your inbox for a detailed confirmation email with your invoice and plan details.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  {subscriptionData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mb-8 p-6 bg-gray-50 rounded-xl"
                    >
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Subscription Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Plan</p>
                          <p className="font-semibold text-gray-900">{subscriptionData.plan?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Billing Cycle</p>
                          <p className="font-semibold text-gray-900">{subscriptionData.subscription?.billingCycle || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-semibold text-green-600">{subscriptionData.subscription?.status || 'Active'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Session ID</p>
                          <p className="font-mono text-xs text-gray-600 truncate">{sessionId || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <button
                      onClick={handleContinue}
                      className="flex-1 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      View Subscription Details
                    </button>
                    <button
                      onClick={handleDashboard}
                      className="flex-1 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
                    >
                      Go to Dashboard
                    </button>
                  </motion.div>

                  {/* Help Text */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 pt-8 border-t border-gray-200 text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">
                      Need help getting started?
                    </p>
                    <a
                      href="/help"
                      className="text-green-600 hover:text-green-700 font-semibold text-sm"
                    >
                      View Getting Started Guide →
                    </a>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
