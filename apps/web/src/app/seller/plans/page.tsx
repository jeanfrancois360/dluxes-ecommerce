'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { subscriptionApi, type SubscriptionPlan } from '@/lib/api/subscription';

interface PlanDisplay {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  badge?: string;
}

export default function SellerPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.getPlans();

      // Transform API plans to display format
      const transformedPlans: PlanDisplay[] = response
        .filter(plan => plan.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(plan => ({
          id: plan.id,
          name: plan.name,
          tagline: getTagline(plan.tier),
          description: plan.description || `${plan.tier} tier subscription`,
          price: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          features: [
            `Up to ${plan.maxActiveListings === -1 ? 'unlimited' : plan.maxActiveListings} active listings`,
            `${plan.monthlyCredits} credits per month`,
            `${plan.featuredSlotsPerMonth} featured slots/month`,
            `${plan.listingDurationDays} days listing duration`,
            ...plan.features,
          ],
          isPopular: plan.isPopular,
          badge: plan.isPopular ? 'Best Value' : plan.tier === 'BUSINESS' ? 'Premium' : undefined,
        }));

      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const getTagline = (tier: string): string => {
    const taglines: Record<string, string> = {
      FREE: 'Get started for free',
      STARTER: 'Perfect to get started',
      PROFESSIONAL: 'Most popular choice',
      BUSINESS: 'Unlimited everything',
    };
    return taglines[tier] || 'Subscription plan';
  };

  const handleUpgrade = async (planId: string, planName: string, price: number) => {
    try {
      setCheckoutLoading(planId);

      // Handle FREE plan separately
      if (price === 0) {
        toast.info('FREE plan is automatically applied to new sellers');
        setCheckoutLoading(null);
        return;
      }

      // Create Stripe checkout session
      const { url } = await subscriptionApi.createCheckout(planId, selectedInterval);

      // Redirect to Stripe checkout
      if (url) {
        toast.success('Redirecting to checkout...');
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error initiating upgrade:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to initiate upgrade';
      toast.error('Error', message);
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#CBB57B] mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading plans...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-2 bg-[#CBB57B]/10 text-[#CBB57B] rounded-full text-sm font-semibold mb-4">
              PRICING PLANS
            </span>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Select the subscription plan that fits your business needs. All plans include a 14-day free trial.
            </p>

            {/* Interval Toggle */}
            <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
              <button
                onClick={() => setSelectedInterval('MONTHLY')}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedInterval === 'MONTHLY'
                    ? 'bg-[#CBB57B] text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setSelectedInterval('YEARLY')}
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                  selectedInterval === 'YEARLY'
                    ? 'bg-[#CBB57B] text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly Billing
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {plans.map((plan, index) => {
              const currentPrice = selectedInterval === 'YEARLY' ? plan.yearlyPrice : plan.price;
              const monthlySavings = selectedInterval === 'YEARLY' ? Number((plan.price * 12 - plan.yearlyPrice).toFixed(0)) : 0;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                    plan.isPopular ? 'ring-4 ring-[#CBB57B] ring-opacity-50' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute top-0 right-0 ${plan.isPopular ? 'bg-[#CBB57B]' : 'bg-gray-900'} text-white px-4 py-2 rounded-bl-2xl font-semibold text-sm`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-[#CBB57B] font-semibold text-sm uppercase tracking-wide mb-1">
                        {plan.tagline}
                      </p>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-gray-900">
                          {formatCurrencyAmount(currentPrice)}
                        </span>
                        <span className="text-gray-600">
                          / {selectedInterval === 'YEARLY' ? 'year' : 'month'}
                        </span>
                      </div>
                      {selectedInterval === 'YEARLY' && monthlySavings > 0 && (
                        <p className="text-sm text-green-600 font-semibold">
                          Save {formatCurrencyAmount(Number(monthlySavings))} per year
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleUpgrade(plan.id, plan.name, currentPrice)}
                      disabled={checkoutLoading === plan.id}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 mb-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                        plan.isPopular
                          ? 'bg-[#CBB57B] text-white hover:bg-[#a89968] shadow-lg hover:shadow-xl'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {checkoutLoading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Redirecting...
                        </span>
                      ) : (
                        currentPrice === 0 ? 'Current Plan' : (plan.isPopular ? 'Start Free Trial' : 'Get Started')
                      )}
                    </button>

                    {/* Features */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Everything included
                      </p>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <svg
                              className="w-5 h-5 text-[#CBB57B] flex-shrink-0 mt-0.5"
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
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6">
              {[
                {
                  q: 'Can I change my plan later?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your billing cycle.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and PayPal for your convenience.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Absolutely! All new sellers get a 14-day free trial on any plan. No credit card required to start your trial.',
                },
                {
                  q: 'What happens after my trial ends?',
                  a: 'Your account will automatically convert to the selected paid plan. You can cancel anytime during the trial period without being charged.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
                },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-[#CBB57B] to-[#a89968] rounded-2xl p-10 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Still have questions?</h3>
              <p className="text-lg mb-6 opacity-90">
                Our team is here to help you choose the perfect plan for your business.
              </p>
              <button className="bg-white text-[#CBB57B] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg">
                Contact Sales Team
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
