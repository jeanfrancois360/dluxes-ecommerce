'use client';

/**
 * Admin Profile Page
 * Dedicated profile page for admin users
 */

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { useUser } from '@/hooks/use-user';
import { toast } from '@/lib/utils/toast';
import { api } from '@/lib/api';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function AdminProfileContent() {
  const { user, refreshUser } = useUser();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    if (user) {
      const changed =
        formData.firstName !== (user.firstName || '') ||
        formData.lastName !== (user.lastName || '') ||
        formData.email !== (user.email || '') ||
        formData.phone !== (user.phone || '');
      setHasChanges(changed);
    }
  }, [formData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.patch('/auth/profile', formData);
      await refreshUser();
      toast.success('Profile updated successfully');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B]"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="My Profile" description="Manage your admin account settings" />

      <div className="p-6 space-y-6">
        {/* Profile Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full flex items-center justify-center ring-4 ring-[#CBB57B]/30">
              <span className="text-white font-bold text-3xl">
                {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-neutral-600 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold uppercase">
                  <Shield className="w-3 h-3" />
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold uppercase">
                  <Calendar className="w-3 h-3" />
                  Member since {format(new Date(user.createdAt), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
        >
          <h3 className="text-lg font-semibold text-black mb-6">Profile Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name
                </div>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Last Name
                </div>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </div>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                  });
                }
              }}
              className="px-6 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:bg-neutral-50 transition-all font-medium"
              disabled={!hasChanges || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="px-6 py-2.5 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function AdminProfilePage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminProfileContent />
      </AdminLayout>
    </AdminRoute>
  );
}
