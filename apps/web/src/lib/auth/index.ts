/**
 * Authentication System - Barrel Export
 *
 * Central export point for all authentication-related modules
 */

// Contexts
export { AuthContext, AuthProvider as AuthContextProvider } from '@/contexts/auth-context';
export type { AuthContextValue, AuthProviderProps } from '@/contexts/auth-context';

// Hooks
export { useAuth } from '@/hooks/use-auth';
export { useUser } from '@/hooks/use-user';
export { useSession } from '@/hooks/use-session';

// Providers
export { AuthProvider } from '@/providers/auth-provider';

// Components
export { ProtectedRoute } from '@/components/protected-route';
export { AdminRoute, AccessDenied } from '@/components/admin-route';
export { ToastListener } from '@/components/toast-listener';

// Utilities
export {
  // Authentication checks
  isAuthenticated,
  isTokenExpired,
  setTokenExpiry,
  clearTokenExpiry,

  // User management
  getStoredUser,
  storeUser,
  clearStoredUser,

  // Role-based access control
  hasRole,
  isAdmin,
  isSuperAdmin,
  isCustomer,
  hasAnyRole,

  // Redirect helpers
  getAuthRedirectUrl,
  getLoginUrl,
  getReturnUrl,

  // Session management
  startSessionTimer,
  resetSessionTimer,
  clearSessionTimer,

  // JWT utilities
  decodeToken,
  getTokenExpiry,
  isJwtExpired,

  // Email verification
  isEmailVerified,
  needsEmailVerification,

  // Two-factor authentication
  has2FAEnabled,

  // Clear all auth data
  clearAllAuthData,

  // Environment helpers
  isDevelopment,
  isProduction,
} from '@/lib/auth-utils';

// API functions
export {
  // Authentication
  login,
  register,
  logout,
  refreshToken,
  isAuthenticated as isAuthenticatedApi,
  getAccessToken,
  clearAuth,

  // Password
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,

  // Magic link
  requestMagicLink,
  verifyMagicLink,

  // Email verification
  verifyEmail,
  resendEmailVerification,

  // Two-factor authentication
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  regenerateBackupCodes,

  // User profile
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,

  // Session management
  getSessions,
  revokeSession,
  revokeAllSessions,
} from '@/lib/api/auth';

// API Client
export { client, TokenManager, ToastNotifier } from '@/lib/api/client';
export type { ToastType, ToastMessage } from '@/lib/api/client';

// Types
export type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  MagicLinkRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  UpdateProfileRequest,
  UserPreferences,
} from '@/lib/api/types';
