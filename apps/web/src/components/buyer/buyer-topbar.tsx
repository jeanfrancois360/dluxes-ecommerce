'use client';

import Link from 'next/link';
import { Bell, MessageSquare, User, ShoppingCart, Heart, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function BuyerTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-neutral-200 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Title */}
        <div>
          <h2 className="text-xl font-semibold text-black">Buyer Dashboard</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 hover:text-[#CBB57B] hover:bg-neutral-50 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 hover:text-[#CBB57B] hover:bg-neutral-50 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Cart</span>
          </Link>

          {/* Notifications */}
          <Link
            href="/account/notifications"
            className="relative p-2 rounded-lg text-neutral-700 hover:text-[#CBB57B] hover:bg-neutral-50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>

          {/* Messages */}
          <Link
            href="/account/messages"
            className="p-2 rounded-lg text-neutral-700 hover:text-[#CBB57B] hover:bg-neutral-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#CBB57B] flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.[0]?.toUpperCase() || 'B'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-black">{user?.firstName || 'Buyer'}</div>
                <div className="text-xs text-neutral-500">Buyer Account</div>
              </div>
              <svg
                className={`w-4 h-4 text-neutral-500 transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
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

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-neutral-200">
                    <div className="font-medium text-black">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm text-neutral-500">{user?.email}</div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/account/profile"
                      className="flex items-center gap-3 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">My Profile</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      className="flex items-center gap-3 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm">My Orders</span>
                    </Link>
                    <Link
                      href="/account/security"
                      className="flex items-center gap-3 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-neutral-200 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
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
