'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/buyer/page-header';
import { useAuth } from '@/hooks/use-auth';
import { toast, standardToasts } from '@/lib/utils/toast';
import {
  paymentMethodsApi,
  type SavedPaymentMethod,
  CARD_BRAND_LABELS,
  CARD_BRAND_COLORS,
} from '@/lib/api/payment-methods';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CardBrandLogo } from '@/components/payment/card-brand-logo';
import { CardExpiryBadge } from '@/components/payment/card-expiry-badge';
import { CardListSkeleton } from '@/components/payment/card-skeleton';

// Card brand icon is now imported from components/payment/card-brand-logo.tsx

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
  const t = useTranslations('account.paymentMethods');
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
        toast.success(t('cardSaved'));
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to save card');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedAddCard');
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
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold">{t('addNewCard')}</h3>
            <p className="text-gray-600">{t('cardInformation')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('cardInformation')}
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
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
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
              <div>
                <p className="text-sm font-medium text-blue-900">{t('securePayment')}</p>
                <p className="text-xs text-blue-700 mt-1">{t('securePaymentDesc')}</p>
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !stripe}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('adding')}
                </>
              ) : (
                t('addCard')
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
  const t = useTranslations('account.paymentMethods');
  const { user, isLoading: authLoading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  // Nickname editing state
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

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
      toast.error(t('failedLoadMethods'));
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
        toast.success(t('defaultUpdated'));
        fetchPaymentMethods();
      } else {
        throw new Error(response?.message || t('failedSetDefault'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failedSetDefault'));
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setIsDeleting(true);
      const response = await paymentMethodsApi.remove(paymentMethodId);
      if (response?.success) {
        toast.success(t('cardRemoved'));
        setShowDeleteConfirm(null);
        fetchPaymentMethods();
      } else {
        throw new Error(response?.message || t('failedRemoveCard'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failedRemoveCard'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditNickname = (cardId: string, currentNickname?: string) => {
    setEditingNickname(cardId);
    setNicknameValue(currentNickname || '');
  };

  const handleSaveNickname = async (paymentMethodId: string) => {
    if (!nicknameValue.trim()) {
      toast.error(t('enterNicknameError'));
      return;
    }

    try {
      setIsSavingNickname(true);
      const response = await paymentMethodsApi.updateNickname(
        paymentMethodId,
        nicknameValue.trim()
      );
      if (response?.success) {
        toast.success(t('nicknameUpdated'));
        setEditingNickname(null);
        fetchPaymentMethods();
      } else {
        throw new Error(response?.message || t('failedUpdateNickname'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failedUpdateNickname'));
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNickname(null);
    setNicknameValue('');
  };

  const formatLastUsed = (lastUsedAt?: string) => {
    if (!lastUsedAt) return t('neverUsed');
    const date = new Date(lastUsedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('usedToday');
    if (diffDays === 1) return t('usedYesterday');
    if (diffDays < 7) return t('usedDaysAgo', { count: diffDays });
    if (diffDays < 30) return t('usedWeeksAgo', { count: Math.floor(diffDays / 7) });
    return t('usedMonthsAgo', { count: Math.floor(diffDays / 30) });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/buyer' },
          { label: 'Payment Methods' },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('addNewCard')}
            </button>
          </motion.div>

          {/* Saved Cards List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {isLoading ? (
              <CardListSkeleton count={3} />
            ) : paymentMethods.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-neutral-100 p-12 text-center">
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{t('noSavedCards')}</h3>
                <p className="text-gray-600 mb-6">{t('noSavedCardsDesc')}</p>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t('addYourFirstCard')}
                </button>
              </div>
            ) : (
              paymentMethods.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                    card.isDefault
                      ? 'border-blue-500 shadow-lg shadow-blue-100'
                      : 'border-neutral-100 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Card Brand Logo */}
                      <div className="flex-shrink-0">
                        <CardBrandLogo brand={card.brand} size="md" />
                      </div>

                      {/* Card Details */}
                      <div className="flex-1">
                        {/* Nickname editing or display */}
                        {editingNickname === card.id ? (
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="text"
                              value={nicknameValue}
                              onChange={(e) => setNicknameValue(e.target.value)}
                              placeholder={t('enterNickname')}
                              className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              autoFocus
                              maxLength={30}
                            />
                            <button
                              onClick={() => handleSaveNickname(card.id)}
                              disabled={isSavingNickname}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isSavingNickname ? t('saving') : t('save')}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 border border-neutral-300 text-xs rounded hover:bg-neutral-50"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            {card.nickname ? (
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-black">{card.nickname}</p>
                                <button
                                  onClick={() => handleEditNickname(card.id, card.nickname)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title={t('editNickname')}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditNickname(card.id)}
                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                {t('addNickname')}
                              </button>
                            )}
                            {card.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {t('default')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card brand and number */}
                        <p className="text-sm text-gray-700">
                          {CARD_BRAND_LABELS[card.brand.toLowerCase()] || card.brand} ••••{' '}
                          {card.last4}
                        </p>

                        {/* Expiry and usage stats */}
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {t('expires')} {card.expMonth.toString().padStart(2, '0')}/
                            {card.expYear}
                          </span>
                          <CardExpiryBadge expMonth={card.expMonth} expYear={card.expYear} />

                          {card.usageCount !== undefined && card.usageCount > 0 && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {card.usageCount === 1
                                  ? t('usedTimes', { count: card.usageCount })
                                  : t('usedTimesPlural', { count: card.usageCount })}
                              </span>
                            </>
                          )}
                          {card.lastUsedAt && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatLastUsed(card.lastUsedAt)}
                              </span>
                            </>
                          )}
                        </div>
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
                          {isSettingDefault === card.id ? t('setting') : t('setDefault')}
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteConfirm(card.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('removeCard')}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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
                <svg
                  className="w-6 h-6 text-green-600"
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
                <h3 className="font-semibold text-black mb-1">{t('cardsSecure')}</h3>
                <p className="text-sm text-gray-600">{t('cardsSecureDesc')}</p>
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('backToDashboard')}
            </Link>
          </motion.div>
        </div>
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
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">{t('removeCard')}?</h3>
                <p className="text-gray-600">{t('removeCardConfirm')}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {isDeleting ? t('removing') : t('removeCard')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
