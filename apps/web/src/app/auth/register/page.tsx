'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput, Button } from '@nextpik/ui';
import type { UserRole } from '@/lib/api/types';

type AccountType = 'BUYER' | 'SELLER';

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

const accountTypes: AccountTypeOption[] = [
  {
    type: 'BUYER',
    title: 'Buyer Account',
    description: 'Shop luxury products from verified sellers',
    icon: '🛍️',
    benefits: [
      'Browse exclusive luxury collections',
      'Secure checkout and payments',
      'Order tracking and history',
      'Wishlist and favorites',
    ],
  },
  {
    type: 'SELLER',
    title: 'Seller Account',
    description: 'Sell your luxury products to a global audience',
    icon: '🏪',
    benefits: [
      'Create your own luxury store',
      'List unlimited products',
      'Analytics and insights',
      'Secure seller dashboard',
    ],
  },
];

export default function RegisterPage() {
  const { register, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>('BUYER');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'type' | 'details'>('type');

  const isLoading = authLoading;

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

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!acceptTerms) newErrors.terms = 'You must accept the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: accountType as UserRole,
      });
      // Auth context handles redirect
    } catch (err: any) {
      // Error is already set in auth context
      console.error('Registration error:', err);
    }
  };

  return (
    <AuthLayout
      title={step === 'type' ? 'Choose Account Type' : 'Create Account'}
      subtitle={step === 'type' ? 'Select how you want to join our platform' : 'Join our exclusive luxury collection'}
    >
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
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                          <li key={index} className="flex items-center gap-2 text-sm text-neutral-700">
                            <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
              Continue as {accountType === 'BUYER' ? 'Buyer' : 'Seller'}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-gold hover:text-accent-700 font-semibold transition-colors"
                >
                  Sign in
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
            className="space-y-6"
          >
            {/* Account Type Badge */}
            <div className="flex items-center justify-between p-4 bg-gold/5 rounded-lg border border-gold/20">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {accountTypes.find(t => t.type === accountType)?.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">
                    {accountTypes.find(t => t.type === accountType)?.title}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {accountTypes.find(t => t.type === accountType)?.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('type')}
                className="text-sm text-gold hover:text-accent-700 transition-colors font-medium"
              >
                Change
              </button>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-error-light border border-error-DEFAULT rounded-lg text-error-dark text-sm"
              >
                {authError}
              </motion.div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                required
              />

              <FloatingInput
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            {/* Email */}
            <FloatingInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
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
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
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
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <motion.div
                    key={level}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: level * 0.05 }}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      formData.password.length >= level * 2
                        ? level <= 2
                          ? 'bg-error-DEFAULT'
                          : level === 3
                            ? 'bg-warning-DEFAULT'
                            : 'bg-success-DEFAULT'
                        : 'bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                Use 8+ characters with a mix of letters, numbers & symbols
              </p>
            </div>

            {/* Confirm Password */}
            <FloatingInput
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
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

            {/* Terms & Conditions */}
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-1 text-gold bg-white border-2 border-neutral-300 rounded focus:ring-2 focus:ring-gold/20 transition-colors"
              />
              <span className="ml-3 text-sm text-neutral-600 group-hover:text-black transition-colors">
                I agree to the{' '}
                <Link href="/terms" className="text-gold hover:text-accent-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gold hover:text-accent-700 font-medium">
                  Privacy Policy
                </Link>
                {accountType === 'SELLER' && (
                  <>
                    , as well as the{' '}
                    <Link href="/seller-agreement" className="text-gold hover:text-accent-700 font-medium">
                      Seller Agreement
                    </Link>
                  </>
                )}
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-error-DEFAULT -mt-2">{errors.terms}</p>
            )}

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                `Create ${accountType === 'BUYER' ? 'Buyer' : 'Seller'} Account`
              )}
            </Button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('type')}
              className="w-full text-center text-sm text-neutral-600 hover:text-gold transition-colors py-2"
            >
              ← Back to account type
            </button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-gold hover:text-accent-700 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
