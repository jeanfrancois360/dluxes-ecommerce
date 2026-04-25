/**
 * Unified Cookie Manager
 *
 * Ensures cookies are set and deleted with identical attributes
 * to prevent persistence issues in production (Cloudflare CDN)
 */

export interface CookieOptions {
  days?: number;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  domain?: string;
}

/**
 * Set a cookie with proper attributes
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof window === 'undefined') return;

  const { days = 7, secure = window.location.protocol === 'https:', sameSite = 'Lax' } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // Build cookie string with exact attributes
  const parts = [
    `${name}=${value}`,
    `expires=${expires.toUTCString()}`,
    'path=/',
    `SameSite=${sameSite}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  // For production, also try with domain attribute for Cloudflare compatibility
  // But do NOT include it in the primary cookie to avoid conflicts
  document.cookie = parts.join(';');

  // Log in production for debugging
  if (process.env.NODE_ENV === 'production') {
    console.log(`[Cookie] Set: ${name} with attributes:`, {
      expires: expires.toUTCString(),
      secure,
      sameSite,
      domain: 'none (auto)',
    });
  }
}

/**
 * Delete a cookie with ALL possible attribute combinations
 * This ensures we catch cookies set with different attributes
 */
export function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;

  console.log(`[Cookie] Deleting: ${name}`);

  const hostname = window.location.hostname;
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? ';Secure' : '';

  // Strategy 1: Delete with exact same attributes we use when setting
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax${secureFlag}`;

  // Strategy 2: Delete with max-age (more reliable on some browsers)
  document.cookie = `${name}=;max-age=0;path=/;SameSite=Lax${secureFlag}`;

  // Strategy 3: Delete with no SameSite (for legacy cookies)
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${secureFlag}`;

  // Strategy 4: Try with root domain if not localhost
  if (hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const rootDomain = '.' + parts.slice(-2).join('.');

      // With SameSite
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${rootDomain};SameSite=Lax${secureFlag}`;
      document.cookie = `${name}=;max-age=0;path=/;domain=${rootDomain};SameSite=Lax${secureFlag}`;

      // Without SameSite
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${rootDomain}${secureFlag}`;
    }
  }

  // Strategy 5: Absolute bare minimum (last resort)
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  document.cookie = `${name}=;max-age=0;path=/`;

  // Verify deletion
  const stillExists = document.cookie.split(';').some((c) => c.trim().startsWith(`${name}=`));
  if (stillExists && process.env.NODE_ENV === 'production') {
    console.warn(`[Cookie] Failed to delete: ${name}`);
    console.warn('[Cookie] Remaining cookies:', document.cookie);
  } else if (process.env.NODE_ENV === 'production') {
    console.log(`[Cookie] Successfully deleted: ${name}`);
  }
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

/**
 * Check if cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Clear all authentication-related cookies
 */
export function clearAllAuthCookies(): void {
  if (typeof window === 'undefined') return;

  console.log('[Cookie] Clearing all auth cookies...');
  console.log('[Cookie] Before clear:', document.cookie);

  const cookieNames = [
    'nextpik_ecommerce_access_token',
    'nextpik_ecommerce_refresh_token',
    'auth_token',
    'refresh_token',
    'access_token',
    'nextpik_session_token',
    'nextpik_ecommerce_user',
    'token',
    'jwt',
    'session',
    'sessionId',
  ];

  cookieNames.forEach((name) => deleteCookie(name));

  console.log('[Cookie] After clear:', document.cookie);

  // Final check: Are there still any nextpik/auth cookies?
  const remaining = document.cookie.split(';').filter((c) => {
    const name = c.trim().split('=')[0];
    return name.includes('nextpik') || name.includes('auth') || name.includes('token');
  });

  if (remaining.length > 0) {
    console.error('[Cookie] CRITICAL: Some cookies still remain:', remaining);
  } else {
    console.log('[Cookie] ✅ All auth cookies cleared successfully');
  }
}
