'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { TokenManager } from '@/lib/api/client';
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

export default function AdminSecurityPage() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    isInitialized,
    changePassword,
    refreshUser,
  } = useAuth();

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
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // 2FA setup state
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'done'>('idle');
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ secret: string; qrCode: string } | null>(
    null
  );
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);
  const [twoFaError, setTwoFaError] = useState('');
  const [isTwoFaLoading, setIsTwoFaLoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');

  const { data: sessionsData, mutate: mutateSessions } = useSWR<UserSession[]>(
    isAuthenticated ? '/auth/sessions' : null,
    async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sessions`, {
        headers: {
          Authorization: `Bearer ${TokenManager.getAccessToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    { revalidateOnFocus: false }
  );

  const sessions = sessionsData || [];

  useEffect(() => {
    if (!authLoading && isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/admin/account/security');
    }
  }, [authLoading, isInitialized, isAuthenticated, router]);

  useEffect(() => {
    const password = formData.newPassword;
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
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
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required.';
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (formData.newPassword.length < 12) {
      newErrors.newPassword = 'Password must be at least 12 characters.';
    } else if (!/[a-z]/.test(formData.newPassword) || !/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase and lowercase letters.';
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number.';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password.';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch {
      // Error handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${TokenManager.getAccessToken()}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success('Device logged out.');
        mutateSessions();
      } else {
        toast.error(data.message || 'Failed to revoke session.');
      }
    } catch {
      toast.error('Failed to revoke session.');
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
            Authorization: `Bearer ${TokenManager.getAccessToken()}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success('All other sessions logged out.');
        mutateSessions();
      } else {
        toast.error(data.message || 'Failed to revoke sessions.');
      }
    } catch {
      toast.error('Failed to revoke sessions.');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const handle2FASetup = async () => {
    setIsTwoFaLoading(true);
    setTwoFaError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TokenManager.getAccessToken()}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to start 2FA setup');
      setTwoFaSetupData({ secret: data.secret, qrCode: data.qrCode });
      setTwoFaStep('setup');
    } catch (err: any) {
      setTwoFaError(err.message);
    } finally {
      setIsTwoFaLoading(false);
    }
  };

  const handle2FAEnable = async () => {
    if (!twoFaCode || twoFaCode.length < 6) {
      setTwoFaError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsTwoFaLoading(true);
    setTwoFaError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({ code: twoFaCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');
      setTwoFaBackupCodes(data.backupCodes || []);
      setTwoFaStep('done');
      await refreshUser();
    } catch (err: any) {
      setTwoFaError(err.message);
    } finally {
      setIsTwoFaLoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!disable2FACode || disable2FACode.length < 6) {
      setTwoFaError('Enter the 6-digit code to confirm disabling 2FA.');
      return;
    }
    setIsTwoFaLoading(true);
    setTwoFaError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({ code: disable2FACode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to disable 2FA');
      toast.success('Two-factor authentication disabled.');
      setShowDisable2FA(false);
      setDisable2FACode('');
      await refreshUser();
    } catch (err: any) {
      setTwoFaError(err.message);
    } finally {
      setIsTwoFaLoading(false);
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-gold transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-neutral-900 font-medium">Security</span>
        </nav>
        <h1 className="text-2xl font-bold font-['Poppins'] text-black">Security Settings</h1>
        <p className="text-neutral-500 mt-1">
          Manage your password, two-factor authentication, and active sessions.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Security Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold font-['Poppins'] mb-5">Security Status</h2>
              <div className="space-y-3">
                {/* Password */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Password set</p>
                    <p className="text-xs text-green-600">Account is password-protected</p>
                  </div>
                </div>

                {/* 2FA */}
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl ${user.twoFactorEnabled ? 'bg-green-50' : 'bg-amber-50'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${user.twoFactorEnabled ? 'bg-green-100' : 'bg-amber-100'}`}
                  >
                    <svg
                      className={`w-4 h-4 ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}
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
                      className={`text-sm font-medium ${user.twoFactorEnabled ? 'text-green-800' : 'text-amber-800'}`}
                    >
                      Two-factor auth
                    </p>
                    <p
                      className={`text-xs ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl ${user.emailVerified ? 'bg-green-50' : 'bg-amber-50'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${user.emailVerified ? 'bg-green-100' : 'bg-amber-100'}`}
                  >
                    <svg
                      className={`w-4 h-4 ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${user.emailVerified ? 'text-green-800' : 'text-amber-800'}`}
                    >
                      Email
                    </p>
                    <p
                      className={`text-xs ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {user.emailVerified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-base font-bold font-['Poppins'] mb-4">Quick Links</h3>
              <div className="space-y-1">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-neutral-600 group-hover:text-gold transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-gold transition-colors">
                    Admin Dashboard
                  </span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-neutral-600 group-hover:text-gold transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-gold transition-colors">
                    System Settings
                  </span>
                </Link>
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-neutral-600 group-hover:text-gold transition-colors"
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
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-gold transition-colors">
                    Edit Profile
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
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
                  <h2 className="text-xl font-bold font-['Poppins']">Change Password</h2>
                  <p className="text-sm text-neutral-500">Update your admin account password</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
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
                      placeholder="Enter current password"
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
                    New Password <span className="text-red-500">*</span>
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
                      placeholder="Enter new password"
                    />
                    <PasswordToggle
                      show={showNewPassword}
                      onToggle={() => setShowNewPassword(!showNewPassword)}
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
                  )}

                  {formData.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-neutral-500">Password strength</span>
                        <span
                          className={`font-medium ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength <= 2 ? 'text-orange-500' : passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-500'}`}
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
                    Confirm New Password <span className="text-red-500">*</span>
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
                      placeholder="Confirm new password"
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
                        Passwords match
                      </p>
                    )}
                </div>

                {/* Requirements */}
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm font-medium text-neutral-700 mb-3">Password requirements</p>
                  <ul className="space-y-2 text-sm">
                    {[
                      { met: formData.newPassword.length >= 12, label: 'At least 12 characters' },
                      {
                        met:
                          /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword),
                        label: 'Uppercase and lowercase letters',
                      },
                      { met: /\d/.test(formData.newPassword), label: 'At least one number' },
                      {
                        met: /[^a-zA-Z0-9]/.test(formData.newPassword),
                        label: 'Special character (recommended)',
                      },
                    ].map(({ met, label }) => (
                      <li
                        key={label}
                        className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-neutral-500'}`}
                      >
                        <svg
                          className={`w-4 h-4 flex-shrink-0 ${met ? 'text-green-500' : 'text-neutral-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {met ? (
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
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Updating password...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </motion.button>
              </form>

              <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                <p className="text-sm text-neutral-500">
                  Forgot your current password?{' '}
                  <Link
                    href="/auth/forgot-password"
                    className="text-gold hover:underline font-medium"
                  >
                    Reset it here
                  </Link>
                </p>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
              <div className="flex items-center gap-3 mb-6">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold font-['Poppins']">Two-Factor Authentication</h2>
                  <p className="text-sm text-neutral-500">
                    Add an extra layer of security to your admin account
                  </p>
                </div>
              </div>

              {/* Enabled */}
              {user.twoFactorEnabled && twoFaStep === 'idle' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                      <p className="font-semibold text-green-800">2FA is active</p>
                      <p className="text-sm text-green-600">
                        Your account is protected with an authenticator app.
                      </p>
                    </div>
                  </div>
                  {!showDisable2FA ? (
                    <button
                      onClick={() => {
                        setShowDisable2FA(true);
                        setTwoFaError('');
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Disable Two-Factor Authentication
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-medium text-red-800">
                        Enter your authenticator code to confirm:
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={disable2FACode}
                        onChange={(e) => {
                          setDisable2FACode(e.target.value.replace(/\D/g, ''));
                          setTwoFaError('');
                        }}
                        placeholder="000000"
                        className="w-40 px-4 py-2 border-2 border-neutral-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-red-400"
                      />
                      {twoFaError && <p className="text-sm text-red-600">{twoFaError}</p>}
                      <div className="flex gap-3">
                        <button
                          onClick={handle2FADisable}
                          disabled={isTwoFaLoading}
                          className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {isTwoFaLoading ? 'Disabling...' : 'Confirm Disable'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDisable2FA(false);
                            setDisable2FACode('');
                            setTwoFaError('');
                          }}
                          className="px-5 py-2.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Not enabled */}
              {!user.twoFactorEnabled && twoFaStep === 'idle' && (
                <div className="space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    2FA is strongly recommended for admin accounts. Scan the QR code with an
                    authenticator app (Google Authenticator, Authy, 1Password, etc.) to get started.
                  </div>
                  {twoFaError && <p className="text-sm text-red-600">{twoFaError}</p>}
                  <button
                    onClick={handle2FASetup}
                    disabled={isTwoFaLoading}
                    className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                  >
                    {isTwoFaLoading ? 'Loading...' : 'Set Up Two-Factor Authentication'}
                  </button>
                </div>
              )}

              {/* Setup — QR code */}
              {twoFaStep === 'setup' && twoFaSetupData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-3">
                        1. Scan this QR code with your authenticator app
                      </p>
                      <div className="inline-block p-3 bg-white border-2 border-neutral-200 rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={twoFaSetupData.qrCode} alt="2FA QR code" className="w-48 h-48" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-700 mb-2">
                          Can't scan? Enter this key manually:
                        </p>
                        <code className="block px-3 py-2 bg-neutral-100 rounded-lg text-sm font-mono tracking-wider break-all">
                          {twoFaSetupData.secret}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700 mb-2">
                          2. Enter the 6-digit code to verify:
                        </p>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={twoFaCode}
                          onChange={(e) => {
                            setTwoFaCode(e.target.value.replace(/\D/g, ''));
                            setTwoFaError('');
                          }}
                          placeholder="000000"
                          className="w-40 px-4 py-2 border-2 border-neutral-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-gold"
                        />
                      </div>
                      {twoFaError && <p className="text-sm text-red-600">{twoFaError}</p>}
                      <div className="flex gap-3">
                        <button
                          onClick={handle2FAEnable}
                          disabled={isTwoFaLoading || twoFaCode.length < 6}
                          className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                        >
                          {isTwoFaLoading ? 'Verifying...' : 'Enable 2FA'}
                        </button>
                        <button
                          onClick={() => {
                            setTwoFaStep('idle');
                            setTwoFaSetupData(null);
                            setTwoFaCode('');
                            setTwoFaError('');
                          }}
                          className="px-5 py-3 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Done — backup codes */}
              {twoFaStep === 'done' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="font-semibold text-green-800">
                      Two-factor authentication enabled!
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-800 mb-3">
                      Save these backup codes — they won't be shown again
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {twoFaBackupCodes.map((code) => (
                        <code
                          key={code}
                          className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-mono text-center"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      Each code can only be used once if you lose access to your authenticator app.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
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
                    <h2 className="text-xl font-bold font-['Poppins']">Active Sessions</h2>
                    <p className="text-sm text-neutral-500">
                      Devices currently signed in to your account
                    </p>
                  </div>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeAllSessions}
                    disabled={isRevokingAll}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRevokingAll ? 'Revoking...' : 'Log out all other'}
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
                  <p className="text-neutral-500">No active sessions</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Sessions will appear here when you sign in
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
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
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${session.isCurrent ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-600'}`}
                        >
                          {getDeviceIcon(session.deviceInfo?.device || session.deviceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-black text-sm">
                              {session.deviceInfo?.description ||
                                `${session.browser || 'Unknown Browser'}${session.os ? ` on ${session.os}` : ''}`}
                            </p>
                            {session.isCurrent && (
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                This device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
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
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {revokingSessionId === session.id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                          ) : (
                            'Log out'
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
                  <p>
                    If you see an unrecognized session, log it out immediately and change your
                    password.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
