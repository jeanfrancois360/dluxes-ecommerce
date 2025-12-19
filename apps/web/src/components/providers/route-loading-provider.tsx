'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { motion } from 'framer-motion';

// Configure NProgress for instant, smooth feedback
NProgress.configure({
  showSpinner: false, // Disabled to prevent overlapping with other components
  trickleSpeed: 80,
  minimum: 0.08,
  easing: 'ease',
  speed: 200,
});

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNavigatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUrlRef = useRef('');

  // Intercept all clicks on links for instant feedback
  useEffect(() => {
    const startLoading = () => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      isNavigatingRef.current = true;
      NProgress.start();

      // Safety timeout: force complete after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (isNavigatingRef.current) {
          NProgress.done();
          isNavigatingRef.current = false;
        }
      }, 10000);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const isExternal = anchor.getAttribute('target') === '_blank' ||
                        anchor.hasAttribute('download') ||
                        anchor.getAttribute('rel')?.includes('external');

      // Only trigger for internal navigation
      if (href && href.startsWith('/') && !isExternal) {
        // Check if we're navigating to the same page
        const currentUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        const targetUrl = href;

        // Don't show loader for same-page navigation
        if (currentUrl === targetUrl) {
          return;
        }

        startLoading();
      }
    };

    // Handle programmatic navigation (router.push, etc.)
    const handleProgrammaticNavigation = () => {
      if (!isNavigatingRef.current) {
        startLoading();
      }
    };

    // Handle browser back/forward buttons
    const handlePopState = () => {
      if (!isNavigatingRef.current) {
        startLoading();
      }
    };

    // Capture phase for earliest possible interception
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigation:start', handleProgrammaticNavigation);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigation:start', handleProgrammaticNavigation);
    };
  }, [pathname, searchParams]);

  // Complete loading when route changes
  useEffect(() => {
    // Clear timeout when route changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Update current URL
    const newUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    // Only complete if we were actually navigating
    if (isNavigatingRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          NProgress.done();
          isNavigatingRef.current = false;
        });
      });
    }

    currentUrlRef.current = newUrl;
  }, [pathname, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      NProgress.done();
      isNavigatingRef.current = false;
    };
  }, []);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.97 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
