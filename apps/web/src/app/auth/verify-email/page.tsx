'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/auth-layout';
import { Button, FloatingInput } from '@nextpik/ui';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired' | 'resend';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setState('resend');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setState('verifying');
      const response = await api.post('/auth/email/verify', { token: verificationToken });

      if (response.message) {
        setState('success');
        toast.success('Email verified successfully! Redirecting to login...');
        // Redirect to login after 5 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 5000);
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);

      if (errorMessage.toLowerCase().includes('expired')) {
        setState('expired');
      } else {
        setState('error');
      }
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    try {
      setIsResending(true);
      setError('');
      setResendSuccess(false);

      await api.post('/auth/email/resend-verification', { email: resendEmail });
      setResendSuccess(true);
      toast.success('Verification email sent! Please check your inbox.');
      setResendEmail('');

      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to resend verification email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Verifying State
  if (state === 'verifying') {
    return (
      <AuthLayout
        title="Verifying Your Email"
        subtitle="Please wait while we verify your email address..."
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6 py-12"
        >
          {/* Animated Loading Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <svg className="w-16 h-16 text-gold" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>

          <div className="space-y-2">
            <p className="text-neutral-600 text-base">
              Verifying your email address...
            </p>
            <p className="text-sm text-neutral-500">
              This should only take a moment
            </p>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Success State
  if (state === 'success') {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          {/* Success Icon with Animation */}
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
              You can now sign in to your account
            </p>
            <p className="text-sm text-neutral-500">
              Redirecting to login page...
            </p>
          </div>

          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold"
          >
            Go to Login
          </Button>

          <div className="pt-4 border-t border-neutral-200">
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-gold transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to home
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // Expired State
  if (state === 'expired') {
    return (
      <AuthLayout
        title="Link Expired"
        subtitle="Your verification link has expired"
      >
        <div className="space-y-6">
          {/* Warning Icon */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-light rounded-full mb-4">
              <svg className="w-8 h-8 text-warning-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 mb-6">
              Verification links expire after 24 hours for security reasons
            </p>
          </div>

          <form onSubmit={handleResendVerification} className="space-y-4">
            <FloatingInput
              label="Email Address"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              required
              placeholder="Enter your email"
            />

            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-success-light border border-success-DEFAULT rounded-lg text-success-dark text-sm"
              >
                Verification email sent! Please check your inbox.
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold"
              disabled={isResending || !resendEmail}
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-neutral-200">
            <Link
              href="/auth/login"
              className="text-sm text-neutral-600 hover:text-gold transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Error or Resend State
  return (
    <AuthLayout
      title={state === 'error' ? 'Verification Failed' : 'Verify Your Email'}
      subtitle={state === 'error' ? 'We couldn\'t verify your email' : 'Resend verification link'}
    >
      <div className="space-y-6">
        {/* Error Icon */}
        {state === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-error-light rounded-full mb-4">
              <svg className="w-8 h-8 text-error-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        )}

        <form onSubmit={handleResendVerification} className="space-y-4">
          <FloatingInput
            label="Email Address"
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            required
            placeholder="Enter your email"
          />

          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-success-light border border-success-DEFAULT rounded-lg text-success-dark text-sm"
            >
              Verification email sent! Please check your inbox.
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold"
            disabled={isResending || !resendEmail}
          >
            {isResending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              'Send Verification Email'
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-neutral-200 space-y-2">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-600 hover:text-gold transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>

          <div>
            <span className="text-sm text-neutral-500">or </span>
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-gold transition-colors"
            >
              return home
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
