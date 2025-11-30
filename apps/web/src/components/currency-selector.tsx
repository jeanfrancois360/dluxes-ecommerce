'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currencies, isLoading } = useCurrencyRates();
  const { currency, selectedCurrency, setSelectedCurrency } = useSelectedCurrency();

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
    setSelectedCurrency(currencyCode);
    setIsOpen(false);
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
    </div>
  );
}
