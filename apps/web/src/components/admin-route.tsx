'use client';

/**
 * Admin Route Component
 *
 * Wrapper component that protects routes requiring admin privileges
 */

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { getLoginUrl } from '@/lib/auth-utils';

export interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSuperAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Admin Route Component
 *
 * Protects routes that require admin or superadmin privileges.
 * Redirects to login if not authenticated or to home if not admin.
 *
 * @example
 * ```tsx
 * // In an admin page component
 * import { AdminRoute } from '@/components/admin-route';
 *
 * export default function AdminDashboard() {
 *   return (
 *     <AdminRoute>
 *       <div>
 *         <h1>Admin Dashboard</h1>
 *         // Admin only content
 *       </div>
 *     </AdminRoute>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Require superadmin only
 * <AdminRoute requireSuperAdmin>
 *   <div>Superadmin only content</div>
 * </AdminRoute>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <AdminRoute fallback={<LoadingSpinner />}>
 *   <div>Admin content</div>
 * </AdminRoute>
 * ```
 */
export function AdminRoute({
  children,
  fallback,
  requireSuperAdmin = false,
  redirectTo,
}: AdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const { user, isAdmin, isSuperAdmin } = useUser();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = redirectTo || getLoginUrl(pathname);
      router.push(loginUrl);
      return;
    }

    // Authenticated but not admin - redirect to home with error
    if (!isAdmin) {
      router.push('/?error=access_denied');
      return;
    }

    // Check superadmin requirement
    if (requireSuperAdmin && !isSuperAdmin) {
      router.push('/admin/dashboard?error=insufficient_permissions');
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    isAdmin,
    isSuperAdmin,
    requireSuperAdmin,
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

  // Not admin - show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  // Superadmin required but user is not superadmin - show nothing while redirecting
  if (requireSuperAdmin && !isSuperAdmin) {
    return null;
  }

  // User has required permissions - render children
  return <>{children}</>;
}

/**
 * Access Denied Component
 *
 * Component to show when user doesn't have required permissions
 *
 * @example
 * ```tsx
 * import { AccessDenied } from '@/components/admin-route';
 *
 * function UnauthorizedPage() {
 *   return <AccessDenied />;
 * }
 * ```
 */
export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page. Please contact an administrator if
          you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
