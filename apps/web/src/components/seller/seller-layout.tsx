'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import SellerSidebar from './sidebar';
import SellerTopbar from './seller-topbar';
import TwoFactorBanner from './two-factor-banner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
    },
  })
    .then((r) => r.json())
    .then((d) => d.data || d);

// Routes that require an ACTIVE store
const ACTIVE_STORE_ROUTES = [
  '/seller/products',
  '/seller/reviews',
  '/seller/orders',
  '/seller/inquiries',
  '/seller/advertisements',
  '/seller/advertisement-plans',
  '/seller/earnings',
  '/seller/store',
  '/seller/gelato-settings',
  '/seller/vacation-mode',
];

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { data: appStatus, isLoading } = useSWR(`${API_URL}/seller/application-status`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const isStoreActive = appStatus?.store?.status === 'ACTIVE';
  const isLockedRoute = ACTIVE_STORE_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!isLoading && appStatus && !isStoreActive && isLockedRoute) {
      router.replace('/seller/onboarding');
    }
  }, [isLoading, appStatus, isStoreActive, isLockedRoute, router]);

  // Block render of locked content until redirect fires
  if (!isLoading && appStatus && !isStoreActive && isLockedRoute) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar */}
      <SellerTopbar
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileMenuOpen={sidebarOpen}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SellerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <SellerSidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-64 pt-16">
        {/* 2FA enforcement banner — visible only when 2FA is not yet enabled (v2.12.0) */}
        <TwoFactorBanner setupUrl="/seller/security" />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
