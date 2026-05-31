'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { subscriptionApi } from '@/lib/api/subscription';
import { useMySubscription } from '@/hooks/use-subscription';
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Shield,
  RotateCcw,
  Timer,
  Minus,
} from 'lucide-react';

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

const TIER_ICONS: Record<string, React.ReactNode> = {
  FREE: <Sparkles className="w-5 h-5" />,
  STARTER: <Zap className="w-5 h-5" />,
  PROFESSIONAL: <Crown className="w-5 h-5" />,
  BUSINESS: <Building2 className="w-5 h-5" />,
};

const FAQ_KEYS = ['changePlan', 'paymentMethods', 'freeTrial', 'productTypes', 'refunds'] as const;

// ─── Plan Card ───────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PlanDisplay;
  index: number;
  isCurrent: boolean;
  isUpgrade: boolean;
  selectedInterval: 'MONTHLY' | 'YEARLY';
  checkoutLoading: string | null;
  onUpgrade: (id: string, name: string, price: number, tier: string) => void;
  t: ReturnType<typeof useTranslations<'sellerSubscriptionPlans'>>;
}

function PlanCard({
  plan,
  index,
  isCurrent,
  isUpgrade,
  selectedInterval,
  checkoutLoading,
  onUpgrade,
  t,
}: PlanCardProps) {
  const currentPrice = selectedInterval === 'YEARLY' ? plan.yearlyPrice : plan.price;
  const monthlyEquivalent = selectedInterval === 'YEARLY' ? plan.yearlyPrice / 12 : plan.price;
  const yearlySavings =
    selectedInterval === 'YEARLY' && plan.price > 0
      ? Math.round(plan.price * 12 - plan.yearlyPrice)
      : 0;

  const isLoading = checkoutLoading === plan.id;

  const cardVariant = plan.isPopular ? 'popular' : isCurrent ? 'current' : 'default';

  const borderClass = {
    popular: 'ring-2 ring-[#CBB57B] shadow-xl shadow-[#CBB57B]/10',
    current: 'ring-2 ring-green-500 shadow-lg shadow-green-500/10',
    default: 'border border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-0.5',
  }[cardVariant];

  const accentClass = {
    popular: 'bg-gradient-to-r from-[#CBB57B] via-[#e2c97a] to-[#CBB57B]',
    current: 'bg-green-500',
    default: 'bg-neutral-100',
  }[cardVariant];

  const iconBg = {
    popular: 'bg-[#CBB57B]/15 text-[#CBB57B]',
    current: 'bg-green-50 text-green-600',
    default: 'bg-neutral-100 text-neutral-500',
  }[cardVariant];

  const ctaClass = {
    popular:
      'bg-[#CBB57B] text-black hover:bg-[#b9a369] shadow-md hover:shadow-lg active:scale-[0.98]',
    current: 'bg-green-50 text-green-700 border border-green-200 cursor-default',
    default:
      currentPrice === 0
        ? 'bg-neutral-100 text-neutral-400 cursor-default'
        : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-md hover:shadow-lg active:scale-[0.98]',
  }[cardVariant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.09, duration: 0.45 }}
      className={`relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 ${borderClass}`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${accentClass}`} />

      {/* Tier badge */}
      {(plan.badge || isCurrent) && (
        <div className="absolute top-5 right-4 z-10">
          {isCurrent && !plan.isPopular ? (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
              <Check className="w-3 h-3" />
              {t('currentPlan.current')}
            </span>
          ) : plan.isPopular ? (
            <span className="bg-[#CBB57B] text-black text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
              {t('badges.mostPopular')}
            </span>
          ) : plan.badge === 'Enterprise' ? (
            <span className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
              {t('badges.enterprise')}
            </span>
          ) : null}
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* Plan header */}
        <div className="flex items-center gap-3 mb-5 pr-16">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
          >
            {TIER_ICONS[plan.tier]}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
              {plan.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{plan.tagline}</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-5 min-h-[72px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${plan.id}-${selectedInterval}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              {currentPrice === 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {t('planCard.free')}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {formatCurrencyAmount(monthlyEquivalent)}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">/{t('billing.month')}</span>
                  </div>
                  {selectedInterval === 'YEARLY' && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatCurrencyAmount(currentPrice)}/{t('billing.year')} &mdash;{' '}
                      {t('billing.billedYearly')}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Yearly savings pill */}
          <AnimatePresence>
            {yearlySavings > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[11px] font-bold"
              >
                <Check className="w-3 h-3 flex-shrink-0" />
                Save {formatCurrencyAmount(yearlySavings)}/year
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onUpgrade(plan.id, plan.name, currentPrice, plan.tier)}
          disabled={isLoading || isCurrent}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 mb-5 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${ctaClass}`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('planCard.processing')}
            </>
          ) : isCurrent ? (
            <>
              <Check className="w-4 h-4" />
              {t('planCard.currentPlan')}
            </>
          ) : currentPrice === 0 ? (
            t('planCard.freeForever')
          ) : (
            <>
              {isUpgrade ? t('planCard.upgrade') : t('planCard.getStarted')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-[22px] font-extrabold text-gray-900 leading-none mb-1">
              {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {t('planCard.listings')}
            </p>
          </div>
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-[22px] font-extrabold text-gray-900 leading-none mb-1">
              {plan.monthlyCredits}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {t('planCard.creditsPerMonth')}
            </p>
          </div>
        </div>

        {/* Product Types */}
        {plan.allowedProductTypes.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {t('planCard.productTypes')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plan.allowedProductTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 bg-[#CBB57B]/10 text-[#9a8a5c] rounded-md text-[10px] font-semibold"
                >
                  {t(`productTypes.${type}` as any) || type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            {t('planCard.features')}
          </p>
          <ul className="space-y-2">
            {plan.features.slice(0, 6).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    plan.isPopular ? 'bg-[#CBB57B]/15' : 'bg-neutral-100'
                  }`}
                >
                  <Check
                    className={`w-2.5 h-2.5 ${plan.isPopular ? 'text-[#CBB57B]' : 'text-gray-500'}`}
                  />
                </div>
                <span className="text-gray-600 text-xs leading-relaxed">{feature}</span>
              </li>
            ))}
            {plan.features.length > 6 && (
              <li className="text-xs text-[#CBB57B] font-semibold pl-6">
                +{plan.features.length - 6} more features
              </li>
            )}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FaqItem({ question, answer, isOpen, onToggle, index }: FaqItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 + index * 0.04 }}
      className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-800 text-sm pr-4 leading-snug">{question}</span>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isOpen ? 'bg-[#CBB57B]/15 text-[#CBB57B]' : 'bg-neutral-100 text-gray-400'
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-neutral-100 pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="h-1 bg-neutral-100" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="h-10 bg-neutral-100 rounded animate-pulse w-2/3" />
            <div className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-neutral-100 rounded-xl animate-pulse" />
              <div className="h-16 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 bg-neutral-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SellerPlansPage() {
  const t = useTranslations('sellerSubscriptionPlans');
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const {
    plan: currentPlan,
    tier: currentTier,
    isLoading: subLoading,
    refresh: refreshSubscription,
  } = useMySubscription();

  useEffect(() => {
    fetchPlans();
    refreshSubscription();
  }, [refreshSubscription]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.getPlans();
      const transformed: PlanDisplay[] = response
        .filter((p) => p.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((p) => ({
          id: p.id,
          tier: p.tier,
          name: p.name,
          tagline: getTagline(p.tier),
          description: p.description || '',
          price: p.monthlyPrice,
          yearlyPrice: p.yearlyPrice,
          maxActiveListings: p.maxActiveListings,
          monthlyCredits: p.monthlyCredits,
          allowedProductTypes: p.allowedProductTypes || [],
          features: p.features || [],
          isPopular: p.isPopular,
          badge: p.isPopular ? 'Most Popular' : p.tier === 'BUSINESS' ? 'Enterprise' : undefined,
        }));
      setPlans(transformed);
    } catch {
      toast.error(t('errors.fetchPlans'));
    } finally {
      setLoading(false);
    }
  };

  const getTagline = (tier: string): string => {
    const map: Record<string, string> = {
      FREE: t('taglines.FREE'),
      STARTER: t('taglines.STARTER'),
      PROFESSIONAL: t('taglines.PROFESSIONAL'),
      BUSINESS: t('taglines.BUSINESS'),
    };
    return map[tier] || t('taglines.default');
  };

  const handleUpgrade = async (planId: string, planName: string, price: number, tier: string) => {
    try {
      setCheckoutLoading(planId);

      if (price === 0) {
        toast.info(t('toasts.freePlanActive'));
        return;
      }
      if (tier === currentTier) {
        toast.info(t('toasts.alreadySubscribed'));
        return;
      }

      const { url } = await subscriptionApi.createCheckout(planId, selectedInterval);
      if (url) {
        toast.success(t('toasts.redirecting'));
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('errors.upgrade');
      toast.error(t('errors.title'), message);
    } finally {
      // Only clear if we didn't redirect
      setCheckoutLoading((prev) => (prev === planId ? null : prev));
    }
  };

  const isCurrentPlan = (tier: string) => {
    if (subLoading || !currentPlan) return false;
    return tier === currentTier;
  };

  const isPageLoading = loading || subLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <Link
          href="/seller"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium">{t('backToDashboard')}</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 pt-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#CBB57B]/10 text-[#9a8a5c] rounded-full text-[11px] font-bold tracking-widest uppercase mb-5">
            <Crown className="w-3.5 h-3.5" />
            {t('header.badge')}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
            {t('header.title')}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-7">{t('header.subtitle')}</p>

          {/* Current plan indicator */}
          {!subLoading && currentPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm mb-7"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t('currentPlanBadge')}{' '}
              <span className="font-semibold ml-0.5">{currentPlan.name}</span>
            </motion.div>
          )}

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-white border border-neutral-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setSelectedInterval('MONTHLY')}
              className={`px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedInterval === 'MONTHLY'
                  ? 'bg-neutral-900 text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('billing.monthly')}
            </button>
            <button
              onClick={() => setSelectedInterval('YEARLY')}
              className={`relative px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedInterval === 'YEARLY'
                  ? 'bg-neutral-900 text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('billing.yearly')}
              <span className="absolute -top-2.5 -right-2.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                {t('billing.discount')}
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── Trust Strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10"
        >
          {[
            { icon: <Timer className="w-4 h-4 text-[#CBB57B]" />, label: '14-day free trial' },
            {
              icon: <RotateCcw className="w-4 h-4 text-[#CBB57B]" />,
              label: '30-day money-back guarantee',
            },
            { icon: <Shield className="w-4 h-4 text-[#CBB57B]" />, label: 'Cancel anytime' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
              {icon}
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Plans Grid ── */}
        {isPageLoading ? (
          <PlansSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {plans.map((plan, index) => {
              const isCurrent = isCurrentPlan(plan.tier);
              const isUpgrade = !isCurrent && currentTier !== 'FREE' && plan.price > 0;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  isCurrent={isCurrent}
                  isUpgrade={isUpgrade}
                  selectedInterval={selectedInterval}
                  checkoutLoading={checkoutLoading}
                  onUpgrade={handleUpgrade}
                  t={t}
                />
              );
            })}
          </div>
        )}

        {/* ── Help Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-neutral-900 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-14"
        >
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-1">{t('helpSection.title')}</h3>
            <p className="text-neutral-400 text-sm max-w-md">{t('helpSection.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button className="px-6 py-2.5 bg-white text-neutral-900 rounded-xl font-semibold text-sm hover:bg-neutral-100 transition-colors">
              {t('helpSection.comparePlans')}
            </button>
            <button className="px-6 py-2.5 bg-[#CBB57B] text-black rounded-xl font-semibold text-sm hover:bg-[#b9a369] transition-colors">
              {t('helpSection.contactSales')}
            </button>
          </div>
        </motion.div>

        {/* ── FAQ ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto mb-14"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('faq.title')}</h2>
            <p className="text-gray-500 text-sm">{t('faq.subtitle')}</p>
          </div>

          <div className="space-y-2">
            {FAQ_KEYS.map((key, idx) => (
              <FaqItem
                key={key}
                index={idx}
                question={t(`faq.questions.${key}.q` as any)}
                answer={t(`faq.questions.${key}.a` as any)}
                isOpen={openFaq === idx}
                onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm mb-2">{t('bottomCta.message')}</p>
          <Link
            href="/help"
            className="text-[#CBB57B] hover:text-[#b9a369] font-semibold text-sm inline-flex items-center gap-1 transition-colors"
          >
            {t('bottomCta.linkText')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
