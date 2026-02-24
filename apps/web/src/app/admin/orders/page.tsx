'use client';

/**
 * Admin Orders Management Page - Unified Self-Fulfilled & POD Orders
 *
 * Consolidated view for all order types with fulfillment type filtering
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { useAdminOrders } from '@/hooks/use-admin';
import { usePodOrders } from '@/hooks/use-gelato';
import { useDebounce } from '@/hooks/use-debounce';
import { adminOrdersApi } from '@/lib/api/admin';
import { gelatoApi } from '@/lib/api/gelato';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  totalRevenue: number;
}

const POD_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> =
  {
    PENDING: {
      label: 'Pending',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      dot: 'bg-yellow-600',
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-600',
    },
    IN_PRODUCTION: {
      label: 'In Production',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      dot: 'bg-purple-600',
    },
    PRODUCED: {
      label: 'Produced',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      dot: 'bg-indigo-600',
    },
    SHIPPED: {
      label: 'Shipped',
      bg: 'bg-green-50',
      text: 'text-green-700',
      dot: 'bg-green-600',
    },
    DELIVERED: {
      label: 'Delivered',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-600',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      dot: 'bg-gray-600',
    },
    FAILED: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
  };

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('adminOrders.filters.status');

  const colors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border border-blue-200',
    shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
    delivered: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    confirmed: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  };

  const dotColors: Record<string, string> = {
    pending: 'bg-amber-600',
    processing: 'bg-blue-600',
    shipped: 'bg-purple-600',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-600',
    confirmed: 'bg-cyan-600',
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    try {
      const translated = t(normalizedStatus as any);
      if (translated.includes('.')) {
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
      return translated;
    } catch {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-gray-600'}`}></div>
      {getStatusLabel(status)}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const t = useTranslations('adminOrders.filters.payment');

  const colors: Record<string, string> = {
    paid: 'bg-green-50 text-green-700 border border-green-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    failed: 'bg-red-50 text-red-700 border border-red-200',
    refunded: 'bg-gray-50 text-gray-700 border border-gray-200',
  };

  const dotColors: Record<string, string> = {
    paid: 'bg-green-600',
    pending: 'bg-amber-600',
    failed: 'bg-red-600',
    refunded: 'bg-gray-600',
  };

  const getPaymentLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    try {
      const translated = t(normalizedStatus as any);
      if (translated.includes('.')) {
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
      return translated;
    } catch {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-gray-600'}`}></div>
      {getPaymentLabel(status)}
    </span>
  );
}

function PodStatusBadge({ status }: { status: string }) {
  const cfg = POD_STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    dot: 'bg-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border ${cfg.bg} ${cfg.text} border-current/20`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></div>
      {cfg.label}
    </span>
  );
}

function OrdersContent() {
  const t = useTranslations('adminOrders');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState(''); // 'ALL', 'SELF_FULFILLED', 'GELATO_POD'
  const [podStatusFilter, setPodStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    totalRevenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Debounce search
  const search = useDebounce(searchInput, 500);

  // Calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    switch (range) {
      case 'today':
        startDate = format(now, 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
        break;
      case '7days':
        startDate = format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
        break;
      case '30days':
        startDate = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(dateRange);

  // Fetch orders based on fulfillment type
  const { orders, total, pages, loading, refetch } = useAdminOrders({
    page,
    limit,
    search,
    status,
    paymentStatus,
    startDate,
    endDate,
  });

  const {
    orders: podOrders,
    isLoading: podLoading,
    refresh: podRefresh,
  } = usePodOrders({
    status: podStatusFilter || undefined,
    limit: 1000, // Get all for filtering
  });

  // Calculate stats
  useEffect(() => {
    const calculateStats = async () => {
      try {
        setStatsLoading(true);
        const allOrders = await adminOrdersApi.getAll({ limit: 1000 });
        const orderList = allOrders.orders;

        const pendingCount = orderList.filter((o) => o.status === 'pending').length;
        const processingCount = orderList.filter((o) => o.status === 'processing').length;
        const completedCount = orderList.filter(
          (o) => o.status === 'delivered' || o.status === 'completed'
        ).length;
        const totalRevenue = orderList.reduce((sum, o) => {
          if (o.paymentStatus === 'paid') {
            return sum + Number(o.total);
          }
          return sum;
        }, 0);

        setStats({
          total: allOrders.total,
          pending: pendingCount,
          processing: processingCount,
          completed: completedCount,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    calculateStats();
  }, []);

  // Filter orders based on fulfillment type
  const displayOrders = useMemo(() => {
    if (fulfillmentType === 'GELATO_POD') {
      // Return POD orders mapped to match regular order structure
      return podOrders.map((po) => ({
        id: po.orderId,
        orderNumber: po.orderId.slice(0, 8) + '...',
        customer: null,
        items: [{ product: po.product }],
        total: 0,
        paymentStatus: 'paid',
        status: po.status.toLowerCase(),
        createdAt: po.createdAt,
        isPod: true,
        podData: po,
      })) as any[];
    }
    return orders.map((o) => ({ ...o, isPod: false }));
  }, [fulfillmentType, orders, podOrders]);

  // POD action handlers
  const handleSync = async (podOrderId: string) => {
    setSyncing(podOrderId);
    try {
      await gelatoApi.syncOrderStatus(podOrderId);
      toast.success('POD status synced with Gelato');
      podRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync status');
    } finally {
      setSyncing(null);
    }
  };

  const handleSubmitPod = async (orderId: string) => {
    if (!confirm('Submit all POD items in this order to Gelato for production?')) return;
    setSubmitting(orderId);
    try {
      await gelatoApi.submitAllPodItems(orderId);
      toast.success('Order submitted to Gelato for production');
      podRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit to Gelato');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancelPod = async (podOrderId: string) => {
    if (!confirm('Cancel this POD order with Gelato? This cannot be undone.')) return;
    try {
      await gelatoApi.cancelPodOrder(podOrderId, 'Cancelled by admin');
      toast.success('POD order cancelled');
      podRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel POD order');
    }
  };

  // Active filters
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (searchInput) filters.push({ key: 'search', label: `Search: ${searchInput}`, value: '' });
    if (status) filters.push({ key: 'status', label: `Status: ${status}`, value: '' });
    if (paymentStatus)
      filters.push({ key: 'payment', label: `Payment: ${paymentStatus}`, value: '' });
    if (fulfillmentType)
      filters.push({
        key: 'fulfillment',
        label: `Type: ${fulfillmentType === 'GELATO_POD' ? 'POD' : 'Self-Fulfilled'}`,
        value: '',
      });
    if (podStatusFilter && fulfillmentType === 'GELATO_POD')
      filters.push({ key: 'podStatus', label: `POD Status: ${podStatusFilter}`, value: '' });
    if (dateRange) {
      const dateLabel =
        dateRange === 'today' ? 'Today' : dateRange === '7days' ? 'Last 7 days' : 'Last 30 days';
      filters.push({ key: 'date', label: `Date: ${dateLabel}`, value: '' });
    }
    return filters;
  }, [searchInput, status, paymentStatus, fulfillmentType, podStatusFilter, dateRange]);

  const clearFilters = () => {
    setSearchInput('');
    setStatus('');
    setPaymentStatus('');
    setFulfillmentType('');
    setPodStatusFilter('');
    setDateRange('');
    setSortBy('createdAt-desc');
    setPage(1);
  };

  const clearFilter = (key: string) => {
    switch (key) {
      case 'search':
        setSearchInput('');
        break;
      case 'status':
        setStatus('');
        break;
      case 'payment':
        setPaymentStatus('');
        break;
      case 'fulfillment':
        setFulfillmentType('');
        break;
      case 'podStatus':
        setPodStatusFilter('');
        break;
      case 'date':
        setDateRange('');
        break;
    }
    setPage(1);
  };

  // Selection
  const allSelected = displayOrders.length > 0 && selectedIds.length === displayOrders.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayOrders.map((o) => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export
  const handleExport = () => {
    const csv = [
      ['Order Number', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Payment', 'Date'],
      ...displayOrders.map((o) => [
        o.orderNumber,
        o.customer?.name || 'Guest',
        o.customer?.email || 'N/A',
        o.items?.length || 0,
        o.total,
        o.status,
        o.paymentStatus,
        o.createdAt ? format(new Date(o.createdAt), 'yyyy-MM-dd') : 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Sort orders on frontend
  const sortedOrders = useMemo(() => {
    const [field, order] = sortBy.split('-');
    return [...displayOrders].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (field) {
        case 'createdAt':
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'total':
          aVal = Number(a.total);
          bVal = Number(b.total);
          break;
        default:
          return 0;
      }

      if (order === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }, [displayOrders, sortBy]);

  const isLoading = fulfillmentType === 'GELATO_POD' ? podLoading : loading;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Manage all orders including self-fulfilled and print-on-demand"
      />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : formatNumber(stats.total)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl shadow-sm border p-6 ${stats.pending > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">Pending</p>
                <p
                  className={`text-2xl font-bold ${stats.pending > 0 ? 'text-amber-600' : 'text-black'}`}
                >
                  {statsLoading ? '...' : formatNumber(stats.pending)}
                </p>
                {!statsLoading && stats.pending > 0 && (
                  <p className="text-xs text-amber-600 mt-1">Awaiting action</p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.pending > 0 ? 'bg-amber-100' : 'bg-neutral-100'}`}
              >
                <svg
                  className={`w-6 h-6 ${stats.pending > 0 ? 'text-amber-600' : 'text-neutral-600'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">Processing</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : formatNumber(stats.processing)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : formatNumber(stats.completed)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Fulfillment Type Filter */}
            <select
              value={fulfillmentType}
              onChange={(e) => {
                setFulfillmentType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all font-medium"
            >
              <option value="">All Orders</option>
              <option value="SELF_FULFILLED">Self-Fulfilled</option>
              <option value="GELATO_POD">Print-on-Demand</option>
            </select>

            {/* POD Status Filter (shown only for POD) */}
            {fulfillmentType === 'GELATO_POD' && (
              <select
                value={podStatusFilter}
                onChange={(e) => {
                  setPodStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">All POD Statuses</option>
                {Object.entries(POD_STATUS_CONFIG).map(([value, cfg]) => (
                  <option key={value} value={value}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            )}

            {/* Regular Status Filter (shown only for non-POD) */}
            {fulfillmentType !== 'GELATO_POD' && (
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            {/* Payment Filter (not for POD) */}
            {fulfillmentType !== 'GELATO_POD' && (
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            )}

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="total-desc">Amount: High to Low</option>
              <option value="total-asc">Amount: Low to High</option>
            </select>

            {/* Clear Filters */}
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear ({activeFilters.length})
              </button>
            )}
          </div>

          {/* Active Filter Pills */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm"
                >
                  {filter.label}
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="hover:text-neutral-900"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="relative bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto relative">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-neutral-600 font-medium">Loading orders...</p>
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="p-16 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-neutral-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-neutral-600 font-medium">No orders found</p>
                <p className="text-neutral-500 text-sm mt-1">
                  Try adjusting your filters or search query
                </p>
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
                      Order
                    </th>
                    {fulfillmentType !== 'GELATO_POD' && (
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Customer
                      </th>
                    )}
                    {fulfillmentType === 'GELATO_POD' && (
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Product
                      </th>
                    )}
                    {fulfillmentType !== 'GELATO_POD' && (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                          Items
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                          Payment
                        </th>
                      </>
                    )}
                    {fulfillmentType === 'GELATO_POD' && (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                          Gelato ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                          Tracking
                        </th>
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sortedOrders.map((order) => {
                    const podData = order.isPod ? order.podData : null;
                    const canCancelPod =
                      podData && ['PENDING', 'SUBMITTED'].includes(podData.status);
                    const canSubmitPod = podData && ['PENDING', 'FAILED'].includes(podData.status);

                    return (
                      <tr
                        key={order.id}
                        className="group transition-all duration-200 hover:bg-neutral-50"
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-black group-hover:text-[#CBB57B] transition-colors">
                            {order.orderNumber}
                          </div>
                          {order.isPod && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                                POD Order
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Customer column (non-POD) */}
                        {!order.isPod && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full overflow-hidden flex items-center justify-center ring-2 ring-[#CBB57B]/30">
                                <span className="text-white font-semibold text-sm">
                                  {order.customer?.name?.charAt(0).toUpperCase() || 'G'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-black">
                                  {order.customer?.name || 'Guest'}
                                </div>
                                <div className="text-xs text-neutral-600">
                                  {order.customer?.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Product column (POD) */}
                        {order.isPod && podData && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {podData.product?.images?.[0]?.url ? (
                                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-neutral-200">
                                  <Image
                                    src={podData.product.images[0].url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded bg-neutral-100 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-black line-clamp-1">
                                  {podData.product?.name || 'Unknown Product'}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  Store: {podData.storeId?.slice(0, 8) || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Regular order columns */}
                        {!order.isPod && (
                          <>
                            <td className="px-6 py-4 text-sm text-neutral-700">
                              {(order.items?.length || 0) === 1
                                ? `${order.items?.length} item`
                                : `${order.items?.length} items`}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-black">
                                ${formatCurrencyAmount(order.total, 2)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <PaymentBadge status={order.paymentStatus} />
                            </td>
                          </>
                        )}

                        {/* POD-specific columns */}
                        {order.isPod && podData && (
                          <>
                            <td className="px-6 py-4">
                              <code className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                {podData.gelatoOrderId?.slice(0, 12) || 'N/A'}...
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              {podData.trackingNumber ? (
                                <a
                                  href={podData.trackingUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {podData.trackingNumber}
                                </a>
                              ) : (
                                <span className="text-neutral-400 text-sm">—</span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Status column */}
                        <td className="px-6 py-4">
                          {order.isPod && podData ? (
                            <PodStatusBadge status={podData.status} />
                          ) : (
                            <StatusBadge status={order.status} />
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {order.createdAt
                            ? format(new Date(order.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </td>

                        {/* Actions column */}
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {/* POD-specific actions */}
                            {order.isPod && podData && (
                              <>
                                <button
                                  onClick={() => handleSync(podData.id)}
                                  disabled={syncing === podData.id}
                                  className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                  title="Sync status with Gelato"
                                >
                                  {syncing === podData.id ? '...' : 'Sync'}
                                </button>

                                {canSubmitPod && (
                                  <button
                                    onClick={() => handleSubmitPod(order.id)}
                                    disabled={submitting === order.id}
                                    className="text-xs px-3 py-1.5 border border-[#CBB57B] text-amber-700 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                                    title="Submit to Gelato"
                                  >
                                    {submitting === order.id ? '...' : 'Submit'}
                                  </button>
                                )}

                                {canCancelPod && (
                                  <button
                                    onClick={() => handleCancelPod(podData.id)}
                                    className="text-xs px-3 py-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Cancel POD order"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </>
                            )}

                            {/* View order */}
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105 inline-flex"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
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
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && sortedOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
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

        {/* Bulk Actions Bar (Fixed at Bottom) */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
              <span className="font-medium text-sm">
                {selectedIds.length} {selectedIds.length === 1 ? 'order' : 'orders'} selected
              </span>

              <div className="h-4 w-px bg-slate-600" />

              <button
                onClick={() => {
                  const selectedOrders = sortedOrders.filter((o) => selectedIds.includes(o.id));
                  const csv = [
                    [
                      'Order Number',
                      'Customer',
                      'Email',
                      'Items',
                      'Total',
                      'Status',
                      'Payment',
                      'Date',
                    ],
                    ...selectedOrders.map((o) => [
                      o.orderNumber,
                      o.customer?.name || 'Guest',
                      o.customer?.email || 'N/A',
                      o.items?.length || 0,
                      o.total,
                      o.status,
                      o.paymentStatus,
                      o.createdAt ? format(new Date(o.createdAt), 'yyyy-MM-dd') : 'N/A',
                    ]),
                  ]
                    .map((row) => row.join(','))
                    .join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `selected-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
                title="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <OrdersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
