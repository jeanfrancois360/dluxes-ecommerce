'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ImagePlus,
  X,
  Home,
  Car,
  Truck,
  Monitor,
  BookOpen,
  Activity,
  Sparkles,
  Heart,
  Users,
  MoreHorizontal,
  Phone,
  Mail,
  CheckCheck,
  Eye,
  Lock,
  Star,
  RefreshCw,
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
  URGENCY_CONFIG,
} from '@/lib/api/hot-deals';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData extends CreateHotDealData {}
type Step = 'form' | 'payment' | 'success';

interface DraftState {
  formValues?: Partial<FormData>;
  selectedUrgency?: UrgencyLevel;
  selectedCategory?: HotDealCategory | '';
  uploadedImages?: string[];
  step?: 'form' | 'payment';
  createdDealId?: string | null;
}

// ─── Draft persistence ────────────────────────────────────────────────────────

const DRAFT_KEY = 'nextpik_hd_draft';

function loadDraft(): DraftState {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDraft(partial: Partial<DraftState>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadDraft();
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...partial }));
  } catch {}
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DRAFT_KEY);
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  HotDealCategory,
  {
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    ring: string;
  }
> = {
  CHILDCARE: {
    Icon: Heart,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    ring: 'ring-pink-200',
  },
  HOME_SERVICES: {
    Icon: Home,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-200',
  },
  AUTOMOTIVE: {
    Icon: Car,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
  },
  PET_SERVICES: {
    Icon: Star,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
  },
  MOVING_DELIVERY: {
    Icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
  },
  TECH_SUPPORT: {
    Icon: Monitor,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
  },
  TUTORING: {
    Icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
  },
  HEALTH_WELLNESS: {
    Icon: Activity,
    color: 'text-red-600',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
  },
  CLEANING: {
    Icon: Sparkles,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    ring: 'ring-cyan-200',
  },
  OTHER: {
    Icon: MoreHorizontal,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    ring: 'ring-gray-200',
  },
};

// ─── StepProgress ─────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: Step }) {
  const stepIndex = { form: 0, payment: 1, success: 2 }[step];
  const steps = [
    { label: 'Details', sub: 'Service request info' },
    { label: 'Payment', sub: '$1.00 posting fee' },
    { label: 'Published', sub: 'Live for 24 hours' },
  ];

  return (
    <div className="relative flex items-start justify-between">
      {/* Background track */}
      <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 z-0" />
      {/* Filled track */}
      <motion.div
        className="absolute top-5 left-10 h-0.5 bg-gradient-to-r from-[#CBB57B] to-amber-400 z-0"
        initial={{ width: '0%' }}
        animate={{
          width:
            stepIndex === 0 ? '0%' : stepIndex === 1 ? 'calc(50% - 2.5rem)' : 'calc(100% - 5rem)',
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      {steps.map(({ label, sub }, i) => (
        <div key={label} className="flex flex-col items-center gap-2 relative z-10 flex-1">
          <motion.div
            animate={
              i === stepIndex
                ? {
                    boxShadow: ['0 0 0 0 rgba(203,181,123,0.4)', '0 0 0 8px rgba(203,181,123,0)'],
                  }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
              i < stepIndex
                ? 'bg-green-500 text-white shadow-md shadow-green-200'
                : i === stepIndex
                  ? 'bg-gradient-to-br from-[#CBB57B] to-amber-500 text-white shadow-lg shadow-[#CBB57B]/30 ring-4 ring-[#CBB57B]/20'
                  : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}
          >
            {i < stepIndex ? <CheckCircle className="w-5 h-5" /> : <span>{i + 1}</span>}
          </motion.div>
          <div className="text-center">
            <p
              className={`text-xs font-semibold transition-colors ${
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
  );
}

// ─── Live Preview Sidebar ─────────────────────────────────────────────────────

function LivePreview({
  title,
  description,
  category,
  urgency,
  city,
  contactName,
  images,
}: {
  title: string;
  description: string;
  category: HotDealCategory | '';
  urgency: UrgencyLevel;
  city: string;
  contactName: string;
  images: string[];
}) {
  const hasContent = title || description || category || city;
  const urgencyConf = URGENCY_CONFIG[urgency];
  const catConf = category ? CATEGORY_CONFIG[category] : null;
  const catIcon = catConf ? <catConf.Icon className={`w-3.5 h-3.5 ${catConf.color}`} /> : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Preview label */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Eye className="w-4 h-4 text-[#CBB57B]" />
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Live Preview
        </span>
        <span className="ml-auto text-xs text-gray-400">Updates as you type</span>
      </div>

      <div className="p-4">
        {!hasContent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-[#CBB57B]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-[#CBB57B]" />
            </div>
            <p className="text-sm text-gray-500">Your deal preview will appear here</p>
          </div>
        ) : (
          <motion.div
            key={`${title}-${category}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Urgency badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${urgencyConf.bgColor} ${urgencyConf.color}`}
            >
              {urgency === 'EMERGENCY' ? (
                <Flame className="w-3 h-3" />
              ) : urgency === 'URGENT' ? (
                <Zap className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {urgencyConf.label}
            </span>

            {/* Image preview */}
            {images.length > 0 && (
              <div className="flex gap-1.5">
                {images.slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                  />
                ))}
              </div>
            )}

            {/* Title */}
            <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {title || <span className="text-gray-400 italic">Add a title…</span>}
            </p>

            {/* Description */}
            {description && (
              <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{description}</p>
            )}

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5">
              {category && catConf && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${catConf.bg} ${catConf.color}`}
                >
                  {catIcon}
                  {CATEGORY_LABELS[category]}
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                  <MapPin className="w-3 h-3" />
                  {city}
                </span>
              )}
            </div>

            {/* Contact */}
            {contactName && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Posted by {contactName}
              </p>
            )}

            {/* Expiry */}
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Active for 24 hours after payment
            </p>
          </motion.div>
        )}
      </div>

      {/* Pricing box */}
      <div className="mx-4 mb-4 p-3 bg-gradient-to-br from-[#CBB57B]/10 to-amber-50 border border-[#CBB57B]/20 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Posting fee</p>
          <p className="text-lg font-bold text-[#CBB57B]">$1.00</p>
        </div>
        <ul className="space-y-1">
          {['Listed for 24 hours', 'Visible to all service providers', 'Unlimited responses'].map(
            (item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {item}
              </li>
            )
          )}
        </ul>
      </div>

      {/* Trust badges */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Lock className="w-3 h-3 text-green-500" /> Secure payment
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Shield className="w-3 h-3 text-blue-500" /> PCI compliant
        </span>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 bg-[#CBB57B]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4.5 h-4.5 text-[#CBB57B]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
  counter,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  counter?: { current: number; max: number };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter && (
          <span
            className={`text-xs tabular-nums ${
              counter.current > counter.max * 0.9 ? 'text-amber-600' : 'text-gray-400'
            }`}
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </motion.p>
      )}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] transition-all hover:border-gray-300';

// ─── HotDealForm ──────────────────────────────────────────────────────────────

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewHotDealPage() {
  const t = useTranslations('pages.hotDealsNew');
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('form');

  useEffect(() => {
    getStripe()
      .then((s) => {
        setStripeInstance(s);
        setStripeLoading(false);
      })
      .catch(() => {
        setStripeError('Payment system unavailable. Please contact support.');
        setStripeLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/new');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Sync step for StepProgress from draft
  useEffect(() => {
    const draft = loadDraft();
    if (draft.step === 'payment' && draft.createdDealId) setCurrentStep('payment');
  }, []);

  if (!isInitialized) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-[#F8F7F4]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              <Link
                href="/hot-deals"
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-[#CBB57B] to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#CBB57B]/30">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-gray-900 truncate">{t('title')}</h1>
                  <p className="text-xs text-gray-500 truncate hidden sm:block">{t('subtitle')}</p>
                </div>
              </div>

              {/* Step progress — inline on desktop */}
              <div className="hidden md:flex flex-1 max-w-sm">
                <StepProgress step={currentStep} />
              </div>
            </div>

            {/* Mobile step progress */}
            <div className="md:hidden pb-4">
              <StepProgress step={currentStep} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <Elements stripe={stripeInstance}>
            <HotDealFormWithStepSync
              stripeLoading={stripeLoading}
              stripeError={stripeError}
              onStepChange={setCurrentStep}
            />
          </Elements>
        </div>
      </div>
    </PageLayout>
  );
}

// Thin wrapper to forward step changes up for the header StepProgress
function HotDealFormWithStepSync({
  stripeLoading,
  stripeError,
  onStepChange,
}: {
  stripeLoading: boolean;
  stripeError: string | null;
  onStepChange: (step: Step) => void;
}) {
  // We intercept step changes through a wrapper so the header stays in sync.
  // The actual step state lives inside HotDealForm; we lift it via a prop callback.
  // To avoid prop drilling into deep state, we use a shared state approach:
  // HotDealForm accepts an optional onStepChange and calls it.
  return (
    <HotDealFormInner
      stripeLoading={stripeLoading}
      stripeError={stripeError}
      onStepChange={onStepChange}
    />
  );
}

function HotDealFormInner({
  stripeLoading,
  stripeError,
  onStepChange,
}: {
  stripeLoading: boolean;
  stripeError: string | null;
  onStepChange?: (step: Step) => void;
}) {
  const t = useTranslations('pages.hotDealsNew');
  const router = useRouter();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStepInternal] = useState<Step>('form');
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('NORMAL');
  const [selectedCategory, setSelectedCategory] = useState<HotDealCategory | ''>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const setStep = useCallback(
    (s: Step) => {
      setStepInternal(s);
      onStepChange?.(s);
    },
    [onStepChange]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      urgency: 'NORMAL',
      preferredContact: 'PHONE',
      contactName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      contactEmail: user?.email || '',
      contactPhone: (user as any)?.phone || '',
    },
  });

  const watchedTitle = watch('title') || '';
  const watchedDescription = watch('description') || '';
  const watchedCity = watch('city') || '';
  const watchedContactName = watch('contactName') || '';
  const watchedPreferredContact = watch('preferredContact');

  useEffect(() => {
    const draft = loadDraft();
    const hasDraftData =
      !!draft.formValues?.title ||
      !!draft.formValues?.description ||
      !!draft.selectedCategory ||
      !!draft.step;

    if (hasDraftData) {
      setHasDraft(true);
      if (draft.formValues) {
        reset({
          urgency: draft.selectedUrgency || 'NORMAL',
          preferredContact: draft.formValues.preferredContact || 'PHONE',
          contactName:
            draft.formValues.contactName ||
            (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
          contactEmail: draft.formValues.contactEmail || user?.email || '',
          contactPhone: draft.formValues.contactPhone || (user as any)?.phone || '',
          ...draft.formValues,
        });
      }
      if (draft.selectedUrgency) setSelectedUrgency(draft.selectedUrgency);
      if (draft.selectedCategory) {
        setSelectedCategory(draft.selectedCategory);
        setValue('category', draft.selectedCategory as HotDealCategory);
      }
      if (draft.uploadedImages?.length) setUploadedImages(draft.uploadedImages);
      if (draft.step === 'payment' && draft.createdDealId) {
        setStep('payment');
        setCreatedDealId(draft.createdDealId);
      }
    }
    setDraftLoaded(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!draftLoaded) return;
    const sub = watch((values) => saveDraft({ formValues: values }));
    return () => sub.unsubscribe();
  }, [watch, draftLoaded]);

  useEffect(() => {
    if (!draftLoaded) return;
    saveDraft({ selectedUrgency, selectedCategory, uploadedImages });
  }, [selectedUrgency, selectedCategory, uploadedImages, draftLoaded]);

  useEffect(() => {
    if (!draftLoaded) return;
    if (step !== 'success') saveDraft({ step: step as 'form' | 'payment', createdDealId });
  }, [step, createdDealId, draftLoaded]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const toUpload = Array.from(files).slice(0, 3 - uploadedImages.length);
    if (!toUpload.length) return;
    setUploadingCount((c) => c + toUpload.length);
    await Promise.all(
      toUpload.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('image', file);
          const res = await api.post('/upload/image?folder=hot-deals', formData);
          const url = res?.data?.url ?? res?.url;
          if (url) setUploadedImages((prev) => [...prev, url]);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        } finally {
          setUploadingCount((c) => c - 1);
        }
      })
    );
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const deal = await hotDealsApi.create({
        ...data,
        category: selectedCategory as HotDealCategory,
        urgency: selectedUrgency,
        images: uploadedImages,
      });
      setCreatedDealId(deal.id);
      setStep('payment');
      toast.success('Details saved! Complete payment to publish.');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToCreate'));
      toast.error(t('failedToCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !createdDealId) {
      setError('Payment system not ready. Please refresh.');
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const paymentResponse = await api.post(`/hot-deals/${createdDealId}/payment-intent`, {});
      const { clientSecret } = paymentResponse?.data ?? paymentResponse;
      if (!clientSecret) throw new Error('Failed to initialize payment');

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment was not successful');

      await hotDealsApi.confirmPayment(createdDealId, paymentIntent.id);
      clearDraft();
      setStep('success');
      toast.success(t('hotDealPublished'));
      setTimeout(() => router.push('/hot-deals'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('paymentFailed'));
      toast.error(t('paymentFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SUCCESS ──
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-200"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your deal is live!</h2>
            <p className="text-gray-500 text-sm mb-1">
              Service providers can now see and respond to your request.
            </p>
            <p className="text-gray-400 text-xs mb-8">Active for the next 24 hours.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/hot-deals"
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-[#CBB57B] to-amber-500 text-white rounded-xl font-semibold shadow-md shadow-[#CBB57B]/30 hover:shadow-lg transition-all"
            >
              <Flame className="w-5 h-5" />
              View Hot Deals
            </Link>
            <p className="text-xs text-gray-400 mt-3">Redirecting automatically…</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── PAYMENT ──
  if (step === 'payment') {
    const payReady = !isSubmitting && !stripeLoading && !stripeError && !!stripe && cardComplete;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-[#CBB57B] via-amber-400 to-[#CBB57B]" />
          <div className="p-7 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Complete payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your deal is saved. Pay to publish it now.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#CBB57B]">$1.00</p>
                <p className="text-xs text-gray-400 mt-0.5">one-time fee</p>
              </div>
            </div>

            <div className="bg-[#F8F7F4] border border-[#CBB57B]/20 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: '24-hour listing' },
                  { icon: Users, label: 'All providers see it' },
                  { icon: CheckCheck, label: 'Unlimited responses' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 bg-[#CBB57B]/15 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#CBB57B]" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Card information</label>
                <div className="flex items-center gap-1.5">
                  {['VISA', 'MC', 'AMEX'].map((b) => (
                    <span
                      key={b}
                      className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {stripeError ? (
                <div className="border border-red-200 rounded-xl p-4 bg-red-50 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Payment system unavailable</p>
                    <p className="text-xs text-red-500 mt-1">{stripeError}</p>
                  </div>
                </div>
              ) : stripeLoading ? (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#CBB57B] animate-spin" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                </div>
              ) : (
                <div className="relative">
                  <div
                    className={`relative p-4 bg-white border-2 rounded-xl transition-all duration-200 ${
                      cardError
                        ? 'border-red-400 hd-shake'
                        : cardComplete
                          ? 'border-green-400 bg-green-50/30'
                          : 'border-gray-200'
                    } focus-within:border-[#CBB57B] focus-within:ring-4 focus-within:ring-[#CBB57B]/10`}
                  >
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#111827',
                            fontFamily: '"Inter", system-ui, sans-serif',
                            backgroundColor: 'transparent',
                            '::placeholder': { color: '#9CA3AF' },
                            iconColor: '#CBB57B',
                          },
                          invalid: { color: '#EF4444', iconColor: '#EF4444' },
                        },
                        hidePostalCode: true,
                      }}
                      onChange={handleCardChange}
                    />
                    <AnimatePresence>
                      {cardComplete && !cardError && (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                          className="absolute -right-2.5 -top-2.5 z-10"
                        >
                          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {cardError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {cardError}
                    </motion.p>
                  )}
                  <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    256-bit SSL encryption. We never store your card details.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 flex-wrap py-2 border-t border-gray-100">
              {[
                { Icon: Lock, label: 'SSL Encrypted', color: 'text-green-500' },
                { Icon: Shield, label: 'PCI Compliant', color: 'text-blue-500' },
                { Icon: CheckCheck, label: 'Stripe Secured', color: 'text-violet-500' },
              ].map(({ Icon, label, color }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (createdDealId) hotDealsApi.cancel(createdDealId).catch(console.error);
                  setCreatedDealId(null);
                  saveDraft({ step: 'form', createdDealId: null });
                  setStep('form');
                }}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Go back
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={!payReady}
                className={`flex-1 relative overflow-hidden flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-base transition-all ${
                  payReady
                    ? 'bg-gradient-to-r from-[#CBB57B] via-amber-400 to-[#CBB57B] bg-[length:200%_100%] text-white shadow-lg shadow-[#CBB57B]/35 hover:shadow-xl hover:shadow-[#CBB57B]/45 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {payReady && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {isSubmitting
                    ? 'Processing…'
                    : stripeLoading
                      ? 'Loading…'
                      : 'Pay $1.00 & Publish'}
                </span>
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              By continuing you agree to our{' '}
              <Link href="/terms" className="text-[#CBB57B] hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#CBB57B] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Your deal summary</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{watchedTitle}</p>
              {watchedCity && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {watchedCity}
                </p>
              )}
              {selectedCategory && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_CONFIG[selectedCategory as HotDealCategory].bg} ${CATEGORY_CONFIG[selectedCategory as HotDealCategory].color}`}
                >
                  {CATEGORY_LABELS[selectedCategory as HotDealCategory]}
                </span>
              )}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-amber-800 mb-3">What happens next?</p>
            <ol className="space-y-2">
              {[
                'Payment processed securely',
                'Deal goes live instantly',
                'Providers can respond',
                'Pick your best match',
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className="w-4 h-4 rounded-full bg-amber-300 flex items-center justify-center text-amber-900 font-bold flex-shrink-0 mt-0.5 text-[10px]">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <style jsx global>{`
          @keyframes hd-shake {
            0%,
            100% {
              transform: translateX(0);
            }
            15%,
            45%,
            75% {
              transform: translateX(-3px);
            }
            30%,
            60%,
            90% {
              transform: translateX(3px);
            }
          }
          .hd-shake {
            animation: hd-shake 0.45s ease-in-out;
          }
          .StripeElement input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #111827 !important;
          }
        `}</style>
      </div>
    );
  }

  // ── FORM ──
  const categories = Object.entries(CATEGORY_LABELS) as [HotDealCategory, string][];

  const URGENCY_OPTIONS: Array<{
    value: UrgencyLevel;
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
    desc: string;
    color: string;
    border: string;
    activeBg: string;
  }> = [
    {
      value: 'NORMAL',
      Icon: Clock,
      label: t('normal'),
      desc: t('normalDesc'),
      color: 'text-gray-700',
      border: 'border-gray-300',
      activeBg: 'bg-gray-50',
    },
    {
      value: 'URGENT',
      Icon: Zap,
      label: t('urgent'),
      desc: t('urgentDesc'),
      color: 'text-[#CBB57B]',
      border: 'border-[#CBB57B]',
      activeBg: 'bg-[#CBB57B]/6',
    },
    {
      value: 'EMERGENCY',
      Icon: Flame,
      label: t('emergency'),
      desc: t('emergencyDesc'),
      color: 'text-red-600',
      border: 'border-red-400',
      activeBg: 'bg-red-50',
    },
  ];

  const CONTACT_OPTIONS: Array<{
    value: ContactMethod;
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = [
    { value: 'PHONE', Icon: Phone, label: t('phoneOption') },
    { value: 'EMAIL', Icon: Mail, label: t('emailOption') },
    { value: 'BOTH', Icon: CheckCheck, label: t('bothOption') },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <AnimatePresence>
          {hasDraft && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <RefreshCw className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 flex-1 font-medium">
                Draft restored — continue where you left off
              </p>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  reset({
                    urgency: 'NORMAL',
                    preferredContact: 'PHONE',
                    contactName: user
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '',
                    contactEmail: user?.email || '',
                    contactPhone: (user as any)?.phone || '',
                  });
                  setSelectedUrgency('NORMAL');
                  setSelectedCategory('');
                  setUploadedImages([]);
                  setHasDraft(false);
                }}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline underline-offset-2 whitespace-nowrap"
              >
                Start fresh
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Service Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader
              icon={Flame}
              title="Service request details"
              subtitle="Describe what you need help with"
            />
            <div className="space-y-5">
              <Field
                label={t('title_label')}
                required
                error={errors.title?.message}
                counter={{ current: watchedTitle.length, max: 100 }}
              >
                <input
                  type="text"
                  {...register('title', {
                    required: t('titleRequired'),
                    minLength: { value: 10, message: t('titleMin') },
                    maxLength: { value: 100, message: t('titleMax') },
                  })}
                  placeholder={t('titlePlaceholder')}
                  className={`${inputClass} ${errors.title ? 'border-red-300' : ''}`}
                />
              </Field>

              <Field
                label={t('description')}
                required
                error={errors.description?.message}
                hint="More detail helps providers respond faster and more accurately"
                counter={{ current: watchedDescription.length, max: 500 }}
              >
                <textarea
                  {...register('description', {
                    required: t('descriptionRequired'),
                    minLength: { value: 20, message: t('descriptionMin') },
                    maxLength: { value: 500, message: t('descriptionMax') },
                  })}
                  rows={4}
                  placeholder={t('descriptionPlaceholder')}
                  className={`${inputClass} resize-none ${errors.description ? 'border-red-300' : ''}`}
                />
              </Field>

              {/* Photos */}
              <Field label="Photos" hint="JPEG, PNG or WebP · max 5 MB each · optional">
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((url, i) => (
                    <div
                      key={url}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group shadow-sm"
                    >
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: uploadingCount }).map((_, i) => (
                    <div
                      key={`uploading-${i}`}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-[#CBB57B]/40 bg-[#CBB57B]/5 flex items-center justify-center"
                    >
                      <Loader2 className="w-5 h-5 text-[#CBB57B] animate-spin" />
                    </div>
                  ))}
                  {uploadedImages.length + uploadingCount < 3 && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group">
                      <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-[#CBB57B] transition-colors" />
                      <span className="text-xs text-gray-400 group-hover:text-[#CBB57B] transition-colors font-medium">
                        Add photo
                      </span>
                      <span className="text-xs text-gray-300">
                        {3 - uploadedImages.length - uploadingCount} left
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageFiles(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </Field>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t('category')}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                </div>
                <input
                  type="hidden"
                  {...register('category', { required: t('categoryRequired') })}
                />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {categories.map(([key, label]) => {
                    const conf = CATEGORY_CONFIG[key];
                    const isSelected = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(key);
                          setValue('category', key, { shouldValidate: true });
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? `${conf.bg} border-current ring-2 ${conf.ring} ${conf.color}`
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? conf.bg : 'bg-gray-100'}`}
                        >
                          <conf.Icon
                            className={`w-5 h-5 ${isSelected ? conf.color : 'text-gray-400'}`}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold leading-tight ${isSelected ? conf.color : 'text-gray-600'}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && !selectedCategory && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors.category.message}
                  </motion.p>
                )}
              </div>

              {/* Urgency */}
              <Field label={t('urgencyLevel')}>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_OPTIONS.map(({ value, Icon, label, desc, color, border, activeBg }) => {
                    const isSelected = selectedUrgency === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedUrgency(value);
                          setValue('urgency', value);
                        }}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? `${activeBg} ${border} shadow-sm`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? color : 'text-gray-400'}`} />
                        <div>
                          <p
                            className={`text-xs font-bold ${isSelected ? color : 'text-gray-600'}`}
                          >
                            {label}
                          </p>
                          <p className="text-xs text-gray-400 leading-tight mt-0.5 hidden sm:block">
                            {desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader
              icon={Users}
              title={t('contactInformation')}
              subtitle="How service providers will reach you"
            />
            <div className="space-y-5">
              <Field label={t('contactName')} required error={errors.contactName?.message}>
                <input
                  type="text"
                  {...register('contactName', { required: t('contactNameRequired') })}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('phone')} required error={errors.contactPhone?.message}>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      {...register('contactPhone', {
                        required: t('phoneRequired'),
                        pattern: { value: /^\+?1?\d{10,14}$/, message: t('phoneInvalid') },
                      })}
                      placeholder={t('phonePlaceholder')}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
                <Field label={t('email')} required error={errors.contactEmail?.message}>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      {...register('contactEmail', {
                        required: t('emailRequired'),
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: t('emailInvalid'),
                        },
                      })}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>
              <Field label={t('preferredContact')}>
                <div className="flex gap-2">
                  {CONTACT_OPTIONS.map(({ value, Icon, label }) => {
                    const isSelected = watchedPreferredContact === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue('preferredContact', value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#CBB57B]/10 border-[#CBB57B] text-[#CBB57B]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register('preferredContact')} />
              </Field>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader
              icon={MapPin}
              title={t('location')}
              subtitle="Where do you need the service?"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('city')} required error={errors.city?.message}>
                <input
                  type="text"
                  {...register('city', { required: t('cityRequired') })}
                  placeholder={t('cityPlaceholder')}
                  className={inputClass}
                />
              </Field>
              <Field label={t('state')}>
                <input
                  type="text"
                  {...register('state')}
                  placeholder={t('statePlaceholder')}
                  className={inputClass}
                />
              </Field>
              <Field label={t('zipCode')} error={errors.zipCode?.message}>
                <input
                  type="text"
                  {...register('zipCode', {
                    pattern: { value: /^\d{5}(-\d{4})?$/, message: t('zipInvalid') },
                  })}
                  placeholder={t('zipPlaceholder')}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div className="flex items-center gap-3 p-3.5 bg-[#CBB57B]/8 border border-[#CBB57B]/20 rounded-xl mb-4">
              <div className="w-9 h-9 bg-[#CBB57B]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4.5 h-4.5 text-[#CBB57B]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{t('oneTimeFee')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('feeDescription')}</p>
              </div>
              <p className="text-xl font-bold text-[#CBB57B]">$1</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/hot-deals"
                className="flex-none flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#111827', color: '#ffffff' }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Flame className="w-5 h-5" style={{ color: '#CBB57B' }} />
                )}
                <span>{isSubmitting ? 'Saving details…' : t('continueToPayment')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <LivePreview
            title={watchedTitle}
            description={watchedDescription}
            category={selectedCategory}
            urgency={selectedUrgency}
            city={watchedCity}
            contactName={watchedContactName}
            images={uploadedImages}
          />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#CBB57B]" />
              Tips for better responses
            </p>
            <ul className="space-y-2">
              {[
                'Be specific about what you need',
                'Mention your timeline or deadline',
                'Include photos if relevant',
                'Set the right urgency level',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
