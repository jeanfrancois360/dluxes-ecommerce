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
 * Convenience methods - supports both (title, message) and (message) signatures
 */
export const toast = {
  success: (titleOrMessage: string, message?: string, duration?: number) =>
    showToast({
      type: 'success',
      title: message ? titleOrMessage : 'Success',
      message: message || titleOrMessage,
      duration
    }),

  error: (titleOrMessage: string, message?: string, duration?: number) =>
    showToast({
      type: 'error',
      title: message ? titleOrMessage : 'Error',
      message: message || titleOrMessage,
      duration
    }),

  warning: (titleOrMessage: string, message?: string, duration?: number) =>
    showToast({
      type: 'warning',
      title: message ? titleOrMessage : 'Warning',
      message: message || titleOrMessage,
      duration
    }),

  info: (titleOrMessage: string, message?: string, duration?: number) =>
    showToast({
      type: 'info',
      title: message ? titleOrMessage : 'Info',
      message: message || titleOrMessage,
      duration
    }),
};
