'use client';

/**
 * Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication
 */

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getLoginUrl } from '@/lib/auth-utils';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

/**
 * Protected Route Component
 *
 * Protects routes that require authentication. Redirects to login if not authenticated.
 *
 * @example
 * ```tsx
 * // In a page component
 * import { ProtectedRoute } from '@/components/protected-route';
 *
 * export default function AccountPage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>
 *         <h1>My Account</h1>
 *         // Protected content here
 *       </div>
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With email verification requirement
 * <ProtectedRoute requireEmailVerification>
 *   <div>Email verified users only</div>
 * </ProtectedRoute>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback loading component
 * <ProtectedRoute fallback={<LoadingSpinner />}>
 *   <div>Protected content</div>
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  fallback,
  requireEmailVerification = false,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = redirectTo || getLoginUrl(pathname);
      router.push(loginUrl);
      return;
    }

    // Check email verification if required
    if (requireEmailVerification && user && !user.emailVerified) {
      router.push('/account/verify-email');
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    user,
    requireEmailVerification,
    pathname,
    redirectTo,
    router,
  ]);

  // Show fallback while loading or not initialized
  if (!isInitialized || isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Not authenticated - show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Email verification required but not verified - show nothing while redirecting
  if (requireEmailVerification && user && !user.emailVerified) {
    return null;
  }

  // User is authenticated - render children
  return <>{children}</>;
}
