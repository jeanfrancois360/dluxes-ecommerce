'use client';

import { CreditCard } from 'lucide-react';
import useSWR from 'swr';
import { settingsApi } from '@/lib/api/settings';

export type PaymentMethod = 'stripe' | 'paypal';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
}

/**
 * Hook to get payment method availability from system settings.
 * Returns which methods are enabled and a sensible default.
 */
export function usePaymentMethods() {
  const { data: settings } = useSWR('/settings/public', settingsApi.getPublicSettings, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const getSetting = (key: string) => {
    const s = settings?.find((s: any) => s.key === key);
    if (!s) return undefined;
    if (s.value === 'true' || s.value === true) return true;
    if (s.value === 'false' || s.value === false) return false;
    return s.value;
  };

  // Default to enabled if setting doesn't exist
  const stripeEnabled = getSetting('stripe_enabled') !== false;
  const paypalEnabled = getSetting('paypal_enabled') !== false;

  const defaultMethod: PaymentMethod = stripeEnabled
    ? 'stripe'
    : paypalEnabled
      ? 'paypal'
      : 'stripe';

  return { stripeEnabled, paypalEnabled, defaultMethod };
}

export function PaymentMethodSelector({
  selected,
  onChange,
  disabled = false,
  stripeEnabled = true,
  paypalEnabled = true,
}: PaymentMethodSelectorProps) {
  // If only one method is available, don't show the selector
  if (stripeEnabled && !paypalEnabled) return null;
  if (paypalEnabled && !stripeEnabled) return null;
  if (!stripeEnabled && !paypalEnabled) return null;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
      <div className="grid grid-cols-2 gap-3">
        {/* Stripe / Card */}
        {stripeEnabled && (
          <button
            type="button"
            onClick={() => onChange('stripe')}
            disabled={disabled}
            className={`
              relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all
              ${
                selected === 'stripe'
                  ? 'border-[#CBB57B] bg-[#CBB57B]/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selected === 'stripe'
                  ? 'bg-[#CBB57B]/15 text-[#CBB57B]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div
                className={`text-sm font-semibold ${
                  selected === 'stripe' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                Credit / Debit Card
              </div>
              <div className="text-xs text-gray-400">Visa, Mastercard, Amex</div>
            </div>
            {selected === 'stripe' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#CBB57B] rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )}

        {/* PayPal */}
        {paypalEnabled && (
          <button
            type="button"
            onClick={() => onChange('paypal')}
            disabled={disabled}
            className={`
              relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all
              ${
                selected === 'paypal'
                  ? 'border-[#0070ba] bg-[#0070ba]/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selected === 'paypal'
                  ? 'bg-[#0070ba]/15 text-[#0070ba]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z" />
              </svg>
            </div>
            <div className="text-left">
              <div
                className={`text-sm font-semibold ${
                  selected === 'paypal' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                PayPal
              </div>
              <div className="text-xs text-gray-400">Pay with PayPal account</div>
            </div>
            {selected === 'paypal' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#0070ba] rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
