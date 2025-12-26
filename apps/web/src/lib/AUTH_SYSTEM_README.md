# Authentication System Documentation

Complete authentication system for the NextPik E-commerce platform built with Next.js 15, React 19, and TypeScript.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

This authentication system provides a complete, production-ready solution for user authentication, authorization, and session management in a Next.js 15 application.

### Key Components

- **Auth Context** (`contexts/auth-context.tsx`) - Central authentication state management
- **Auth Provider** (`providers/auth-provider.tsx`) - Wrapper component for the app
- **Hooks** - Custom hooks for easy access to auth functionality
  - `useAuth()` - Main authentication hook
  - `useUser()` - User data and profile operations
  - `useSession()` - Session management and monitoring
- **Route Protection** - Components for protecting routes
  - `ProtectedRoute` - For authenticated users
  - `AdminRoute` - For admin users only
- **Middleware** (`middleware.ts`) - Edge-level route protection
- **Utilities** (`lib/auth-utils.ts`) - Helper functions

## Features

### Authentication Methods

- Email/Password login
- User registration
- Magic link (passwordless) authentication
- Password reset flow
- Two-factor authentication (2FA)
- Email verification
- Remember me functionality

### Authorization

- Role-based access control (RBAC)
- Customer, Admin, and SuperAdmin roles
- Protected routes
- Admin-only routes
- Permission checks

### Session Management

- Automatic token refresh
- Session timeout handling
- Multiple device session tracking
- Session revocation
- Activity tracking

### Security

- JWT token management
- Secure token storage
- Automatic token expiry checks
- Session timeout on inactivity
- XSS and CSRF protection

### User Profile

- Profile management
- Avatar upload/delete
- Preference management
- Password change
- Account deletion

## Architecture

### Data Flow

```
User Action → Component → Hook → Context → API Client → Backend
                                     ↓
                          Token Manager ← localStorage
```

### State Management

The auth system uses React Context for state management:

1. **AuthContext** - Provides authentication state and methods
2. **LocalStorage** - Persists tokens and user data
3. **API Client** - Handles token refresh automatically

### Token Management

- Access tokens stored in localStorage
- Automatic refresh on expiry
- Interceptors handle 401 responses
- Tokens cleared on logout

## Installation & Setup

### 1. Wrap Your App with AuthProvider

In your root layout file (`app/layout.tsx`):

```tsx
import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Environment Variables

Ensure you have the API URL configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Middleware Configuration

The middleware is automatically configured and will protect routes based on the patterns defined in `middleware.ts`.

## Usage Examples

### Basic Authentication

#### Login Form

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password, rememberMe: true });
      // Redirect is handled automatically
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

#### Register Form

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(formData);
      // Redirect is handled automatically
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
      />
      <input
        type="text"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        placeholder="First Name"
      />
      <input
        type="text"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        placeholder="Last Name"
      />
      <label>
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
        />
        I accept the terms and conditions
      </label>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}
```

### Protected Routes

#### Using ProtectedRoute Component

```tsx
// app/account/page.tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>My Account</h1>
        {/* Protected content */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Using AdminRoute Component

```tsx
// app/admin/dashboard/page.tsx
import { AdminRoute } from '@/components/admin-route';

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin only content */}
      </div>
    </AdminRoute>
  );
}
```

#### Require SuperAdmin

```tsx
import { AdminRoute } from '@/components/admin-route';

export default function SuperAdminSettings() {
  return (
    <AdminRoute requireSuperAdmin>
      <div>
        <h1>SuperAdmin Settings</h1>
        {/* SuperAdmin only content */}
      </div>
    </AdminRoute>
  );
}
```

### User Profile Management

#### Display User Profile

```tsx
'use client';

import { useUser } from '@/hooks/use-user';

export function UserProfile() {
  const { profile, isAdmin, isEmailVerified } = useUser();

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>{profile.fullName}</h2>
      <p>{profile.email}</p>
      {isAdmin && <span className="badge">Admin</span>}
      {!isEmailVerified && (
        <div className="alert">Please verify your email</div>
      )}
    </div>
  );
}
```

#### Update Profile

```tsx
'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';

export function EditProfile() {
  const { profile, updateProfile, isLoading } = useUser();
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile({ firstName, lastName });
      // Success toast is shown automatically
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <button type="submit" disabled={isLoading}>
        Save Changes
      </button>
    </form>
  );
}
```

#### Upload Avatar

```tsx
'use client';

import { useUser } from '@/hooks/use-user';

export function AvatarUpload() {
  const { uploadAvatar, isLoading } = useUser();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      {isLoading && <p>Uploading...</p>}
    </div>
  );
}
```

### Session Management

#### Display Active Sessions

```tsx
'use client';

import { useEffect } from 'react';
import { useSession } from '@/hooks/use-session';

export function SessionsList() {
  const {
    sessions,
    fetchSessions,
    revokeSession,
    isLoading,
  } = useSession();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div>
      <h2>Active Sessions</h2>
      {sessions.map((session) => (
        <div key={session.id}>
          <p>{session.device} - {session.location}</p>
          <p>Last active: {session.lastActiveAt}</p>
          {!session.isCurrent && (
            <button onClick={() => revokeSession(session.id)}>
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Conditional Rendering Based on Auth

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';

export function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const { profile, isAdmin } = useUser();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {profile?.firstName}!</span>
          {isAdmin && <a href="/admin">Admin Panel</a>}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <a href="/auth/login">Login</a>
          <a href="/auth/register">Register</a>
        </>
      )}
    </nav>
  );
}
```

### Password Management

#### Change Password

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function ChangePasswordForm() {
  const { changePassword, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      // Success toast is shown automatically
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Password change failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        placeholder="Current Password"
      />
      <input
        type="password"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
        placeholder="New Password"
      />
      <input
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        placeholder="Confirm Password"
      />
      <button type="submit" disabled={isLoading}>
        Change Password
      </button>
    </form>
  );
}
```

### Two-Factor Authentication

#### Enable 2FA

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function Enable2FA() {
  const { setupTwoFactor, enableTwoFactor } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const handleSetup = async () => {
    const data = await setupTwoFactor();
    setQrCode(data.qrCode);
  };

  const handleEnable = async () => {
    await enableTwoFactor(code);
    setQrCode(null);
  };

  return (
    <div>
      {!qrCode ? (
        <button onClick={handleSetup}>Setup 2FA</button>
      ) : (
        <>
          <img src={qrCode} alt="QR Code" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code from app"
          />
          <button onClick={handleEnable}>Enable 2FA</button>
        </>
      )}
    </div>
  );
}
```

## API Reference

### useAuth Hook

```typescript
const {
  // State
  user,
  isAuthenticated,
  isLoading,
  isInitialized,
  error,

  // Auth Methods
  login,
  register,
  logout,
  refreshUser,

  // Password Methods
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,

  // Magic Link
  requestMagicLink,
  verifyMagicLink,

  // Email Verification
  verifyEmail,
  resendEmailVerification,

  // 2FA Methods
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  regenerateBackupCodes,

  // Profile Methods
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,

  // Session Methods
  getSessions,
  revokeSession,
  revokeAllSessions,

  // Utility
  clearError,
} = useAuth();
```

### useUser Hook

```typescript
const {
  // User Data
  user,
  profile,
  preferences,
  addresses,
  defaultShippingAddress,
  defaultBillingAddress,

  // State
  isAuthenticated,
  isLoading,

  // Role Checks
  isAdmin,
  isSuperAdmin,
  isCustomer,
  hasRole,
  hasAnyRole,

  // Verification
  isEmailVerified,
  needsEmailVerification,
  has2FAEnabled,

  // Profile Operations
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
  refreshUser,
  changePassword,

  // Email Verification
  verifyEmail,
  resendEmailVerification,

  // Preferences
  updatePreferences,
  updateNotificationSettings,
  changeTheme,
  changeLanguage,
  changeCurrency,
} = useUser();
```

### useSession Hook

```typescript
const {
  // Session Data
  sessions,
  sessionStats,
  lastActivity,

  // State
  isLoading,
  error,
  isSessionExpired,

  // Operations
  fetchSessions,
  revokeSession,
  revokeAllOtherSessions,

  // Timer Management
  startTimer,
  resetTimer,
  clearTimer,

  // Queries
  getSessionsByDevice,
  getSessionsByBrowser,

  // Formatting
  getSessionDuration,
  getLastActiveTime,

  // Utility
  clearError,
} = useSession();
```

## Best Practices

### 1. Always Check isInitialized

Before rendering auth-dependent UI, check if auth is initialized:

```tsx
const { isInitialized, isAuthenticated } = useAuth();

if (!isInitialized) {
  return <LoadingSpinner />;
}

return isAuthenticated ? <Dashboard /> : <Login />;
```

### 2. Handle Loading States

Show loading indicators during async operations:

```tsx
const { login, isLoading } = useAuth();

<button disabled={isLoading}>
  {isLoading ? 'Logging in...' : 'Login'}
</button>
```

### 3. Handle Errors Gracefully

Display error messages to users:

```tsx
const { error, clearError } = useAuth();

{error && (
  <div className="error">
    {error}
    <button onClick={clearError}>×</button>
  </div>
)}
```

### 4. Use Route Protection

Protect routes at the component level AND with middleware:

```tsx
// Component level
<ProtectedRoute>
  <AccountPage />
</ProtectedRoute>

// Middleware handles edge-level protection automatically
```

### 5. Refresh User Data After Updates

After profile updates, the context automatically refreshes user data:

```tsx
await updateProfile({ firstName: 'John' });
// user state is automatically updated
```

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Solution:** Wrap your app with `<AuthProvider>` in the root layout.

### Issue: Infinite redirect loops

**Solution:** Check that your middleware configuration doesn't conflict with route protection logic.

### Issue: Token not persisting

**Solution:** Ensure localStorage is available (not in SSR context) and tokens are being set correctly.

### Issue: Session timeout not working

**Solution:** Check that user activity events are being tracked and timer is started on login.

### Issue: 401 errors not triggering token refresh

**Solution:** Verify that the API client interceptors are configured correctly.

## Security Considerations

1. **Never store sensitive data in localStorage** - Only tokens are stored
2. **Validate tokens on the server** - Middleware should verify JWT signatures
3. **Use HTTPS in production** - Protect tokens in transit
4. **Implement rate limiting** - Prevent brute force attacks
5. **Regular token rotation** - Refresh tokens periodically
6. **Session timeout** - Auto-logout after inactivity
7. **XSS protection** - Sanitize all user inputs
8. **CSRF protection** - Use CSRF tokens for state-changing operations

## Support

For issues or questions, please contact the development team or create an issue in the repository.
