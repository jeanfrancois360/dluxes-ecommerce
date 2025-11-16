# Authentication System Setup Guide

This guide will walk you through integrating the authentication system into your Next.js 15 application.

## Quick Start

### Step 1: Update Root Layout

Update your `src/app/layout.tsx` to include the AuthProvider and ToastListener:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { ToastListener } from '@/components/toast-listener';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Luxury E-commerce',
  description: 'Premium luxury goods marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ToastListener />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Step 2: Add Animation Styles

Add these animation styles to your `src/app/globals.css`:

```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

### Step 3: Environment Variables

Ensure your `.env.local` has the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Step 4: Update Middleware (Optional)

The middleware is already set up at `/Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce/apps/web/middleware.ts`.

If you need to customize routes, edit the constants:

```typescript
// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/collections',
  // ... add more
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/account',
  '/orders',
  // ... add more
];

// Admin routes
const ADMIN_ROUTES = ['/admin'];
```

## Usage Examples

### 1. Create a Login Page

Create `src/app/auth/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      // Redirect is handled automatically
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Remember me</span>
            </label>

            <Link href="/auth/forgot-password" className="text-sm text-black hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-black hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 2. Create a Protected Account Page

Create `src/app/account/page.tsx`:

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useUser } from '@/hooks/use-user';
import { useAuth } from '@/hooks/use-auth';

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

function AccountContent() {
  const { profile, isAdmin, isEmailVerified } = useUser();
  const { logout, isLoading } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="w-16 h-16 rounded-full mr-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-2xl text-gray-600">
                  {profile.firstName[0]}{profile.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{profile.fullName}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Admin
              </span>
            </div>
          )}

          {!isEmailVerified && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
              Please verify your email address
            </div>
          )}

          <div className="space-y-2">
            <p><strong>Member since:</strong> {profile.createdAt.toLocaleDateString()}</p>
            {profile.lastLoginAt && (
              <p><strong>Last login:</strong> {profile.lastLoginAt.toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={logout}
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Create an Admin Dashboard

Create `src/app/admin/dashboard/page.tsx`:

```tsx
'use client';

import { AdminRoute } from '@/components/admin-route';
import { useUser } from '@/hooks/use-user';

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <DashboardContent />
    </AdminRoute>
  );
}

function DashboardContent() {
  const { profile, isSuperAdmin } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.firstName}!</p>
        {isSuperAdmin && (
          <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Super Admin
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Orders</h2>
          <p className="text-3xl font-bold">1,234</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold">5,678</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Revenue</h2>
          <p className="text-3xl font-bold">$123,456</p>
        </div>
      </div>
    </div>
  );
}
```

### 4. Update Navigation Header

Create or update `src/components/header.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';

export function Header() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const { profile, isAdmin } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            Luxury E-commerce
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/products" className="hover:text-gray-600">
              Products
            </Link>
            <Link href="/collections" className="hover:text-gray-600">
              Collections
            </Link>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin/dashboard" className="hover:text-gray-600">
                    Admin
                  </Link>
                )}
                <Link href="/account" className="hover:text-gray-600">
                  Account
                </Link>
                <Link href="/orders" className="hover:text-gray-600">
                  Orders
                </Link>
                <button
                  onClick={logout}
                  disabled={isLoading}
                  className="hover:text-gray-600 disabled:opacity-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-gray-600">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
```

## Testing the Authentication System

### 1. Test Login Flow

1. Navigate to `/auth/login`
2. Enter valid credentials
3. Should be redirected based on role (admin → `/admin/dashboard`, customer → `/account`)
4. Toast notification should appear

### 2. Test Protected Routes

1. Without logging in, try to access `/account`
2. Should be redirected to `/auth/login?returnUrl=/account`
3. After login, should be redirected back to `/account`

### 3. Test Admin Routes

1. Login as a non-admin user
2. Try to access `/admin/dashboard`
3. Should be redirected to home with error message
4. Login as admin, should have access

### 4. Test Session Timeout

1. Login to the application
2. Leave browser idle for 30 minutes
3. Try to perform an action
4. Should be logged out with timeout message

### 5. Test Token Refresh

1. Login to the application
2. Wait until token is about to expire
3. Make an API request
4. Token should be automatically refreshed

## Troubleshooting

### Tokens Not Persisting Across Page Refreshes

**Issue:** User is logged out on page refresh

**Solution:**
- Check that tokens are being stored in localStorage
- Verify that `AuthProvider` is wrapping the entire app
- Check browser console for errors during auth initialization

### Middleware Redirect Loops

**Issue:** Infinite redirects between pages

**Solution:**
- Check middleware route patterns don't conflict
- Ensure auth routes (login, register) are in `AUTH_ROUTES`
- Verify public routes are in `PUBLIC_ROUTES`

### Toast Notifications Not Showing

**Issue:** No toast notifications appear

**Solution:**
- Verify `ToastListener` is included in root layout
- Check browser console for errors
- Ensure animation styles are added to globals.css

### 401 Errors Not Triggering Refresh

**Issue:** Getting 401 errors without automatic token refresh

**Solution:**
- Verify API client interceptors are configured
- Check that refresh token exists in localStorage
- Ensure API endpoint for token refresh is correct

## Next Steps

1. **Customize Styling** - Update the component styles to match your design system
2. **Add More Auth Features** - Implement social login, passkeys, etc.
3. **Enhance Security** - Add rate limiting, CAPTCHA, etc.
4. **Add Analytics** - Track authentication events
5. **Implement Audit Logs** - Log user actions for security

## Support

For questions or issues:
- Check the main documentation: `src/lib/AUTH_SYSTEM_README.md`
- Review the example code in this guide
- Check the TypeScript types for available methods
- Inspect browser console and network tab for errors

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [JWT Best Practices](https://jwt.io/introduction)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
