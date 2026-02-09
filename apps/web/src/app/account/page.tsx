'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TokenManager } from '@/lib/api/client';
import { useAuth } from '@/hooks/use-auth';

/**
 * Account Dashboard Redirect
 *
 * This page redirects users to their appropriate dashboard based on role:
 * - BUYER/CUSTOMER → /dashboard/buyer
 * - SELLER → /seller
 * - ADMIN/SUPER_ADMIN → /admin/dashboard
 *
 * If not authenticated, redirects to login
 * If email not verified (after grace period), shows verification prompt
 */
export default function AccountDashboard() {
  const router = useRouter();
  const t = useTranslations('account');
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = TokenManager.getAccessToken();

      if (!token) {
        // Not authenticated - redirect to login
        router.push('/auth/login');
        return;
      }

      // Wait for user data to load
      if (!user) {
        return; // Still loading
      }

      // Decode token to get user role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;

        // Check email verification for non-OAuth users
        if (!user.emailVerified && user.authProvider !== 'GOOGLE') {
          // Show verification pending page for new users
          // Grace period is handled by backend, but we show a prompt
          router.push('/auth/verify-email-prompt');
          return;
        }

        // Redirect based on role
        switch (role) {
          case 'ADMIN':
          case 'SUPER_ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'SELLER':
            router.push('/seller');
            break;
          case 'BUYER':
          case 'CUSTOMER':
          default:
            router.push('/dashboard/buyer');
            break;
        }
        setChecking(false);
      } catch (error) {
        console.error('Error decoding token:', error);
        router.push('/auth/login');
      }
    };

    checkAuthAndRedirect();
  }, [router, user]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-black mb-4"></div>
        <p className="text-neutral-600">{t('redirect.redirecting')}</p>
      </div>
    </div>
  );
}
