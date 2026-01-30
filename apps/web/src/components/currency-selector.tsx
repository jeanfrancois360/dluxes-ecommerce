'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';
import { useCart } from '@/hooks/use-cart';

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currencies, isLoading } = useCurrencyRates();
  const { currency, selectedCurrency, setSelectedCurrency } = useSelectedCurrency();
  const { items, clearCart } = useCart();

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

  const handleSelect = (currencyCode: string) => {
    // Check if cart has items
    if (items && items.length > 0 && currencyCode !== selectedCurrency) {
      // Show confirmation modal
      setPendingCurrency(currencyCode);
      setShowConfirmModal(true);
      setIsOpen(false);
    } else {
      // No items in cart or same currency, proceed
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
        aria-label="Select currency"
      >
        <span className="font-medium text-sm">{currency.symbol}</span>
        <span className="text-sm text-neutral-600">{currency.currencyCode}</span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

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
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors ${selectedCurrency === curr.currencyCode
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
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Change Currency?</h3>
                    <p className="text-sm text-neutral-600">Your cart will be cleared</p>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-neutral-700 mb-2">
                    You have <strong>{items.length} item{items.length !== 1 ? 's' : ''}</strong> in your cart.
                  </p>
                  <p className="text-sm text-neutral-600">
                    Changing from <strong>{currency?.currencyCode}</strong> to{' '}
                    <strong>{currencies.find(c => c.currencyCode === pendingCurrency)?.currencyCode}</strong>{' '}
                    will clear your cart.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCurrencyChange}
                    className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCurrencyChange}
                    className="flex-1 px-4 py-2.5 bg-[#CBB57B] text-black rounded-lg hover:bg-[#a89158] transition-colors text-sm font-medium"
                  >
                    Clear Cart & Continue
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
