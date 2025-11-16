'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { cn } from '@luxury/ui';
import type { StripeCardElementOptions } from '@stripe/stripe-js';

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
      '::placeholder': {
        color: '#737373',
      },
      iconColor: '#CBB57B',
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

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleBillingChange = (same: boolean) => {
    setBillingIsSame(same);
    onBillingAddressChange?.(same);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
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

    setIsProcessing(true);
    setCardError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
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
        <p className="text-sm text-neutral-600">Enter your card information to complete your order</p>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Card Information</label>
        <div
          className={cn(
            'p-4 bg-white border-2 rounded-lg transition-all duration-300',
            cardError ? 'border-red-500' : 'border-neutral-200 hover:border-neutral-300',
            'focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10'
          )}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
        </div>
        {cardError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {cardError}
          </motion.p>
        )}
      </div>

      {/* Save Card Checkbox */}
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
            <p className="text-3xl font-serif font-bold text-gold">${amount.toFixed(2)}</p>
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
          disabled={isProcessing || !stripe || !cardComplete}
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          className="flex-1 bg-gradient-to-r from-gold to-amber-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-gold/90 hover:to-amber-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
        >
          {isProcessing ? (
            <>
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
              Processing Payment...
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
              Pay ${amount.toFixed(2)}
            </>
          )}
        </motion.button>
      </div>

      {/* Privacy Notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-center text-neutral-500"
      >
        Your payment information is encrypted and secure. We never store your full card details.
      </motion.p>
    </motion.form>
  );
}
