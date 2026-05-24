'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { api, TokenManager } from '@/lib/api/client';
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

  // TOTP 2FA setup state
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

  // Email OTP 2FA state
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [emailOtpStep, setEmailOtpStep] = useState<
    'idle' | 'awaiting-code' | 'awaiting-disable-code'
  >('idle');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpMaskedEmail, setEmailOtpMaskedEmail] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');
  const [isEmailOtpLoading, setIsEmailOtpLoading] = useState(false);

  const { data: sessionsData, mutate: mutateSessions } = useSWR<UserSession[]>(
    isAuthenticated ? '/auth/sessions' : null,
    () => api.get<UserSession[]>('/auth/sessions'),
    { revalidateOnFocus: false }
  );

  const sessions = sessionsData || [];

  useSWR(
    isAuthenticated ? '/auth/2fa/email/status' : null,
    () => api.get<{ enabled: boolean }>('/auth/2fa/email/status'),
    {
      revalidateOnFocus: false,
      onSuccess: (data) => setEmailOtpEnabled(data?.enabled ?? false),
    }
  );

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
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Device logged out.');
      mutateSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke session.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      await api.post('/auth/sessions/revoke-all-other');
      toast.success('All other sessions logged out.');
      mutateSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions.');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const handle2FASetup = async () => {
    setIsTwoFaLoading(true);
    setTwoFaError('');
    try {
      const data = await api.post<{ secret: string; qrCode: string }>('/auth/2fa/setup');
      setTwoFaSetupData({ secret: data.secret, qrCode: data.qrCode });
      setTwoFaStep('setup');
    } catch (err: any) {
      setTwoFaError(err.message || 'Failed to start 2FA setup.');
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
      const data = await api.post<{ backupCodes: string[] }>('/auth/2fa/enable', {
        code: twoFaCode,
      });
      setTwoFaBackupCodes(data.backupCodes || []);
      setTwoFaStep('done');
      await refreshUser();
      setEmailOtpEnabled(false);
      setEmailOtpStep('idle');
    } catch (err: any) {
      setTwoFaError(err.message || 'Verification failed.');
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
      await api.post('/auth/2fa/disable', { code: disable2FACode });
      toast.success('Two-factor authentication disabled.');
      setShowDisable2FA(false);
      setDisable2FACode('');
      await refreshUser();
    } catch (err: any) {
      setTwoFaError(err.message || 'Failed to disable 2FA.');
    } finally {
      setIsTwoFaLoading(false);
    }
  };

  const handleEmailOtpSetup = async () => {
    setIsEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      const data = await api.post<{ maskedEmail: string; expiresAt: string }>(
        '/auth/2fa/email/setup'
      );
      setEmailOtpMaskedEmail(data.maskedEmail || '');
      setEmailOtpStep('awaiting-code');
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.message || err.message || 'Failed to send code');
    } finally {
      setIsEmailOtpLoading(false);
    }
  };

  const handleEmailOtpEnable = async () => {
    if (!emailOtpCode || emailOtpCode.length < 6) {
      setEmailOtpError('Enter the 6-digit code sent to your email.');
      return;
    }
    setIsEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      await api.post('/auth/2fa/email/enable', { code: emailOtpCode });
      toast.success('Email OTP two-factor authentication enabled.');
      setEmailOtpEnabled(true);
      setEmailOtpStep('idle');
      setEmailOtpCode('');
      await refreshUser();
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsEmailOtpLoading(false);
    }
  };

  const handleEmailOtpDisableSetup = async () => {
    setIsEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      const data = await api.post<{ maskedEmail: string }>('/auth/2fa/email/setup');
      setEmailOtpMaskedEmail(data.maskedEmail || '');
      setEmailOtpStep('awaiting-disable-code');
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.message || err.message || 'Failed to send code');
    } finally {
      setIsEmailOtpLoading(false);
    }
  };

  const handleEmailOtpDisable = async () => {
    if (!emailOtpCode || emailOtpCode.length < 6) {
      setEmailOtpError('Enter the 6-digit code sent to your email.');
      return;
    }
    setIsEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      await api.post('/auth/2fa/email/disable', { code: emailOtpCode });
      toast.success('Two-factor authentication disabled.');
      setEmailOtpEnabled(false);
      setEmailOtpStep('idle');
      setEmailOtpCode('');
    } catch (err: any) {
      setEmailOtpError(err?.response?.data?.message || err.message || 'Failed to disable');
    } finally {
      setIsEmailOtpLoading(false);
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

  const normalizeIp = (ip: string | null): string | null => {
    if (!ip) return null;
    const unwrapped = ip.replace(/^::ffff:/i, '');
    if (unwrapped === '127.0.0.1' || unwrapped === '::1') return 'localhost';
    return unwrapped;
  };

  const getOsIcon = (os: string | null) => {
    if (!os) return null;
    const lower = os.toLowerCase();
    if (lower.includes('macos') || lower.includes('ios') || lower.includes('ipados')) {
      return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    }
    if (lower.includes('windows')) {
      return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.75l6-1.32v6.57H3zm17 0V3.5l-8 1.4V12h8zM3 13h6v6.43l-6-1.33V13zm17 0h-8v6.83L20 21.5V13z" />
        </svg>
      );
    }
    if (lower.includes('android')) {
      return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1.5c-.71 0-1.39.13-2.04.37L8.48.39c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C7.45 3.35 6.5 5 6.5 7h11c0-2-.95-3.65-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
        </svg>
      );
    }
    if (lower.includes('linux') || lower.includes('chromeos')) {
      return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489.217 1.348.859 2.498 2.047 3.31.618.422 1.276.634 1.989.635.606.001 1.225-.145 1.849-.42.583-.265 1.145-.674 1.586-1.188.465-.54.845-1.17 1.23-1.667.422-.54 1.067-.878 1.741-.748.72.137 1.269.696 1.662 1.42.444.82.73 1.783.872 2.63.08.49.101.943.08 1.26-.02.316-.017.434.168.434h.008c.026 0 .058-.002.094-.007.468-.036.911-.217 1.28-.493 1.08-.815 1.575-2.197 1.71-3.637.056-.58.058-1.154.01-1.695-.097-1.142-.354-2.224-.681-3.127-.32-.888-.727-1.614-1.108-2.147-.373-.52-.804-.95-1.205-1.35-.368-.37-.728-.721-.97-1.109-.475-.758-.756-1.628-.806-2.571-.036-.703.015-1.398.057-1.967.091-1.172.178-2.065-.348-2.979C14.3.445 13.456 0 12.504 0zM9.37 8.24c.133 0 .261.019.381.059.6.2.911.907.693 1.573-.22.667-.876 1.044-1.476.844-.6-.2-.911-.908-.691-1.574.176-.534.645-.902 1.093-.902zm5.264 0c.448 0 .917.368 1.092.902.219.666-.092 1.374-.692 1.574-.6.2-1.256-.177-1.476-.844-.217-.666.094-1.373.693-1.573.12-.04.248-.059.383-.059zM9 13c.553 0 1 .447 1 1s-.447 1-1 1-1-.447-1-1 .447-1 1-1zm6 0c.553 0 1 .447 1 1s-.447 1-1 1-1-.447-1-1 .447-1 1-1z" />
        </svg>
      );
    }
    return null;
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
                  className={`flex items-center gap-3 p-3 rounded-xl ${user.twoFactorEnabled || emailOtpEnabled ? 'bg-green-50' : 'bg-amber-50'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${user.twoFactorEnabled || emailOtpEnabled ? 'bg-green-100' : 'bg-amber-100'}`}
                  >
                    <svg
                      className={`w-4 h-4 ${user.twoFactorEnabled || emailOtpEnabled ? 'text-green-600' : 'text-amber-600'}`}
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
                      className={`text-sm font-medium ${user.twoFactorEnabled || emailOtpEnabled ? 'text-green-800' : 'text-amber-800'}`}
                    >
                      Two-factor auth
                    </p>
                    <p
                      className={`text-xs ${user.twoFactorEnabled || emailOtpEnabled ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {user.twoFactorEnabled || emailOtpEnabled ? 'Enabled' : 'Not enabled'}
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

            {/* Two-Factor Authentication — Unified Method Selection */}
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

              {/* Neither method active — method selection */}
              {!user.twoFactorEnabled &&
                !emailOtpEnabled &&
                twoFaStep === 'idle' &&
                emailOtpStep === 'idle' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      2FA is strongly recommended for admin accounts. Choose a verification method
                      to get started.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 border-2 border-neutral-200 rounded-xl space-y-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">Authenticator App</p>
                          <p className="text-sm text-neutral-500 mt-1">
                            Google Authenticator, Authy, 1Password — generates a code on your phone.
                          </p>
                        </div>
                        <button
                          onClick={handle2FASetup}
                          disabled={isTwoFaLoading}
                          className="w-full px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                        >
                          {isTwoFaLoading ? 'Loading...' : 'Set Up'}
                        </button>
                      </div>
                      <div className="p-5 border-2 border-neutral-200 rounded-xl space-y-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-indigo-600"
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
                        <div>
                          <p className="font-semibold text-neutral-900">Email Code</p>
                          <p className="text-sm text-neutral-500 mt-1">
                            A 6-digit code is sent to your email address each time you sign in.
                          </p>
                        </div>
                        <button
                          onClick={handleEmailOtpSetup}
                          disabled={isEmailOtpLoading}
                          className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          {isEmailOtpLoading ? 'Sending code...' : 'Set Up'}
                        </button>
                      </div>
                    </div>
                    {twoFaError && <p className="text-sm text-red-600">{twoFaError}</p>}
                    {emailOtpError && <p className="text-sm text-red-600">{emailOtpError}</p>}
                  </div>
                )}

              {/* TOTP active */}
              {user.twoFactorEnabled && twoFaStep === 'idle' && emailOtpStep === 'idle' && (
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
                      <p className="font-semibold text-green-800">2FA active — Authenticator App</p>
                      <p className="text-sm text-green-600">
                        Your account is protected with an authenticator app.
                      </p>
                    </div>
                  </div>
                  {!showDisable2FA ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleEmailOtpSetup}
                        disabled={isEmailOtpLoading}
                        className="px-5 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      >
                        {isEmailOtpLoading ? 'Sending code...' : 'Switch to Email Code'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDisable2FA(true);
                          setTwoFaError('');
                        }}
                        className="px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Disable 2FA
                      </button>
                    </div>
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

              {/* Email OTP active */}
              {emailOtpEnabled &&
                !user.twoFactorEnabled &&
                emailOtpStep === 'idle' &&
                twoFaStep === 'idle' && (
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
                        <p className="font-semibold text-green-800">2FA active — Email Code</p>
                        <p className="text-sm text-green-600">
                          A verification code will be sent to your email each time you sign in.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handle2FASetup}
                        disabled={isTwoFaLoading}
                        className="px-5 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      >
                        {isTwoFaLoading ? 'Loading...' : 'Switch to Authenticator App'}
                      </button>
                      <button
                        onClick={handleEmailOtpDisableSetup}
                        disabled={isEmailOtpLoading}
                        className="px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {isEmailOtpLoading ? 'Sending code...' : 'Disable 2FA'}
                      </button>
                    </div>
                  </div>
                )}

              {/* Disable email OTP confirm */}
              {emailOtpEnabled &&
                !user.twoFactorEnabled &&
                emailOtpStep === 'awaiting-disable-code' && (
                  <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-medium text-red-800">
                      Enter the code sent to {emailOtpMaskedEmail} to confirm:
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={emailOtpCode}
                      onChange={(e) => {
                        setEmailOtpCode(e.target.value.replace(/\D/g, ''));
                        setEmailOtpError('');
                      }}
                      placeholder="000000"
                      className="w-40 px-4 py-2 border-2 border-neutral-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-red-400"
                    />
                    {emailOtpError && <p className="text-sm text-red-600">{emailOtpError}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={handleEmailOtpDisable}
                        disabled={isEmailOtpLoading}
                        className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isEmailOtpLoading ? 'Disabling...' : 'Confirm Disable'}
                      </button>
                      <button
                        onClick={() => {
                          setEmailOtpStep('idle');
                          setEmailOtpCode('');
                          setEmailOtpError('');
                        }}
                        className="px-5 py-2.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
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

              {/* TOTP done — backup codes */}
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
                  <button
                    onClick={() => setTwoFaStep('idle')}
                    className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Email OTP setup — awaiting code */}
              {emailOtpStep === 'awaiting-code' && (
                <div className="space-y-5">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
                    A 6-digit code has been sent to <strong>{emailOtpMaskedEmail}</strong>. Enter it
                    below to enable.
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={emailOtpCode}
                      onChange={(e) => {
                        setEmailOtpCode(e.target.value.replace(/\D/g, ''));
                        setEmailOtpError('');
                      }}
                      placeholder="000000"
                      className="w-40 px-4 py-2 border-2 border-neutral-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-indigo-400"
                    />
                    {emailOtpError && <p className="text-sm text-red-600">{emailOtpError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleEmailOtpEnable}
                      disabled={isEmailOtpLoading || emailOtpCode.length < 6}
                      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isEmailOtpLoading ? 'Verifying...' : 'Enable Email 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setEmailOtpStep('idle');
                        setEmailOtpCode('');
                        setEmailOtpError('');
                      }}
                      className="px-5 py-3 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
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
                            <div className="flex items-center gap-1.5">
                              {getOsIcon(session.deviceInfo?.os || session.os) && (
                                <span className="text-neutral-500">
                                  {getOsIcon(session.deviceInfo?.os || session.os)}
                                </span>
                              )}
                              <p className="font-medium text-black text-sm">
                                {session.deviceInfo?.description ||
                                  session.browser ||
                                  'Unknown device'}
                              </p>
                            </div>
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
                            {normalizeIp(session.ipAddress) && (
                              <span className="font-mono text-neutral-400">
                                {normalizeIp(session.ipAddress)}
                              </span>
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
