'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput, Button } from '@nextpik/ui';
import type { UserRole } from '@/lib/api/types';
import { toast, standardToasts } from '@/lib/utils/toast';
import { showAuthError } from '@/lib/utils/auth-errors';
import {
  PasswordStrengthIndicator,
  validatePassword,
} from '@/components/auth/password-strength-indicator';
import { SuccessAnimation } from '@/components/auth/success-animation';

type AccountType = 'BUYER' | 'SELLER';

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading: authLoading, error: authError, clearError } = useAuth();
  const t = useTranslations('auth.register');
  const tc = useTranslations('common');
  const tLogin = useTranslations('auth.login');

  // Referral System (v2.11.0) - Extract referral code from URL
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const accountTypes: AccountTypeOption[] = [
    {
      type: 'BUYER',
      title: t('buyerAccount'),
      description: t('buyerDescription'),
      icon: '🛍️',
      benefits: [t('buyerBenefit1'), t('buyerBenefit2'), t('buyerBenefit3'), t('buyerBenefit4')],
    },
    {
      type: 'SELLER',
      title: t('sellerAccount'),
      description: t('sellerDescription'),
      icon: '🏪',
      benefits: [
        t('sellerBenefit1'),
        t('sellerBenefit2'),
        t('sellerBenefit3'),
        t('sellerBenefit4'),
      ],
    },
  ];

  const [accountType, setAccountType] = useState<AccountType>('BUYER');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeDescription: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const isLoading = authLoading;

  // Extract referral code from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase().trim());
    }
  }, [searchParams]);

  // Countdown timer for redirect after success
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      // Redirect handled by auth context, but we can add a fallback
      router.push('/');
    }
    return undefined;
  }, [isSuccess, countdown, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (authError) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName) newErrors.lastName = t('lastNameRequired');
    if (!formData.email) newErrors.email = t('emailRequired');
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('invalidEmailFormat');

    // Enhanced password validation (matches backend requirements)
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }
    if (!acceptTerms) newErrors.terms = t('mustAcceptTerms');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      toast.error(t('fillAllFields'));
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: accountType as UserRole,
        // Include store fields if user is registering as a seller
        ...(accountType === 'SELLER' && {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription,
        }),
        // Referral System (v2.11.0) - Pass referral code if present
        ...(referralCode && { referralCode }),
      });

      // Show success animation
      setIsSuccess(true);

      // Start countdown and redirect
      setCountdown(3);
    } catch (err: any) {
      // Use enhanced auth error handler with actionable links
      showAuthError(err, router);
    }
  };

  // Show success screen
  if (isSuccess) {
    return (
      <AuthLayout title={t('welcomeToNextPik')} subtitle={t('accountCreatedSuccess')}>
        <SuccessAnimation
          title={accountType === 'SELLER' ? t('storeCreated') : t('accountCreated')}
          message={accountType === 'SELLER' ? t('storeReadyMessage') : t('welcomeExploreMessage')}
          countdown={countdown}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={step === 'type' ? t('chooseAccountType') : t('createAccount')}
      subtitle={step === 'type' ? t('selectHowToJoin') : t('joinExclusive')}
    >
      {/* Referral Banner (v2.11.0) */}
      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl">🎁</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Referral code applied:{' '}
                <code className="text-blue-600 font-mono">{referralCode}</code>
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Complete your registration to claim your reward
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 'type' ? (
          /* Step 1: Account Type Selection */
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              {accountTypes.map((option) => (
                <motion.button
                  key={option.type}
                  type="button"
                  onClick={() => setAccountType(option.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    accountType === option.type
                      ? 'border-gold bg-gold/5 shadow-lg shadow-gold/20'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  {/* Icon Badge */}
                  <div className="absolute top-4 right-4">
                    {accountType === option.type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-gold flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{option.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-2">{option.title}</h3>
                      <p className="text-sm text-neutral-600 mb-4">{option.description}</p>

                      {/* Benefits List */}
                      <ul className="space-y-2">
                        {option.benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-neutral-700"
                          >
                            <svg
                              className="w-4 h-4 text-gold flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <Button
              type="button"
              onClick={() => setStep('details')}
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg"
            >
              {accountType === 'BUYER' ? t('continueAsBuyer') : t('continueAsSeller')}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                {t('alreadyHaveAccount')}{' '}
                <Link
                  href="/auth/login"
                  className="text-gold hover:text-accent-700 font-semibold transition-colors"
                >
                  {tc('nav.signIn')}
                </Link>
              </p>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Registration Form */
          <motion.form
            key="details"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Account Type Badge */}
            <div className="flex items-center justify-between p-4 bg-gold/5 rounded-lg border border-gold/20">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {accountTypes.find((at) => at.type === accountType)?.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">
                    {accountTypes.find((at) => at.type === accountType)?.title}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {accountTypes.find((at) => at.type === accountType)?.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('type')}
                disabled={isLoading}
                className="text-sm text-gold hover:text-accent-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tc('buttons.change')}
              </button>
            </div>

            {/* Name Fields - Responsive grid stacks on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label={t('firstName')}
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                disabled={isLoading}
                required
              />

              <FloatingInput
                label={t('lastName')}
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                disabled={isLoading}
                required
              />
            </div>

            {/* Email */}
            <FloatingInput
              label={tLogin('emailLabel')}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
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

            {/* Password */}
            <div className="relative">
              <FloatingInput
                label={tLogin('passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                disabled={isLoading}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gold transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={formData.password} showRequirements={true} />

            {/* Confirm Password */}
            <FloatingInput
              label={t('confirmPassword')}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              disabled={isLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              required
            />

            {/* Store Information (Seller Only) */}
            {accountType === 'SELLER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-neutral-200"
              >
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="font-semibold text-black">{t('storeInfoOptional')}</h3>
                </div>

                {/* Instant Store Activation Notice */}
                <div className="p-4 bg-success-light border border-success-DEFAULT/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-success-dark flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-success-dark text-sm mb-1">
                        {t('instantStoreActivation')}
                      </p>
                      <p className="text-xs text-success-dark/80">{t('storeActivationMessage')}</p>
                    </div>
                  </div>
                </div>

                <FloatingInput
                  label={t('storeNameOptional')}
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  disabled={isLoading}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                  placeholder={t('storeNamePlaceholder')}
                />

                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-600 mb-2">
                    {t('storeDescriptionOptional')}
                  </label>
                  <textarea
                    value={formData.storeDescription}
                    onChange={(e) => handleChange('storeDescription', e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg text-base text-black bg-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 hover:border-neutral-300 transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    placeholder={t('storeDescriptionPlaceholder')}
                  />
                  <p className="text-xs text-neutral-400 mt-1 text-right">
                    {formData.storeDescription.length} {t('characters')}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Terms & Conditions */}
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 mt-1 text-gold bg-white border-2 border-neutral-300 rounded focus:ring-2 focus:ring-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm text-neutral-600 group-hover:text-black transition-colors">
                {t('agreeToTerms')}{' '}
                <Link href="/terms" className="text-gold hover:text-accent-700 font-medium">
                  {tc('footer.termsOfService')}
                </Link>{' '}
                {tLogin('and')}{' '}
                <Link href="/privacy" className="text-gold hover:text-accent-700 font-medium">
                  {tc('footer.privacyPolicy')}
                </Link>
                {accountType === 'SELLER' && (
                  <>
                    {t('asWellAs')}{' '}
                    <Link
                      href="/seller-agreement"
                      className="text-gold hover:text-accent-700 font-medium"
                    >
                      {tc('footer.sellerAgreement')}
                    </Link>
                  </>
                )}
              </span>
            </label>
            {errors.terms && <p className="text-sm text-error-DEFAULT -mt-2">{errors.terms}</p>}

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg"
              loading={isLoading}
              loadingText={t('creatingAccount')}
            >
              {accountType === 'BUYER' ? t('createBuyerAccount') : t('createSellerAccount')}
            </Button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('type')}
              className="w-full text-center text-sm text-neutral-600 hover:text-gold transition-colors py-2"
            >
              {t('backToAccountType')}
            </button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                {t('alreadyHaveAccount')}{' '}
                <Link
                  href="/auth/login"
                  className="text-gold hover:text-accent-700 font-semibold transition-colors"
                >
                  {tc('nav.signIn')}
                </Link>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
