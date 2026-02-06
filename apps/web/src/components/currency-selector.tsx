'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';
import { useCart } from '@/hooks/use-cart';
import { useTranslations } from 'next-intl';

export function CurrencySelector() {
  const t = useTranslations('components.currencySelector');
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currencies, isLoading } = useCurrencyRates();
  const { currency, selectedCurrency, setSelectedCurrency } = useSelectedCurrency();
  const { items, clearCart, isCurrencyLocked, cartCurrency, exchangeRate, handleCurrencyChange } =
    useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (currencyCode: string) => {
    // 🔒 Use new cart context currency change handler
    const result = await handleCurrencyChange(currencyCode);

    if (!result.allowed) {
      // Currency locked - show confirmation modal
      setPendingCurrency(currencyCode);
      setShowConfirmModal(true);
      setIsOpen(false);
    } else {
      // Allowed - proceed with currency change
      setSelectedCurrency(currencyCode);
      setIsOpen(false);
    }
  };

  const handleConfirmCurrencyChange = async () => {
    if (!pendingCurrency) return;

    try {
      // Clear cart and change currency
      await clearCart();
      setSelectedCurrency(pendingCurrency);
      setShowConfirmModal(false);
      setPendingCurrency(null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const handleCancelCurrencyChange = () => {
    setShowConfirmModal(false);
    setPendingCurrency(null);
  };

  if (isLoading || !currency) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg animate-pulse">
        <div className="w-8 h-4 bg-neutral-300 rounded" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="relative"
        onMouseEnter={() => isCurrencyLocked && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg transition-colors ${
            isCurrencyLocked
              ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
          aria-label={t('selectCurrency')}
        >
          {/* 🔒 Lock icon when currency is locked */}
          {isCurrencyLocked && (
            <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="font-medium text-sm">{currency.symbol}</span>
          <span className={`text-sm ${isCurrencyLocked ? 'text-amber-700' : 'text-neutral-600'}`}>
            {currency.currencyCode}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isCurrencyLocked ? 'text-amber-600' : 'text-neutral-400'
            } ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 🔒 Tooltip when currency is locked */}
        <AnimatePresence>
          {showTooltip && isCurrencyLocked && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-neutral-900 text-white text-xs rounded-lg shadow-lg p-3 z-50"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold mb-1">{t('currencyLocked')}</p>
                  <p className="text-neutral-300">
                    {items.length === 1
                      ? t('cartLockedTo', { currency: cartCurrency, count: items.length })
                      : t('cartLockedToPlural', {
                          currency: cartCurrency,
                          count: items.length,
                        })}{' '}
                    {t('clearCartToChange')}
                  </p>
                  {exchangeRate !== 1 && (
                    <p className="text-neutral-400 mt-1 text-[10px]">
                      {t('rate', { rate: exchangeRate.toFixed(6), currency: cartCurrency })}
                    </p>
                  )}
                </div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-neutral-900 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto">
              {currencies.map((curr) => (
                <button
                  key={curr.currencyCode}
                  onClick={() => handleSelect(curr.currencyCode)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors ${
                    selectedCurrency === curr.currencyCode
                      ? 'bg-neutral-50 border-l-2 border-[#CBB57B]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-neutral-700">{curr.symbol}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-900">{curr.currencyCode}</p>
                      <p className="text-xs text-neutral-500">{curr.currencyName}</p>
                    </div>
                  </div>
                  {selectedCurrency === curr.currencyCode && (
                    <svg className="w-5 h-5 text-[#CBB57B]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelCurrencyChange}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {t('changeCurrency')}
                    </h3>
                    <p className="text-sm text-neutral-600">{t('cartWillBeCleared')}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-amber-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        {t('currencyLocked')}
                      </p>
                      <p className="text-sm text-amber-700">
                        {items.length === 1
                          ? t('cartLockedTo', { currency: cartCurrency, count: items.length })
                          : t('cartLockedToPlural', {
                              currency: cartCurrency,
                              count: items.length,
                            })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 mb-2">
                    {items.length === 1
                      ? t('yourCartIs', { count: items.length })
                      : t('yourCartIsPlural', { count: items.length })}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t('changingTo', {
                      currency:
                        currencies.find((c) => c.currencyCode === pendingCurrency)?.currencyCode ||
                        pendingCurrency ||
                        '',
                    })}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCurrencyChange}
                    className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmCurrencyChange}
                    className="flex-1 px-4 py-2.5 bg-[#CBB57B] text-black rounded-lg hover:bg-[#a89158] transition-colors text-sm font-medium"
                  >
                    {t('clearCartAndContinue')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
