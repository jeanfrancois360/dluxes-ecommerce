'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { motion, AnimatePresence } from 'framer-motion';
import 'nprogress/nprogress.css';

// Configure NProgress for smooth, visible progress
NProgress.configure({
  showSpinner: true,
  trickleSpeed: 100,
  minimum: 0.1,
  easing: 'ease-out',
  speed: 400,
});

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const completionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeouts
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);

    // Show loading state immediately
    setIsLoading(true);
    NProgress.start();

    // Ensure minimum loading time for visual feedback (300ms)
    loadingTimeoutRef.current = setTimeout(() => {
      // Complete the loading animation
      NProgress.done();

      // Keep loading overlay for smooth transition
      completionTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }, 300);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
      NProgress.done();
      setIsLoading(false);
    };
  }, [pathname, searchParams]);

  return (
    <>
      {/* Page Transition Overlay */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
          >
            {/* Subtle overlay to indicate loading */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

            {/* Loading indicator in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-2xl border border-neutral-200"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium text-neutral-700">Loading...</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content with transition */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0.95, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
