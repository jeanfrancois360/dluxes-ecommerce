'use client';

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useAdminCustomers, useCustomerStats } from '@/hooks/use-admin';
import { adminCustomersApi } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useDebounce } from '@/hooks/use-debounce';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning';
  loading?: boolean;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutral-700">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-neutral-300 text-black rounded-lg hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
              confirmVariant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomersContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [segment, setSegment] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customerId: '', customerName: '' });
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, customerId: '', customerName: '' });
  const [bulkSuspendModal, setBulkSuspendModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search to avoid too many API calls
  const search = useDebounce(searchInput, 500);

  const { customers, total, pages, loading, refetch } = useAdminCustomers({
    page,
    limit,
    search,
    status,
    role,
    segment,
    sortBy,
  });

  const { stats, loading: statsLoading } = useCustomerStats();

  // Bulk selection
  const allSelected = customers.length > 0 && selectedIds.length === customers.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, customerId: id, customerName: name });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminCustomersApi.delete(deleteModal.customerId);
      toast.success('Customer deleted successfully');
      setDeleteModal({ isOpen: false, customerId: '', customerName: '' });
      refetch();
    } catch (error) {
      toast.error('Failed to delete customer');
    } finally {
      setActionLoading(false);
    }
  };

  const openSuspendModal = (id: string, name: string) => {
    setSuspendModal({ isOpen: true, customerId: id, customerName: name });
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await adminCustomersApi.suspend(suspendModal.customerId);
      toast.success('Customer suspended successfully');
      setSuspendModal({ isOpen: false, customerId: '', customerName: '' });
      refetch();
    } catch (error) {
      toast.error('Failed to suspend customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminCustomersApi.activate(id);
      toast.success('Customer activated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to activate customer');
    }
  };

  const handleBulkSuspend = async () => {
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => adminCustomersApi.suspend(id)));
      toast.success(`${selectedIds.length} customers suspended successfully`);
      setSelectedIds([]);
      setBulkSuspendModal(false);
      refetch();
    } catch (error) {
      toast.error('Failed to suspend customers');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(selectedIds.map(id => adminCustomersApi.activate(id)));
      toast.success(`${selectedIds.length} customers activated successfully`);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error('Failed to activate customers');
    }
  };

  const handleBulkEmail = () => {
    const emails = customers
      .filter(c => selectedIds.includes(c.id))
      .map(c => c.email)
      .join(',');
    window.open(`mailto:${emails}`);
  };

  const handleBulkExport = () => {
    const selectedCustomers = customers.filter(c => selectedIds.includes(c.id));
    const csv = [
      ['Name', 'Email', 'Total Orders', 'Total Spent', 'Status', 'Join Date'],
      ...selectedCustomers.map((c) => [
        c.name,
        c.email,
        c.totalOrders,
        c.totalSpent,
        c.status,
        format(new Date(c.createdAt), 'yyyy-MM-dd'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-selected-${selectedIds.length}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatus('');
    setRole('');
    setSegment('');
    setSortBy('createdAt-desc');
    setPage(1);
  };

  const hasActiveFilters = searchInput || status || role || segment || sortBy !== 'createdAt-desc';
  const activeFilterCount = [searchInput, status, role, segment, sortBy !== 'createdAt-desc'].filter(Boolean).length;

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Total Orders', 'Total Spent', 'Status', 'Join Date'],
      ...customers.map((c) => [
        c.name,
        c.email,
        c.totalOrders,
        c.totalSpent,
        c.status,
        format(new Date(c.createdAt), 'yyyy-MM-dd'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-neutral-600">Manage customer accounts</p>
        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-black">
                {statsLoading ? '...' : formatNumber(stats.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600 mb-1">New This Month</p>
              <p className="text-2xl font-bold text-black">
                {statsLoading ? '...' : formatNumber(stats.newThisMonth)}
              </p>
              {!statsLoading && (
                <p className="text-xs text-green-600 mt-1">
                  {stats.growthPercent > 0 ? '+' : ''}{stats.growthPercent}% growth
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600 mb-1">VIP Customers</p>
              <p className="text-2xl font-bold text-black">
                {statsLoading ? '...' : formatNumber(stats.vipCount)}
              </p>
              {!statsLoading && (
                <p className="text-xs text-amber-600 mt-1">$1000+ spent</p>
              )}
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-black">
                {statsLoading ? '...' : `$${formatCurrencyAmount(stats.totalRevenue, 0)}`}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-neutral-300 text-black placeholder-neutral-400 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
          >
            <option value="">All Roles</option>
            <option value="BUYER">Customers</option>
            <option value="SELLER">Sellers</option>
            <option value="DELIVERY_PARTNER">Delivery Partners</option>
            <option value="ADMIN">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Segment Filter */}
          <select
            value={segment}
            onChange={(e) => { setSegment(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
          >
            <option value="">All Segments</option>
            <option value="vip">VIP ($1000+)</option>
            <option value="regular">Regular</option>
            <option value="new">New (30 days)</option>
            <option value="at-risk">At Risk (90+ days)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="totalSpent-desc">Highest Spend</option>
            <option value="totalSpent-asc">Lowest Spend</option>
            <option value="orderCount-desc">Most Orders</option>
            <option value="lastLoginAt-desc">Recent Activity</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
            {searchInput && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
                Search: "{searchInput}"
                <button onClick={() => setSearchInput('')} className="hover:text-neutral-900">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {role && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
                Role: {role === 'BUYER' ? 'Customers' : role === 'SELLER' ? 'Sellers' : role === 'DELIVERY_PARTNER' ? 'Delivery Partners' : 'Admins'}
                <button onClick={() => setRole('')} className="hover:text-neutral-900">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
                Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                <button onClick={() => setStatus('')} className="hover:text-neutral-900">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {segment && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
                Segment: {segment === 'vip' ? 'VIP' : segment === 'new' ? 'New' : segment === 'at-risk' ? 'At Risk' : 'Regular'}
                <button onClick={() => setSegment('')} className="hover:text-neutral-900">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {sortBy !== 'createdAt-desc' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
                Sort: {sortBy.split('-')[0] === 'createdAt' ? 'Created' : sortBy.split('-')[0] === 'totalSpent' ? 'Spend' : sortBy.split('-')[0] === 'orderCount' ? 'Orders' : sortBy.split('-')[0] === 'lastLoginAt' ? 'Activity' : 'Name'}
                <button onClick={() => setSortBy('createdAt-desc')} className="hover:text-neutral-900">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto relative">
          {loading ? (
            <div className="p-16 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-neutral-600 font-medium">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-16 text-center">
              <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-neutral-600 font-medium">No customers found</p>
            </div>
          ) : (
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="group transition-all duration-200 hover:bg-neutral-50">
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full overflow-hidden flex items-center justify-center ring-2 ring-[#CBB57B]/30">
                          <span className="text-white font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-black group-hover:text-[#CBB57B] transition-colors">{customer.name}</div>
                          {customer.totalSpent >= 1000 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              VIP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-neutral-800 font-bold">{customer.totalOrders}</td>
                    <td className="px-6 py-4 text-sm font-bold text-black">
                      ${formatCurrencyAmount(customer.totalSpent, 2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                        {customer.status === 'active' ? (
                          <button
                            onClick={() => openSuspendModal(customer.id, customer.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(customer.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 border border-green-200 text-green-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(customer.id, customer.name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} customers
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="ml-4 px-3 py-1.5 border border-neutral-300 bg-white text-black rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-700 font-medium px-3">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, customerId: '', customerName: '' })}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteModal.customerName}? This action cannot be undone and will permanently remove all customer data.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={suspendModal.isOpen}
        onClose={() => setSuspendModal({ isOpen: false, customerId: '', customerName: '' })}
        onConfirm={handleSuspend}
        title="Suspend Customer"
        message={`Are you sure you want to suspend ${suspendModal.customerName}? They will not be able to log in or place orders until reactivated.`}
        confirmText="Suspend"
        confirmVariant="warning"
        loading={actionLoading}
      />

      {/* Bulk Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={bulkSuspendModal}
        onClose={() => setBulkSuspendModal(false)}
        onConfirm={handleBulkSuspend}
        title="Suspend Multiple Customers"
        message={`Are you sure you want to suspend ${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''}? They will not be able to log in or place orders until reactivated.`}
        confirmText={`Suspend ${selectedIds.length} Customer${selectedIds.length > 1 ? 's' : ''}`}
        confirmVariant="warning"
        loading={actionLoading}
      />

      {/* Bulk Actions Bar (Fixed at Bottom) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
            <span className="font-medium text-sm">
              {selectedIds.length} customer{selectedIds.length > 1 ? 's' : ''} selected
            </span>

            <div className="h-4 w-px bg-slate-600" />

            <button
              onClick={handleBulkEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>

            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            <button
              onClick={() => setBulkSuspendModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Suspend
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CustomersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
