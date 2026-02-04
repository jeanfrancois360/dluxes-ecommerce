/**
 * Enhanced Auth Error Handler
 *
 * Provides actionable error messages with smart action buttons
 * based on error content from backend
 */

import { toast, ToastOptions } from './toast';
import { useRouter } from 'next/navigation';

export interface AuthErrorAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ParsedAuthError {
  message: string;
  action?: AuthErrorAction;
}

/**
 * Parse auth error and determine appropriate action
 */
export function parseAuthError(errorMessage: string): ParsedAuthError {
  const msg = errorMessage.toLowerCase();

  // Email not verified
  if (msg.includes('email not verified') || msg.includes('verify your email')) {
    return {
      message: errorMessage,
      action: {
        label: 'Resend Verification',
        href: '/auth/verify-email',
      },
    };
  }

  // Password reset needed
  if (
    msg.includes('incorrect password') ||
    msg.includes('forgot password') ||
    msg.includes('reset your password') ||
    msg.includes('reset it')
  ) {
    return {
      message: errorMessage,
      action: {
        label: 'Reset Password',
        href: '/auth/forgot-password',
      },
    };
  }

  // Account creation needed
  if (msg.includes('no account found') || msg.includes('create a new account')) {
    return {
      message: errorMessage,
      action: {
        label: 'Create Account',
        href: '/auth/register',
      },
    };
  }

  // Email already registered - suggest login
  if (msg.includes('already registered') || msg.includes('please log in')) {
    return {
      message: errorMessage,
      action: {
        label: 'Log In',
        href: '/auth/login',
      },
    };
  }

  // Magic link expired/invalid
  if (msg.includes('magic link') && (msg.includes('expired') || msg.includes('invalid'))) {
    return {
      message: errorMessage,
      action: {
        label: 'Request New Link',
        href: '/auth/magic-link',
      },
    };
  }

  // Password reset link expired/invalid
  if (
    (msg.includes('reset') && (msg.includes('expired') || msg.includes('invalid'))) ||
    msg.includes('request a new')
  ) {
    return {
      message: errorMessage,
      action: {
        label: 'Request New Reset',
        href: '/auth/forgot-password',
      },
    };
  }

  // Verification link expired/invalid
  if (
    msg.includes('verification link') &&
    (msg.includes('expired') || msg.includes('invalid') || msg.includes('already used'))
  ) {
    return {
      message: errorMessage,
      action: {
        label: 'Request New Link',
        href: '/auth/verify-email',
      },
    };
  }

  // Passwordless login suggestion
  if (msg.includes('passwordless login') || msg.includes('magic link option')) {
    return {
      message: errorMessage,
      action: {
        label: 'Use Magic Link',
        href: '/auth/magic-link',
      },
    };
  }

  // Account suspended or inactive
  if (msg.includes('suspended') || msg.includes('contact support')) {
    return {
      message: errorMessage,
      action: {
        label: 'Contact Support',
        href: 'mailto:support@nextpik.com',
      },
    };
  }

  // No specific action - return message only
  return {
    message: errorMessage,
  };
}

/**
 * Show auth error with smart action button
 */
export function showAuthError(error: any, router?: ReturnType<typeof useRouter>): void {
  // Extract error message
  let errorMessage: string;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unexpected error occurred. Please try again.';
  }

  // Parse error to get action
  const parsed = parseAuthError(errorMessage);

  // Prepare toast options
  const toastOptions: ToastOptions = {
    duration: 6000, // Longer duration for error messages with actions
  };

  // Add action if available
  if (parsed.action) {
    toastOptions.action = {
      label: parsed.action.label,
      onClick: () => {
        if (parsed.action?.onClick) {
          parsed.action.onClick();
        } else if (parsed.action?.href) {
          // Handle navigation
          if (parsed.action.href.startsWith('mailto:')) {
            window.location.href = parsed.action.href;
          } else if (router) {
            router.push(parsed.action.href);
          } else {
            window.location.href = parsed.action.href;
          }
        }
      },
    };
  }

  // Show error toast with action
  toast.error(parsed.message, toastOptions);
}

/**
 * Common auth error messages (for consistency)
 */
export const AUTH_ERROR_MESSAGES = {
  networkError: 'Network error. Please check your connection and try again.',
  sessionExpired: 'Your session has expired. Please log in again.',
  unauthorized: 'You are not authorized to perform this action.',
  invalidCredentials: 'Invalid email or password. Please try again.',
  accountLocked: 'Your account has been locked. Please try again later or reset your password.',
  serverError: 'Server error. Please try again later.',
  unknownError: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message from API error
 */
export function getAuthErrorMessage(error: any): string {
  // Check for network errors
  if (!error.response) {
    return AUTH_ERROR_MESSAGES.networkError;
  }

  // Get status code
  const status = error.response?.status;

  // Map status codes to messages
  switch (status) {
    case 401:
      return error.response.data?.message || AUTH_ERROR_MESSAGES.unauthorized;
    case 403:
      return 'Access forbidden. You do not have permission to perform this action.';
    case 404:
      return error.response.data?.message || 'Resource not found.';
    case 409:
      return error.response.data?.message || 'Conflict. This resource already exists.';
    case 429:
      return (
        error.response.data?.message ||
        'Too many requests. Please wait a moment before trying again.'
      );
    case 500:
      return AUTH_ERROR_MESSAGES.serverError;
    default:
      return error.response.data?.message || AUTH_ERROR_MESSAGES.unknownError;
  }
}
