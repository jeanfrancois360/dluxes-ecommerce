'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useLocale, languages } from '@/contexts/locale-context';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';

const promoMessages = [
  { text: 'Exclusive Spring Collection Now Live', icon: '✨' },
  { text: 'Free Worldwide Shipping on Orders Over $100', icon: '🚚' },
  { text: 'New Arrivals: Limited Edition Pieces', icon: '💎' },
];

export function TopBar() {
  const [currentPromo, setCurrentPromo] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage } = useLocale();
  const { currencies, isLoading: currenciesLoading } = useCurrencyRates();
  const { currency, selectedCurrency, setSelectedCurrency } = useSelectedCurrency();

  // Rotating promos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <div className="sticky top-0 z-50 h-12 bg-gradient-to-r from-black via-neutral-900 to-black overflow-visible">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Golden accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBB57B]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent" />

      <div className="relative h-full max-w-[1920px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-full gap-4">
          {/* Left - Language & Currency Selectors */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div ref={languageRef} className="relative">
              <button
                onClick={() => {
                  setLanguageOpen(!languageOpen);
                  setCurrencyOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-all duration-300 group border border-white/10 hover:border-[#CBB57B]/50"
              >
                <span className="text-base">{currentLanguage?.flag}</span>
                <span className="text-xs font-medium text-white/90 tracking-wide hidden sm:inline">
                  {currentLanguage?.code.toUpperCase()}
                </span>
                <motion.svg
                  animate={{ rotate: languageOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-3 h-3 text-white/60 group-hover:text-[#CBB57B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setLanguageOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ${
                            language === lang.code
                              ? 'bg-[#CBB57B]/20 text-[#CBB57B]'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                          {language === lang.code && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-4 h-4 ml-auto text-[#CBB57B]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Currency Selector */}
            <div ref={currencyRef} className="relative">
              {currenciesLoading || !currency ? (
                <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                  <div className="w-12 h-4 bg-white/10 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setCurrencyOpen(!currencyOpen);
                      setLanguageOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-all duration-300 group border border-white/10 hover:border-[#CBB57B]/50"
                  >
                    <span className="text-xs font-medium text-white/90 tracking-wide">
                      {currency.currencyCode}
                    </span>
                    <motion.svg
                      animate={{ rotate: currencyOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-3 h-3 text-white/60 group-hover:text-[#CBB57B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {currencyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-52 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100]"
                      >
                        <div className="py-1 max-h-80 overflow-y-auto">
                          {currencies.map((curr) => (
                            <button
                              key={curr.currencyCode}
                              onClick={() => {
                                setSelectedCurrency(curr.currencyCode);
                                setCurrencyOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ${
                                selectedCurrency === curr.currencyCode
                                  ? 'bg-[#CBB57B]/20 text-[#CBB57B]'
                                  : 'text-white/80 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="text-sm font-medium">{curr.symbol}</span>
                              <div className="flex flex-col items-start flex-1">
                                <span className="text-sm font-medium">{curr.currencyCode}</span>
                                <span className="text-xs text-white/40">{curr.currencyName}</span>
                              </div>
                              {selectedCurrency === curr.currencyCode && (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-4 h-4 text-[#CBB57B]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </motion.svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* Center - Rotating Promo */}
          <div className="flex items-center justify-center gap-3 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPromo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{promoMessages[currentPromo].icon}</span>
                <span className="text-sm font-light tracking-wide text-white/90 hidden md:inline">
                  {promoMessages[currentPromo].text}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="hidden lg:flex items-center gap-2">
              {promoMessages.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setCurrentPromo(i)}
                  className="relative h-1 overflow-hidden rounded-full bg-white/20"
                  animate={{ width: currentPromo === i ? 24 : 12 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentPromo === i && (
                    <motion.div
                      className="absolute inset-0 bg-[#CBB57B]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 4, ease: 'linear' }}
                      style={{ transformOrigin: 'left' }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right - Account Link */}
          <div className="flex items-center justify-end gap-4">
            {/* Account */}
            <Link href="/account" className="group relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <svg
                  className="w-5 h-5 text-white/80 group-hover:text-[#CBB57B] transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="absolute inset-0 bg-[#CBB57B] blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full pointer-events-none" />
              </motion.div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">
                Account
              </span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite;
        }
      `}</style>
    </div>
  );
}
