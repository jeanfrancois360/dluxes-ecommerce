'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Zap,
  Clock,
  Shield,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
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

type Step = 'form' | 'payment' | 'success';

// Step progress bar
function StepProgress({ step }: { step: Step }) {
  const stepIndex = { form: 0, payment: 1, success: 2 }[step];
  const steps = [
    { label: 'Details', sub: 'Service request info' },
    { label: 'Payment', sub: '$1.00 posting fee' },
    { label: 'Published', sub: 'Live for 24 hours' },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 mx-10 z-0" />
        <div
          className="absolute top-5 left-10 h-px bg-green-400 z-0 transition-all duration-500"
          style={{ width: `calc(${stepIndex === 0 ? 0 : stepIndex === 1 ? 50 : 100}% - 5rem)` }}
        />

        {steps.map(({ label, sub }, i) => (
          <div key={label} className="flex flex-col items-center gap-2 relative z-10 flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
                i < stepIndex
                  ? 'bg-green-500 text-white shadow-md shadow-green-200'
                  : i === stepIndex
                    ? 'bg-[#CBB57B] text-white shadow-md shadow-[#CBB57B]/30 ring-4 ring-[#CBB57B]/20'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < stepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-semibold transition-colors ${
                  i === stepIndex
                    ? 'text-gray-900'
                    : i < stepIndex
                      ? 'text-green-600'
                      : 'text-gray-400'
                }`}
              >
                {label}
              </p>
              <p className="text-xs text-gray-400 hidden sm:block">{sub}</p>
            </div>
          </div>
        ))}
      </div>
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
function HotDealForm({
  stripeLoading,
  stripeError,
}: {
  stripeLoading: boolean;
  stripeError: string | null;
}) {
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
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

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
  // IMPORTANT: CardElement MUST remain mounted during the entire payment flow.
  // Never call setStep('processing') before stripe.confirmCardPayment — it unmounts
  // the element and causes "Element not ready" errors. Stay on 'payment' step until
  // confirmCardPayment resolves, then switch to 'success' directly.
  const handlePayment = async () => {
    if (!stripe || !elements || !createdDealId) {
      setError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    // Stay on 'payment' step — do NOT switch to 'processing' here
    try {
      const paymentResponse = await api.post(`/hot-deals/${createdDealId}/payment-intent`, {});
      const { clientSecret } = paymentResponse?.data ?? paymentResponse;
      if (!clientSecret) throw new Error('Failed to create payment intent');

      // CardElement is still mounted here — safe to call confirmCardPayment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment was not successful');

      await hotDealsApi.confirmPayment(createdDealId, paymentIntent.id);
      // Only switch step AFTER payment is fully confirmed
      setStep('success');
      toast.success(t('hotDealPublished'));
      setTimeout(() => router.push('/hot-deals'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('paymentFailed'));
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

  // Payment screen
  if (step === 'payment') {
    const payReady = !isSubmitting && !stripeLoading && !stripeError && !!stripe && cardComplete;
    return (
      <>
        <StepProgress step={step} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-6"
        >
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('completePayment')}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {t('cardDetails')} to complete your request
            </p>
          </div>

          {/* Fee summary */}
          <div className="bg-gradient-to-br from-[#CBB57B]/10 to-transparent border-2 border-[#CBB57B]/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t('postingFee')}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t('activeFor24Hours')}</p>
              </div>
              <p className="text-3xl font-bold text-[#CBB57B]">$1.00</p>
            </div>
          </div>

          {/* API / payment error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Card input section */}
          <div>
            {/* Accepted cards */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
              <span>We accept:</span>
              {['VISA', 'MC', 'AMEX', 'DISC'].map((brand) => (
                <span
                  key={brand}
                  className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200 font-semibold text-neutral-700"
                >
                  {brand}
                </span>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Card Information
            </label>

            {stripeError ? (
              <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Payment system unavailable</p>
                    <p className="text-xs text-red-600 mt-1">{stripeError}</p>
                  </div>
                </div>
              </div>
            ) : stripeLoading ? (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#CBB57B] animate-spin flex-shrink-0" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  className={`relative p-4 bg-white border-2 rounded-xl transition-all duration-300 ${
                    cardError
                      ? 'border-red-500 hd-shake'
                      : cardComplete
                        ? 'border-green-500 bg-green-50/20'
                        : 'border-neutral-200 hover:border-neutral-300'
                  } focus-within:border-[#CBB57B] focus-within:ring-4 focus-within:ring-[#CBB57B]/10`}
                >
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#000000',
                          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
                          backgroundColor: '#ffffff',
                          '::placeholder': { color: '#737373' },
                          iconColor: '#CBB57B',
                        },
                        invalid: { color: '#EF4444', iconColor: '#EF4444' },
                      },
                      hidePostalCode: true,
                    }}
                    onChange={handleCardChange}
                  />

                  {/* Green checkmark badge when complete */}
                  <AnimatePresence>
                    {cardComplete && !cardError && (
                      <motion.div
                        key="checkmark"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="absolute -right-2 -top-2 z-10 pointer-events-none"
                      >
                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <svg
                            className="w-4 h-4 text-white"
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Real-time card error from Stripe */}
                {cardError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {cardError}
                    </p>
                  </motion.div>
                )}

                {/* Encryption tip */}
                <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  Your payment info is encrypted end-to-end. We never see or store your full card
                  details.
                </p>
              </div>
            )}
          </div>

          {/* Security trust badges */}
          <div className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900">SSL Encrypted</p>
                  <p className="text-xs text-neutral-500">Secure Connection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900">PCI Compliant</p>
                  <p className="text-xs text-neutral-500">Protected Payment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900">Powered by Stripe</p>
                  <p className="text-xs text-neutral-500">Trusted Payments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (createdDealId) hotDealsApi.cancel(createdDealId).catch(console.error);
                setStep('form');
                setCreatedDealId(null);
              }}
              className="flex-1 px-6 py-4 border-2 border-neutral-200 rounded-xl font-semibold text-gray-700 hover:border-neutral-300 transition-colors"
            >
              {t('goBack')}
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={!payReady}
              className={`flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                payReady
                  ? 'bg-gradient-to-r from-[#CBB57B] via-amber-500 to-[#CBB57B] bg-[length:200%_200%] hd-animate-gradient text-white shadow-lg shadow-[#CBB57B]/30 hover:shadow-xl hover:shadow-[#CBB57B]/40'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {/* Shimmer when ready */}
              {payReady && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting || stripeLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                )}
                <span className="text-base">{stripeLoading ? 'Loading...' : t('payAmount')}</span>
              </span>
            </button>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-center text-neutral-400">
            Your payment information is encrypted and secure.{' '}
            <Link href="/terms" className="text-[#CBB57B] hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#CBB57B] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>

        {/* Animations */}
        <style jsx global>{`
          @keyframes hd-shake {
            0%,
            100% {
              transform: translateX(0);
            }
            10%,
            30%,
            50%,
            70%,
            90% {
              transform: translateX(-2px);
            }
            20%,
            40%,
            60%,
            80% {
              transform: translateX(2px);
            }
          }
          @keyframes hd-gradient {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          .hd-shake {
            animation: hd-shake 0.5s ease-in-out;
          }
          .hd-animate-gradient {
            animation: hd-gradient 3s ease infinite;
          }
          .StripeElement input:-webkit-autofill,
          .StripeElement input:-webkit-autofill:hover,
          .StripeElement input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #000000 !important;
          }
        `}</style>
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
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    getStripe()
      .then((stripe) => {
        setStripeInstance(stripe);
        setStripeLoading(false);
      })
      .catch(() => {
        setStripeError(
          'Payment system is not configured. Please contact support or try again later.'
        );
        setStripeLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/new');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Wait for auth to finish initializing before deciding
  if (!isInitialized) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin" />
        </div>
      </PageLayout>
    );
  }

  // Initialized but not authenticated — redirect is happening
  if (!isAuthenticated) {
    return null;
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
          <Elements stripe={stripeInstance}>
            <HotDealForm stripeLoading={stripeLoading} stripeError={stripeError} />
          </Elements>
        </div>
      </div>
    </PageLayout>
  );
}
