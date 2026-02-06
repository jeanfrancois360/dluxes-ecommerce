'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput, Button } from '@nextpik/ui';
import { toast } from '@/lib/utils/toast';
import { showAuthError } from '@/lib/utils/auth-errors';
import { SuccessCheckmark } from '@/components/auth/success-animation';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, isLoading: authLoading, clearError } = useAuth();
  const t = useTranslations('auth.forgotPassword');
  const tc = useTranslations('common');
  const tLogin = useTranslations('auth.login');

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const isLoading = authLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate email
    if (!email) {
      toast.error(t('enterYourEmail'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(tLogin('invalidEmail'));
      return;
    }

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
    } catch (err: any) {
      // Use enhanced auth error handler with actionable links
      showAuthError(err, router);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title={t('checkYourEmail')}
        subtitle={t('sentResetLink')}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          {/* Success Checkmark */}
          <div className="flex justify-center mb-4">
            <SuccessCheckmark size="lg" />
          </div>

          {/* Email Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-50 rounded-full">
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-3">
            <p className="text-neutral-600 text-base">
              {t('ifAccountExists')} <strong className="text-black">{email}</strong>,
              {t('willReceiveLink')}
            </p>

            <p className="text-sm text-neutral-500">
              {t('linkExpires1Hour')}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 text-left">
            <p className="text-sm text-neutral-600 mb-2">
              <strong className="text-black">{t('didntReceiveEmail')}</strong>
            </p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>• {t('checkSpam')}</li>
              <li>• {t('verifyEmailCorrect')}</li>
              <li>• {t('waitFewMinutes')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
              className="w-full text-gold hover:text-accent-700 font-medium transition-colors text-sm"
            >
              {tc('buttons.tryDifferentEmail')}
            </button>

            <Link
              href="/auth/login"
              className="block w-full text-neutral-600 hover:text-black transition-colors text-sm"
            >
              {tc('buttons.backToLogin')}
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Message */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-50 rounded-full mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600">
            {t('enterEmailForReset')}
          </p>
        </div>

        {/* Email Input */}
        <FloatingInput
          label={tLogin('emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg"
          loading={isLoading}
          loadingText={t('sendingResetLink')}
          disabled={!email}
        >
          {t('sendResetLink')}
        </Button>

        {/* Back to Login - Mobile-friendly touch target */}
        <div className="text-center pt-4 border-t border-neutral-200">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-600 hover:text-gold transition-colors inline-flex items-center gap-2 py-2 px-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {tc('buttons.backToLogin')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
