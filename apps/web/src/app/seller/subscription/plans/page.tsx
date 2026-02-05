'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { toast } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { subscriptionApi, type SubscriptionPlan } from '@/lib/api/subscription';
import { useMySubscription } from '@/hooks/use-subscription';
import { Check, Sparkles, Crown, Zap, Building2, ArrowRight, HelpCircle, ChevronLeft } from 'lucide-react';

interface PlanDisplay {
  id: string;
  tier: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  yearlyPrice: number;
  features: string[];
  allowedProductTypes: string[];
  maxActiveListings: number;
  monthlyCredits: number;
  isPopular?: boolean;
  badge?: string;
}

// Icons for each tier
const tierIcons: Record<string, React.ReactNode> = {
  FREE: <Sparkles className="w-6 h-6" />,
  STARTER: <Zap className="w-6 h-6" />,
  PROFESSIONAL: <Crown className="w-6 h-6" />,
  BUSINESS: <Building2 className="w-6 h-6" />,
};

// Product type labels
const productTypeLabels: Record<string, string> = {
  SERVICE: 'Services',
  RENTAL: 'Rentals',
  VEHICLE: 'Vehicles',
  REAL_ESTATE: 'Real Estate',
};

export default function SellerPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const { subscription, plan: currentPlan, tier: currentTier, isLoading: subLoading, refresh: refreshSubscription } = useMySubscription();

  useEffect(() => {
    fetchPlans();
    // Also refresh subscription data to ensure we have the latest
    refreshSubscription();
  }, [refreshSubscription]);

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
          tier: plan.tier,
          name: plan.name,
          tagline: getTagline(plan.tier),
          description: plan.description || `${plan.tier} tier subscription`,
          price: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          maxActiveListings: plan.maxActiveListings,
          monthlyCredits: plan.monthlyCredits,
          allowedProductTypes: plan.allowedProductTypes || [],
          features: plan.features || [],
          isPopular: plan.isPopular,
          badge: plan.isPopular ? 'Most Popular' : plan.tier === 'BUSINESS' ? 'Enterprise' : undefined,
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
      STARTER: 'Perfect for growing sellers',
      PROFESSIONAL: 'For serious businesses',
      BUSINESS: 'Unlimited potential',
    };
    return taglines[tier] || 'Subscription plan';
  };

  const handleUpgrade = async (planId: string, planName: string, price: number, tier: string) => {
    try {
      setCheckoutLoading(planId);

      // Handle FREE plan separately
      if (price === 0) {
        toast.info('Free plan is already active for your account');
        setCheckoutLoading(null);
        return;
      }

      // Check if user is trying to select their current plan
      if (tier === currentTier) {
        toast.info('You are already subscribed to this plan');
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

  // Only show current plan indicator if subscription data is fully loaded
  const isCurrentPlan = (tier: string) => {
    // Don't show any plan as "current" if subscription data is still loading
    if (subLoading || !currentPlan) return false;
    return tier === currentTier;
  };

  // Wait for both plans AND subscription data to load
  if (loading || subLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading subscription plans...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-[#CBB57B]/5">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            href="/dashboard/seller"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#CBB57B]/10 text-[#9a8a5c] rounded-full text-sm font-semibold mb-6">
              <Crown className="w-4 h-4" />
              SUBSCRIPTION PLANS
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Unlock premium features to grow your business. All paid plans include a 14-day free trial.
            </p>

            {/* Current Plan Badge */}
            {currentPlan && !subLoading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Current Plan: <span className="font-semibold">{currentPlan.name}</span>
              </div>
            )}

            {/* Interval Toggle */}
            <div className="inline-flex items-center bg-white border border-neutral-200 rounded-2xl p-1.5 shadow-sm">
              <button
                onClick={() => setSelectedInterval('MONTHLY')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedInterval === 'MONTHLY'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedInterval('YEARLY')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                  selectedInterval === 'YEARLY'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2.5 -right-3 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, index) => {
              const currentPrice = selectedInterval === 'YEARLY' ? plan.yearlyPrice : plan.price;
              const monthlyEquivalent = selectedInterval === 'YEARLY' ? plan.yearlyPrice / 12 : plan.price;
              const isCurrent = isCurrentPlan(plan.tier);
              const isUpgrade = !isCurrent && currentTier !== 'FREE' && plan.price > 0;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.isPopular
                      ? 'ring-2 ring-[#CBB57B] shadow-lg'
                      : isCurrent
                      ? 'ring-2 ring-green-500 shadow-lg'
                      : 'border border-neutral-200 shadow-sm hover:-translate-y-1'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute top-4 right-4 ${
                      plan.isPopular ? 'bg-[#CBB57B] text-black' : 'bg-neutral-900 text-white'
                    } px-3 py-1 rounded-full font-semibold text-xs`}>
                      {plan.badge}
                    </div>
                  )}
                  {isCurrent && !plan.badge && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Icon & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.isPopular
                          ? 'bg-[#CBB57B]/10 text-[#CBB57B]'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {tierIcons[plan.tier]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {currentPrice === 0 ? 'Free' : formatCurrencyAmount(currentPrice)}
                        </span>
                        {currentPrice > 0 && (
                          <span className="text-gray-500 text-sm">
                            /{selectedInterval === 'YEARLY' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      {selectedInterval === 'YEARLY' && currentPrice > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrencyAmount(monthlyEquivalent)}/month billed yearly
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleUpgrade(plan.id, plan.name, currentPrice, plan.tier)}
                      disabled={checkoutLoading === plan.id || isCurrent}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-200 mb-6 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-green-50 text-green-700 border-2 border-green-200'
                          : plan.isPopular
                          ? 'bg-[#CBB57B] text-black hover:bg-[#b9a369] shadow-md hover:shadow-lg'
                          : currentPrice === 0
                          ? 'bg-neutral-100 text-neutral-500'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        <>
                          <Check className="w-5 h-5" />
                          Current Plan
                        </>
                      ) : currentPrice === 0 ? (
                        'Free Forever'
                      ) : (
                        <>
                          {isUpgrade ? 'Upgrade' : 'Get Started'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-neutral-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}
                        </p>
                        <p className="text-xs text-gray-500">Listings</p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">{plan.monthlyCredits}</p>
                        <p className="text-xs text-gray-500">Credits/mo</p>
                      </div>
                    </div>

                    {/* Allowed Product Types */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Product Types
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.allowedProductTypes.length > 0 ? (
                          plan.allowedProductTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-[#CBB57B]/10 text-[#9a8a5c] rounded text-xs font-medium"
                            >
                              {productTypeLabels[type] || type}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Physical products only</span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Features
                      </p>
                      <ul className="space-y-2">
                        {plan.features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-[#CBB57B] flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 5 && (
                          <li className="text-sm text-[#CBB57B] font-medium">
                            +{plan.features.length - 5} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-neutral-900 rounded-2xl p-8 mb-16"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Need help choosing the right plan?
                </h3>
                <p className="text-neutral-400">
                  Compare features or contact our team for personalized recommendations.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-white text-neutral-900 rounded-xl font-semibold hover:bg-neutral-100 transition-colors">
                  Compare Plans
                </button>
                <button className="px-6 py-3 bg-[#CBB57B] text-black rounded-xl font-semibold hover:bg-[#b9a369] transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">Everything you need to know about our plans</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'Can I change my plan later?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your billing cycle.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and various local payment methods through Stripe.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
                },
                {
                  q: 'What product types can I list?',
                  a: 'Free accounts can list physical products. Higher tier plans unlock Services, Rentals, Vehicles, and Real Estate listings.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Yes, we offer a 30-day money-back guarantee on all paid plans. Contact support for assistance.',
                },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.05 }}
                  className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-[#CBB57B]/30 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-[#CBB57B]" />
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed pl-7">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-500 mb-4">
              Have more questions? We&apos;re here to help.
            </p>
            <Link
              href="/help"
              className="text-[#CBB57B] hover:text-[#b9a369] font-semibold inline-flex items-center gap-1 transition-colors"
            >
              Visit Help Center
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
