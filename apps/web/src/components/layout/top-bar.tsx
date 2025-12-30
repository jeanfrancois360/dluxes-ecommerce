'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useLocale, languages } from '@/contexts/locale-context';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const promoMessages = [
  { text: 'Exclusive Spring Collection Now Live', icon: '✨' },
  { text: 'Free Worldwide Shipping on Orders Over $100', icon: '🚚' },
  { text: 'New Arrivals: Limited Edition Pieces', icon: '💎' },
];

export function TopBar() {
  const router = useRouter();
  const [currentPromo, setCurrentPromo] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage } = useLocale();
  const { currencies, isLoading: currenciesLoading } = useCurrencyRates();
  const { currency, selectedCurrency, setSelectedCurrency } = useSelectedCurrency();
  const { user, isAuthenticated, logout } = useAuth();

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    if (!user) return '/account';

    switch (user.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'SELLER':
        return '/seller/dashboard';
      case 'BUYER':
      case 'CUSTOMER':
      default:
        return '/dashboard/buyer';
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setAccountOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
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
                          className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ${language === lang.code
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
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-all duration-300 group border border-white/10 hover:border-[#CBB57B]/50"
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
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-200 ${selectedCurrency === curr.currencyCode
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

          {/* Right - Account Dropdown */}
          <div className="flex items-center justify-end gap-4">
            {/* Account Menu */}
            <div ref={accountRef} className="relative">
              <motion.button
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setLanguageOpen(false);
                  setCurrencyOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-[#CBB57B]/50"
              >
                {/* Avatar Circle */}
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-[#CBB57B] to-[#8B7355] flex items-center justify-center ring-2 ring-white/10 group-hover:ring-[#CBB57B]/50 transition-all duration-300">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {/* Glow effect */}
                  <span className="absolute inset-0 bg-[#CBB57B] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-full pointer-events-none" />
                </div>

                {/* Account Text - Hidden on mobile */}
                <span className="text-xs font-medium text-white/90 tracking-wide hidden sm:inline">
                  Account
                </span>

                {/* Dropdown Arrow */}
                <motion.svg
                  animate={{ rotate: accountOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-3 h-3 text-white/60 group-hover:text-[#CBB57B] hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100]"
                  >
                    {isAuthenticated && user ? (
                      <>
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-[#CBB57B]/10 to-transparent border-b border-white/5">
                          <p className="text-sm font-semibold text-white">
                            {user.firstName ? `Welcome Back, ${user.firstName}!` : 'Welcome Back!'}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {/* Dashboard Link - Role-based */}
                          <Link
                            href={getDashboardUrl()}
                            onClick={() => setAccountOpen(false)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                          >
                            <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-sm font-medium">
                              {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'Admin Dashboard' : user.role === 'SELLER' ? 'Seller Dashboard' : 'My Dashboard'}
                            </span>
                          </Link>

                          {/* Buyer/Customer specific links */}
                          {(user.role === 'BUYER' || user.role === 'CUSTOMER') && (
                            <>
                              <Link
                                href="/account/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span className="text-sm font-medium">My Orders</span>
                              </Link>

                              <Link
                                href="/wishlist"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="text-sm font-medium">Wishlist</span>
                              </Link>

                              <Link
                                href="/account/inquiries"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm font-medium">My Inquiries</span>
                              </Link>
                            </>
                          )}

                          {/* Seller specific links */}
                          {user.role === 'SELLER' && (
                            <>
                              <Link
                                href="/seller/products"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-sm font-medium">My Products</span>
                              </Link>

                              <Link
                                href="/seller/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm font-medium">Orders</span>
                              </Link>
                            </>
                          )}

                          {/* Admin specific links */}
                          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                            <>
                              <Link
                                href="/admin/products"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-sm font-medium">Products</span>
                              </Link>

                              <Link
                                href="/admin/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm font-medium">Orders</span>
                              </Link>

                              <Link
                                href="/admin/settings"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium">Settings</span>
                              </Link>
                            </>
                          )}

                          {/* Profile/Settings - Common for all roles */}
                          <Link
                            href="/account/profile"
                            onClick={() => setAccountOpen(false)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                          >
                            <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium">Profile</span>
                          </Link>

                          {/* Divider */}
                          <div className="my-1 border-t border-white/5" />

                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Not Authenticated - Show Login/Register */
                      <div className="py-1">
                        <Link
                          href="/auth/login"
                          onClick={() => setAccountOpen(false)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                        >
                          <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-sm font-medium">Sign In</span>
                        </Link>

                        <Link
                          href="/auth/register"
                          onClick={() => setAccountOpen(false)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                        >
                          <svg className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <span className="text-sm font-medium">Register</span>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
