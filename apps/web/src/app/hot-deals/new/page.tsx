'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Zap,
  Clock,
  Shield,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import { getStripe } from '@/lib/stripe';
import api from '@/lib/api/client';
import {
  hotDealsApi,
  CreateHotDealData,
  CATEGORY_LABELS,
  HotDealCategory,
  UrgencyLevel,
  ContactMethod,
} from '@/lib/api/hot-deals';

interface FormData extends CreateHotDealData {}

type Step = 'form' | 'payment' | 'processing' | 'success';

// Step progress bar
function StepProgress({ step }: { step: Step }) {
  const stepIndex = { form: 0, payment: 1, processing: 1, success: 2 }[step];
  const steps = ['Details', 'Payment', 'Published'];

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              i < stepIndex
                ? 'bg-green-500 text-white'
                : i === stepIndex
                  ? 'bg-[#CBB57B] text-white'
                  : 'bg-gray-200 text-gray-400'
            }`}
          >
            {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          <span
            className={`text-sm font-medium hidden sm:inline transition-colors ${
              i === stepIndex ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 sm:w-16 transition-colors ${
                i < stepIndex ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Urgency option configs
const URGENCY_OPTIONS: Array<{
  value: UrgencyLevel;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  bg: string;
}> = [
  {
    value: 'NORMAL',
    Icon: Clock,
    color: 'text-gray-700',
    border: 'border-gray-400',
    bg: 'bg-gray-50',
  },
  {
    value: 'URGENT',
    Icon: Zap,
    color: 'text-[#CBB57B]',
    border: 'border-[#CBB57B]',
    bg: 'bg-[#CBB57B]/5',
  },
  {
    value: 'EMERGENCY',
    Icon: Flame,
    color: 'text-red-600',
    border: 'border-red-400',
    bg: 'bg-red-50',
  },
];

// Main form component (must be inside Stripe Elements)
function HotDealForm() {
  const t = useTranslations('pages.hotDealsNew');
  const router = useRouter();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('NORMAL');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      urgency: 'NORMAL' as UrgencyLevel,
      preferredContact: 'PHONE' as ContactMethod,
      contactName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
    },
  });

  const categories = Object.entries(CATEGORY_LABELS) as [HotDealCategory, string][];

  const CONTACT_OPTIONS: Array<{ value: ContactMethod; label: string }> = [
    { value: 'PHONE', label: t('phoneOption') },
    { value: 'EMAIL', label: t('emailOption') },
    { value: 'BOTH', label: t('bothOption') },
  ];

  const URGENCY_LABELS: Record<UrgencyLevel, { label: string; desc: string }> = {
    NORMAL: { label: t('normal'), desc: t('normalDesc') },
    URGENT: { label: t('urgent'), desc: t('urgentDesc') },
    EMERGENCY: { label: t('emergency'), desc: t('emergencyDesc') },
  };

  // Step 1: Submit form → create deal
  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const deal = await hotDealsApi.create({ ...data, urgency: selectedUrgency });
      setCreatedDealId(deal.id);
      setStep('payment');
      toast.info(t('dealCreated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToCreate'));
      toast.error(t('failedToCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle Stripe payment
  const handlePayment = async () => {
    if (!stripe || !elements || !createdDealId) {
      setError('Payment system not ready');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setStep('processing');
    try {
      const paymentResponse = await api.post('/payment/create-intent', {
        amount: 100,
        currency: 'USD',
        metadata: { type: 'hot_deal', hotDealId: createdDealId },
      });
      const { clientSecret } = paymentResponse;
      if (!clientSecret) throw new Error('Failed to create payment intent');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment was not successful');

      await hotDealsApi.confirmPayment(createdDealId, paymentIntent.id);
      setStep('success');
      toast.success(t('hotDealPublished'));
      setTimeout(() => router.push('/hot-deals'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('paymentFailed'));
      setStep('payment');
      toast.error(t('paymentFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <>
        <StepProgress step={step} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm p-10 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-5 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('hotDealPublished')}</h2>
          <p className="text-gray-500 mb-8">{t('nowLive')}</p>
          <Link
            href="/hot-deals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
          >
            {t('viewHotDeals')}
          </Link>
        </motion.div>
      </>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <>
        <StepProgress step={step} />
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <Loader2 className="w-12 h-12 text-[#CBB57B] mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('processingPayment')}</h2>
          <p className="text-gray-500 text-sm">{t('pleaseWait')}</p>
        </div>
      </>
    );
  }

  // Payment screen
  if (step === 'payment') {
    return (
      <>
        <StepProgress step={step} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('completePayment')}</h2>

          <div className="bg-[#CBB57B]/10 border border-[#CBB57B]/20 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t('postingFee')}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t('activeFor24Hours')}</p>
              </div>
              <p className="text-3xl font-bold text-[#CBB57B]">$1.00</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('cardDetails')}
            </label>
            <div className="border border-gray-200 rounded-xl p-4 focus-within:ring-2 focus-within:ring-[#CBB57B]/30 focus-within:border-[#CBB57B] transition-shadow">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      '::placeholder': { color: '#9ca3af' },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (createdDealId) hotDealsApi.cancel(createdDealId).catch(console.error);
                setStep('form');
                setCreatedDealId(null);
              }}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('goBack')}
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={isSubmitting || !stripe}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {t('payAmount')}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            {t('securePayment')}
          </div>
        </motion.div>
      </>
    );
  }

  // Form screen
  return (
    <>
      <StepProgress step={step} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Service Request Details */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {t('serviceRequestDetails')}
            </h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('title_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', {
                    required: t('titleRequired'),
                    minLength: { value: 10, message: t('titleMin') },
                    maxLength: { value: 100, message: t('titleMax') },
                  })}
                  placeholder={t('titlePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description', {
                    required: t('descriptionRequired'),
                    minLength: { value: 20, message: t('descriptionMin') },
                    maxLength: { value: 500, message: t('descriptionMax') },
                  })}
                  rows={4}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: t('categoryRequired') })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none bg-white"
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Urgency — visual card selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('urgencyLevel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_OPTIONS.map(({ value, Icon, color, border, bg }) => {
                    const isSelected = selectedUrgency === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedUrgency(value);
                          setValue('urgency', value);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? `${border} ${bg}`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? color : 'text-gray-400'}`} />
                        <span
                          className={`text-xs font-semibold ${isSelected ? color : 'text-gray-500'}`}
                        >
                          {URGENCY_LABELS[value].label}
                        </span>
                        <span className="text-xs text-gray-400 hidden sm:block leading-tight">
                          {URGENCY_LABELS[value].desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {t('contactInformation')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contactName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('contactName', { required: t('contactNameRequired') })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                />
                {errors.contactName && (
                  <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('contactPhone', {
                      required: t('phoneRequired'),
                      pattern: { value: /^\+?1?\d{10,14}$/, message: t('phoneInvalid') },
                    })}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('contactEmail', {
                      required: t('emailRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('emailInvalid'),
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('preferredContact')}
                </label>
                <div className="flex gap-5">
                  {CONTACT_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register('preferredContact')}
                        value={option.value}
                        className="accent-[#CBB57B]"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {t('location')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('city')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('city', { required: t('cityRequired') })}
                  placeholder={t('cityPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('state')}</label>
                <input
                  type="text"
                  {...register('state')}
                  placeholder={t('statePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('zipCode')}
                </label>
                <input
                  type="text"
                  {...register('zipCode', {
                    pattern: { value: /^\d{5}(-\d{4})?$/, message: t('zipInvalid') },
                  })}
                  placeholder={t('zipPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-xs text-red-600">{errors.zipCode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-[#CBB57B]/10 border border-[#CBB57B]/20 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-[#CBB57B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t('oneTimeFee')}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t('feeDescription')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/hot-deals"
                className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Flame className="w-5 h-5" />
                )}
                {t('continueToPayment')}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </>
  );
}

// Main page — auth guard + Stripe Elements wrapper
export default function NewHotDealPage() {
  const t = useTranslations('pages.hotDealsNew');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stripePromise] = useState(() => getStripe());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/new');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (!authLoading && !isAuthenticated)) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-4">
              <Link
                href="/hot-deals"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
                <p className="text-sm text-gray-500">{t('subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form (StepProgress rendered inside HotDealForm) */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Elements stripe={stripePromise}>
            <HotDealForm />
          </Elements>
        </div>
      </div>
    </PageLayout>
  );
}
