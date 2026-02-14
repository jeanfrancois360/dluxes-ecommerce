'use client';

import { motion } from 'framer-motion';
import { cn } from '@nextpik/ui';
import Image from 'next/image';

export type PaymentMethodType = 'stripe' | 'paypal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'stripe' as PaymentMethodType,
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
      ),
      logos: (
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="text-xs font-bold text-neutral-800 px-1.5 py-0.5 bg-white rounded border border-neutral-200">
            VISA
          </span>
          <span className="text-xs font-bold text-neutral-800 px-1.5 py-0.5 bg-white rounded border border-neutral-200">
            MC
          </span>
          <span className="text-xs font-bold text-neutral-800 px-1.5 py-0.5 bg-white rounded border border-neutral-200">
            AMEX
          </span>
          <span className="text-xs font-bold text-neutral-800 px-1.5 py-0.5 bg-white rounded border border-neutral-200">
            DISC
          </span>
        </div>
      ),
    },
    {
      id: 'paypal' as PaymentMethodType,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
          <Image
            src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
            alt="PayPal"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      ),
      logos: <span className="text-xs font-semibold text-blue-600">Secure checkout</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-serif font-semibold mb-2">Payment Method</h3>
        <p className="text-sm text-neutral-600">Select how you'd like to pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method, index) => (
          <motion.label
            key={method.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative cursor-pointer group block',
              'p-5 rounded-xl border-2 transition-all duration-300',
              selectedMethod === method.id
                ? method.id === 'paypal'
                  ? 'border-gold bg-gradient-to-br from-amber-50 to-white shadow-lg ring-2 ring-gold/20'
                  : 'border-neutral-300 bg-white shadow-md'
                : 'border-neutral-200 hover:border-neutral-300 bg-white hover:shadow-sm'
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => onMethodChange(method.id)}
              className="sr-only"
            />

            <div className="flex items-center gap-4">
              {/* Radio Indicator */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                    selectedMethod === method.id
                      ? 'border-gold bg-gold'
                      : 'border-neutral-300 bg-white group-hover:border-gold/50'
                  )}
                >
                  {selectedMethod === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Icon */}
              <div className="flex-shrink-0">{method.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-neutral-900 mb-1 text-base">{method.name}</h4>
                <p className="text-sm text-neutral-600 mb-2.5">{method.description}</p>
                <div className="mt-1">{method.logos}</div>
              </div>

              {/* Selected Badge */}
              {selectedMethod === method.id && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute top-3 right-3"
                >
                  <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-md">
                    <svg
                      className="w-5 h-5 text-white"
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
            </div>
          </motion.label>
        ))}
      </div>
    </div>
  );
}
