'use client';

import { motion } from 'framer-motion';
import { cn } from '@nextpik/ui';

export type PaymentMethodType = 'stripe' | 'paypal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({ selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'stripe' as PaymentMethodType,
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      logos: (
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-neutral-600">VISA</span>
          <span className="text-xs font-semibold text-neutral-600">MC</span>
          <span className="text-xs font-semibold text-neutral-600">AMEX</span>
          <span className="text-xs font-semibold text-neutral-600">DISC</span>
        </div>
      ),
    },
    {
      id: 'paypal' as PaymentMethodType,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h8.44c2.82 0 4.806 1.584 5.117 4.084.177 1.426-.047 2.54-.67 3.318-.805 1.007-2.22 1.515-4.207 1.515H11.73a.77.77 0 0 0-.76.653l-.542 3.446-.021.133-.76 4.824a.641.641 0 0 1-.633.653h-.938z" />
          <path
            opacity=".7"
            d="M19.175 7.925c-.177.944-.664 1.624-1.456 2.034-1.007.52-2.364.624-4.053.312l-.542 3.446a.641.641 0 0 1-.633.653h-3.58l-.76 4.824a.641.641 0 0 1-.633.653H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h8.44c2.82 0 4.806 1.584 5.117 4.084 0 .414-.047.828-.086 1.242z"
          />
        </svg>
      ),
      logos: (
        <span className="text-xs font-semibold text-blue-600">Secure checkout</span>
      ),
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
              'p-6 rounded-lg border-2 transition-all duration-300',
              selectedMethod === method.id
                ? 'border-gold bg-gradient-to-br from-gold/5 to-transparent shadow-lg'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
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

            <div className="flex items-start gap-4">
              {/* Radio Indicator */}
              <div className="flex-shrink-0 pt-1">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                    selectedMethod === method.id
                      ? 'border-gold bg-gold'
                      : 'border-neutral-300 bg-white group-hover:border-neutral-400'
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
              <div
                className={cn(
                  'flex-shrink-0 p-3 rounded-lg transition-colors duration-300',
                  selectedMethod === method.id
                    ? method.id === 'paypal'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gold/10 text-gold'
                    : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                )}
              >
                {method.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-black mb-1">{method.name}</h4>
                <p className="text-sm text-neutral-600 mb-2">{method.description}</p>
                {method.logos}
              </div>

              {/* Selected Badge */}
              {selectedMethod === method.id && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute top-4 right-4"
                >
                  <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
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
