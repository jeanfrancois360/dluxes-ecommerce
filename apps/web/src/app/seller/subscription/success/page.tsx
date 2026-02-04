'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { motion } from 'framer-motion';
import { subscriptionApi } from '@/lib/api/subscription';

// Constants for polling
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds
const MAX_POLL_ATTEMPTS = 15; // Max 30 seconds of polling (reduced since we have direct verification)
const INITIAL_DELAY_MS = 1000; // Wait 1 second before first check

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<'waiting' | 'verifying' | 'polling' | 'success' | 'timeout'>('waiting');
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const verificationAttemptedRef = useRef(false);

  useEffect(() => {
    // Clean up polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Direct verification with Stripe (bypasses webhook delay)
    const verifyCheckoutDirectly = async (): Promise<boolean> => {
      if (!sessionId) {
        console.log('No session_id in URL, skipping direct verification');
        return false;
      }

      if (verificationAttemptedRef.current) {
        console.log('Verification already attempted');
        return false;
      }

      verificationAttemptedRef.current = true;
      setPollingStatus('verifying');

      try {
        console.log('Verifying checkout session directly with Stripe...', { sessionId });
        const result = await subscriptionApi.verifyCheckout(sessionId);
        console.log('Verification result:', result);

        if (result.activated && result.subscription) {
          console.log('Subscription activated via direct verification:', result.subscription);
          // Fetch the full subscription info
          const data = await subscriptionApi.getMySubscription();
          console.log('Full subscription info:', data);
          setSubscriptionData(data);
          setPollingStatus('success');
          setLoading(false);
          return true;
        } else {
          console.log('Verification returned but not activated:', result);
        }
      } catch (error) {
        console.error('Direct verification failed, falling back to polling:', error);
      }

      return false;
    };

    // Poll for subscription data until we get a non-FREE plan or timeout
    const pollForSubscription = async () => {
      try {
        const data = await subscriptionApi.getMySubscription();

        // Check if we have a valid paid subscription (not FREE tier)
        const tier = data?.plan?.tier || data?.tier;
        const isPaidPlan = tier && tier !== 'FREE';

        if (isPaidPlan) {
          // Success! We have the correct subscription
          setSubscriptionData(data);
          setPollingStatus('success');
          setLoading(false);

          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return false;
      }
    };

    const startActivation = async () => {
      setPollingStatus('waiting');

      // Small initial delay
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS));

      // Step 1: Try direct verification with Stripe first (fastest path)
      const verifiedDirectly = await verifyCheckoutDirectly();
      if (verifiedDirectly) return;

      // Step 2: Fall back to polling (in case webhook already processed)
      setPollingStatus('polling');

      // Check immediately
      const foundImmediately = await pollForSubscription();
      if (foundImmediately) return;

      // Start polling interval
      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          // Timeout - stop polling and show whatever we have
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Final fetch attempt
          try {
            const data = await subscriptionApi.getMySubscription();
            setSubscriptionData(data);
          } catch (error) {
            console.error('Final subscription fetch failed:', error);
          }

          setPollingStatus('timeout');
          setLoading(false);
          return;
        }

        await pollForSubscription();
      }, POLL_INTERVAL_MS);
    };

    startActivation();
  }, [sessionId]);

  const handleContinue = () => {
    router.push('/seller/subscription');
  };

  const handleDashboard = () => {
    router.push('/dashboard/seller');
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-[#CBB57B]/10 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-[#CBB57B] to-[#d4c490] p-12 text-center relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 shadow-lg relative z-10"
              >
                <svg
                  className="w-14 h-14 text-[#CBB57B]"
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
                className="text-4xl font-bold text-black mb-3 relative z-10"
              >
                Subscription Activated!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-black/70 relative z-10"
              >
                Welcome to your new subscription plan
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12">
              {loading ? (
                <div className="text-center py-12">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-900 font-semibold text-lg">
                    {pollingStatus === 'waiting' && 'Processing your payment...'}
                    {pollingStatus === 'verifying' && 'Verifying with Stripe...'}
                    {pollingStatus === 'polling' && 'Activating your subscription...'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    This may take a few moments. Please don&apos;t close this page.
                  </p>
                </div>
              ) : (
                <>
                  {/* Timeout Warning */}
                  {pollingStatus === 'timeout' && subscriptionData?.plan?.tier === 'FREE' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <h4 className="font-semibold text-amber-800">Subscription Activation Pending</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Your payment was successful, but your subscription is still being activated.
                            This can happen when our servers are busy. Please wait a few minutes and
                            check your <a href="/seller/subscription" className="underline font-medium">subscription page</a> to see your updated plan.
                          </p>
                          <p className="text-sm text-amber-700 mt-2">
                            If your subscription doesn&apos;t update within 15 minutes, please contact support.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* What's Next */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      What happens next?
                    </h2>
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-start gap-4 p-5 bg-[#CBB57B]/10 border border-[#CBB57B]/20 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-[#CBB57B] text-black rounded-full flex items-center justify-center font-bold text-lg">
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
                        className="flex items-start gap-4 p-5 bg-neutral-50 border border-neutral-200 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
                        className="flex items-start gap-4 p-5 bg-neutral-50 border border-neutral-200 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
                      className="mb-8 p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl text-white"
                    >
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Subscription Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-400">Plan</p>
                          <p className="font-semibold text-[#CBB57B] text-lg">{subscriptionData.plan?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Billing Cycle</p>
                          <p className="font-semibold text-white">{subscriptionData.subscription?.billingCycle || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Status</p>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            {subscriptionData.subscription?.status || 'Active'}
                          </span>
                        </div>
                        <div>
                          <p className="text-neutral-400">Session ID</p>
                          <p className="font-mono text-xs text-neutral-500 truncate">{sessionId || 'N/A'}</p>
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
                      className="flex-1 bg-[#CBB57B] text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#b9a369] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      View Subscription Details
                    </button>
                    <button
                      onClick={handleDashboard}
                      className="flex-1 bg-neutral-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-neutral-800"
                    >
                      Go to Dashboard
                    </button>
                  </motion.div>

                  {/* Help Text */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 pt-8 border-t border-neutral-200 text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">
                      Need help getting started?
                    </p>
                    <a
                      href="/help"
                      className="text-[#CBB57B] hover:text-[#b9a369] font-semibold text-sm inline-flex items-center gap-1 transition-colors"
                    >
                      View Getting Started Guide
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
