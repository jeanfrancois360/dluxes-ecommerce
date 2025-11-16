/**
 * Authentication Utility Functions
 *
 * Helper functions for authentication, authorization, and token management
 */

import { TokenManager } from './api/client';
import type { User } from './api/types';

// ============================================================================
// Constants
// ============================================================================

const USER_KEY = 'luxury_ecommerce_user';
const TOKEN_EXPIRY_KEY = 'luxury_ecommerce_token_expiry';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// ============================================================================
// Authentication Checks
// ============================================================================

/**
 * Check if user is authenticated
 *
 * @returns True if user has valid access token
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return TokenManager.isAuthenticated();
}

/**
 * Check if the current access token is expired
 *
 * @returns True if token is expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;

  return Date.now() >= parseInt(expiryTime, 10);
}

/**
 * Set token expiry time
 *
 * @param expiresIn - Expiry time in seconds
 */
export function setTokenExpiry(expiresIn: number): void {
  if (typeof window === 'undefined') return;

  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Clear token expiry time
 */
export function clearTokenExpiry(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Get current user from localStorage
 *
 * @returns User object or null
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
}

/**
 * Store user in localStorage
 *
 * @param user - User object to store
 */
export function storeUser(user: User): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
}

/**
 * Remove user from localStorage
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

/**
 * Check if user has a specific role
 *
 * @param user - User object
 * @param role - Role to check
 * @returns True if user has the role
 */
export function hasRole(user: User | null, role: User['role']): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is an admin (admin or superadmin)
 *
 * @param user - User object
 * @returns True if user is admin or superadmin
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

/**
 * Check if user is a superadmin
 *
 * @param user - User object
 * @returns True if user is superadmin
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

/**
 * Check if user is a customer
 *
 * @param user - User object
 * @returns True if user is customer
 */
export function isCustomer(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'CUSTOMER';
}

/**
 * Check if user has any of the specified roles
 *
 * @param user - User object
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 */
export function hasAnyRole(user: User | null, roles: User['role'][]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

// ============================================================================
// Redirect Helpers
// ============================================================================

/**
 * Get redirect URL for authenticated users
 *
 * @param user - User object
 * @returns Redirect URL based on user role
 */
export function getAuthRedirectUrl(user: User | null): string {
  if (!user) return '/';

  // Redirect based on role
  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin/dashboard';

    case 'SELLER':
      return '/dashboard/seller';

    case 'BUYER':
    case 'CUSTOMER':
      return '/dashboard/buyer';

    default:
      return '/';
  }
}

/**
 * Get login redirect URL
 *
 * @param currentPath - Current path to return to after login
 * @returns Login URL with return path
 */
export function getLoginUrl(currentPath?: string): string {
  if (!currentPath || currentPath === '/') {
    return '/auth/login';
  }

  const encodedPath = encodeURIComponent(currentPath);
  return `/auth/login?returnUrl=${encodedPath}`;
}

/**
 * Get return URL from query params
 *
 * @param searchParams - URL search params
 * @returns Return URL or default
 */
export function getReturnUrl(searchParams: URLSearchParams): string {
  const returnUrl = searchParams.get('returnUrl');
  if (!returnUrl) return '/';

  // Validate returnUrl is a relative path (security)
  try {
    const url = new URL(returnUrl, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // Invalid URL, return default
  }

  return '/';
}

// ============================================================================
// Session Management
// ============================================================================

let sessionTimer: NodeJS.Timeout | null = null;

/**
 * Start session timeout timer
 *
 * @param onTimeout - Callback function when session times out
 * @param timeoutDuration - Timeout duration in milliseconds (default: 30 minutes)
 */
export function startSessionTimer(
  onTimeout: () => void,
  timeoutDuration: number = SESSION_TIMEOUT
): void {
  if (typeof window === 'undefined') return;

  // Clear existing timer
  clearSessionTimer();

  // Set new timer
  sessionTimer = setTimeout(() => {
    onTimeout();
  }, timeoutDuration);
}

/**
 * Reset session timeout timer
 *
 * @param onTimeout - Callback function when session times out
 * @param timeoutDuration - Timeout duration in milliseconds
 */
export function resetSessionTimer(
  onTimeout: () => void,
  timeoutDuration: number = SESSION_TIMEOUT
): void {
  startSessionTimer(onTimeout, timeoutDuration);
}

/**
 * Clear session timeout timer
 */
export function clearSessionTimer(): void {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
}

// ============================================================================
// JWT Token Utilities
// ============================================================================

/**
 * Decode JWT token payload (without verification)
 *
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get token expiry from JWT token
 *
 * @param token - JWT token
 * @returns Expiry timestamp or null
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Check if JWT token is expired
 *
 * @param token - JWT token
 * @returns True if token is expired
 */
export function isJwtExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;

  return Date.now() >= expiry;
}

// ============================================================================
// Email Verification
// ============================================================================

/**
 * Check if user's email is verified
 *
 * @param user - User object
 * @returns True if email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return user.isEmailVerified;
}

/**
 * Check if user needs email verification
 *
 * @param user - User object
 * @returns True if email verification is required
 */
export function needsEmailVerification(user: User | null): boolean {
  if (!user) return false;
  return !user.isEmailVerified;
}

// ============================================================================
// Two-Factor Authentication
// ============================================================================

/**
 * Check if user has 2FA enabled
 *
 * @param user - User object
 * @returns True if 2FA is enabled
 */
export function has2FAEnabled(user: User | null): boolean {
  if (!user) return false;
  return user.twoFactorEnabled === true;
}

// ============================================================================
// Clear All Auth Data
// ============================================================================

/**
 * Clear all authentication data from storage
 */
export function clearAllAuthData(): void {
  if (typeof window === 'undefined') return;

  TokenManager.clearTokens();
  clearStoredUser();
  clearTokenExpiry();
  clearSessionTimer();
}

// ============================================================================
// Environment Helpers
// ============================================================================

/**
 * Check if app is in development mode
 *
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if app is in production mode
 *
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
