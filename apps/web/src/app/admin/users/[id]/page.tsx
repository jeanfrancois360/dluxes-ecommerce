'use client';

/**
 * User Detail Page
 * View and manage individual user details, status, and activity
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { api } from '@/lib/api';
import { toast } from '@/lib/utils/toast';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShoppingBag,
  Package,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign,
  Store,
  Truck,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'BUYER' | 'SELLER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  _count?: {
    orders?: number;
    products?: number;
    reviews?: number;
    addresses?: number;
  };
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  store?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  _count: {
    items: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  BUYER: 'bg-blue-50 text-blue-700 border-blue-200',
  SELLER: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERY_PARTNER: 'bg-orange-50 text-orange-700 border-orange-200',
  ADMIN: 'bg-red-50 text-red-700 border-red-200',
  SUPER_ADMIN: 'bg-pink-50 text-pink-700 border-pink-200',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  SUSPENDED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  BANNED: 'bg-red-50 text-red-700 border-red-200',
};

function UserDetailContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserOrders();
    }
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      const userData = response.user || response.data?.user || response.data || response;
      setUser(userData);
      setEditForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const response = await api.get(`/admin/users/${userId}/orders?limit=10`);
      const ordersData = response.orders || response.data?.orders || response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error: any) {
      // Silently fail - orders are optional
      console.log('No orders found for user');
      setOrders([]);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      toast.success('User status updated');
      fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.patch(`/admin/users/${userId}`, editForm);
      toast.success('User updated successfully');
      setIsEditing(false);
      fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await api.patch(`/admin/users/${userId}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-2fa`, { enabled });
      toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
      fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle 2FA');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await api.patch(`/admin/users/${userId}/verify-email`);
      toast.success('Email verified successfully');
      fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify email');
    }
  };

  const handleVerifyPhone = async () => {
    try {
      await api.patch(`/admin/users/${userId}/verify-phone`);
      toast.success('Phone verified successfully');
      fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify phone');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B] mx-auto"></div>
        <p className="mt-4 text-neutral-600">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <PageHeader title={`${user.firstName} ${user.lastName}`} description={`User ID: ${user.id}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit User'}
          </button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Orders</p>
                <p className="text-2xl font-bold text-black mt-1">{user._count?.orders || 0}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {user.role === 'SELLER' && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Products</p>
                  <p className="text-2xl font-bold text-black mt-1">{user._count?.products || 0}</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Reviews</p>
                <p className="text-2xl font-bold text-black mt-1">{user._count?.reviews || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Addresses</p>
                <p className="text-2xl font-bold text-black mt-1">{user._count?.addresses || 0}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user.firstName?.charAt(0)}
                      {user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-neutral-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${ROLE_COLORS[user.role]}`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                    >
                      <option value="BUYER">Buyer</option>
                      <option value="SELLER">Seller</option>
                      <option value="DELIVERY_PARTNER">Delivery Partner</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleUpdateUser}
                      className="px-6 py-2.5 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Mail className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm">{user.email}</span>
                      {user.emailVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Phone className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm">{user.phone}</span>
                        {user.phoneVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Shield className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm">
                        2FA: {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm">
                        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {user.lastLogin && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Activity className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm">
                          Last login {format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Store Information (if seller) */}
            {user.role === 'SELLER' && user.store && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Store Name</span>
                    <span className="text-sm font-medium text-black">{user.store.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Store Slug</span>
                    <span className="text-sm font-medium text-black">{user.store.slug}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Store Status</span>
                    <span className="text-sm font-medium text-black">{user.store.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Recent Orders
              </h3>
              {orders.length === 0 ? (
                <p className="text-neutral-600 text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-black">#{order.orderNumber}</p>
                          <p className="text-sm text-neutral-600">
                            {order._count.items} items •{' '}
                            {format(new Date(order.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">
                            {order.currency} {order.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-neutral-600">{order.status}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">Account Actions</h3>
              <div className="space-y-3">
                {user.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateStatus('ACTIVE')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Activate Account
                  </button>
                )}
                {user.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => handleUpdateStatus('SUSPENDED')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all font-medium"
                  >
                    <Ban className="w-4 h-4" />
                    Suspend Account
                  </button>
                )}
                {user.status !== 'BANNED' && (
                  <button
                    onClick={() => handleUpdateStatus('BANNED')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Ban Account
                  </button>
                )}
                <button
                  onClick={handleDeleteUser}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </h3>
              <div className="space-y-4">
                {/* Password Reset */}
                <div className="border-b border-neutral-200 pb-4">
                  {!showPasswordReset ? (
                    <button
                      onClick={() => setShowPasswordReset(true)}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      Reset Password
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleResetPassword}
                          className="flex-1 px-3 py-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] text-sm font-medium"
                        >
                          Set Password
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordReset(false);
                            setNewPassword('');
                          }}
                          className="flex-1 px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA Toggle */}
                <div className="border-b border-neutral-200 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Two-Factor Auth</span>
                    <button
                      onClick={() => handleToggle2FA(!user.twoFactorEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        user.twoFactorEnabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {user.twoFactorEnabled
                        ? 'Enabled - Click to Disable'
                        : 'Disabled - Click to Enable'}
                    </button>
                  </div>
                </div>

                {/* Email Verification */}
                {!user.emailVerified && (
                  <div className="border-b border-neutral-200 pb-4">
                    <button
                      onClick={handleVerifyEmail}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4 inline mr-2" />
                      Manually Verify Email
                    </button>
                  </div>
                )}

                {/* Phone Verification */}
                {user.phone && !user.phoneVerified && (
                  <div>
                    <button
                      onClick={handleVerifyPhone}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Phone className="w-4 h-4 inline mr-2" />
                      Manually Verify Phone
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Addresses
                </h3>
                <div className="space-y-3">
                  {user.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <p className="text-sm font-medium text-black">{address.street}</p>
                      <p className="text-sm text-neutral-600">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm text-neutral-600">{address.country}</p>
                      {address.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#CBB57B] text-white text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function UserDetailPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <UserDetailContent />
      </AdminLayout>
    </AdminRoute>
  );
}
