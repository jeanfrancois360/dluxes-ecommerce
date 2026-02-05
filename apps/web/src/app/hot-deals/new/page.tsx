'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
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

const URGENCY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', description: 'Standard urgency' },
  { value: 'URGENT', label: 'Urgent', description: 'Need help soon' },
  { value: 'EMERGENCY', label: 'Emergency', description: 'Need help ASAP' },
];

const CONTACT_OPTIONS = [
  { value: 'PHONE', label: 'Phone', icon: Phone },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'BOTH', label: 'Both', icon: null },
];

interface FormData extends CreateHotDealData {}

// Payment form component (uses Stripe Elements)
function HotDealForm() {
  const router = useRouter();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'processing' | 'success'>('form');
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      urgency: 'NORMAL' as UrgencyLevel,
      preferredContact: 'PHONE' as ContactMethod,
      contactName: user ? `${user.firstName} ${user.lastName}` : '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
    },
  });

  const categories = Object.entries(CATEGORY_LABELS) as [HotDealCategory, string][];

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Create the hot deal (status: PENDING)
      const deal = await hotDealsApi.create(data);
      setCreatedDealId(deal.id);
      setStep('payment');
      toast.info('Deal created! Please complete payment to publish.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hot deal');
      toast.error('Failed to create hot deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !createdDealId) {
      setError('Payment system not ready');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep('processing');

    try {
      // Step 2: Create payment intent via backend
      const paymentResponse = await api.post('/payment/create-intent', {
        amount: 100, // $1.00 in cents
        currency: 'USD',
        metadata: {
          type: 'hot_deal',
          hotDealId: createdDealId,
        },
      });

      const { clientSecret } = paymentResponse;

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Step 3: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }

      // Step 4: Confirm payment with backend to activate the deal
      await hotDealsApi.confirmPayment(createdDealId, paymentIntent.id);

      setStep('success');
      toast.success('Hot deal published successfully!');

      // Redirect after short delay
      setTimeout(() => {
        router.push('/hot-deals');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('payment');
      toast.error('Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hot Deal Published!</h2>
        <p className="text-gray-600 mb-6">
          Your hot deal is now live and will be visible for 24 hours.
        </p>
        <Link
          href="/hot-deals"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
        >
          View Hot Deals
        </Link>
      </motion.div>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h2>
        <p className="text-gray-600">Please wait while we process your payment.</p>
      </div>
    );
  }

  // Payment step
  if (step === 'payment') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Hot Deal Posting Fee</p>
              <p className="text-sm text-gray-600">Your deal will be active for 24 hours</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">$1.00</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              // Cancel the deal if going back
              if (createdDealId) {
                hotDealsApi.cancel(createdDealId).catch(console.error);
              }
              setStep('form');
              setCreatedDealId(null);
            }}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handlePayment}
            disabled={isSubmitting || !stripe}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
            Pay $1.00
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Stripe. Your card details are never stored on our servers.
        </p>
      </motion.div>
    );
  }

  // Form step
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Info Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Request Details</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 10, message: 'Title must be at least 10 characters' },
                  maxLength: { value: 100, message: 'Title cannot exceed 100 characters' },
                })}
                placeholder="e.g., Need emergency plumber for leaky pipe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' },
                  maxLength: { value: 500, message: 'Description cannot exceed 500 characters' },
                })}
                rows={4}
                placeholder="Describe what you need help with, including any specific requirements or time constraints..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <select
                  {...register('urgency')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('contactName', { required: 'Contact name is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.contactName && (
                <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('contactPhone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?1?\d{10,14}$/,
                      message: 'Please enter a valid phone number',
                    },
                  })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('contactEmail', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email',
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="flex gap-4">
                {CONTACT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register('preferredContact')}
                      value={option.value}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('city', { required: 'City is required' })}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                {...register('state')}
                placeholder="NY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                {...register('zipCode', {
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Invalid ZIP code format',
                  },
                })}
                placeholder="10001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Notice & Submit */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">$1.00 One-time Fee</p>
                <p className="text-sm text-gray-600">
                  Your hot deal will be active for 24 hours and visible to all service providers in your area.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/hot-deals"
              className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
              Continue to Payment
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

// Main page component with Stripe Elements provider
export default function NewHotDealPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stripePromise] = useState(() => getStripe());

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login?redirect=/hot-deals/new');
    return null;
  }

  if (authLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/hot-deals"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Post a Hot Deal</h1>
                <p className="text-gray-600">Get help fast - post your urgent service request</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Elements stripe={stripePromise}>
            <HotDealForm />
          </Elements>
        </div>
      </div>
    </PageLayout>
  );
}
