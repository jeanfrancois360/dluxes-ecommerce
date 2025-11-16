/**
 * Toast Notification Utilities
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

/**
 * Show a toast notification
 */
export function showToast({ type, title, message, duration = 5000 }: ToastOptions) {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('api:toast', {
    detail: { type, title, message, duration },
  });

  window.dispatchEvent(event);
}

/**
 * Convenience methods
 */
export const toast = {
  success: (title: string, message: string, duration?: number) =>
    showToast({ type: 'success', title, message, duration }),

  error: (title: string, message: string, duration?: number) =>
    showToast({ type: 'error', title, message, duration }),

  warning: (title: string, message: string, duration?: number) =>
    showToast({ type: 'warning', title, message, duration }),

  info: (title: string, message: string, duration?: number) =>
    showToast({ type: 'info', title, message, duration }),
};
