'use client';

/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, LoginRequest, RegisterRequest, ProfileUpdateData } from '@/lib/api/types';
import * as authApi from '@/lib/api/auth';
import { TokenManager } from '@/lib/api/client';
import { toast, standardToasts } from '@/lib/utils/toast';
import {
  getStoredUser,
  storeUser,
  clearAllAuthData,
  setTokenExpiry,
  isTokenExpired,
  startSessionTimer,
  resetSessionTimer,
  clearSessionTimer,
  getAuthRedirectUrl,
  isAdmin,
} from '@/lib/auth-utils';

// ============================================================================
// Types
// ============================================================================

export interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Authentication Methods
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Password Methods
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string, confirmPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;

  // Magic Link Methods
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;

  // Email Verification Methods
  verifyEmail: (token: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;

  // Two-Factor Authentication Methods
  setupTwoFactor: () => Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  enableTwoFactor: (code: string) => Promise<{ backupCodes: string[] }>;
  disableTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactor: (code: string, loginToken: string) => Promise<void>;
  regenerateBackupCodes: () => Promise<{ backupCodes: string[] }>;

  // Profile Methods
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;

  // Session Methods
  getSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;

  // Utility Methods
  clearError: () => void;
}

// ============================================================================
// Context
// ============================================================================

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed state
  const isAuthenticated = !!user && TokenManager.isAuthenticated();

  // ============================================================================
  // Session Timeout Handler
  // ============================================================================

  const handleSessionTimeout = useCallback(async () => {
    standardToasts.auth.sessionExpired();
    await logout();
  }, []);

  // ============================================================================
  // Initialize Auth State
  // ============================================================================

  useEffect(() => {
    async function initializeAuth() {
      try {
        setIsLoading(true);

        // Check if token exists
        const token = TokenManager.getAccessToken();
        if (!token) {
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (isTokenExpired()) {
          // Try to refresh token
          try {
            await authApi.refreshToken();
          } catch (error: any) {
            // Refresh failed, clear auth data
            // Don't log 401 errors - they're expected for expired refresh tokens
            const is401 = error?.status === 401 || error?.response?.status === 401;
            if (!is401) {
              console.error('Error refreshing token:', error);
            }
            clearAllAuthData();
            setUser(null);
            setIsInitialized(true);
            setIsLoading(false);
            return;
          }
        }

        // Try to get stored user first (for faster initial render)
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Fetch fresh user data from API
        try {
          const freshUser = await authApi.getCurrentUser();
          setUser(freshUser);
          storeUser(freshUser);

          // Start session timer
          startSessionTimer(handleSessionTimeout);
        } catch (error: any) {
          // Failed to fetch user, use stored user or clear auth
          // Don't log 401 errors - they're expected for expired tokens
          const is401 = error?.status === 401 || error?.response?.status === 401;

          if (!storedUser) {
            clearAllAuthData();
            setUser(null);
          }

          // Only log unexpected errors (not authentication failures)
          if (!is401) {
            console.error('Error validating user session:', error);
          }
        }
      } catch (error: any) {
        // Don't log 401 errors - they're expected for expired tokens
        const is401 = error?.status === 401 || error?.response?.status === 401;
        if (!is401) {
          console.error('Error initializing auth:', error);
        }
        clearAllAuthData();
        setUser(null);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, [handleSessionTimeout]);

  // ============================================================================
  // Listen for API logout events
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLogoutEvent = () => {
      setUser(null);
      clearAllAuthData();
      router.push('/auth/login');
    };

    window.addEventListener('api:logout', handleLogoutEvent);
    return () => window.removeEventListener('api:logout', handleLogoutEvent);
  }, [router]);

  // ============================================================================
  // User Activity Tracking (Reset Session Timer)
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const resetTimer = () => {
      resetSessionTimer(handleSessionTimeout);
    };

    // Track user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, handleSessionTimeout]);

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authApi.login(credentials);

        // Handle different response formats
        const userData = response.user;
        const token = response.token || response.access_token;
        const refreshToken = response.refreshToken;

        // Store tokens if present
        if (token) {
          TokenManager.setAccessToken(token);
          if (refreshToken) {
            TokenManager.setRefreshToken(refreshToken);
          }
        }

        setUser(userData);
        storeUser(userData);

        // Set token expiry if available (default to 24 hours if not provided)
        const expiresIn = response.expiresIn || 24 * 60 * 60 * 1000;
        setTokenExpiry(expiresIn);

        // Start session timer
        startSessionTimer(handleSessionTimeout);

        standardToasts.auth.loginSuccess(userData.firstName);

        // Redirect based on user role
        const redirectUrl = getAuthRedirectUrl(userData);
        router.push(redirectUrl);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, handleSessionTimeout]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authApi.register(data);

        // Handle different response formats
        const userData = response.user;
        const token = response.token || response.access_token;
        const refreshToken = response.refreshToken;

        // Store tokens if present
        if (token) {
          TokenManager.setAccessToken(token);
          if (refreshToken) {
            TokenManager.setRefreshToken(refreshToken);
          }
        }

        setUser(userData);
        storeUser(userData);

        // Set token expiry if available (default to 24 hours if not provided)
        const expiresIn = response.expiresIn || 24 * 60 * 60 * 1000;
        setTokenExpiry(expiresIn);

        // Start session timer
        startSessionTimer(handleSessionTimeout);

        standardToasts.auth.registerSuccess();

        // Redirect to account page
        router.push('/account');
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Registration failed. Please try again.';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, handleSessionTimeout]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout API
      await authApi.logout();

      // Clear all auth data
      setUser(null);
      clearAllAuthData();

      standardToasts.auth.logoutSuccess();

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth data even if API call fails
      setUser(null);
      clearAllAuthData();
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const freshUser = await authApi.getCurrentUser();

      setUser(freshUser);
      storeUser(freshUser);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to refresh user data';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Password Methods
  // ============================================================================

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.requestPasswordReset({ email });
      standardToasts.auth.passwordResetSent();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPasswordReset = useCallback(
    async (token: string, password: string, confirmPassword: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await authApi.confirmPasswordReset({ token, password, confirmPassword });
        standardToasts.auth.passwordResetSuccess();

        router.push('/auth/login');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to reset password';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await authApi.changePassword(currentPassword, newPassword, confirmPassword);
        toast.success('Password changed successfully');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to change password';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ============================================================================
  // Magic Link Methods
  // ============================================================================

  const requestMagicLink = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.requestMagicLink({ email });
      toast.success('Magic link sent to your email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send magic link';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMagicLink = useCallback(
    async (token: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const { user: userData, tokens } = await authApi.verifyMagicLink(token);

        setUser(userData);
        storeUser(userData);
        setTokenExpiry(tokens.expiresIn);

        // Start session timer
        startSessionTimer(handleSessionTimeout);

        standardToasts.auth.loginSuccess();

        // Redirect based on user role
        const redirectUrl = getAuthRedirectUrl(userData);
        router.push(redirectUrl);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to verify magic link';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, handleSessionTimeout]
  );

  // ============================================================================
  // Email Verification Methods
  // ============================================================================

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.verifyEmail(token);
      standardToasts.auth.emailVerified();

      // Refresh user data
      await refreshUser();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify email';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const resendEmailVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.resendEmailVerification();
      toast.success('Verification email sent to your email address');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to send verification email';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Two-Factor Authentication Methods
  // ============================================================================

  const setupTwoFactor = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      return await authApi.setupTwoFactor();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to setup 2FA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enableTwoFactor = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await authApi.enableTwoFactor({ code });
      standardToasts.otp.enabled();

      // Refresh user data
      await refreshUser();

      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to enable 2FA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const disableTwoFactor = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.disableTwoFactor({ code });
      standardToasts.otp.disabled();

      // Refresh user data
      await refreshUser();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to disable 2FA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const verifyTwoFactor = useCallback(
    async (code: string, loginToken: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const { user: userData, tokens } = await authApi.verifyTwoFactor(code, loginToken);

        setUser(userData);
        storeUser(userData);
        setTokenExpiry(tokens.expiresIn);

        // Start session timer
        startSessionTimer(handleSessionTimeout);

        standardToasts.auth.loginSuccess();

        // Redirect based on user role
        const redirectUrl = getAuthRedirectUrl(userData);
        router.push(redirectUrl);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to verify 2FA code';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, handleSessionTimeout]
  );

  const regenerateBackupCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await authApi.regenerateBackupCodes();
      toast.success('New backup codes have been generated');

      return data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to regenerate backup codes';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Profile Methods
  // ============================================================================

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await authApi.updateProfile(data);

      setUser(updatedUser);
      storeUser(updatedUser);

      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      try {
        setIsLoading(true);
        setError(null);

        const updatedUser = await authApi.uploadAvatar(file, onProgress);

        setUser(updatedUser);
        storeUser(updatedUser);

        toast.success('Avatar updated successfully');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to upload avatar';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAvatar = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await authApi.deleteAvatar();

      setUser(updatedUser);
      storeUser(updatedUser);

      toast.success('Avatar removed');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete avatar';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await authApi.deleteAccount(password);

        // Clear all auth data
        setUser(null);
        clearAllAuthData();

        toast.success('Account deleted successfully');

        router.push('/');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to delete account';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ============================================================================
  // Session Methods
  // ============================================================================

  const getSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      return await authApi.getSessions();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch sessions';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.revokeSession(sessionId);
      toast.success('Session revoked');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to revoke session';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeAllSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authApi.revokeAllSessions();
      toast.success('All sessions revoked');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to revoke sessions';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextValue = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Authentication Methods
    login,
    register,
    logout,
    refreshUser,

    // Password Methods
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,

    // Magic Link Methods
    requestMagicLink,
    verifyMagicLink,

    // Email Verification Methods
    verifyEmail,
    resendEmailVerification,

    // Two-Factor Authentication Methods
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

    // Utility Methods
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
