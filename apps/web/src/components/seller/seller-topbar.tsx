'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';
import { useLocale, languages, type LanguageOption } from '@/contexts/locale-context';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Bell,
  MessageSquare,
  Store,
  Menu,
  X,
  Globe,
  Check,
} from 'lucide-react';

interface SellerTopbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function SellerTopbar({
  onMobileMenuToggle,
  isMobileMenuOpen = false,
}: SellerTopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { summary } = useSellerDashboard();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Language hook
  const { language, setLanguage } = useLocale();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'S';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'S';
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return 'Seller';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email.split('@')[0];
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language change
  const handleLanguageChange = (lang: LanguageOption['code']) => {
    setLanguage(lang);
    setLanguageOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 lg:left-64 z-40 bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section: Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle (visible on mobile only) */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-black" />
              ) : (
                <Menu className="w-6 h-6 text-black" />
              )}
            </motion.div>
          </button>

          {/* Page Title (optional - can be dynamic per page) */}
          <h1 className="hidden lg:block text-lg font-semibold text-black">Seller Dashboard</h1>
        </div>

        {/* Center Section: Quick Links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href={summary?.store?.slug ? `/store/${summary.store.slug}` : '/'}
            target="_blank"
            className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-[#CBB57B] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Visit Store</span>
          </Link>
          <Link
            href="/seller/store/settings"
            className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-[#CBB57B] transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Store Settings</span>
          </Link>
        </div>

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative" ref={languageRef}>
            <button
              onClick={() => setLanguageOpen(!languageOpen)}
              className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Language"
            >
              <Globe className="w-5 h-5 text-neutral-700" />
            </button>

            {/* Language Dropdown */}
            <AnimatePresence>
              {languageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden"
                >
                  <div className="p-2 border-b border-neutral-200 bg-neutral-50">
                    <h3 className="text-xs font-semibold text-neutral-600 uppercase px-2">
                      Language
                    </h3>
                  </div>
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                          language === lang.code ? 'bg-neutral-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium text-neutral-900">{lang.name}</span>
                        </div>
                        {language === lang.code && <Check className="w-4 h-4 text-[#CBB57B]" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-700" />
              {/* Notification badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CBB57B] rounded-full border-2 border-white"></span>
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-neutral-200">
                    <h3 className="font-semibold text-black">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-8 text-center text-neutral-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <Link
            href="/seller/inquiries"
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5 text-neutral-700" />
          </Link>

          {/* User Account Menu */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
              </div>
              {/* Name (hidden on small screens) */}
              <span className="hidden lg:block text-sm font-medium text-black">
                {getDisplayName()}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${
                  accountOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Account Dropdown */}
            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{getUserInitials()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black truncate">{getDisplayName()}</p>
                        <p className="text-xs text-neutral-600 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/seller/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/seller/store/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Store Settings</span>
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit Website</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-neutral-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
