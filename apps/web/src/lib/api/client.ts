const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// Token Manager
// ============================================================================

const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const COOKIE_ACCESS_TOKEN_KEY = 'luxury_ecommerce_access_token';
const COOKIE_REFRESH_TOKEN_KEY = 'luxury_ecommerce_refresh_token';

// Cookie utility functions
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export const TokenManager = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    // Also set in cookie for server-side middleware access
    setCookie(COOKIE_ACCESS_TOKEN_KEY, token, 7);
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    // Also set in cookie for server-side middleware access
    setCookie(COOKIE_REFRESH_TOKEN_KEY, token, 30);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Also clear cookies
    deleteCookie(COOKIE_ACCESS_TOKEN_KEY);
    deleteCookie(COOKIE_REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};

// ============================================================================
// Toast Notifier
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
}

export const ToastNotifier = {
  notify(type: ToastType, title: string, message?: string): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('toast', {
      detail: { type, title, message } as ToastMessage,
    });
    window.dispatchEvent(event);
  },

  success(title: string, message?: string): void {
    this.notify('success', title, message);
  },

  error(title: string, message?: string): void {
    this.notify('error', title, message);
  },

  warning(title: string, message?: string): void {
    this.notify('warning', title, message);
  },

  info(title: string, message?: string): void {
    this.notify('info', title, message);
  },
};

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new APIError(
      data?.message || 'An error occurred',
      response.status,
      data
    );
  }

  // Unwrap response if it's wrapped in { success, data } format
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    if (data.success) {
      return data.data;
    } else {
      // Handle error response from backend
      throw new APIError(
        data.message || 'An error occurred',
        response.status,
        data
      );
    }
  }

  return data;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers, ...restOptions } = options;

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  return handleResponse(response);
}

export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),

  // Orders API namespace
  orders: {
    getOrders: (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.status) searchParams.append('status', params.status);
      if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      const query = searchParams.toString();
      return apiClient(`/orders${query ? `?${query}` : ''}`);
    },
    getOrder: (id: string) => apiClient(`/orders/${id}`),
    cancelOrder: (id: string) => apiClient(`/orders/${id}/cancel`, { method: 'POST' }),
    trackOrder: (orderNumber: string, email: string) =>
      apiClient(`/orders/track`, {
        method: 'POST',
        body: JSON.stringify({ orderNumber, email }),
        headers: { 'Content-Type': 'application/json' },
      }),
    downloadInvoice: async (orderId: string) => {
      const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      return response.blob();
    },
  },
};

// Export api as client for compatibility
export const client = api;
