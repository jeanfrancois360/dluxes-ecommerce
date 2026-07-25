/**
 * Google Analytics 4 utility
 * All functions are no-ops when GA_MEASUREMENT_ID is not configured.
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

function isEnabled(): boolean {
  return typeof window !== 'undefined' && !!GA_MEASUREMENT_ID && typeof window.gtag === 'function';
}

/** Fire a page_view event. Called automatically by GoogleAnalytics on route change. */
export function pageview(url: string): void {
  if (!isEnabled()) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

// ── E-commerce events ────────────────────────────────────────────────────────

export function trackViewItem(params: {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
  category?: string;
}): void {
  if (!isEnabled()) return;
  window.gtag('event', 'view_item', {
    currency: params.currency ?? 'USD',
    value: params.price,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        item_category: params.category,
      },
    ],
  });
}

export function trackAddToCart(params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency?: string;
}): void {
  if (!isEnabled()) return;
  window.gtag('event', 'add_to_cart', {
    currency: params.currency ?? 'USD',
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  });
}

export function trackRemoveFromCart(params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency?: string;
}): void {
  if (!isEnabled()) return;
  window.gtag('event', 'remove_from_cart', {
    currency: params.currency ?? 'USD',
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(params: {
  value: number;
  currency?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}): void {
  if (!isEnabled()) return;
  window.gtag('event', 'begin_checkout', {
    currency: params.currency ?? 'USD',
    value: params.value,
    items: params.items,
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  currency?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}): void {
  if (!isEnabled()) return;
  window.gtag('event', 'purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency ?? 'USD',
    items: params.items,
  });
}

// ── Auth events ──────────────────────────────────────────────────────────────

export function trackLogin(method = 'email'): void {
  if (!isEnabled()) return;
  window.gtag('event', 'login', { method });
}

export function trackSignUp(method = 'email'): void {
  if (!isEnabled()) return;
  window.gtag('event', 'sign_up', { method });
}

// ── Search ───────────────────────────────────────────────────────────────────

export function trackSearch(searchTerm: string): void {
  if (!isEnabled()) return;
  window.gtag('event', 'search', { search_term: searchTerm });
}

// ── Generic escape hatch ─────────────────────────────────────────────────────

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!isEnabled()) return;
  window.gtag('event', name, params);
}
