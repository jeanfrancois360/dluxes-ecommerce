/**
 * Professional Toast Notification Utility
 *
 * Centralized toast notification system using Sonner
 * Provides consistent, professional notifications across the platform
 */

import { toast as sonnerToast } from 'sonner';
import { ExternalToast } from 'sonner';

export interface ToastOptions extends ExternalToast {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Success Toast
 * Use for successful operations (save, create, update, delete)
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      ...options,
    });
  },

  /**
   * Error Toast
   * Use for failed operations or validation errors
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 5000,
      action: options?.action,
      ...options,
    });
  },

  /**
   * Warning Toast
   * Use for cautionary messages or potential issues
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 4500,
      action: options?.action,
      ...options,
    });
  },

  /**
   * Info Toast
   * Use for informational messages
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      ...options,
    });
  },

  /**
   * Loading Toast
   * Use for async operations
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      ...options,
    });
  },

  /**
   * Promise Toast
   * Use for async operations with loading, success, and error states
   */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

/**
 * Pre-configured toast messages for common scenarios
 */
export const standardToasts = {
  // Authentication
  auth: {
    loginSuccess: (name?: string) =>
      toast.success(name ? `Welcome back, ${name}!` : 'Login successful'),
    loginError: () => toast.error('Invalid email or password'),
    logoutSuccess: () => toast.success('Logged out successfully'),
    registerSuccess: () =>
      toast.success('Account created successfully! Welcome to NextPik.'),
    registerError: (message: string) => toast.error(message),
    emailVerified: () => toast.success('Email verified successfully'),
    passwordResetSent: () =>
      toast.success('Password reset link sent to your email'),
    passwordResetSuccess: () =>
      toast.success('Password reset successfully. Please login.'),
    sessionExpired: () =>
      toast.warning('Your session has expired. Please login again.'),
    unauthorized: () =>
      toast.error('You are not authorized to perform this action'),
  },

  // Store Management
  store: {
    created: () =>
      toast.success(
        'Store created successfully! Pending admin approval.',
        { duration: 6000 }
      ),
    updated: () => toast.success('Store updated successfully'),
    deleted: () => toast.success('Store deleted successfully'),
    approved: () => toast.success('Store approved successfully'),
    rejected: () => toast.info('Store application rejected'),
  },

  // Products
  product: {
    created: () => toast.success('Product created successfully'),
    updated: () => toast.success('Product updated successfully'),
    deleted: () => toast.success('Product deleted successfully'),
    outOfStock: () => toast.warning('Product is out of stock'),
    addedToCart: (name?: string) =>
      toast.success(name ? `${name} added to cart` : 'Added to cart'),
    removedFromCart: () => toast.info('Removed from cart'),
  },

  // Orders
  order: {
    created: () => toast.success('Order placed successfully'),
    updated: () => toast.success('Order updated successfully'),
    cancelled: () => toast.info('Order cancelled'),
    shipped: () => toast.success('Order shipped'),
    delivered: () => toast.success('Order delivered'),
  },

  // Cart & Wishlist
  cart: {
    cleared: () => toast.info('Cart cleared'),
    updated: () => toast.success('Cart updated'),
    itemAdded: (productName?: string) =>
      toast.success(productName ? `${productName} added to cart` : 'Item added to cart'),
    itemRemoved: () => toast.info('Item removed from cart'),
  },

  wishlist: {
    added: (productName?: string) =>
      toast.success(
        productName ? `${productName} added to wishlist` : 'Added to wishlist'
      ),
    removed: () => toast.info('Removed from wishlist'),
  },

  // Email OTP
  otp: {
    sent: () => toast.success('Verification code sent to your email'),
    verified: () => toast.success('Code verified successfully'),
    invalid: () => toast.error('Invalid or expired verification code'),
    enabled: () => toast.success('Two-factor authentication enabled'),
    disabled: () => toast.success('Two-factor authentication disabled'),
  },

  // OAuth
  oauth: {
    googleLinked: () => toast.success('Google account linked successfully'),
    googleUnlinked: () => toast.info('Google account unlinked'),
    oauthError: () =>
      toast.error('OAuth authentication failed. Please try again.'),
  },

  // Generic
  generic: {
    saved: () => toast.success('Changes saved successfully'),
    deleted: () => toast.success('Deleted successfully'),
    copied: () => toast.success('Copied to clipboard'),
    uploadSuccess: () => toast.success('Upload successful'),
    uploadError: () => toast.error('Upload failed. Please try again.'),
    networkError: () =>
      toast.error('Network error. Please check your connection.'),
    serverError: () =>
      toast.error('Server error. Please try again later.'),
    validationError: (message?: string) =>
      toast.error(message || 'Please check your input and try again'),
    permissionDenied: () =>
      toast.error('You do not have permission to perform this action'),
  },

  // Subscriptions
  subscription: {
    created: () => toast.success('Subscription activated successfully'),
    cancelled: () => toast.info('Subscription cancelled'),
    renewed: () => toast.success('Subscription renewed'),
    paymentFailed: () =>
      toast.error('Payment failed. Please update your payment method.'),
  },
};

/**
 * API Error Handler
 * Automatically displays appropriate toast for API errors
 */
export const handleApiError = (error: any) => {
  // Extract error message
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred';

  // Handle specific error codes
  const status = error?.response?.status;

  switch (status) {
    case 400:
      toast.error(message);
      break;
    case 401:
      standardToasts.auth.sessionExpired();
      break;
    case 403:
      standardToasts.auth.unauthorized();
      break;
    case 404:
      toast.error('Resource not found');
      break;
    case 409:
      toast.error(message); // Conflict (e.g., duplicate email)
      break;
    case 422:
      standardToasts.generic.validationError(message);
      break;
    case 429:
      toast.warning('Too many requests. Please try again later.');
      break;
    case 500:
      standardToasts.generic.serverError();
      break;
    case 503:
      toast.error('Service temporarily unavailable');
      break;
    default:
      if (!navigator.onLine) {
        standardToasts.generic.networkError();
      } else {
        toast.error(message);
      }
  }
};

/**
 * Form Validation Toast
 * Use for displaying form validation errors
 */
export const showFormError = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');

  toast.error(errorMessages || 'Please fix the form errors');
};

/**
 * Convert technical error to user-friendly message
 * Logs technical details to console while showing friendly message to user
 *
 * @param error - The error object from catch block
 * @param fallbackMessage - Fallback message if no specific mapping exists
 * @param context - Additional context for console logging (e.g., 'Login Error', 'Magic Link')
 * @returns User-friendly error message
 */
export function getUserFriendlyError(
  error: any,
  fallbackMessage: string = 'Something went wrong. Please try again.',
  context?: string
): string {
  // Log technical error to console
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error('Error:', error);
  }

  // Extract error message from various error formats
  const technicalMessage =
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    '';

  // Map technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    // Network errors
    'Network Error': 'Unable to connect. Please check your internet connection.',
    'Failed to fetch': 'Unable to connect. Please check your internet connection.',
    'ERR_NETWORK': 'Unable to connect. Please check your internet connection.',
    'ERR_CONNECTION_REFUSED': 'Unable to connect to the server. Please try again later.',
    'ECONNREFUSED': 'Unable to connect to the server. Please try again later.',

    // HTTP errors
    'Cannot POST': 'Unable to process your request. Please try again.',
    'Cannot GET': 'Unable to load data. Please try again.',
    'Cannot PUT': 'Unable to update. Please try again.',
    'Cannot DELETE': 'Unable to delete. Please try again.',
    'Cannot PATCH': 'Unable to update. Please try again.',

    // Auth errors
    'Invalid credentials': 'The email or password you entered is incorrect.',
    'Invalid email or password': 'The email or password you entered is incorrect.',
    'Unauthorized': 'You need to sign in to access this.',
    'Token expired': 'Your session has expired. Please sign in again.',
    'Invalid token': 'This link has expired or is invalid. Please request a new one.',
    'Email already exists': 'An account with this email already exists.',
    'User not found': 'No account found with this email address.',
    'Account not verified': 'Please verify your email address to continue.',

    // Magic link specific
    'Magic link expired': 'This link has expired. Please request a new one.',
    'Invalid magic link': 'This link is invalid. Please request a new one.',
    'Failed to send magic link': 'We couldn\'t send the link. Please try again.',
    'Failed to verify magic link': 'This link is invalid or has expired. Please request a new one.',

    // Password reset
    'Invalid reset token': 'This reset link has expired. Please request a new one.',
    'Password reset token expired': 'This reset link has expired. Please request a new one.',

    // Email verification
    'Verification token expired': 'This verification link has expired. We\'ll send you a new one.',
    'Email already verified': 'Your email is already verified.',

    // Server errors
    'Internal server error': 'Something went wrong on our end. Please try again later.',
    '500': 'Something went wrong on our end. Please try again later.',
    '502': 'Server is temporarily unavailable. Please try again in a moment.',
    '503': 'Service temporarily unavailable. Please try again in a moment.',
    '504': 'Request timed out. Please try again.',

    // Validation errors
    'Validation failed': 'Please check your input and try again.',
    'Invalid input': 'Please check your input and try again.',
    'Missing required fields': 'Please fill in all required fields.',

    // Rate limiting
    'Too many requests': 'Too many attempts. Please wait a moment and try again.',
    'Rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
  };

  // Check for exact matches
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (technicalMessage.includes(key)) {
      return friendlyMessage;
    }
  }

  // Check for status codes
  const statusCode = error?.response?.status || error?.status;
  if (statusCode) {
    if (statusCode === 401) {
      return 'You need to sign in to access this.';
    } else if (statusCode === 403) {
      return 'You don\'t have permission to do this.';
    } else if (statusCode === 404) {
      return 'The requested resource was not found.';
    } else if (statusCode === 409) {
      return 'This action conflicts with existing data.';
    } else if (statusCode === 422) {
      return 'Please check your input and try again.';
    } else if (statusCode === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    } else if (statusCode >= 500) {
      return 'Something went wrong on our end. Please try again later.';
    }
  }

  // If the technical message is already user-friendly (no technical jargon), use it
  const technicalJargon = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'api/v1', 'Error:', 'err:', 'Exception'];
  const hasTechnicalJargon = technicalJargon.some(term => technicalMessage.includes(term));

  if (technicalMessage && !hasTechnicalJargon && technicalMessage.length < 100) {
    return technicalMessage;
  }

  // Fall back to the provided fallback message
  return fallbackMessage;
}

export default toast;
