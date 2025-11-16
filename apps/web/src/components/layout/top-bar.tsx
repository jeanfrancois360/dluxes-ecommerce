'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const promoMessages = [
  { text: '✨ Exclusive Spring Collection Now Live', icon: '✨' },
  { text: '🚚 Free Worldwide Shipping on Orders Over $100', icon: '🚚' },
  { text: '💎 New Arrivals: Limited Edition Pieces', icon: '💎' },
];

export function TopBar() {
  const [currentPromo, setCurrentPromo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 h-12 bg-gradient-to-r from-black via-neutral-900 to-black overflow-hidden"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

      {/* Golden accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBB57B]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent" />

      <div className="relative h-full max-w-[1920px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left - Rotating Promo */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPromo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm font-light tracking-wide text-white/90">
                  {promoMessages[currentPromo].text}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="hidden md:flex items-center gap-2">
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

          {/* Right - Icon Cluster */}
          <div className="flex items-center gap-6">
            {/* Wishlist */}
            <Link href="/account/wishlist" className="group relative">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {/* Glow effect */}
                <span className="absolute inset-0 bg-[#CBB57B] blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full" />
              </motion.div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">
                Wishlist
              </span>
            </Link>

            {/* Divider */}
            <div className="h-5 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

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
                <span className="absolute inset-0 bg-[#CBB57B] blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full" />
              </motion.div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">
                Account
              </span>
            </Link>

            {/* Divider */}
            <div className="h-5 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            {/* Cart */}
            <Link href="/cart" className="group relative">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {/* Cart badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#CBB57B] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#CBB57B]/50"
                >
                  3
                </motion.div>
                <span className="absolute inset-0 bg-[#CBB57B] blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full" />
              </motion.div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none">
                Cart
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
