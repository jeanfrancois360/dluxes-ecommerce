'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { Button } from '@nextpik/ui';
import { toast } from '@/lib/utils/toast';

export default function VerifyEmailPromptPage() {
  const router = useRouter();
  const { user, resendEmailVerification, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/account');
    }
  }, [user, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      await resendEmailVerification();
      toast.success('Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleSkipForNow = () => {
    // Allow user to proceed (grace period)
    router.push('/account');
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="We've sent a verification link to your email address"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Email Address */}
        {user?.email && (
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1">Email sent to:</p>
            <p className="font-semibold text-black">{user.email}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Next Steps
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return here and click "Continue to Dashboard"</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Continue Button */}
          <Button
            onClick={handleSkipForNow}
            className="w-full bg-gradient-to-r from-gold to-accent-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Continue to Dashboard
          </Button>

          {/* Resend Button */}
          <Button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            variant="outline"
            className="w-full border-2 border-neutral-300 hover:border-gold hover:bg-gold/5 transition-colors py-3 rounded-xl font-semibold"
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend Email (${resendCooldown}s)`
                : 'Resend Verification Email'}
          </Button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full text-sm text-neutral-600 hover:text-black transition-colors py-2"
          >
            Log out and use a different email
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Didn't receive the email?{' '}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-gold hover:text-accent-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Click here to resend
            </button>
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Make sure to check your spam or junk folder
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
