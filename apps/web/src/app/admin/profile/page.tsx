'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/lib/utils/toast';

export default function AdminProfilePage() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    isInitialized,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshUser,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarDeleting, setAvatarDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/admin/profile');
    }
  }, [authLoading, isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const changed =
      formData.firstName !== (user.firstName || '') ||
      formData.lastName !== (user.lastName || '') ||
      formData.email !== (user.email || '') ||
      formData.phone !== (user.phone || '');
    setHasChanges(changed);
  }, [formData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setIsSubmitting(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!user) return;
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarProgress(0);
    try {
      await uploadAvatar(file, (progress) => setAvatarProgress(progress));
      toast.success('Avatar updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      setAvatarProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    setAvatarDeleting(true);
    try {
      await deleteAvatar();
      toast.success('Avatar removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove avatar.');
    } finally {
      setAvatarDeleting(false);
    }
  };

  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          <span className="text-neutral-900 font-medium">My Profile</span>
        </nav>
        <h1 className="text-2xl font-bold font-['Poppins'] text-black">My Profile</h1>
        <p className="text-neutral-500 mt-1">Manage your admin account details and avatar.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Avatar Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-bold font-['Poppins'] mb-5">Profile Photo</h2>

              <div className="flex flex-col items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-gold/30"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gold to-[#a89158] rounded-full flex items-center justify-center ring-4 ring-gold/30">
                      <span className="text-white font-bold text-2xl">{getInitials()}</span>
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{avatarProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-black">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold uppercase">
                    {user.role}
                  </span>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading || avatarDeleting}
                    className="flex-1 px-3 py-2 text-xs font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {avatarUploading ? `Uploading ${avatarProgress}%` : 'Upload photo'}
                  </button>
                  {user.avatar && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarUploading || avatarDeleting}
                      className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {avatarDeleting ? '...' : 'Remove'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-400 text-center">JPG, PNG or GIF · Max 5 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-base font-bold font-['Poppins'] mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Member since</span>
                  <span className="font-medium text-black">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">2FA</span>
                  <span
                    className={`font-medium ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Email</span>
                  <span
                    className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Sign-in</span>
                  <span className="font-medium text-black capitalize">
                    {user.authProvider === 'GOOGLE' ? 'Google' : 'Password'}
                  </span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <Link
                  href="/admin/account/security"
                  className="flex items-center justify-between text-sm font-medium text-gold hover:text-[#a89158] transition-colors"
                >
                  <span>Security settings</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
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
            {/* Edit Profile */}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold font-['Poppins']">Personal Information</h2>
                  <p className="text-sm text-neutral-500">
                    Update your name, email, and contact details
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-black"
                      placeholder="First name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-black"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-black"
                    placeholder="you@example.com"
                    required
                  />
                  {!user.emailVerified && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      Your email address is not verified.
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-black"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!hasChanges || isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={!hasChanges || isSubmitting}
                    className="px-6 py-2.5 text-sm font-semibold bg-black text-white rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
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
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Password & Security shortcut */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
              <div className="flex items-center gap-3 mb-4">
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
                  <h2 className="text-xl font-bold font-['Poppins']">Password & Security</h2>
                  <p className="text-sm text-neutral-500">
                    Change your password, manage 2FA, and review active sessions
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-2 text-sm ${user.twoFactorEnabled ? 'text-green-700' : 'text-amber-700'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    2FA {user.twoFactorEnabled ? 'enabled' : 'not enabled'}
                  </div>
                </div>
                <Link
                  href="/admin/account/security"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Manage security
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
