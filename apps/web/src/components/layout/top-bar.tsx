'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale, languages } from '@/contexts/locale-context';
import { useCurrencyRates, useSelectedCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  text: string;
  icon: string | null;
  link: string | null;
  type: string;
  displayOrder: number;
}

export function TopBar() {
  const router = useRouter();
  const t = useTranslations('common');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '';
  };

  // Get display name for button
  const getDisplayName = () => {
    if (!user) return t('nav.account');
    if (user.firstName) return user.firstName;
    return user.email.split('@')[0];
  };

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    if (!user) return '/account';

    switch (user.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'SELLER':
        return '/seller';
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

  // Fetch announcements on mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/announcements/active`
        );
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        // Fallback to default messages if API fails
        setAnnouncements([
          {
            id: '1',
            text: t('promo.springCollection'),
            icon: '✨',
            link: null,
            type: 'PROMO',
            displayOrder: 0,
          },
          {
            id: '2',
            text: t('promo.freeShipping'),
            icon: '🚚',
            link: null,
            type: 'PROMO',
            displayOrder: 1,
          },
          {
            id: '3',
            text: t('promo.newArrivals'),
            icon: '💎',
            link: null,
            type: 'PROMO',
            displayOrder: 2,
          },
        ]);
      }
    };
    fetchAnnouncements();
  }, [t]);

  // Rotating promos
  useEffect(() => {
    if (announcements.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

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

  const currentLanguage = languages.find((l) => l.code === language);

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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                      {languages
                        .filter((lang) => lang.code === 'en')
                        .map((lang) => (
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
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </motion.svg>
                            )}
                          </button>
                        ))}
                      {/* Disabled Languages */}
                      {languages
                        .filter((lang) => lang.code !== 'en')
                        .map((lang) => (
                          <div
                            key={lang.code}
                            className="w-full px-4 py-2.5 flex items-center gap-3 opacity-40 cursor-not-allowed"
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.name}</span>
                            <span className="ml-auto text-xs text-white/40">(Coming Soon)</span>
                          </div>
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
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
            {announcements.length > 0 && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPromo}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    {announcements[currentPromo].link ? (
                      <Link
                        href={announcements[currentPromo].link!}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        {announcements[currentPromo].icon && (
                          <span className="text-lg">{announcements[currentPromo].icon}</span>
                        )}
                        <span className="text-sm font-light tracking-wide text-white/90 hidden md:inline">
                          {announcements[currentPromo].text}
                        </span>
                      </Link>
                    ) : (
                      <>
                        {announcements[currentPromo].icon && (
                          <span className="text-lg">{announcements[currentPromo].icon}</span>
                        )}
                        <span className="text-sm font-light tracking-wide text-white/90 hidden md:inline">
                          {announcements[currentPromo].text}
                        </span>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                {announcements.length > 1 && (
                  <div className="hidden lg:flex items-center gap-2">
                    {announcements.map((_, i) => (
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
                )}
              </>
            )}
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-[#CBB57B]/50 shadow-lg shadow-black/20"
              >
                {/* Avatar Circle with Initials or Icon */}
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#CBB57B] via-[#D4AF37] to-[#8B7355] flex items-center justify-center ring-2 ring-white/10 group-hover:ring-[#CBB57B]/50 transition-all duration-300 overflow-hidden">
                  {isAuthenticated && getUserInitials() ? (
                    <span className="text-sm font-bold text-white tracking-tight">
                      {getUserInitials()}
                    </span>
                  ) : (
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
                  )}
                  {/* Animated glow effect */}
                  <span className="absolute inset-0 bg-gradient-to-br from-[#CBB57B]/50 to-transparent blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-full pointer-events-none" />
                </div>

                {/* User Name or Account Text */}
                <div className="hidden sm:flex flex-col items-start -space-y-0.5">
                  <span className="text-xs font-semibold text-white/90 tracking-wide leading-tight">
                    {getDisplayName()}
                  </span>
                  {isAuthenticated && user?.role && (
                    <span className="text-[10px] text-[#CBB57B]/80 font-medium leading-tight">
                      {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                        ? 'Admin'
                        : user.role === 'SELLER'
                          ? 'Seller'
                          : user.role === 'BUYER' || user.role === 'CUSTOMER'
                            ? 'Buyer'
                            : user.role === 'DELIVERY_PARTNER'
                              ? 'Delivery Partner'
                              : user.role === 'DELIVERY_PROVIDER_ADMIN'
                                ? 'Delivery Admin'
                                : 'Buyer'}
                    </span>
                  )}
                </div>

                {/* Dropdown Arrow */}
                <motion.svg
                  animate={{ rotate: accountOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-3 h-3 text-white/60 group-hover:text-[#CBB57B] hidden sm:block ml-0.5"
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
                </motion.svg>
              </motion.button>

              {/* Enhanced Dropdown Menu */}
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute top-full right-0 mt-3 w-72 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[100] backdrop-blur-xl"
                  >
                    {/* Golden accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent" />
                    {isAuthenticated && user ? (
                      <>
                        {/* Enhanced User Info Header */}
                        <div className="relative px-4 py-4 bg-gradient-to-br from-[#CBB57B]/20 via-[#CBB57B]/10 to-transparent border-b border-white/10 overflow-hidden">
                          {/* Decorative background pattern */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#CBB57B]/10 via-transparent to-transparent opacity-50" />

                          <div className="relative flex items-start gap-3">
                            {/* Large Avatar */}
                            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#CBB57B] via-[#D4AF37] to-[#8B7355] flex items-center justify-center ring-2 ring-[#CBB57B]/30 shadow-lg shadow-[#CBB57B]/20">
                              {getUserInitials() ? (
                                <span className="text-lg font-bold text-white tracking-tight">
                                  {getUserInitials()}
                                </span>
                              ) : (
                                <svg
                                  className="w-6 h-6 text-white"
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
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.firstName
                                    ? user.firstName
                                    : t('nav.welcomeBackGeneric')}
                              </p>
                              <p className="text-xs text-white/70 mt-0.5 truncate">{user.email}</p>
                              {/* Role Badge */}
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#CBB57B]/20 border border-[#CBB57B]/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]" />
                                <span className="text-[10px] font-semibold text-[#CBB57B] uppercase tracking-wider">
                                  {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                                    ? 'Administrator'
                                    : user.role === 'SELLER'
                                      ? 'Seller Account'
                                      : user.role === 'BUYER' || user.role === 'CUSTOMER'
                                        ? 'Buyer Account'
                                        : user.role === 'DELIVERY_PARTNER'
                                          ? 'Delivery Partner'
                                          : user.role === 'DELIVERY_PROVIDER_ADMIN'
                                            ? 'Delivery Admin'
                                            : 'Buyer Account'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Dashboard Link - Role-based */}
                          <Link
                            href={getDashboardUrl()}
                            onClick={() => setAccountOpen(false)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-gradient-to-r hover:from-[#CBB57B]/10 hover:to-transparent hover:text-white transition-all duration-200 group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#CBB57B]/0 via-[#CBB57B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative w-9 h-9 rounded-lg bg-white/5 group-hover:bg-[#CBB57B]/20 flex items-center justify-center transition-all duration-200">
                              <svg
                                className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                            </div>
                            <span className="relative text-sm font-medium">
                              {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                                ? t('nav.adminDashboard')
                                : user.role === 'SELLER'
                                  ? t('nav.sellerDashboard')
                                  : t('nav.myDashboard')}
                            </span>
                            <svg
                              className="relative w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-[#CBB57B] transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>

                          {/* Buyer/Customer specific links */}
                          {(user.role === 'BUYER' || user.role === 'CUSTOMER') && (
                            <>
                              <Link
                                href="/account/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myOrders')}</span>
                              </Link>

                              <Link
                                href="/wishlist"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.wishlist')}</span>
                              </Link>

                              <Link
                                href="/account/inquiries"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myInquiries')}</span>
                              </Link>

                              <Link
                                href="/account/reviews"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myReviews')}</span>
                              </Link>

                              <Link
                                href="/account/downloads"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myDownloads')}</span>
                              </Link>

                              <Link
                                href="/account/payment-methods"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  {t('nav.paymentMethods')}
                                </span>
                              </Link>

                              <Link
                                href="/account/returns"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myReturns')}</span>
                              </Link>

                              <Link
                                href="/account/notifications"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  {t('nav.notifications')}
                                </span>
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
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.myProducts')}</span>
                              </Link>

                              <Link
                                href="/seller/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.orders')}</span>
                              </Link>

                              <Link
                                href="/seller/selling-credits"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  {t('nav.platformSubscription')}
                                </span>
                              </Link>

                              <Link
                                href="/seller/subscription/plans"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.featurePlans')}</span>
                              </Link>

                              <Link
                                href="/seller/inquiries"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.inquiries')}</span>
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
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.products')}</span>
                              </Link>

                              <Link
                                href="/admin/orders"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.orders')}</span>
                              </Link>

                              <Link
                                href="/admin/settings"
                                onClick={() => setAccountOpen(false)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                              >
                                <svg
                                  className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">{t('nav.settings')}</span>
                              </Link>
                            </>
                          )}

                          {/* Profile/Settings - Common for all roles */}
                          <Link
                            href="/account/profile"
                            onClick={() => setAccountOpen(false)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-gradient-to-r hover:from-[#CBB57B]/10 hover:to-transparent hover:text-white transition-all duration-200 group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#CBB57B]/0 via-[#CBB57B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative w-9 h-9 rounded-lg bg-white/5 group-hover:bg-[#CBB57B]/20 flex items-center justify-center transition-all duration-200">
                              <svg
                                className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
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
                            </div>
                            <span className="relative text-sm font-medium">{t('nav.profile')}</span>
                            <svg
                              className="relative w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-[#CBB57B] transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>

                          {/* Divider */}
                          <div className="my-2 border-t border-white/5" />

                          {/* Enhanced Logout Button */}
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-transparent hover:text-red-300 transition-all duration-200 group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative w-9 h-9 rounded-lg bg-red-500/5 group-hover:bg-red-500/20 flex items-center justify-center transition-all duration-200">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                            </div>
                            <span className="relative text-sm font-medium">{t('nav.signOut')}</span>
                            <svg
                              className="relative w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
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
                          <svg
                            className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          <span className="text-sm font-medium">{t('nav.signIn')}</span>
                        </Link>

                        <Link
                          href="/auth/register"
                          onClick={() => setAccountOpen(false)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                        >
                          <svg
                            className="w-4 h-4 text-white/60 group-hover:text-[#CBB57B] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          <span className="text-sm font-medium">{t('nav.register')}</span>
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
