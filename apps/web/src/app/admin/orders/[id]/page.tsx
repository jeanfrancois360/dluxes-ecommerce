'use client';

/**
 * Admin Order Details Page
 *
 * View and manage individual order
 * Includes: Timeline, Shipments, Reviews, Returns, Digital Downloads, Invoice, Packing Slip
 */

import React, { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { OrderBreakdown } from '@/components/admin/order-breakdown';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { ShipmentCard } from '@/components/seller/shipment-card';
import { PackingSlip } from '@/components/seller/packing-slip';
import { MarkAsShippedModal } from '@/components/seller/mark-as-shipped-modal';
import { useAdminOrder } from '@/hooks/use-admin';
import { adminOrdersApi } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import { currencyApi, CurrencyRate } from '@/lib/api/currency';
import { downloadsApi, type DigitalPurchase } from '@/lib/api/downloads';
import { returnsApi } from '@/lib/api/returns';
import { reviewsApi } from '@/lib/api/reviews';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Currency symbols map for common currencies (fallback if API fails)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  RWF: 'FRw',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
  KRW: '₩',
  SGD: 'S$',
  NOK: 'kr',
  MXN: 'MX$',
  INR: '₹',
  BRL: 'R$',
  ZAR: 'R',
  HKD: 'HK$',
  LUX: '€', // Luxembourg uses Euro
};

/**
 * Format file size helper
 */
function formatFileSize(bytes: string | null): string {
  if (!bytes) return 'Unknown size';
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format currency for admin views - shows amount in ORIGINAL order currency
 * No conversion, just proper symbol formatting
 */
function formatOrderCurrency(
  amount: number,
  currencyCode: string,
  currencyData?: CurrencyRate | null
): string {
  if (currencyData) {
    return currencyApi.formatPrice(amount, currencyData);
  }

  // Fallback: use currency symbols map
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const formattedAmount = formatCurrencyAmount(amount, 2);

  // Most currencies use symbol before amount
  if (['JPY', 'KRW', 'SEK', 'NOK', 'RWF'].includes(currencyCode)) {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
}

interface Delivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  provider: {
    name: string;
  };
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  product: {
    name: string;
  };
}

interface ReturnRequest {
  id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  refundedAt?: string;
}

function OrderDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { order, loading } = useAdminOrder(resolvedParams.id);
  const [updating, setUpdating] = useState(false);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [assigningDelivery, setAssigningDelivery] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [orderCurrency, setOrderCurrency] = useState<CurrencyRate | null>(null);

  // New state for additional features
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [digitalDownloads, setDigitalDownloads] = useState<DigitalPurchase[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [showMarkAsShippedModal, setShowMarkAsShippedModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const packingSlipRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (order) {
      fetchDelivery();
      fetchProviders();
      fetchOrderCurrency();
      fetchShipments();
      fetchDigitalDownloads();
      fetchReturnRequests();
      fetchReviews();
      setOrderNotes(order.notes || '');
    }
  }, [order]);

  const fetchOrderCurrency = async () => {
    if (!order?.currency) return;

    try {
      const currencyData = await currencyApi.getRate(order.currency);
      setOrderCurrency(currencyData);
    } catch (error) {
      console.error('Failed to fetch currency data:', error);
      // Will use fallback formatting
      setOrderCurrency(null);
    }
  };

  const fetchShipments = async () => {
    if (!order?.id) return;

    try {
      setShipmentsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/shipments/order/${order.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setShipmentsLoading(false);
    }
  };

  const fetchDigitalDownloads = async () => {
    if (!order?.id) return;

    try {
      const response = await downloadsApi.getOrderDigitalProducts(order.id);
      if (response?.data) {
        setDigitalDownloads(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch digital downloads:', error);
    }
  };

  const fetchReturnRequests = async () => {
    if (!order?.id) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/returns/order/${order.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReturnRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch return requests:', error);
    }
  };

  const fetchReviews = async () => {
    if (!order?.id) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/reviews/order/${order.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      await adminOrdersApi.updateStatus(order.id, newStatus);
      toast.success('Order status updated successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to refund this order?')) return;

    try {
      setUpdating(true);
      await adminOrdersApi.refund(order.id);
      toast.success('Order refunded successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to refund order');
    } finally {
      setUpdating(false);
    }
  };

  const fetchDelivery = async () => {
    if (!order) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/deliveries/order/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success && response.data.data) {
        setDelivery(response.data.data);
      }
    } catch (error: any) {
      // Order might not have delivery yet
      setDelivery(null);
    }
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/delivery-providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(response.data.data || response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (!order || !selectedProviderId) return;

    try {
      setAssigningDelivery(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/admin/deliveries/assign`,
        { orderId: order.id, providerId: selectedProviderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Delivery assigned successfully');
        fetchDelivery();
        setSelectedProviderId('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign delivery');
    } finally {
      setAssigningDelivery(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/orders/${order.id}/invoice`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success('Invoice opened in new tab');
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleReorder = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/orders/${order.id}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (data.success) {
        const { results } = data.data;
        if (results.added.length > 0) {
          toast.success(`${results.added.length} items added to cart`);
          router.push('/cart');
        } else if (results.skipped.length > 0) {
          toast.error(results.skipped[0]?.reason || 'Some items could not be added');
        }
      } else {
        toast.error(data.message || 'Failed to reorder');
      }
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const handlePrintPackingSlip = () => {
    setShowPackingSlip(true);
    // Delay print to allow modal to render
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSaveNotes = async () => {
    if (!order) return;

    try {
      setSavingNotes(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/orders/${order.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ notes: orderNotes }),
      });

      if (response.ok) {
        toast.success('Order notes saved');
      } else {
        toast.error('Failed to save notes');
      }
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (!order) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Order Not Found"
          description="The order you're looking for doesn't exist"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-neutral-600">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title={`Order ${order.orderNumber || 'N/A'}`}
        description={
          order.createdAt
            ? format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')
            : 'Date unavailable'
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={order.status || 'pending'}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleRefund}
              disabled={updating || order.paymentStatus === 'refunded'}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refund
            </button>
          </div>
        }
      />

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
            >
              <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#CBB57B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Order Timeline
              </h2>
              <OrderTimeline
                timeline={(order.timeline || []).map((item) => ({
                  ...item,
                  description: item.description || '',
                }))}
                status={order.status}
              />
            </motion.div>

            {/* Shipment Tracking */}
            {shipments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-neutral-200"
              >
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">Shipment Tracking</h2>
                      <p className="text-sm text-neutral-600">
                        {shipments.length} shipment{shipments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {shipments.map((shipment: any) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      currency={order.currency || 'USD'}
                      onUpdate={fetchShipments}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Digital Downloads */}
            {digitalDownloads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-100 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Digital Downloads</h2>
                    <p className="text-sm text-neutral-600">
                      {digitalDownloads.length} digital products
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {digitalDownloads.map((download) => (
                    <div
                      key={download.productId}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-purple-100"
                    >
                      {download.productImage && (
                        <img
                          src={download.productImage}
                          alt={download.productName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{download.productName}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                          {download.digitalFileFormat && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase font-medium">
                              {download.digitalFileFormat}
                            </span>
                          )}
                          {download.digitalFileSize && (
                            <span>{formatFileSize(download.digitalFileSize)}</span>
                          )}
                          {download.downloadCount > 0 && (
                            <span>• Downloaded {download.downloadCount} times</span>
                          )}
                          {download.digitalDownloadLimit && (
                            <span className="text-neutral-400">
                              • {download.downloadCount}/{download.digitalDownloadLimit} uses
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Return Requests */}
            {returnRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Return Requests</h2>
                    <p className="text-sm text-neutral-600">
                      {returnRequests.length} request{returnRequests.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {returnRequests.map((returnReq) => (
                    <div
                      key={returnReq.id}
                      className="p-4 bg-orange-50 rounded-xl border border-orange-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-900">
                          {returnReq.reason.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            returnReq.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : returnReq.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : returnReq.status === 'REFUNDED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {returnReq.status}
                        </span>
                      </div>
                      {returnReq.description && (
                        <p className="text-sm text-neutral-600 mb-2">{returnReq.description}</p>
                      )}
                      <p className="text-xs text-neutral-500">
                        Requested: {format(new Date(returnReq.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Customer Reviews */}
            {reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Customer Reviews</h2>
                    <p className="text-sm text-neutral-600">
                      {reviews.length} review{reviews.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-yellow-50 rounded-xl border border-yellow-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">
                            {review.user.firstName} {review.user.lastName}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">{review.product.name}</p>
                      {review.title && (
                        <p className="font-medium text-neutral-900 mb-1">{review.title}</p>
                      )}
                      <p className="text-sm text-neutral-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Order Items with Enhanced Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-200 rounded-xl flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900">{item.name}</h3>
                        <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                        {item.product?.store && (
                          <p className="text-xs text-blue-600 mt-1">
                            Sold by: {item.product.store.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900">
                          {formatOrderCurrency(
                            item.price * item.quantity,
                            order.currency || 'USD',
                            orderCurrency
                          )}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {formatOrderCurrency(item.price, order.currency || 'USD', orderCurrency)}{' '}
                          each
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-neutral-600 py-4">No items in this order</p>
                )}
              </div>
            </div>

            {/* Enhanced Order Breakdown */}
            <OrderBreakdown
              items={order.items || []}
              commissions={order.commissions || []}
              subtotal={order.subtotal || 0}
              tax={order.tax || 0}
              shipping={order.shipping || 0}
              total={order.total || 0}
              currency={order.currency}
            />

            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Shipping Information</h2>
              <div className="text-sm text-neutral-600">
                <p className="font-medium text-neutral-900 mb-2">
                  {order.customer?.name || 'Guest Customer'}
                </p>
                {order.shippingAddress ? (
                  <>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </>
                ) : (
                  <p className="text-neutral-600">No shipping address provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Invoice
                </button>

                <button
                  onClick={handlePrintPackingSlip}
                  className="w-full px-4 py-3 border border-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Packing Slip
                </button>

                <button
                  onClick={handleReorder}
                  className="w-full px-4 py-3 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reorder (Add to Cart)
                </button>

                <button
                  onClick={() => setShowMarkAsShippedModal(true)}
                  className="w-full px-4 py-3 border-2 border-[#CBB57B] text-[#CBB57B] rounded-lg hover:bg-[#CBB57B]/5 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  Create Shipment (DHL)
                </button>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Notes</h2>
              <div className="space-y-3">
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="w-full px-4 py-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-colors font-medium disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Customer</h2>
              <div className="space-y-2">
                <p className="font-medium text-neutral-900">
                  {order.customer?.name || 'Guest Customer'}
                </p>
                <p className="text-sm text-neutral-600">
                  {order.customer?.email || 'No email provided'}
                </p>
                {order.customer?.id && (
                  <a
                    href={`/admin/customers/${order.customer.id}`}
                    className="text-sm text-[#CBB57B] hover:text-[#a89158] font-medium inline-block mt-2"
                  >
                    View Customer
                  </a>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Status</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.paymentStatus === 'refunded'
                            ? 'bg-gray-100 text-gray-800'
                            : order.paymentStatus
                              ? 'bg-red-100 text-red-800'
                              : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {order.paymentStatus
                      ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total</span>
                  <span className="font-medium">
                    {formatOrderCurrency(order.total || 0, order.currency || 'USD', orderCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Status</h2>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-3 ${order.status === 'pending' ? 'text-[#CBB57B]' : 'text-neutral-400'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-[#CBB57B]' : 'bg-neutral-300'}`}
                  />
                  <span className="text-sm">Pending</span>
                </div>
                <div
                  className={`flex items-center gap-3 ${order.status === 'processing' ? 'text-[#CBB57B]' : 'text-neutral-400'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${order.status === 'processing' ? 'bg-[#CBB57B]' : 'bg-neutral-300'}`}
                  />
                  <span className="text-sm">Processing</span>
                </div>
                <div
                  className={`flex items-center gap-3 ${order.status === 'shipped' ? 'text-[#CBB57B]' : 'text-neutral-400'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${order.status === 'shipped' ? 'bg-[#CBB57B]' : 'bg-neutral-300'}`}
                  />
                  <span className="text-sm">Shipped</span>
                </div>
                <div
                  className={`flex items-center gap-3 ${order.status === 'delivered' ? 'text-[#CBB57B]' : 'text-neutral-400'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-[#CBB57B]' : 'bg-neutral-300'}`}
                  />
                  <span className="text-sm">Delivered</span>
                </div>
              </div>
            </div>

            {/* Delivery Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Delivery</h2>
              {delivery ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Provider</span>
                    <span className="font-medium">{delivery.provider.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Tracking #</span>
                    <span className="font-mono text-sm font-medium">{delivery.trackingNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        delivery.currentStatus === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : delivery.currentStatus.includes('TRANSIT')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {delivery.currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <a
                    href={`/admin/deliveries`}
                    className="text-sm text-[#CBB57B] hover:text-[#a89158] font-medium inline-block mt-2"
                  >
                    View Delivery Details →
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600">No delivery assigned yet</p>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-700">
                      Select Delivery Provider
                    </label>
                    <select
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      disabled={loadingProviders || assigningDelivery}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent text-sm"
                    >
                      <option value="">Select provider...</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} ({provider.type})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignDelivery}
                      disabled={!selectedProviderId || assigningDelivery}
                      className="w-full px-4 py-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {assigningDelivery ? 'Assigning...' : 'Assign Delivery'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Packing Slip Modal */}
      <AnimatePresence>
        {showPackingSlip && order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-start justify-center p-4 no-print"
            onClick={() => setShowPackingSlip(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full my-8"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between rounded-t-lg no-print">
                <h2 className="text-lg font-semibold text-neutral-900">Packing Slip Preview</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={() => setShowPackingSlip(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
              <PackingSlip
                ref={packingSlipRef}
                order={
                  {
                    ...order,
                    user: order.customer as any,
                    delivery: undefined as any,
                    shippingCost: undefined,
                  } as any
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark as Shipped Modal */}
      {order && order.items && (
        <MarkAsShippedModal
          isOpen={showMarkAsShippedModal}
          onClose={() => setShowMarkAsShippedModal(false)}
          orderId={order.id}
          storeId={order.items[0]?.product?.store?.id || ''}
          items={order.items.map((item) => ({
            id: item.id,
            product: {
              id: item.product?.id || item.productId,
              name: item.name,
              heroImage: item.image || null,
            },
            quantity: item.quantity,
            price: item.price,
            total: item.total ?? item.price * item.quantity,
          }))}
          currency={order.currency || 'USD'}
          onSuccess={() => {
            fetchShipments();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminRoute>
      <AdminLayout>
        <OrderDetailsContent params={params} />
      </AdminLayout>
    </AdminRoute>
  );
}
