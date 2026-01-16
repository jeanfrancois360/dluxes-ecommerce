'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import { toast, standardToasts } from '@/lib/utils/toast';
import {
  paymentMethodsApi,
  type SavedPaymentMethod,
  CARD_BRAND_LABELS,
  CARD_BRAND_COLORS,
} from '@/lib/api/payment-methods';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Link from 'next/link';

// Card brand SVG icons
const CardBrandIcon = ({ brand }: { brand: string }) => {
  const lowerBrand = brand.toLowerCase();

  if (lowerBrand === 'visa') {
    return (
      <svg viewBox="0 0 50 50" className="w-10 h-6">
        <rect fill="#1A1F71" width="50" height="50" rx="4" />
        <text x="25" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">VISA</text>
      </svg>
    );
  }

  if (lowerBrand === 'mastercard') {
    return (
      <svg viewBox="0 0 50 50" className="w-10 h-6">
        <rect fill="#000" width="50" height="50" rx="4" />
        <circle cx="20" cy="25" r="12" fill="#EB001B" />
        <circle cx="30" cy="25" r="12" fill="#F79E1B" />
      </svg>
    );
  }

  if (lowerBrand === 'amex') {
    return (
      <svg viewBox="0 0 50 50" className="w-10 h-6">
        <rect fill="#006FCF" width="50" height="50" rx="4" />
        <text x="25" y="32" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">AMEX</text>
      </svg>
    );
  }

  // Default card icon
  return (
    <svg viewBox="0 0 50 50" className="w-10 h-6">
      <rect fill="#6B7280" width="50" height="50" rx="4" />
      <rect x="5" y="15" width="40" height="6" fill="#9CA3AF" rx="1" />
      <rect x="5" y="30" width="20" height="4" fill="#9CA3AF" rx="1" />
    </svg>
  );
};

// Add Card Modal Component
function AddCardModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get setup intent from server
      const setupResponse = await paymentMethodsApi.createSetupIntent();

      if (!setupResponse?.data?.clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      // Confirm the setup intent with Stripe
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        setupResponse.data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (setupIntent?.status === 'succeeded') {
        toast.success('Your card has been saved successfully');
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to save card');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add card';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Add New Card</h3>
            <p className="text-gray-600">Enter your card details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="p-4 border-2 border-neutral-200 rounded-xl focus-within:border-blue-500 transition-colors">
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
                    invalid: {
                      color: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your card information is encrypted and securely processed by Stripe.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !stripe}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Card'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Main Page Component
export default function PaymentMethodsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const response = await paymentMethodsApi.createSetupIntent();
        if (response?.data?.publishableKey) {
          setStripePromise(loadStripe(response.data.publishableKey));
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    };
    initStripe();
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await paymentMethodsApi.getPaymentMethods();
      if (response?.data?.paymentMethods) {
        setPaymentMethods(response.data.paymentMethods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPaymentMethods();
    }
  }, [authLoading, user]);

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setIsSettingDefault(paymentMethodId);
      const response = await paymentMethodsApi.setDefault(paymentMethodId);
      if (response?.success) {
        toast.success('Your default payment method has been updated');
        fetchPaymentMethods();
      } else {
        throw new Error(response?.message || 'Failed to set default');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update default');
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setIsDeleting(true);
      const response = await paymentMethodsApi.remove(paymentMethodId);
      if (response?.success) {
        toast.success('Your card has been removed');
        setShowDeleteConfirm(null);
        fetchPaymentMethods();
      } else {
        throw new Error(response?.message || 'Failed to remove card');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove card');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/account" className="hover:text-gold transition-colors">Account</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">Payment Methods</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-white mb-1">
                Payment Methods
              </h1>
              <p className="text-lg text-white/80">
                Manage your saved cards for faster checkout
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add New Card Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Card
          </button>
        </motion.div>

        {/* Saved Cards List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {paymentMethods.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-100 p-12 text-center">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No Saved Cards</h3>
              <p className="text-gray-600 mb-6">
                Add a card to save it for faster checkout next time
              </p>
              <button
                onClick={() => setShowAddCard(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Card
              </button>
            </div>
          ) : (
            paymentMethods.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                  card.isDefault ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-neutral-100 hover:border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Card Icon */}
                    <div className="flex-shrink-0">
                      <CardBrandIcon brand={card.brand} />
                    </div>

                    {/* Card Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-black">
                          {CARD_BRAND_LABELS[card.brand.toLowerCase()] || card.brand} ending in {card.last4}
                        </p>
                        {card.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        disabled={isSettingDefault === card.id}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSettingDefault === card.id ? 'Setting...' : 'Set Default'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(card.id)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove card"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-neutral-50 to-white rounded-2xl border-2 border-neutral-100 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">Your Cards are Secure</h3>
              <p className="text-sm text-gray-600">
                All card information is encrypted and securely stored by Stripe. We never store your full card number on our servers. Your payment data is protected by industry-leading security standards.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Link
            href="/dashboard/buyer"
            className="text-gray-600 hover:text-black transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </motion.div>
      </div>

      {/* Add Card Modal with Stripe Elements */}
      {stripePromise && (
        <Elements stripe={stripePromise}>
          <AnimatePresence>
            {showAddCard && (
              <AddCardModal
                isOpen={showAddCard}
                onClose={() => setShowAddCard(false)}
                onSuccess={fetchPaymentMethods}
              />
            )}
          </AnimatePresence>
        </Elements>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Remove Card?</h3>
                <p className="text-gray-600">
                  Are you sure you want to remove this card? You can always add it again later.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {isDeleting ? 'Removing...' : 'Remove Card'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
