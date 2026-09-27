'use client';

/**
 * User Management Module
 * Production-ready user management system for all user roles
 * Replaces the old customers module
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import { toast } from '@/lib/utils/toast';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Shield,
  Mail,
  Phone,
  Calendar,
  Users as UsersIcon,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Truck,
  Lock,
  X,
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
  createdAt: string;
  lastLogin?: string;
  _count?: {
    orders?: number;
    products?: number;
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

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);

  // Add User Modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'BUYER',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const search = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, roleFilter, statusFilter, sortBy]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (sortBy) {
        const [field, order] = sortBy.split('-');
        params.append('sortBy', field);
        params.append('sortOrder', order);
      }

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.users || response.data?.users || []);
      setTotal(response.total || response.data?.total || 0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      toast.success('User status updated');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} users? This action cannot be undone.`)) return;

    try {
      await api.post('/admin/users/bulk-delete', { userIds: selectedIds });
      toast.success(`${selectedIds.length} users deleted`);
      setSelectedIds([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete users');
    }
  };

  const handleExport = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

      const response = await fetch(`${API_URL}/admin/users/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export users');
    }
  };

  const pages = Math.ceil(total / limit);
  const allSelected = users.length > 0 && selectedIds.length === users.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : users.map((u) => u.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage all platform users, roles, and permissions"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2.5 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Users</p>
                <p className="text-2xl font-bold text-black mt-1">{total}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          {['BUYER', 'SELLER', 'DELIVERY_PARTNER', 'ADMIN'].map((role) => {
            const count = users.filter((u) => u.role === role).length;
            return (
              <div
                key={role}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{role.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-black mt-1">{count}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]"
            >
              <option value="">All Roles</option>
              <option value="BUYER">Buyers</option>
              <option value="SELLER">Sellers</option>
              <option value="DELIVERY_PARTNER">Delivery Partners</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B]"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="firstName-asc">Name A-Z</option>
              <option value="firstName-desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B] mx-auto"></div>
              <p className="mt-4 text-neutral-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <UsersIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-600 font-medium">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-4 w-[40px]">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-black">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.firstName?.charAt(0)}
                                {user.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-black">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-neutral-600">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${ROLE_COLORS[user.role]}`}
                          >
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[user.status]}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {user.phone && (
                              <div className="flex items-center gap-1 text-neutral-600">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-neutral-600">
                              <Mail className="w-3 h-3" />
                              {user.emailVerified ? '✓' : '✗'} Verified
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="p-2 text-[#CBB57B] hover:bg-[#CBB57B]/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setShowActions(showActions === user.id ? null : user.id)
                                }
                                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {showActions === user.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
                                  {user.status !== 'ACTIVE' && (
                                    <button
                                      onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Activate
                                    </button>
                                  )}
                                  {user.status !== 'SUSPENDED' && (
                                    <button
                                      onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                                    >
                                      <Ban className="w-4 h-4" />
                                      Suspend
                                    </button>
                                  )}
                                  {user.status !== 'BANNED' && (
                                    <button
                                      onClick={() => handleUpdateStatus(user.id, 'BANNED')}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Ban
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-700">
                    Page {page} of {pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
              <span className="font-medium">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-slate-600" />
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#CBB57B]/15 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#CBB57B]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
                    <p className="text-xs text-gray-400">Create a new platform user account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddUserLoading(true);
                  try {
                    await api.post('/auth/register', {
                      firstName: addUserForm.firstName,
                      lastName: addUserForm.lastName,
                      email: addUserForm.email,
                      password: addUserForm.password,
                      role: addUserForm.role,
                      ...(addUserForm.phone ? { phone: addUserForm.phone } : {}),
                    });
                    toast.success(`User ${addUserForm.email} created successfully`);
                    setShowAddUser(false);
                    setAddUserForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      password: '',
                      role: 'BUYER',
                    });
                    setShowPassword(false);
                    fetchUsers();
                  } catch (error: any) {
                    const msg =
                      error?.response?.data?.message || error?.message || 'Failed to create user';
                    toast.error(Array.isArray(msg) ? msg[0] : msg);
                  } finally {
                    setAddUserLoading(false);
                  }
                }}
                className="p-6 space-y-5"
              >
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addUserForm.firstName}
                        onChange={(e) =>
                          setAddUserForm({ ...addUserForm, firstName: e.target.value })
                        }
                        className="w-full pl-3 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] text-sm transition-all"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={addUserForm.lastName}
                      onChange={(e) => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                      className="w-full pl-3 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] text-sm transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] text-sm transition-all"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Phone Number{' '}
                    <span className="text-gray-300 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={addUserForm.phone}
                      onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] text-sm transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] text-sm transition-all"
                      placeholder="Min 12 characters"
                      required
                      minLength={12}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {addUserForm.password.length > 0 && addUserForm.password.length < 12 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      {12 - addUserForm.password.length} more character
                      {12 - addUserForm.password.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: 'BUYER',
                        label: 'Buyer',
                        icon: ShoppingBag,
                        desc: 'Can purchase products',
                      },
                      {
                        value: 'SELLER',
                        label: 'Seller',
                        icon: Store,
                        desc: 'Can sell + buy products',
                      },
                      {
                        value: 'DELIVERY_PARTNER',
                        label: 'Delivery',
                        icon: Truck,
                        desc: 'Handle deliveries',
                      },
                      { value: 'ADMIN', label: 'Admin', icon: Shield, desc: 'Platform management' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAddUserForm({ ...addUserForm, role: value })}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                          addUserForm.role === value
                            ? 'border-[#CBB57B] bg-[#CBB57B]/5 shadow-sm'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            addUserForm.role === value
                              ? 'bg-[#CBB57B]/15 text-[#CBB57B]'
                              : 'bg-white text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold ${addUserForm.role === value ? 'text-gray-900' : 'text-gray-600'}`}
                          >
                            {label}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setShowPassword(false);
                    }}
                    disabled={addUserLoading}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addUserLoading || addUserForm.password.length < 12}
                    className="flex-1 py-2.5 bg-[#CBB57B] text-white rounded-xl font-bold text-sm hover:bg-[#a89158] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addUserLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function UsersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <UsersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
