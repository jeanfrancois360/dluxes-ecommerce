'use client';

/**
 * Seller Orders Management Page
 *
 * View and manage orders for products from this seller's store
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { sellerAPI } from '@/lib/api/seller';
import useSWR from 'swr';
import PageHeader from '@/components/seller/page-header';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
    SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
    DELIVERED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800 border-green-300',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    FAILED: 'bg-red-100 text-red-800 border-red-300',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
    >
      {status}
    </span>
  );
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerOrders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch orders from API
  const {
    data: ordersResponse,
    error,
    mutate,
  } = useSWR(
    user && user.role === 'SELLER' ? ['seller-orders', statusFilter, page] : null,
    () =>
      sellerAPI.getOrders({
        page,
        limit: 50,
        status: statusFilter || undefined,
      }),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Transform API data to match UI interface
  const orders: Order[] = React.useMemo(() => {
    if (!ordersResponse?.data) return [];

    return ordersResponse.data.map((order: any) => {
      // Calculate total from seller's items only
      const sellerTotal = order.items.reduce((sum: number, item: any) => {
        return sum + Number(item.total || 0);
      }, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName:
          `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || t('unknown'),
        customerEmail: order.user.email,
        total: sellerTotal,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        createdAt: order.createdAt,
        itemCount: order.items.length,
      };
    });
  }, [ordersResponse]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPayment = !paymentFilter || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const stats = {
    totalOrders: orders.length,
    processing: orders.filter((o) => o.status === 'PROCESSING').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      await sellerAPI.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
      });

      // Refresh orders
      await mutate();

      setShowStatusModal(false);
      setSelectedOrder(null);

      // Show success toast (assuming toast is set up)
      alert(t('updateStatus.success'));
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      alert(error?.response?.data?.message || t('updateStatus.error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      PENDING: 'PROCESSING',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const isLoading = !ordersResponse && !error;

  if (authLoading || (isLoading && !user)) {
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        description={t('pageSubtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/seller' },
          { label: t('breadcrumbs.orders') },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-neutral-50 via-neutral-50/50 to-white border border-neutral-100 rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-neutral-600 font-medium">{t('stats.totalOrders')}</p>
            <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalOrders}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-white border border-blue-100 rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-neutral-600 font-medium">{t('stats.processing')}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.processing}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-white border border-purple-100 rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-neutral-600 font-medium">{t('stats.shipped')}</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.shipped}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white border border-amber-100 rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-neutral-600 font-medium">{t('stats.totalRevenue')}</p>
            <p className="text-3xl font-bold text-gold mt-2">
              ${formatCurrencyAmount(stats.totalRevenue, 2)}
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium cursor-pointer"
              >
                <option value="">{t('filters.allStatus')}</option>
                <option value="PENDING">{t('status.PENDING')}</option>
                <option value="PROCESSING">{t('status.PROCESSING')}</option>
                <option value="SHIPPED">{t('status.SHIPPED')}</option>
                <option value="DELIVERED">{t('status.DELIVERED')}</option>
                <option value="CANCELLED">{t('status.CANCELLED')}</option>
              </select>
            </div>
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-medium cursor-pointer"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <p className="text-neutral-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gradient-to-r hover:from-neutral-50/50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-black">{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-black">{order.customerName}</p>
                          <p className="text-sm text-neutral-500">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-700">
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-black">
                          ${formatCurrencyAmount(order.total, 2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-700">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="text-gold hover:text-gold/80 font-medium text-sm"
                          >
                            View
                          </Link>
                          {getNextStatus(order.status) && (
                            <>
                              <span className="text-neutral-300">|</span>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowStatusModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Update Status
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom accent border */}
          <div className="h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
        </div>

        {/* Update Status Modal */}
        {showStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-black mb-4">Update Order Status</h3>
              <div className="mb-6">
                <p className="text-sm text-neutral-600 mb-2">
                  Order:{' '}
                  <span className="font-semibold text-black">{selectedOrder.orderNumber}</span>
                </p>
                <p className="text-sm text-neutral-600 mb-4">
                  Current Status: <StatusBadge status={selectedOrder.status} />
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next Status:</strong>{' '}
                    <span className="uppercase font-semibold">
                      {getNextStatus(selectedOrder.status)}
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {getNextStatus(selectedOrder.status) === 'PROCESSING' &&
                      'Mark order as being processed'}
                    {getNextStatus(selectedOrder.status) === 'SHIPPED' &&
                      'Mark order as shipped (delivery partner will be notified)'}
                    {getNextStatus(selectedOrder.status) === 'DELIVERED' &&
                      'Mark order as delivered (payment will be released from escrow)'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                  }}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(getNextStatus(selectedOrder.status)!)}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? t('updateStatus.updating') : t('updateStatus.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
