'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/auth-layout';
import { OTPInput, Button } from '@nextpik/ui';
import { TokenManager, api } from '@/lib/api/client';
import { storeUser, getAuthRedirectUrl } from '@/lib/auth-utils';

export default function GoogleTwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleTwoFactorInner />
    </Suspense>
  );
}

function GoogleTwoFactorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pendingToken = searchParams.get('pendingToken') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!pendingToken) {
    return (
      <AuthLayout title="Session Expired" subtitle="Please sign in again.">
        <Button onClick={() => router.push('/auth/login')} className="w-full">
          Back to Sign In
        </Button>
      </AuthLayout>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result: any = await api.post('/auth/google/verify-2fa', {
        pendingToken,
        code,
      });

      TokenManager.setAccessToken(result.accessToken);
      if (result.sessionToken) {
        localStorage.setItem('nextpik_session_token', result.sessionToken);
      }
      storeUser(result.user);

      router.push(getAuthRedirectUrl(result.user));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Enter the code from your authenticator app to continue"
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center">
          <OTPInput length={6} value={code} onChange={setCode} />
        </div>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={isLoading || code.length < 6} className="w-full">
          {isLoading ? 'Verifying...' : 'Verify & Sign In'}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-gold hover:underline"
          >
            Use a different account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
