'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { cn } from '@nextpik/ui';
import type { StripeCardElementOptions } from '@stripe/stripe-js';
import Link from 'next/link';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  paymentMethodsApi,
  type SavedPaymentMethod,
  CARD_BRAND_LABELS,
} from '@/lib/api/payment-methods';
import { CardBrandLogo } from '@/components/payment/card-brand-logo';

interface PaymentFormProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onBack?: () => void;
  billingAddressSameAsShipping?: boolean;
  onBillingAddressChange?: (same: boolean) => void;
}

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#000000',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      backgroundColor: '#ffffff',
      '::placeholder': {
        color: '#737373',
      },
      iconColor: '#CBB57B',
      ':-webkit-autofill': {
        color: '#000000',
        backgroundColor: '#ffffff',
      },
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true,
};

export function PaymentForm({
  amount,
  clientSecret,
  onSuccess,
  onError,
  onBack,
  billingAddressSameAsShipping = true,
  onBillingAddressChange,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);
  const [billingIsSame, setBillingIsSame] = useState(billingAddressSameAsShipping);
  const [cardBrand, setCardBrand] = useState<string>('unknown');

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(true);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);

  // Fetch saved cards on mount
  useEffect(() => {
    const fetchSavedCards = async () => {
      try {
        const response = await paymentMethodsApi.getPaymentMethods();
        if (response?.data?.paymentMethods) {
          setSavedCards(response.data.paymentMethods);
          // Auto-select default card if exists
          const defaultCard = response.data.paymentMethods.find(c => c.isDefault);
          if (defaultCard) {
            setSelectedSavedCard(defaultCard.id);
          } else if (response.data.paymentMethods.length > 0) {
            setSelectedSavedCard(response.data.paymentMethods[0].id);
          } else {
            setUseNewCard(true);
          }
        } else {
          setUseNewCard(true);
        }
      } catch (error) {
        console.error('Failed to fetch saved cards:', error);
        setUseNewCard(true);
      } finally {
        setLoadingSavedCards(false);
      }
    };
    fetchSavedCards();
  }, []);

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
    if (event.brand) {
      setCardBrand(event.brand);
    }
  };

  const handleBillingChange = (same: boolean) => {
    setBillingIsSame(same);
    onBillingAddressChange?.(same);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    // For new cards, check if elements is available and card is complete
    if (useNewCard) {
      if (!elements) {
        onError('Payment form not ready. Please try again.');
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError('Card element not found. Please refresh the page.');
        return;
      }

      if (!cardComplete) {
        setCardError('Please complete your card details');
        return;
      }
    } else if (!selectedSavedCard) {
      setCardError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // First, check if the payment intent is already in a successful state
      const { paymentIntent: existingIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (existingIntent) {
        // If already succeeded or requires capture, don't try to confirm again
        if (existingIntent.status === 'succeeded' || existingIntent.status === 'requires_capture') {
          console.log('Payment already authorized with status:', existingIntent.status);
          onSuccess(existingIntent.id);
          return;
        }

        // If already processing, inform user
        if (existingIntent.status === 'processing') {
          throw new Error('Payment is already being processed. Please wait a moment.');
        }
      }

      let result;

      if (useNewCard) {
        // Pay with new card
        const cardElement = elements!.getElement(CardElement)!;
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });
      } else {
        // Pay with saved card
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedSavedCard!,
        });
      }

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'requires_capture')) {
        // Both 'succeeded' and 'requires_capture' mean payment was authorized successfully
        // 'requires_capture' is used for manual capture (escrow system)

        // CRITICAL FIX: Save the card if user checked the "Save card" checkbox
        if (useNewCard && saveCard && result.paymentIntent.id) {
          try {
            await paymentMethodsApi.saveAfterPayment(result.paymentIntent.id);
            console.log('Card saved successfully for future use');
          } catch (saveError) {
            // Don't fail the payment if card saving fails
            console.error('Failed to save card for future use:', saveError);
          }
        }

        onSuccess(result.paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = getErrorMessage(err.message);
      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    // Map common Stripe errors to user-friendly messages
    if (error.includes('payment_intent_unexpected_state')) {
      return 'This payment is being processed. Please wait a moment and refresh the page.';
    }
    if (error.includes('card_declined')) return 'Your card was declined. Please try another card.';
    if (error.includes('insufficient_funds'))
      return 'Your card has insufficient funds. Please try another card.';
    if (error.includes('expired_card')) return 'Your card has expired. Please use a different card.';
    if (error.includes('incorrect_cvc'))
      return 'Your card security code is incorrect. Please check and try again.';
    if (error.includes('processing_error'))
      return 'An error occurred while processing your card. Please try again.';
    if (error.includes('incorrect_number'))
      return 'Your card number is incorrect. Please check and try again.';
    return error || 'Payment failed. Please try again.';
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Payment Details Header */}
      <div>
        <h3 className="text-lg font-serif font-semibold mb-2">Payment Details</h3>
        <p className="text-sm text-neutral-600">
          {savedCards.length > 0 ? 'Choose a saved card or add a new one' : 'Enter your card information to complete your order'}
        </p>
      </div>

      {/* Saved Cards Section */}
      {!loadingSavedCards && savedCards.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">Saved Cards</label>

          {/* Saved Card Options */}
          <div className="space-y-2">
            {savedCards.map((card) => (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedSavedCard(card.id);
                  setUseNewCard(false);
                  setCardError(null);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full p-4 flex items-center justify-between rounded-lg border-2 transition-all',
                  selectedSavedCard === card.id && !useNewCard
                    ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedSavedCard === card.id && !useNewCard
                      ? 'border-gold bg-gold'
                      : 'border-neutral-300'
                  )}>
                    {selectedSavedCard === card.id && !useNewCard && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Card Brand Logo */}
                  <CardBrandLogo brand={card.brand} size="sm" />

                  {/* Card Details */}
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">
                      {CARD_BRAND_LABELS[card.brand.toLowerCase()] || card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                    </p>
                  </div>
                </div>

                {card.isDefault && (
                  <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-medium rounded">
                    Default
                  </span>
                )}
              </motion.button>
            ))}

            {/* Use New Card Option */}
            <motion.button
              type="button"
              onClick={() => {
                setUseNewCard(true);
                setSelectedSavedCard(null);
                setCardError(null);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'w-full p-4 flex items-center gap-3 rounded-lg border-2 transition-all',
                useNewCard
                  ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                  : 'border-neutral-200 hover:border-neutral-300 border-dashed'
              )}
              disabled={isProcessing}
            >
              {/* Radio indicator */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                useNewCard ? 'border-gold bg-gold' : 'border-neutral-300'
              )}>
                {useNewCard && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>

              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>

              <span className="font-medium text-neutral-700">Use a new card</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Loading Saved Cards */}
      {loadingSavedCards && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading saved cards...</span>
        </div>
      )}

      {/* Card Element - Only show for new card */}
      <AnimatePresence>
        {(useNewCard || savedCards.length === 0) && !loadingSavedCards && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-neutral-700 mb-3">Card Information</label>

            {/* Accepted Cards Banner */}
            <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
              <span>We accept:</span>
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">
                  <span className="font-semibold text-neutral-700">VISA</span>
                </div>
                <div className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">
                  <span className="font-semibold text-neutral-700">MC</span>
                </div>
                <div className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">
                  <span className="font-semibold text-neutral-700">AMEX</span>
                </div>
                <div className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">
                  <span className="font-semibold text-neutral-700">DISC</span>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'relative p-4 bg-white border-2 rounded-lg transition-all duration-300',
                cardError ? 'border-red-500 shake' : 'border-neutral-200 hover:border-neutral-300',
                'focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10',
                cardComplete && !cardError && 'border-green-500 bg-green-50/20'
              )}
            >
              <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />

          {/* Success Checkmark - Only show when card is complete */}
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
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {cardError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{cardError}</span>
            </p>
          </motion.div>
        )}

        {/* Card Tips */}
            <div className="mt-2 text-xs text-neutral-500 flex items-start gap-1.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your payment info is encrypted end-to-end. We never see or store your full card details.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Card Checkbox - Only show for new cards */}
      {(useNewCard || savedCards.length === 0) && !loadingSavedCards && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3"
      >
        <input
          type="checkbox"
          id="saveCard"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          disabled={isProcessing}
          className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-gold focus:ring-gold focus:ring-offset-0"
        />
        <div>
          <label htmlFor="saveCard" className="text-sm text-neutral-700 cursor-pointer block">
            Save card for future purchases
          </label>
          <p className="text-xs text-neutral-500 mt-1">
            Your card will be securely stored for faster checkout next time
          </p>
        </div>
      </motion.div>
      )}

      {/* Billing Address */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3"
      >
        <input
          type="checkbox"
          id="billingAddress"
          checked={billingIsSame}
          onChange={(e) => handleBillingChange(e.target.checked)}
          disabled={isProcessing}
          className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-gold focus:ring-gold focus:ring-offset-0"
        />
        <label htmlFor="billingAddress" className="text-sm text-neutral-700 cursor-pointer">
          Billing address is the same as shipping address
        </label>
      </motion.div>

      {/* Security Badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-lg"
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {/* SSL Badge */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* PCI Badge */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Stripe Badge */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900">Powered by Stripe</p>
              <p className="text-xs text-neutral-500">Trusted Payments</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Total Amount */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-gradient-to-br from-gold/5 to-transparent border-2 border-gold/20 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 mb-1">Total Amount</p>
            <p className="text-3xl font-serif font-bold text-gold">${formatCurrencyAmount(amount, 2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">You will be charged</p>
            <p className="text-sm font-medium text-neutral-700 mt-1">One-time payment</p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </motion.button>
        )}
        <motion.button
          type="submit"
          disabled={isProcessing || !stripe || loadingSavedCards || (useNewCard ? !cardComplete : !selectedSavedCard)}
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          className={cn(
            "flex-1 px-6 py-5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 relative overflow-hidden",
            isProcessing || !stripe || loadingSavedCards || (useNewCard ? !cardComplete : !selectedSavedCard)
              ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              : "bg-gradient-to-r from-gold via-amber-500 to-gold bg-size-200 animate-gradient text-white shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40"
          )}
        >
          {/* Shimmer Effect */}
          {!isProcessing && stripe && !loadingSavedCards && (useNewCard ? cardComplete : !!selectedSavedCard) && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}

          <div className="relative z-10 flex items-center gap-2">
            {isProcessing ? (
              <>
                <div className="relative">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                </div>
                <span className="font-semibold">Processing Payment...</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ●●●
                </motion.span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-lg">Pay ${formatCurrencyAmount(amount, 2)}</span>
              </>
            )}
          </div>
        </motion.button>

      </div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <p className="text-xs text-center text-neutral-500">
          Your payment information is encrypted and secure. We never store your full card details.
        </p>
        <p className="text-xs text-center text-neutral-500">
          By completing your purchase, you agree to our{' '}
          <Link href="/terms" className="text-gold hover:text-accent-700 transition-colors">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-gold hover:text-accent-700 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </motion.div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% 200%;
        }

        /* Prevent browser autocomplete yellow background */
        .StripeElement input:-webkit-autofill,
        .StripeElement input:-webkit-autofill:hover,
        .StripeElement input:-webkit-autofill:focus,
        .StripeElement input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #000000 !important;
          background-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Ensure Stripe iframe has proper background */
        .StripeElement iframe {
          background-color: transparent !important;
        }
      `}</style>
    </motion.form>
  );
}
