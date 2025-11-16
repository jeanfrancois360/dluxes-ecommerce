'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenManager } from '@/lib/api/client';

/**
 * Account Dashboard Redirect
 *
 * This page redirects users to their appropriate dashboard based on role:
 * - BUYER/CUSTOMER → /dashboard/buyer
 * - SELLER → /dashboard/seller
 * - ADMIN/SUPER_ADMIN → /admin/dashboard
 *
 * If not authenticated, redirects to login
 */
export default function AccountDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = TokenManager.getAccessToken();

    if (!token) {
      // Not authenticated - redirect to login
      router.push('/auth/login');
      return;
    }

    // Decode token to get user role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      // Redirect based on role
      switch (role) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'SELLER':
          router.push('/dashboard/seller');
          break;
        case 'BUYER':
        case 'CUSTOMER':
        default:
          router.push('/dashboard/buyer');
          break;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/auth/login');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-black mb-4"></div>
        <p className="text-neutral-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
