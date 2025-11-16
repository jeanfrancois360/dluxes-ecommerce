'use client';

/**
 * useUser Hook
 *
 * Custom hook for user data and operations
 */

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import {
  isAdmin,
  isSuperAdmin,
  isCustomer,
  hasRole,
  hasAnyRole,
  isEmailVerified,
  needsEmailVerification,
  has2FAEnabled,
} from '@/lib/auth-utils';
import type { User } from '@/lib/api/types';

/**
 * Hook for user data and operations
 *
 * @returns User data and utility methods
 *
 * @example
 * ```tsx
 * function ProfileComponent() {
 *   const { user, isAdmin, updateProfile, uploadAvatar } = useUser();
 *
 *   if (!user) return <div>Not logged in</div>;
 *
 *   return (
 *     <div>
 *       <h1>{user.fullName}</h1>
 *       {isAdmin && <AdminPanel />}
 *       <button onClick={() => updateProfile({ firstName: 'John' })}>
 *         Update Profile
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUser() {
  const {
    user,
    isAuthenticated,
    isLoading,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    refreshUser,
    changePassword,
    verifyEmail,
    resendEmailVerification,
  } = useAuth();

  // Memoized role checks
  const userRole = useMemo(() => {
    return {
      isAdmin: isAdmin(user),
      isSuperAdmin: isSuperAdmin(user),
      isCustomer: isCustomer(user),
      hasRole: (role: User['role']) => hasRole(user, role),
      hasAnyRole: (roles: User['role'][]) => hasAnyRole(user, roles),
    };
  }, [user]);

  // Memoized verification checks
  const verification = useMemo(() => {
    return {
      isEmailVerified: isEmailVerified(user),
      needsEmailVerification: needsEmailVerification(user),
      has2FAEnabled: has2FAEnabled(user),
    };
  }, [user]);

  // User profile helpers
  const profile = useMemo(() => {
    if (!user) return null;

    return {
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
    };
  }, [user]);

  // User preferences helpers
  const preferences = useMemo(() => {
    if (!user) return null;

    return {
      language: user.preferences?.language || 'en',
      currency: user.preferences?.currency || 'USD',
      theme: user.preferences?.theme || 'light',
      notifications: {
        email: user.preferences?.notifications?.email ?? true,
        sms: user.preferences?.notifications?.sms ?? false,
        push: user.preferences?.notifications?.push ?? true,
        marketing: user.preferences?.notifications?.marketing ?? false,
      },
    };
  }, [user]);

  // User addresses
  const addresses = useMemo(() => {
    if (!user) return [];
    return user.addresses || [];
  }, [user]);

  // Get default shipping address
  const defaultShippingAddress = useMemo(() => {
    return addresses.find((addr) => addr.type === 'shipping' && addr.isDefault);
  }, [addresses]);

  // Get default billing address
  const defaultBillingAddress = useMemo(() => {
    return addresses.find((addr) => addr.type === 'billing' && addr.isDefault);
  }, [addresses]);

  // Update user preferences
  const updatePreferences = async (
    newPreferences: Partial<User['preferences']>
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await updateProfile({
      preferences: {
        ...user.preferences,
        ...newPreferences,
      },
    });
  };

  // Update notification settings
  const updateNotificationSettings = async (
    notifications: Partial<User['preferences']['notifications']>
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await updateProfile({
      preferences: {
        ...user.preferences,
        notifications: {
          ...user.preferences.notifications,
          ...notifications,
        },
      },
    });
  };

  // Change user theme
  const changeTheme = async (theme: 'light' | 'dark' | 'auto'): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await updateProfile({
      preferences: {
        ...user.preferences,
        theme,
      },
    });
  };

  // Change user language
  const changeLanguage = async (language: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await updateProfile({
      preferences: {
        ...user.preferences,
        language,
      },
    });
  };

  // Change user currency
  const changeCurrency = async (currency: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await updateProfile({
      preferences: {
        ...user.preferences,
        currency,
      },
    });
  };

  return {
    // User data
    user,
    profile,
    preferences,
    addresses,
    defaultShippingAddress,
    defaultBillingAddress,

    // Authentication state
    isAuthenticated,
    isLoading,

    // Role checks
    ...userRole,

    // Verification checks
    ...verification,

    // Profile operations
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    refreshUser,
    changePassword,

    // Email verification
    verifyEmail,
    resendEmailVerification,

    // Preferences operations
    updatePreferences,
    updateNotificationSettings,
    changeTheme,
    changeLanguage,
    changeCurrency,
  };
}
