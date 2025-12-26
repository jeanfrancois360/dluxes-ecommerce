'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput, Button } from '@nextpik/ui';

export default function MagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { requestMagicLink, verifyMagicLink, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  const isLoading = authLoading;
  const error = authError || localError;

  const handleVerifyMagicLink = useCallback(async (magicToken: string) => {
    setIsVerifying(true);
    setLocalError('');
    clearError();

    try {
      await verifyMagicLink(magicToken);
      setIsSuccess(true);
      // Auth context handles redirect
    } catch (err: any) {
      // Error is already set in auth context
      console.error('Magic link verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [verifyMagicLink, clearError]);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token) {
      handleVerifyMagicLink(token);
    }
  }, [token, handleVerifyMagicLink]);

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validate email
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await requestMagicLink(email);
      setIsSent(true);
    } catch (err: any) {
      // Error is already set in auth context
      console.error('Magic link request error:', err);
    }
  };

  // Verifying state
  if (isVerifying) {
    return (
      <AuthLayout
        title="Verifying..."
        subtitle="Please wait while we sign you in"
      >
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-accent-50 rounded-full"
          >
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </motion.div>
          <p className="text-neutral-600">Authenticating your magic link...</p>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout
        title="Welcome Back!"
        subtitle="You've been successfully signed in"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-success-light rounded-full"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-10 h-10 text-success-DEFAULT"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>

          <div className="space-y-2">
            <p className="text-neutral-600 text-base">
              Redirecting you to your dashboard...
            </p>
          </div>

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold"
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  // Email sent state
  if (isSent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a magic link"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          {/* Email Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-50 rounded-full">
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-3">
            <p className="text-neutral-600 text-base">
              We've sent a magic link to <strong className="text-black">{email}</strong>
            </p>
            <p className="text-sm text-neutral-500">
              Click the link in your email to sign in instantly. The link will expire in 15 minutes.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 text-left">
            <p className="text-sm text-neutral-600 mb-2">
              <strong className="text-black">Didn't receive the email?</strong>
            </p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• The email might take a few minutes to arrive</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                setIsSent(false);
                setEmail('');
              }}
              className="w-full text-gold hover:text-accent-700 font-medium transition-colors text-sm"
            >
              Try a different email
            </button>

            <Link
              href="/auth/login"
              className="block w-full text-neutral-600 hover:text-black transition-colors text-sm"
            >
              Back to login
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Request magic link form
  return (
    <AuthLayout
      title="Sign In with Magic Link"
      subtitle="No password needed - we'll email you a secure link"
    >
      <form onSubmit={handleRequestMagicLink} className="space-y-6">
        {/* Info Message */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-50 rounded-full mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600">
            Enter your email and we'll send you a secure link to sign in instantly
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-error-light border border-error-DEFAULT rounded-lg text-error-dark text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Email Input */}
        <FloatingInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          required
        />

        {/* Benefits */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-xs font-medium text-black mb-2">Why use magic links?</p>
          <ul className="text-xs text-neutral-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-success-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No passwords to remember or type</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-success-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>More secure than traditional passwords</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-success-DEFAULT mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sign in with just one click</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending magic link...
            </span>
          ) : (
            'Send Magic Link'
          )}
        </Button>

        {/* Alternative Options */}
        <div className="text-center pt-4 border-t border-neutral-200 space-y-3">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-600 hover:text-gold transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Sign in with password instead
          </Link>

          <div>
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-gold hover:text-accent-700 font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
