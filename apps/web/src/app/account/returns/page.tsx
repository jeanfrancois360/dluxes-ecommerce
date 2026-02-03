'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { PageLayout } from '@/components/layout/page-layout';
import {
  returnsApi,
  type ReturnRequest,
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  RETURN_STATUS_COLORS,
} from '@/lib/api/returns';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { toast, standardToasts } from '@/lib/utils/toast';

// Status Badge Component
function StatusBadge({ status }: { status: ReturnRequest['status'] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${RETURN_STATUS_COLORS[status]}`}
    >
      {RETURN_STATUS_LABELS[status]}
    </span>
  );
}

export default function MyReturnsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setIsLoading(true);
        const response = await returnsApi.getMyReturns();
        if (response?.data) {
          setReturns(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch returns:', error);
        toast.error('Failed to load return requests');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchReturns();
    }
  }, [authLoading, user]);

  const handleCancelReturn = async (returnId: string) => {
    try {
      setCancellingId(returnId);
      const response = await returnsApi.cancelReturnRequest(returnId);
      if (response?.success) {
        setReturns((prev) =>
          prev.map((r) => (r.id === returnId ? { ...r, status: 'CANCELLED' as const } : r))
        );
        toast.success('Return request has been cancelled');
      } else {
        toast.error(response?.message || 'Failed to cancel return request');
      }
    } catch (error) {
      toast.error('Failed to cancel return request');
    } finally {
      setCancellingId(null);
    }
  };

  // Group returns by status
  const activeReturns = returns.filter((r) =>
    ['PENDING', 'APPROVED', 'ITEM_RECEIVED', 'REFUND_PROCESSING'].includes(r.status)
  );
  const completedReturns = returns.filter((r) =>
    ['REFUNDED', 'REJECTED', 'CANCELLED'].includes(r.status)
  );

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition-colors">
              Home
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/dashboard/buyer" className="hover:text-gold transition-colors">
              Account
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">Returns & Refunds</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-white mb-1">
                Returns & Refunds
              </h1>
              <p className="text-lg text-white/80">Track your return requests and refunds</p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-gold">{returns.length}</p>
              <p className="text-sm text-white/70">Total Requests</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-yellow-400">{activeReturns.length}</p>
              <p className="text-sm text-white/70">In Progress</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-green-400">
                {returns.filter((r) => r.status === 'REFUNDED').length}
              </p>
              <p className="text-sm text-white/70">Refunded</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">
                $
                {formatCurrencyAmount(
                  returns
                    .filter((r) => r.status === 'REFUNDED' && r.refundAmount)
                    .reduce((sum, r) => sum + (r.refundAmount || 0), 0),
                  2
                )}
              </p>
              <p className="text-sm text-white/70">Total Refunded</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {returns.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center"
          >
            <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold font-['Poppins'] text-black mb-2">
              No Return Requests
            </h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              You haven't submitted any return requests yet. If you need to return a product,
              visit your order details page.
            </p>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              View My Orders
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Active Returns */}
            {activeReturns.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Active Requests
                </h2>
                <div className="space-y-4">
                  {activeReturns.map((returnRequest, index) => (
                    <motion.div
                      key={returnRequest.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Link
                                href={`/account/orders/${returnRequest.orderId}`}
                                className="font-semibold text-lg hover:text-gold transition-colors"
                              >
                                Order #{returnRequest.order.orderNumber}
                              </Link>
                              <StatusBadge status={returnRequest.status} />
                            </div>
                            <p className="text-sm text-neutral-500">
                              Requested on{' '}
                              {new Date(returnRequest.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          {returnRequest.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelReturn(returnRequest.id)}
                              disabled={cancellingId === returnRequest.id}
                              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {cancellingId === returnRequest.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>

                        {/* Item Info */}
                        {returnRequest.orderItem && (
                          <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl mb-4">
                            {returnRequest.orderItem.image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                <img
                                  src={returnRequest.orderItem.image}
                                  alt={returnRequest.orderItem.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{returnRequest.orderItem.name}</p>
                              <p className="text-sm text-neutral-500">
                                Qty: {returnRequest.orderItem.quantity} ×{' '}
                                ${formatCurrencyAmount(returnRequest.orderItem.price, 2)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Reason & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">Reason</p>
                            <p className="font-medium">{RETURN_REASON_LABELS[returnRequest.reason]}</p>
                          </div>
                          {returnRequest.description && (
                            <div>
                              <p className="text-sm text-neutral-500 mb-1">Description</p>
                              <p className="text-neutral-700">{returnRequest.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Resolution (if any) */}
                        {returnRequest.resolution && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-600 font-medium mb-1">Resolution Note</p>
                            <p className="text-blue-800">{returnRequest.resolution}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Returns */}
            {completedReturns.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Completed
                </h2>
                <div className="space-y-4">
                  {completedReturns.map((returnRequest, index) => (
                    <motion.div
                      key={returnRequest.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Link
                                href={`/account/orders/${returnRequest.orderId}`}
                                className="font-semibold text-lg hover:text-gold transition-colors"
                              >
                                Order #{returnRequest.order.orderNumber}
                              </Link>
                              <StatusBadge status={returnRequest.status} />
                            </div>
                            <p className="text-sm text-neutral-500">
                              {returnRequest.status === 'REFUNDED' && returnRequest.refundedAt
                                ? `Refunded on ${new Date(returnRequest.refundedAt).toLocaleDateString()}`
                                : `Closed on ${new Date(returnRequest.updatedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          {returnRequest.status === 'REFUNDED' && returnRequest.refundAmount && (
                            <div className="text-right">
                              <p className="text-sm text-neutral-500">Refund Amount</p>
                              <p className="text-xl font-bold text-green-600">
                                ${formatCurrencyAmount(returnRequest.refundAmount, 2)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Item Info */}
                        {returnRequest.orderItem && (
                          <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                            {returnRequest.orderItem.image && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                <img
                                  src={returnRequest.orderItem.image}
                                  alt={returnRequest.orderItem.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{returnRequest.orderItem.name}</p>
                              <p className="text-sm text-neutral-500">
                                {RETURN_REASON_LABELS[returnRequest.reason]}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Resolution */}
                        {returnRequest.resolution && (
                          <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
                            <p className="text-sm text-neutral-500 mb-1">Resolution</p>
                            <p className="text-neutral-700">{returnRequest.resolution}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-neutral-50 to-white rounded-2xl border border-neutral-100 p-6"
        >
          <h3 className="font-bold text-lg mb-4">Return Policy</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Returns must be requested within 30 days of delivery
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Items must be in original condition with tags attached
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Refunds are processed within 5-7 business days after we receive the item
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Digital products and personalized items are non-refundable
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Link
              href="/contact"
              className="text-gold hover:text-gold/80 font-medium inline-flex items-center gap-1"
            >
              Need help? Contact support
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
