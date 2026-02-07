'use client';

/**
 * Security Settings Page
 *
 * Allows users to manage security settings:
 * - Change password
 * - Two-factor authentication status
 * - Active sessions (future)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/buyer/page-header';
import { useAuth } from '@/hooks/use-auth';
import { toast, standardToasts } from '@/lib/utils/toast';

interface UserSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
  deviceInfo?: {
    device: string;
    os: string;
    browser: string;
    description: string;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function SecurityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, changePassword } = useAuth();
  const t = useTranslations('account.security');

  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Fetch active sessions with device trust information
  const { data: sessionsData, mutate: mutateSessions } = useSWR<UserSession[]>(
    isAuthenticated ? '/auth/sessions' : null,
    async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sessions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
    { revalidateOnFocus: false }
  );

  const sessions = sessionsData || [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/account/security');
    }
  }, [authLoading, isAuthenticated, router]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.newPassword;
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [formData.newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return t('weak');
    if (passwordStrength <= 2) return t('fair');
    if (passwordStrength <= 3) return t('good');
    if (passwordStrength <= 4) return t('strong');
    return t('veryStrong');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('newPasswordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('passwordMinLength');
    } else if (!/[a-z]/.test(formData.newPassword) || !/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = t('passwordNeedsCases');
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = t('passwordNeedsNumber');
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = t('passwordMustBeDifferent');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('pleaseConfirmPassword');
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      standardToasts.generic.validationError('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      // Reset form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || !deleteConfirm) {
      setDeleteError(t('enterPasswordAndConfirm'));
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear local storage and redirect
        localStorage.removeItem('token');
        toast.success(t('accountDeleted'));
        router.push('/');
      } else {
        setDeleteError(data.message || t('failedDeleteAccount'));
      }
    } catch (error: any) {
      setDeleteError(error.message || t('errorDeletingAccount'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(t('deviceLoggedOut'));
        mutateSessions();
      } else {
        toast.error(data.message || t('failedRevokeSession'));
      }
    } catch {
      toast.error(t('failedRevokeSession'));
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sessions/revoke-all-other`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(t('allOtherLoggedOut'));
        mutateSessions();
      } else {
        toast.error(data.message || t('failedRevokeSessions'));
      }
    } catch {
      toast.error(t('failedRevokeSessions'));
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60)
      return diffMins > 1
        ? t('minutesAgo', { count: diffMins })
        : t('minuteAgo', { count: diffMins });
    if (diffHours < 24)
      return diffHours > 1
        ? t('hoursAgo', { count: diffHours })
        : t('hourAgo', { count: diffHours });
    if (diffDays < 7)
      return diffDays > 1 ? t('daysAgo', { count: diffDays }) : t('dayAgo', { count: diffDays });

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
    >
      {show ? (
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
  );

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/buyer' }, { label: 'Security' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              {/* Security Status Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
                <h2 className="text-xl font-bold font-['Poppins'] mb-6">{t('securityStatus')}</h2>

                <div className="space-y-4">
                  {/* Password Status */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{t('passwordSet')}</p>
                      <p className="text-sm text-green-600">{t('passwordSetDesc')}</p>
                    </div>
                  </div>

                  {/* 2FA Status */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      user.twoFactorEnabled ? 'bg-green-50' : 'bg-amber-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        user.twoFactorEnabled ? 'bg-green-100' : 'bg-amber-100'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className={`font-medium ${user.twoFactorEnabled ? 'text-green-800' : 'text-amber-800'}`}
                      >
                        {t('twoFactorAuth')}
                      </p>
                      <p
                        className={`text-sm ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {user.twoFactorEnabled ? t('enabled') : t('notEnabled')}
                      </p>
                    </div>
                  </div>

                  {/* Email Verification Status */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      user.emailVerified ? 'bg-green-50' : 'bg-amber-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        user.emailVerified ? 'bg-green-100' : 'bg-amber-100'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <p
                        className={`font-medium ${user.emailVerified ? 'text-green-800' : 'text-amber-800'}`}
                      >
                        {t('emailVerified')}
                      </p>
                      <p
                        className={`text-sm ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {user.emailVerified ? t('emailVerifiedDesc') : t('pleaseVerifyEmail')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 mt-6"
              >
                <h3 className="text-lg font-bold font-['Poppins'] mb-4">{t('quickLinks')}</h3>
                <div className="space-y-2">
                  <Link
                    href="/account/profile"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <svg
                        className="w-5 h-5 text-neutral-600 group-hover:text-gold transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-neutral-700 group-hover:text-gold transition-colors">
                      {t('editProfile')}
                    </span>
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <svg
                        className="w-5 h-5 text-neutral-600 group-hover:text-gold transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-neutral-700 group-hover:text-gold transition-colors">
                      {t('addresses')}
                    </span>
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              {/* Change Password Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-neutral-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-['Poppins']">{t('changePassword')}</h2>
                    <p className="text-neutral-500">{t('changePasswordDesc')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('currentPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors.currentPassword
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-neutral-200 focus:border-gold'
                        }`}
                        placeholder={t('enterCurrentPassword')}
                      />
                      <PasswordToggle
                        show={showCurrentPassword}
                        onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                      />
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('newPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors.newPassword
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-neutral-200 focus:border-gold'
                        }`}
                        placeholder={t('enterNewPassword')}
                      />
                      <PasswordToggle
                        show={showNewPassword}
                        onToggle={() => setShowNewPassword(!showNewPassword)}
                      />
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-neutral-500">{t('passwordStrength')}</span>
                          <span
                            className={`font-medium ${
                              passwordStrength <= 1
                                ? 'text-red-500'
                                : passwordStrength <= 2
                                  ? 'text-orange-500'
                                  : passwordStrength <= 3
                                    ? 'text-yellow-600'
                                    : 'text-green-500'
                            }`}
                          >
                            {getStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                            className={`h-full ${getStrengthColor()} transition-all duration-300`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('confirmNewPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors ${
                          errors.confirmPassword
                            ? 'border-red-500 focus:border-red-500'
                            : formData.confirmPassword &&
                                formData.confirmPassword === formData.newPassword
                              ? 'border-green-500 focus:border-green-500'
                              : 'border-neutral-200 focus:border-gold'
                        }`}
                        placeholder={t('confirmNewPasswordPlaceholder')}
                      />
                      <PasswordToggle
                        show={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                    {formData.confirmPassword &&
                      formData.confirmPassword === formData.newPassword &&
                      !errors.confirmPassword && (
                        <p className="mt-1 text-sm text-green-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t('passwordsMatch')}
                        </p>
                      )}
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-sm font-medium text-neutral-700 mb-3">
                      {t('passwordRequirements')}
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li
                        className={`flex items-center gap-2 ${
                          formData.newPassword.length >= 8 ? 'text-green-600' : 'text-neutral-500'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            formData.newPassword.length >= 8 ? 'text-green-500' : 'text-neutral-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {formData.newPassword.length >= 8 ? (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        {t('atLeast8Chars')}
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword)
                            ? 'text-green-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword)
                              ? 'text-green-500'
                              : 'text-neutral-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {/[a-z]/.test(formData.newPassword) &&
                          /[A-Z]/.test(formData.newPassword) ? (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        {t('uppercaseAndLowercase')}
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          /\d/.test(formData.newPassword) ? 'text-green-600' : 'text-neutral-500'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            /\d/.test(formData.newPassword) ? 'text-green-500' : 'text-neutral-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {/\d/.test(formData.newPassword) ? (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        {t('atLeastOneNumber')}
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          /[^a-zA-Z0-9]/.test(formData.newPassword)
                            ? 'text-green-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            /[^a-zA-Z0-9]/.test(formData.newPassword)
                              ? 'text-green-500'
                              : 'text-neutral-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {/[^a-zA-Z0-9]/.test(formData.newPassword) ? (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        {t('specialCharRecommended')}
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
                        {t('updatingPassword')}
                      </span>
                    ) : (
                      t('updatePassword')
                    )}
                  </motion.button>
                </form>

                {/* Forgot Password Link */}
                <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                  <p className="text-sm text-neutral-500">
                    {t('forgotCurrentPassword')}{' '}
                    <Link
                      href="/auth/forgot-password"
                      className="text-gold hover:underline font-medium"
                    >
                      {t('resetItHere')}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-['Poppins']">{t('activeSessions')}</h2>
                      <p className="text-neutral-500">{t('activeSessionsDesc')}</p>
                    </div>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllSessions}
                      disabled={isRevokingAll}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRevokingAll ? t('revoking') : t('logOutAllOther')}
                    </button>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-neutral-500">{t('noActiveSessions')}</p>
                    <p className="text-sm text-neutral-400 mt-1">{t('sessionsWillAppear')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          session.isCurrent
                            ? 'bg-green-50 border-green-200'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              session.isCurrent
                                ? 'bg-green-100 text-green-600'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {getDeviceIcon(session.deviceInfo?.device || session.deviceType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-black">
                                {session.deviceInfo?.description ||
                                  `${session.browser || 'Unknown Browser'}${session.os ? ` on ${session.os}` : ''}`}
                              </p>
                              {session.isCurrent && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                  {t('currentDevice')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {session.location}
                                </span>
                              )}
                              {session.ipAddress && (
                                <span className="text-neutral-400">IP: {session.ipAddress}</span>
                              )}
                              <span>Active {formatSessionDate(session.lastActiveAt)}</span>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingSessionId === session.id}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {revokingSessionId === session.id ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  className="animate-spin w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
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
                              </span>
                            ) : (
                              t('logOut')
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="flex items-start gap-3 text-sm text-neutral-500">
                    <svg
                      className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>{t('unrecognizedSessionWarning')}</p>
                  </div>
                </div>
              </div>

              {/* Delete Account Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-['Poppins'] text-red-600">
                      {t('deleteAccount')}
                    </h2>
                    <p className="text-neutral-500">{t('deleteAccountDesc')}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <svg
                      className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-800 mb-1">
                        {t('warningCannotBeUndone')}
                      </p>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>{t('deleteWarning1')}</li>
                        <li>{t('deleteWarning2')}</li>
                        <li>{t('deleteWarning3')}</li>
                        <li>{t('deleteWarning4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  {t('deleteMyAccount')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-black">{t('confirmAccountDeletion')}</h3>
                <p className="text-sm text-neutral-500">{t('thisActionIsPermanent')}</p>
              </div>
            </div>

            <p className="text-neutral-600 mb-4">{t('enterPasswordToConfirm')}</p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('enterYourPassword')}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-red-500"
                  placeholder={t('yourPassword')}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-neutral-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-neutral-600">{t('understandDeletion')}</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirm(false);
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-3 border-2 border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword || !deleteConfirm}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
                    {t('deletingAccount')}
                  </span>
                ) : (
                  t('deleteAccount')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
