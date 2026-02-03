/**
 * Next.js Middleware for Authentication and Route Protection
 *
 * Handles authentication checks and route protection at the edge
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// Configuration
// ============================================================================

const TOKEN_KEY = 'nextpik_ecommerce_access_token';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/collections',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
];

// Auth routes (login, register, etc.)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/magic-link',
  '/auth/verify-email',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/account',
  '/orders',
  '/wishlist',
  '/addresses',
  '/settings',
  '/dashboard',
  '/profile',
  '/checkout',
];

// Buyer-specific routes
const BUYER_ROUTES = ['/dashboard/buyer'];

// Seller-specific routes
const SELLER_ROUTES = ['/dashboard/seller', '/seller'];

// Admin routes that require admin role
const ADMIN_ROUTES = ['/admin'];

// Delivery Partner routes
const DELIVERY_PARTNER_ROUTES = ['/delivery-partner'];

// Routes that should always be accessible
const ALWAYS_ACCESSIBLE = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/fonts',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route))
  );
}

/**
 * Check if route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if route requires admin privileges
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Get token from cookies
 */
function getTokenFromCookies(request: NextRequest): string | undefined {
  // Check for token in cookies
  const token = request.cookies.get(TOKEN_KEY)?.value;
  return token;
}

/**
 * Check if token is valid (basic check - just existence for now)
 * In production, you might want to verify the JWT signature
 */
function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;

  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload to check expiry
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp;

    if (!exp) return false;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  } catch (error) {
    return false;
  }
}

/**
 * Get user role from token
 */
function getUserRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is admin
 */
function isAdmin(token: string): boolean {
  const role = getUserRoleFromToken(token);
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user is seller
 */
function isSeller(token: string): boolean {
  const role = getUserRoleFromToken(token);
  return role === 'SELLER';
}

/**
 * Check if user is buyer
 */
function isBuyer(token: string): boolean {
  const role = getUserRoleFromToken(token);
  return role === 'BUYER' || role === 'CUSTOMER';
}

/**
 * Check if user is delivery partner
 */
function isDeliveryPartner(token: string): boolean {
  const role = getUserRoleFromToken(token);
  return role === 'DELIVERY_PARTNER';
}

/**
 * Check if route is seller route
 */
function isSellerRoute(pathname: string): boolean {
  return SELLER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if route is buyer route
 */
function isBuyerRoute(pathname: string): boolean {
  return BUYER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if route is delivery partner route
 */
function isDeliveryPartnerRoute(pathname: string): boolean {
  return DELIVERY_PARTNER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Get dashboard redirect based on user role
 */
function getDashboardForRole(token: string): string {
  const role = getUserRoleFromToken(token);

  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'SELLER':
      return '/dashboard/seller';
    case 'DELIVERY_PARTNER':
      return '/delivery-partner/dashboard';
    case 'BUYER':
    case 'CUSTOMER':
      return '/dashboard/buyer';
    default:
      return '/';
  }
}

// ============================================================================
// Middleware Function
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for always accessible routes
  if (ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = getTokenFromCookies(request);
  const isAuthenticated = token ? isTokenValid(token) : false;

  // ============================================================================
  // Handle Auth Routes (Login, Register, etc.)
  // ============================================================================

  if (isAuthRoute(pathname)) {
    // If user is already authenticated, redirect to appropriate dashboard
    if (isAuthenticated && token) {
      const returnUrl = searchParams.get('returnUrl');

      // If there's a return URL, use it
      if (returnUrl) {
        try {
          const url = new URL(returnUrl, request.url);
          if (url.origin === request.nextUrl.origin) {
            return NextResponse.redirect(new URL(url.pathname + url.search, request.url));
          }
        } catch {
          // Invalid URL, fallthrough to dashboard redirect
        }
      }

      // Redirect to role-specific dashboard
      const dashboardUrl = getDashboardForRole(token);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Allow access to auth routes for non-authenticated users
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Protected Routes
  // ============================================================================

  if (isProtectedRoute(pathname)) {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated - allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Buyer Routes
  // ============================================================================

  if (isBuyerRoute(pathname)) {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but not buyer - redirect to appropriate dashboard
    if (token && !isBuyer(token)) {
      const dashboardUrl = getDashboardForRole(token);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Buyer - allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Seller Routes
  // ============================================================================

  if (isSellerRoute(pathname)) {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but not seller - redirect to appropriate dashboard
    if (token && !isSeller(token) && !isAdmin(token)) {
      const dashboardUrl = getDashboardForRole(token);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Seller or Admin - allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Admin Routes
  // ============================================================================

  if (isAdminRoute(pathname)) {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but not admin - redirect to role-specific dashboard
    if (token && !isAdmin(token)) {
      const dashboardUrl = getDashboardForRole(token);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Admin - allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Delivery Partner Routes
  // ============================================================================

  if (isDeliveryPartnerRoute(pathname)) {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but not delivery partner or admin - redirect to role-specific dashboard
    if (token && !isDeliveryPartner(token) && !isAdmin(token)) {
      const dashboardUrl = getDashboardForRole(token);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Delivery Partner or Admin - allow access
    return NextResponse.next();
  }

  // ============================================================================
  // Handle Public Routes
  // ============================================================================

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ============================================================================
  // Default: Allow access
  // ============================================================================

  return NextResponse.next();
}

// ============================================================================
// Middleware Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
