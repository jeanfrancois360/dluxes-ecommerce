'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { TopBar } from '@/components/layout/top-bar';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showLayout?: boolean;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  showLayout = true,
}: AuthLayoutProps) {
  const authContent = (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-accent-50 px-4 sm:px-6 py-8 sm:py-12 min-h-[calc(100dvh-6rem)] sm:min-h-screen">
      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md my-4 sm:my-0"
      >
        {/* Decorative Elements - Hidden on mobile to prevent overlap */}
        <div className="hidden sm:block absolute -top-12 -left-12 w-24 h-24 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute -bottom-12 -right-12 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-neutral-200/60 px-5 py-6 sm:px-7 sm:py-8 md:px-10 md:py-10">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-3 sm:mb-4"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-black to-neutral-800 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-3xl font-bold text-black mb-1.5 sm:mb-2"
            >
              {title}
            </motion.h1>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-neutral-600 text-xs sm:text-base leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Content */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {children}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5"
          >
            <svg
              className="w-3 h-3 flex-shrink-0"
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
            Secured with enterprise-grade encryption
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  if (!showLayout) {
    return <div className="min-h-screen flex flex-col">{authContent}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navbar />
      <main className="flex-1 flex flex-col">{authContent}</main>
      <Footer />
    </div>
  );
}
