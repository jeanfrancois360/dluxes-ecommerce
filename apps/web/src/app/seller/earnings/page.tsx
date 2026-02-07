'use client';

/**
 * Seller Earnings & Payouts Page
 *
 * View earnings summary, commission history, and payout history
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Package,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

interface CommissionSummary {
  total: { amount: number; count: number };
  pending: { amount: number; count: number };
  confirmed: { amount: number; count: number };
  paid: { amount: number; count: number };
}

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  platformFee: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  createdAt: string;
  order?: {
    orderNumber: string;
    total: number;
  };
}

interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  method: string;
  transactionId: string | null;
  processedAt: string | null;
  createdAt: string;
  store?: {
    name: string;
  };
  _count?: {
    commissions: number;
  };
}

type TabType = 'overview' | 'commissions' | 'payouts';

function StatusBadge({ status, type }: { status: string; type: 'commission' | 'payout' }) {
  const colors: Record<string, string> = {
    // Commission statuses
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    PAID: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
    // Payout statuses
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    FAILED: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SellerEarningsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  // Pagination
  const [commissionPage, setCommissionPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const pageSize = 10;

  // Filters
  const [commissionStatus, setCommissionStatus] = useState<string>('');

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await api.get('/commission/my-summary');
      setSummary(response);
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
      setError(err.message || 'Failed to fetch earnings summary');
    }
  };

  // Fetch commissions
  const fetchCommissions = async () => {
    try {
      const params = new URLSearchParams({
        page: commissionPage.toString(),
        limit: pageSize.toString(),
        ...(commissionStatus && { status: commissionStatus }),
      });

      const response = await api.get(`/commission/my-commissions?${params.toString()}`);
      setCommissions(response.data || []);
      setCommissionTotal(response.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch commissions:', err);
    }
  };

  // Fetch payouts
  const fetchPayouts = async () => {
    try {
      const params = new URLSearchParams({
        page: payoutPage.toString(),
        limit: pageSize.toString(),
      });

      const response = await api.get(`/commission/my-payouts?${params.toString()}`);
      setPayouts(response.data || []);
      setPayoutTotal(response.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch payouts:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && user.role === 'SELLER') {
      setIsLoading(true);
      Promise.all([fetchSummary(), fetchCommissions(), fetchPayouts()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [user]);

  // Refetch commissions when page or status changes
  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchCommissions();
    }
  }, [commissionPage, commissionStatus]);

  // Refetch payouts when page changes
  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchPayouts();
    }
  }, [payoutPage]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchSummary(), fetchCommissions(), fetchPayouts()]);
    setIsLoading(false);
  };

  if (authLoading || isLoading) {
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

  const commissionTotalPages = Math.ceil(commissionTotal / pageSize);
  const payoutTotalPages = Math.ceil(payoutTotal / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-6">
            <Link href="/dashboard/seller" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white">Earnings & Payouts</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Earnings & Payouts</h1>
              <p className="text-neutral-300">
                Track your earnings, commissions, and payout history
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-black">
              {formatCurrencyAmount(summary?.total.amount || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{summary?.total.count || 0} orders</p>
          </motion.div>

          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-black">
              {formatCurrencyAmount(summary?.pending.amount || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {summary?.pending.count || 0} orders awaiting confirmation
            </p>
          </motion.div>

          {/* Available for Payout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Available for Payout</p>
            <p className="text-2xl font-bold text-black">
              {formatCurrencyAmount(summary?.confirmed.amount || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {summary?.confirmed.count || 0} confirmed orders
            </p>
          </motion.div>

          {/* Paid Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Paid Out</p>
            <p className="text-2xl font-bold text-black">
              {formatCurrencyAmount(summary?.paid.amount || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{summary?.paid.count || 0} paid orders</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'commissions', label: 'Commission History', icon: Package },
            { id: 'payouts', label: 'Payout History', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gold text-gold font-medium'
                  : 'border-transparent text-neutral-500 hover:text-black'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Commissions */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Commissions</h3>
                <button
                  onClick={() => setActiveTab('commissions')}
                  className="text-sm text-gold hover:text-gold/80"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {commissions.slice(0, 5).map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-black">
                        Order #{commission.order?.orderNumber || commission.orderId.slice(0, 8)}
                      </p>
                      <p className="text-sm text-neutral-500">{formatDate(commission.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrencyAmount(commission.commissionAmount)}
                      </p>
                      <StatusBadge status={commission.status} type="commission" />
                    </div>
                  </div>
                ))}
                {commissions.length === 0 && (
                  <p className="text-center text-neutral-500 py-8">No commissions yet</p>
                )}
              </div>
            </div>

            {/* Recent Payouts */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Payouts</h3>
                <button
                  onClick={() => setActiveTab('payouts')}
                  className="text-sm text-gold hover:text-gold/80"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-black">Payout #{payout.id.slice(0, 8)}</p>
                      <p className="text-sm text-neutral-500">
                        {formatDate(payout.createdAt)} • {payout._count?.commissions || 0} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        {formatCurrencyAmount(payout.amount)}
                      </p>
                      <StatusBadge status={payout.status} type="payout" />
                    </div>
                  </div>
                ))}
                {payouts.length === 0 && (
                  <p className="text-center text-neutral-500 py-8">No payouts yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100">
            {/* Filters */}
            <div className="p-4 border-b border-neutral-100 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-500">Filter:</span>
              </div>
              <select
                value={commissionStatus}
                onChange={(e) => {
                  setCommissionStatus(e.target.value);
                  setCommissionPage(1);
                }}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Gross Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Commission Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Your Earnings
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-black">
                          #{commission.order?.orderNumber || commission.orderId.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDateTime(commission.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {formatCurrencyAmount(commission.grossAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-neutral-500">
                        {((1 - commission.commissionRate) * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-semibold text-green-600">
                          +{formatCurrencyAmount(commission.commissionAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={commission.status} type="commission" />
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                        No commissions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {commissionTotalPages > 1 && (
              <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Showing {(commissionPage - 1) * pageSize + 1} -{' '}
                  {Math.min(commissionPage * pageSize, commissionTotal)} of {commissionTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCommissionPage((p) => Math.max(1, p - 1))}
                    disabled={commissionPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm">
                    Page {commissionPage} of {commissionTotalPages}
                  </span>
                  <button
                    onClick={() => setCommissionPage((p) => Math.min(commissionTotalPages, p + 1))}
                    disabled={commissionPage === commissionTotalPages}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Payout ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-black font-mono text-sm">
                          #{payout.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDateTime(payout.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="capitalize">{payout.method || 'Bank Transfer'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {payout._count?.commissions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-semibold text-black">
                          {formatCurrencyAmount(payout.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={payout.status} type="payout" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-mono">
                        {payout.transactionId || '-'}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                        No payouts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {payoutTotalPages > 1 && (
              <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Showing {(payoutPage - 1) * pageSize + 1} -{' '}
                  {Math.min(payoutPage * pageSize, payoutTotal)} of {payoutTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                    disabled={payoutPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm">
                    Page {payoutPage} of {payoutTotalPages}
                  </span>
                  <button
                    onClick={() => setPayoutPage((p) => Math.min(payoutTotalPages, p + 1))}
                    disabled={payoutPage === payoutTotalPages}
                    className="p-2 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">About Earnings & Payouts</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Pending:</strong> Earnings from orders that are still being processed or in
              escrow.
            </p>
            <p>
              <strong>Confirmed:</strong> Earnings ready for payout after order delivery
              confirmation.
            </p>
            <p>
              <strong>Paid:</strong> Earnings that have been transferred to your account.
            </p>
            <p className="mt-4">
              Payouts are processed automatically according to the platform's payout schedule.
              Contact support if you have questions about your earnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
