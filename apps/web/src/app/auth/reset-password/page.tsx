'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput, Button } from '@nextpik/ui';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { confirmPasswordReset, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localError, setLocalError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isLoading = authLoading;
  const error = authError || localError;

  useEffect(() => {
    if (!token) {
      setLocalError('Invalid or missing reset token');
    }
  }, [token]);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[strength] || 'Weak';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 1) return 'bg-error-DEFAULT';
    if (strength === 2) return 'bg-warning-DEFAULT';
    if (strength === 3) return 'bg-success-DEFAULT';
    return 'bg-success-dark';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!validateForm() || !token) return;

    try {
      await confirmPasswordReset(token, password, confirmPassword);
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      // Error is already set in auth context
      console.error('Password reset error:', err);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Reset!"
        subtitle="Your password has been successfully updated"
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
              You can now sign in with your new password
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
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Create a strong password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Message */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-50 rounded-full mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-600">
            Your new password must be different from previously used passwords
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

        {/* New Password */}
        <div className="relative">
          <FloatingInput
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            error={validationErrors.password}
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gold transition-colors z-10"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <motion.div
                  key={level}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: level * 0.05 }}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    passwordStrength >= level
                      ? getPasswordStrengthColor(passwordStrength)
                      : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-500">
                Password strength: <span className={`font-semibold ${passwordStrength >= 3 ? 'text-success-DEFAULT' : 'text-warning-DEFAULT'}`}>
                  {getPasswordStrengthLabel(passwordStrength)}
                </span>
              </p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-xs text-neutral-600 space-y-1">
              <p className="font-medium text-black mb-1">Password must contain:</p>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-success-DEFAULT' : 'bg-neutral-300'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-success-DEFAULT' : 'bg-neutral-300'}`} />
                  <span>Upper & lowercase letters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${/\d/.test(password) ? 'bg-success-DEFAULT' : 'bg-neutral-300'}`} />
                  <span>At least one number</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${/[^a-zA-Z0-9]/.test(password) ? 'bg-success-DEFAULT' : 'bg-neutral-300'}`} />
                  <span>At least one special character</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirm Password */}
        <FloatingInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (validationErrors.confirmPassword) {
              setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
          }}
          error={validationErrors.confirmPassword}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-lg hover:bg-neutral-800 transition-all duration-300 font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !password || !confirmPassword || !token}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Resetting password...
            </span>
          ) : (
            'Reset Password'
          )}
        </Button>

        {/* Back to Login */}
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
      </form>
    </AuthLayout>
  );
}
