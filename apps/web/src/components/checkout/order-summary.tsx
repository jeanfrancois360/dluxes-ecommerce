'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Building2, User } from 'lucide-react';
import { cn } from '@nextpik/ui';
import type { CartItem } from '@/contexts/cart-context';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useSelectedCurrency, useCurrencyConverter, useCurrencyRates } from '@/hooks/use-currency';
import { useTranslations } from 'next-intl';

interface SellerTaxBreakdownItem {
  storeId: string;
  storeName: string;
  businessType: string | null;
  taxHandling: 'NEXTPIK_COLLECTS' | 'PRICE_INCLUSIVE';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  jurisdiction: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  cartCurrency?: string;
  shippingMethod?: {
    name: string;
    price: number;
    estimatedDays?: number;
  };
  promoCode?: string;
  discount?: number;
  couponDiscount?: number;
  appliedCouponCode?: string;
  onApplyCoupon?: (
    code: string
  ) => Promise<{ success: boolean; discount?: number; message?: string }>;
  onRemoveCoupon?: () => void;
  className?: string;
  hasShippingAddress?: boolean;
  isLoadingShipping?: boolean;
  taxBreakdown?: {
    sellerBreakdown: SellerTaxBreakdownItem[];
    hasTaxInclusiveItems: boolean;
    hasTaxableItems: boolean;
  };
}

export function OrderSummary({
  items,
  subtotal,
  shipping,
  tax,
  total,
  cartCurrency = 'USD',
  shippingMethod,
  promoCode,
  discount = 0,
  couponDiscount = 0,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  className,
  hasShippingAddress = false,
  isLoadingShipping = false,
  taxBreakdown,
}: OrderSummaryProps) {
  const t = useTranslations('components.orderSummary');
  const [isSticky, setIsSticky] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(appliedCouponCode || promoCode || '');
  const [promoError, setPromoError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

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

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setPromoError(t('pleaseEnterPromoCode'));
      return;
    }

    if (onApplyCoupon) {
      setIsApplyingCoupon(true);
      setPromoError('');
      const result = await onApplyCoupon(promoInput.trim().toUpperCase());
      setIsApplyingCoupon(false);
      if (result.success) {
        setAppliedPromo(promoInput.trim().toUpperCase());
        setShowPromo(false);
      } else {
        setPromoError(result.message || 'Invalid coupon code.');
      }
    } else {
      // Fallback: local-only (no API)
      setAppliedPromo(promoInput.toUpperCase());
      setPromoError('');
      setShowPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo('');
    setPromoInput('');
    onRemoveCoupon?.();
  };

  const finalTotal = total - discount - couponDiscount;

  // Helper function to format prices with cart's locked currency
  // 🔒 UPDATED: Uses cartCurrency to prevent double conversion of locked totals
  const formatWithCurrency = (
    amount: number,
    shouldConvert: boolean = false,
    fromCurrency?: string
  ) => {
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

  const ITEMS_PREVIEW_COUNT = 3;
  const visibleItems = showAllItems ? items : items.slice(0, ITEMS_PREVIEW_COUNT);
  const hiddenCount = items.length - ITEMS_PREVIEW_COUNT;

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
        <h2 className="text-xl font-serif font-bold text-black">{t('orderSummary')}</h2>
        <p className="text-sm text-neutral-600 mt-1">
          {items.length} {items.length === 1 ? t('item') : t('items')}
        </p>
      </div>

      {/* Items List */}
      <div className="max-h-64 overflow-y-auto p-6 space-y-4">
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3"
          >
            {/* Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
              <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
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
                <span className="text-xs text-neutral-500">
                  {t('qty')}: {item.quantity}
                </span>
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

        {/* Show more / less toggle */}
        {items.length > ITEMS_PREVIEW_COUNT && (
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="w-full pt-2 text-sm text-neutral-500 hover:text-black transition-colors font-medium flex items-center justify-center gap-1"
          >
            {showAllItems ? (
              <>
                Show less
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                Show {hiddenCount} more {hiddenCount === 1 ? 'item' : 'items'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}
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
                <svg
                  className="w-5 h-5 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                {t('addPromoCode')}
              </span>
              <svg
                className={cn('w-5 h-5 transition-transform', showPromo && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
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
                      placeholder={t('enterCode')}
                      className={cn(
                        'flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold transition-colors',
                        promoError ? 'border-red-500' : 'border-neutral-200'
                      )}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={isApplyingCoupon}
                      className="flex-shrink-0 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors whitespace-nowrap disabled:opacity-60"
                    >
                      {isApplyingCoupon ? '...' : t('apply')}
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-500 mt-1 px-1">{promoError}</p>}
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
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">
                  {t('code')}: {appliedPromo}
                </p>
                <p className="text-xs text-green-700">{t('discountApplied')}</p>
              </div>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <div className="p-6 border-t border-neutral-200 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">
            {t('subtotal')}{' '}
            <span className="text-neutral-400">
              ({items.length} {items.length === 1 ? t('item') : t('items')})
            </span>
          </span>
          <span className="font-medium text-neutral-900">
            {formatWithCurrency(subtotal, false)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-neutral-500">{t('shipping')}</span>
            {hasShippingAddress && shippingMethod && (
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight truncate">
                {shippingMethod.name}
                {shippingMethod.estimatedDays != null && (
                  <span> · {shippingMethod.estimatedDays}d est.</span>
                )}
              </p>
            )}
          </div>
          <span className="font-medium flex-shrink-0">
            {isLoadingShipping ? (
              <span className="inline-block w-14 h-4 bg-neutral-200 rounded animate-pulse" />
            ) : !hasShippingAddress ? (
              <span className="text-neutral-400 text-xs">{t('calculatedAtNextStep')}</span>
            ) : shipping === 0 ? (
              <span className="text-emerald-600 font-semibold">{t('free')}</span>
            ) : (
              <span className="text-neutral-900">{formatWithCurrency(shipping, false)}</span>
            )}
          </span>
        </div>

        {/* Tax — expandable per-seller breakdown */}
        <div>
          <button
            type="button"
            onClick={() => hasShippingAddress && taxBreakdown && setShowTaxBreakdown((v) => !v)}
            className={cn(
              'w-full flex items-center justify-between text-sm',
              hasShippingAddress && taxBreakdown && 'cursor-pointer group'
            )}
          >
            <span className="flex items-center gap-1.5 text-neutral-500">
              {hasShippingAddress ? 'Tax' : t('taxEstimated')}
              {hasShippingAddress && taxBreakdown && (
                <>
                  {taxBreakdown.hasTaxInclusiveItems && taxBreakdown.hasTaxableItems && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      Mixed
                    </span>
                  )}
                  {taxBreakdown.hasTaxInclusiveItems && !taxBreakdown.hasTaxableItems && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Included
                    </span>
                  )}
                  {taxBreakdown.sellerBreakdown.length > 0 && (
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-neutral-400 transition-transform duration-200',
                        showTaxBreakdown && 'rotate-180'
                      )}
                    />
                  )}
                </>
              )}
            </span>
            <span className="font-medium">
              {isLoadingShipping ? (
                <span className="inline-block w-12 h-4 bg-neutral-200 rounded animate-pulse" />
              ) : !hasShippingAddress ? (
                <span className="text-neutral-400 text-xs">{t('calculatedAtNextStep')}</span>
              ) : tax === 0 &&
                taxBreakdown?.hasTaxInclusiveItems &&
                !taxBreakdown.hasTaxableItems ? (
                <span className="text-emerald-600 font-semibold text-xs">Included</span>
              ) : (
                <span className="text-neutral-900">{formatWithCurrency(tax, false)}</span>
              )}
            </span>
          </button>

          {/* Per-seller tax breakdown accordion */}
          <AnimatePresence>
            {hasShippingAddress && showTaxBreakdown && taxBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 pl-1">
                  {taxBreakdown.sellerBreakdown.map((seller) => (
                    <div
                      key={seller.storeId}
                      className={cn(
                        'flex items-start justify-between gap-2 px-3 py-2 rounded-lg text-xs border',
                        seller.taxHandling === 'PRICE_INCLUSIVE'
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-amber-50 border-amber-100'
                      )}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        {seller.taxHandling === 'PRICE_INCLUSIVE' ? (
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 truncate">
                            {seller.storeName}
                          </p>
                          {seller.taxHandling === 'PRICE_INCLUSIVE' ? (
                            <p className="text-emerald-700 mt-0.5">Tax included in price</p>
                          ) : (
                            <p className="text-amber-700 mt-0.5">
                              {(seller.taxRate * 100).toFixed(0)}% · {seller.jurisdiction}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {seller.taxHandling === 'PRICE_INCLUSIVE' ? (
                          <span className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">
                            Incl.
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold">
                            {formatWithCurrency(seller.taxAmount, false)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-neutral-400 pl-1 pt-0.5">
                    Tax on non-registered seller items is collected by NextPik
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Store credit / discount */}
        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between text-sm"
          >
            <span className="text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Store credit
            </span>
            <span className="font-semibold text-emerald-600">
              −{formatWithCurrency(discount, false)}
            </span>
          </motion.div>
        )}

        {/* Coupon discount */}
        {couponDiscount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between text-sm"
          >
            <span className="text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Coupon
            </span>
            <span className="font-semibold text-emerald-600">
              −{formatWithCurrency(couponDiscount, false)}
            </span>
          </motion.div>
        )}

        {/* Total */}
        <div className="pt-4 mt-1 border-t-2 border-neutral-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-base font-bold text-neutral-900">{t('total')}</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {cartCurrency !== 'USD' ? `All amounts in ${cartCurrency}` : 'Including all taxes'}
              </p>
            </div>
            <div className="text-right">
              {(discount > 0 || couponDiscount > 0) && (
                <p className="text-xs text-neutral-400 line-through mb-0.5">
                  {formatWithCurrency(total, false)}
                </p>
              )}
              <p className="text-2xl font-serif font-bold text-gold">
                {formatWithCurrency(finalTotal, false)}
              </p>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <svg
                className="w-4 h-4 text-emerald-500"
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
              <span className="text-[11px]">Buyer Protection</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <svg
                className="w-4 h-4 text-neutral-500"
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
              <span className="text-[11px]">SSL Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <svg
                className="w-4 h-4 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-[11px]">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
