'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@nextpik/ui';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  calculateShippingCost,
  getEstimatedDeliveryDate,
  FREE_SHIPPING_THRESHOLD,
  getAmountNeededForFreeShipping,
  SHIPPING_METHODS as SHIPPING_CONFIG,
} from '@/lib/shipping-config';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedDays: string | number;
  icon?: React.ReactNode;
  carrier?: string;
}

interface ShippingMethodProps {
  selectedMethod?: string;
  onSelect: (methodId: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  subtotal: number; // Add subtotal for free shipping calculation
  shippingOptions?: ShippingMethod[]; // Dynamic shipping options from backend
  isLoadingOptions?: boolean;
  currency?: string; // Currency code (e.g., 'EUR', 'USD')
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered via USPS or UPS',
    price: 10,
    estimatedDays: '5-7 business days',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered via FedEx or UPS',
    price: 25,
    estimatedDays: '2-3 business days',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    id: 'nextday',
    name: 'Next Day Delivery',
    description: 'Delivered via FedEx overnight',
    price: 50,
    estimatedDays: '1 business day',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export function ShippingMethodSelector({
  selectedMethod = 'standard',
  onSelect,
  onContinue,
  onBack,
  isLoading,
  subtotal,
  shippingOptions, // Dynamic options from backend
  isLoadingOptions,
  currency = 'USD', // Default to USD if not provided
}: ShippingMethodProps) {
  const [selected, setSelected] = useState(selectedMethod);

  // Get currency symbol using Intl API
  const currencySymbol = useMemo(() => {
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0).replace(/\d/g, '').trim();
    } catch {
      return '$'; // Fallback to USD symbol
    }
  }, [currency]);

  // Use dynamic options from backend if available, fallback to hardcoded
  const methods = useMemo((): ShippingMethod[] => {
    if (shippingOptions && shippingOptions.length > 0) {
      // Backend provided options - transform to component format
      return shippingOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        description: opt.carrier ? `Delivered via ${opt.carrier}` : undefined,
        price: opt.price,
        estimatedDays: typeof opt.estimatedDays === 'number'
          ? `${opt.estimatedDays} business days`
          : String(opt.estimatedDays),
        carrier: opt.carrier,
        icon: undefined, // Backend options don't have icons
      }));
    }
    // Fallback to hardcoded options
    return SHIPPING_METHODS;
  }, [shippingOptions]);

  // Check if we're using backend options (they already have calculated prices)
  const usingBackendOptions = shippingOptions && shippingOptions.length > 0;

  // Calculate shipping costs dynamically based on subtotal
  // Only use calculateShippingCost for hardcoded options
  const shippingCalculations = useMemo(() => {
    return methods.reduce((acc, method) => {
      if (usingBackendOptions) {
        // Backend already calculated prices, use them directly
        acc[method.id] = {
          methodId: method.id,
          finalPrice: method.price,
          originalPrice: method.price,
          isFree: method.price === 0,
          discount: 0,
          qualifiesForFreeShipping: method.price === 0,
        };
      } else {
        // Use frontend calculation for hardcoded options
        acc[method.id] = calculateShippingCost(method.id, subtotal);
      }
      return acc;
    }, {} as Record<string, ReturnType<typeof calculateShippingCost>>);
  }, [methods, subtotal, usingBackendOptions]);

  // Check if qualifies for free shipping
  const amountNeededForFreeShipping = useMemo(() => {
    return getAmountNeededForFreeShipping(subtotal);
  }, [subtotal]);

  const handleSelect = (methodId: string) => {
    setSelected(methodId);
    onSelect(methodId);
  };

  const handleContinue = () => {
    if (selected) {
      onContinue();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-serif font-semibold mb-2">Shipping Method</h3>
        <p className="text-sm text-neutral-600">Select your preferred shipping option</p>
      </div>

      <div className="space-y-4">
        {isLoadingOptions ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-lg border-2 border-neutral-200 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-neutral-200 rounded-full" />
                  <div className="w-12 h-12 bg-neutral-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-neutral-200 rounded w-1/3" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                  </div>
                  <div className="h-6 bg-neutral-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          methods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
            <label
              className={cn(
                'block cursor-pointer group',
                isLoading && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="radio"
                name="shipping-method"
                value={method.id}
                checked={selected === method.id}
                onChange={() => handleSelect(method.id)}
                disabled={isLoading}
                className="sr-only"
              />
              <motion.div
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className={cn(
                  'relative p-6 rounded-lg border-2 transition-all duration-300',
                  selected === method.id
                    ? 'border-gold bg-gradient-to-br from-gold/5 to-transparent shadow-lg'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white',
                  'flex items-start gap-4'
                )}
              >
                {/* Radio Indicator */}
                <div className="flex-shrink-0 pt-1">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                      selected === method.id
                        ? 'border-gold bg-gold'
                        : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                    )}
                  >
                    {selected === method.id && (
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
                    selected === method.id
                      ? 'bg-gold/10 text-gold'
                      : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                  )}
                >
                  {method.icon || (
                    // Default shipping icon if none provided
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="font-semibold text-black">{method.name}</h4>
                    <div className="text-right flex-shrink-0">
                      {shippingCalculations[method.id]?.isFree ? (
                        <div className="flex flex-col items-end">
                          <p className="text-lg font-serif font-bold text-green-600">Free</p>
                          <p className="text-xs text-neutral-400 line-through">
                            {currencySymbol}{formatCurrencyAmount(shippingCalculations[method.id].originalPrice, 2)}
                          </p>
                        </div>
                      ) : (
                        <p
                          className={cn(
                            'text-lg font-serif font-bold',
                            selected === method.id ? 'text-gold' : 'text-black'
                          )}
                        >
                          {currencySymbol}{formatCurrencyAmount(shippingCalculations[method.id]?.finalPrice || method.price, 2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{method.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <svg
                      className="w-4 h-4 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-neutral-600">
                      {typeof method.estimatedDays === 'number'
                        ? `${method.estimatedDays} business days`
                        : method.estimatedDays}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-500">
                      Est. delivery: {getEstimatedDeliveryDate(String(method.estimatedDays))}
                    </span>
                  </div>
                </div>

                {/* Selected Badge */}
                {selected === method.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
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
              </motion.div>
            </label>
          </motion.div>
          ))
        )}
      </div>

      {/* Info Banner - Dynamic based on subtotal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          'p-4 border rounded-lg flex gap-3',
          amountNeededForFreeShipping > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        )}
      >
        <svg
          className={cn(
            'w-5 h-5 flex-shrink-0 mt-0.5',
            amountNeededForFreeShipping > 0 ? 'text-amber-600' : 'text-green-600'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              amountNeededForFreeShipping > 0
                ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            }
          />
        </svg>
        <div className="text-sm">
          {amountNeededForFreeShipping > 0 ? (
            <>
              <p className="text-amber-900 font-medium">
                Add {currencySymbol}{formatCurrencyAmount(amountNeededForFreeShipping, 2)} more to qualify for free
                shipping!
              </p>
              <p className="text-amber-700 mt-1">
                Free shipping available on orders over {currencySymbol}{formatCurrencyAmount(FREE_SHIPPING_THRESHOLD, 2)}
              </p>
            </>
          ) : (
            <>
              <p className="text-green-900 font-medium">You qualify for free shipping!</p>
              <p className="text-green-700 mt-1">
                Your order meets the {currencySymbol}{formatCurrencyAmount(FREE_SHIPPING_THRESHOLD, 2)} minimum for
                complimentary delivery
              </p>
            </>
          )}
          <p className={cn('mt-1', amountNeededForFreeShipping > 0 ? 'text-amber-600' : 'text-green-600')}>
            All orders are insured and require signature upon delivery
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={handleContinue}
          disabled={isLoading || !selected}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
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
              Processing...
            </>
          ) : (
            <>
              Continue to Payment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
