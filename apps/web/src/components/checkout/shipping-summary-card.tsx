'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface ShippingSummaryCardProps {
  shippingMethod?: {
    name: string;
    price: number;
    estimatedDays: string;
  };
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  currency?: string; // e.g. 'USD', 'EUR', 'RWF'
}

export function ShippingSummaryCard({
  shippingMethod,
  shippingAddress,
  currency = 'USD',
}: ShippingSummaryCardProps) {
  const currencySymbol = useMemo(() => {
    try {
      return (
        new Intl.NumberFormat('en', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? '$'
      );
    } catch {
      return '$';
    }
  }, [currency]);
  if (!shippingMethod && !shippingAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4"
    >
      <h4 className="text-sm font-semibold text-neutral-900">Selected Shipping</h4>

      {shippingAddress && (
        <div className="text-sm">
          <p className="font-medium text-neutral-900">
            {shippingAddress.firstName} {shippingAddress.lastName}
          </p>
          <p className="text-neutral-600 mt-1">{shippingAddress.addressLine1}</p>
          <p className="text-neutral-600">
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
        </div>
      )}

      {shippingMethod && (
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{shippingMethod.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{shippingMethod.estimatedDays}</p>
            </div>
            <p className="text-sm font-semibold text-gold">
              {shippingMethod.price === 0
                ? 'Free'
                : `${currencySymbol}${formatCurrencyAmount(shippingMethod.price, 2)}`}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
