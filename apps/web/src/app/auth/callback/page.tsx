'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TokenManager } from '@/lib/api/client';
import { storeUser, setTokenExpiry, getAuthRedirectUrl } from '@/lib/auth-utils';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin">
              <svg className="w-12 h-12 text-neutral-800" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-neutral-600 font-medium">Signing you in...</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const sessionToken = searchParams.get('sessionToken');
    const userB64 = searchParams.get('user');

    // If there is no accessToken, this might be an error redirect that landed here
    if (!accessToken || !userB64) {
      setError('Missing authentication data. Please try signing in again.');
      return;
    }

    try {
      const user = JSON.parse(atob(userB64));

      // Store access token (also sets cookie via TokenManager)
      TokenManager.setAccessToken(accessToken);

      // Store session token in localStorage for x-session-id header
      if (sessionToken) {
        localStorage.setItem('nextpik_session_token', sessionToken);
      }

      // Store user profile
      storeUser(user);

      // Set token expiry to 7 days (matching JWT expiresIn)
      setTokenExpiry(7 * 24 * 60 * 60);

      // Clear the tokens from the URL by replacing history entry, then redirect
      const redirectUrl = getAuthRedirectUrl(user);
      router.replace(redirectUrl);
    } catch {
      setError('Failed to process authentication data. Please try signing in again.');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Sign-in failed</h1>
          <p className="text-neutral-600">{error}</p>
          <a
            href="/auth/login"
            className="inline-block w-full bg-black text-white py-3 rounded-lg hover:bg-neutral-800 transition-colors font-semibold"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  // Loading state while tokens are being processed
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin">
          <svg className="w-12 h-12 text-neutral-800" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-neutral-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}
