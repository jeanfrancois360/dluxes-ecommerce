'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nextpik/ui';
import type { CartItem } from '@/contexts/cart-context';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useSelectedCurrency, useCurrencyConverter, useCurrencyRates } from '@/hooks/use-currency';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  cartCurrency?: string; // 🔒 Cart's locked currency
  shippingMethod?: {
    name: string;
    price: number;
  };
  promoCode?: string;
  discount?: number;
  className?: string;
}

export function OrderSummary({
  items,
  subtotal,
  shipping,
  tax,
  total,
  cartCurrency = 'USD', // 🔒 Default to USD if not provided
  shippingMethod,
  promoCode,
  discount = 0,
  className,
}: OrderSummaryProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(promoCode || '');
  const [promoError, setPromoError] = useState('');

  // Use currency from the selected currency context
  const { currency } = useSelectedCurrency();
  const { convertPrice } = useCurrencyConverter();
  const { allCurrencies } = useCurrencyRates();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    // Here you would validate the promo code with your API
    // For now, we'll just simulate success
    setAppliedPromo(promoInput.toUpperCase());
    setPromoError('');
    setShowPromo(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo('');
    setPromoInput('');
  };

  const finalTotal = total - discount;

  // Helper function to format prices with cart's locked currency
  // 🔒 UPDATED: Uses cartCurrency to prevent double conversion of locked totals
  const formatWithCurrency = (amount: number, shouldConvert: boolean = false, fromCurrency?: string) => {
    // Determine which currency to use for formatting
    // For totals (subtotal, shipping, tax, total), use cartCurrency
    // For item prices, use their currencyAtAdd
    const currencyCode = fromCurrency || cartCurrency;
    const currencyToUse = allCurrencies.find((c) => c.currencyCode === currencyCode) || currency;

    if (!currencyToUse) return `$${formatCurrencyAmount(amount, 2)}`;

    // Convert from USD ONLY if shouldConvert is true and price is in USD
    // For locked prices (priceAtAdd) and locked totals, shouldConvert will be false
    const displayAmount = shouldConvert ? convertPrice(amount, 'USD') : amount;

    const formatted = formatCurrencyAmount(displayAmount, currencyToUse.decimalDigits);
    if (currencyToUse.position === 'before') {
      return `${currencyToUse.symbol}${formatted}`;
    }
    return `${formatted} ${currencyToUse.symbol}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white border-2 border-neutral-200 rounded-lg overflow-hidden',
        isSticky && 'sticky top-24',
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
        <h2 className="text-xl font-serif font-bold text-black">Order Summary</h2>
        <p className="text-sm text-neutral-600 mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Items List */}
      <div className="max-h-64 overflow-y-auto p-6 space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3"
          >
            {/* Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover"
              />
              {/* Quantity Badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {item.quantity}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {item.brand && (
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-0.5">
                  {item.brand}
                </p>
              )}
              <h4 className="text-sm font-medium text-black truncate">{item.name}</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-neutral-500">Qty: {item.quantity}</span>
                <span className="text-sm font-serif font-semibold text-gold">
                  {/* 🔒 Use locked price (priceAtAdd) if available, otherwise convert from USD */}
                  {formatWithCurrency(
                    (item.priceAtAdd !== undefined ? item.priceAtAdd : item.price) * item.quantity,
                    item.priceAtAdd === undefined, // Only convert if no locked price
                    item.currencyAtAdd || 'USD' // Use item's locked currency
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className="px-6 pb-4">
        {!appliedPromo ? (
          <div>
            <button
              onClick={() => setShowPromo(!showPromo)}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-gold transition-colors text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Add Promo Code
              </span>
              <svg
                className={cn('w-5 h-5 transition-transform', showPromo && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {showPromo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      placeholder="Enter code"
                      className={cn(
                        'flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold transition-colors',
                        promoError ? 'border-red-500' : 'border-neutral-200'
                      )}
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-red-500 mt-1 px-1">{promoError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">Code: {appliedPromo}</p>
                <p className="text-xs text-green-700">Discount applied!</p>
              </div>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <div className="p-6 border-t border-neutral-200 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-medium text-black">{formatWithCurrency(subtotal, false)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className="text-neutral-600">Shipping</span>
            {shippingMethod && (
              <span className="text-xs text-neutral-500">({shippingMethod.name})</span>
            )}
          </div>
          <span className="font-medium text-black">
            {shipping === 0 ? (
              <span className="text-green-600 font-semibold">Free</span>
            ) : (
              formatWithCurrency(shipping, false)
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Tax (estimated)</span>
          <span className="font-medium text-black">{formatWithCurrency(tax, false)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between text-sm"
          >
            <span className="text-green-600">Discount</span>
            <span className="font-medium text-green-600">-{formatWithCurrency(discount, false)}</span>
          </motion.div>
        )}

        {/* Total */}
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-serif font-bold text-black">Total</span>
            <div className="text-right">
              {discount > 0 && (
                <p className="text-sm text-neutral-500 line-through">{formatWithCurrency(total, false)}</p>
              )}
              <p className="text-2xl font-serif font-bold text-gold">{formatWithCurrency(finalTotal, false)}</p>
            </div>
          </div>
        </div>

        {/* Free Shipping Info */}
        {shipping > 0 && subtotal < 200 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-xs text-blue-900">
              Add <strong className="font-semibold">{formatWithCurrency(200 - subtotal)}</strong> more for{' '}
              <strong className="font-semibold text-gold">free shipping</strong>
            </p>
          </motion.div>
        )}

        {/* Security Info */}
        <div className="pt-3 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure checkout with SSL encryption</span>
        </div>
      </div>
    </motion.div>
  );
}
