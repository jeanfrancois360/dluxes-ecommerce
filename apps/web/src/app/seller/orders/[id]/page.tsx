'use client';

/**
 * Seller Order Details Page
 *
 * View and manage individual order from seller's store
 */

import React, { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { sellerAPI, SellerOrderDetail } from '@/lib/api/seller';
import { toast } from 'sonner';
import useSWR from 'swr';
import { PackingSlip } from '@/components/seller/packing-slip';
import { MarkAsShippedModal } from '@/components/seller/mark-as-shipped-modal';
import { ShipmentCard } from '@/components/seller/shipment-card';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  X,
} from 'lucide-react';

function StatusBadge({ status, type }: { status: string; type: 'order' | 'payment' }) {
  const orderColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    PROCESSING: 'bg-purple-100 text-purple-800 border-purple-300',
    SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    DELIVERED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const paymentColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PAID: 'bg-green-100 text-green-800 border-green-300',
    FAILED: 'bg-red-100 text-red-800 border-red-300',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const colors = type === 'order' ? orderColors : paymentColors;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export default function SellerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerOrderDetails');
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [showMarkAsShippedModal, setShowMarkAsShippedModal] = useState(false);
  const packingSlipRef = useRef<HTMLDivElement>(null);

  // Fetch order data
  const {
    data: order,
    error,
    isLoading,
    mutate,
  } = useSWR<SellerOrderDetail>(
    user && user.role === 'SELLER' ? ['seller-order', resolvedParams.id] : null,
    () => sellerAPI.getOrder(resolvedParams.id),
    {
      revalidateOnFocus: false,
    }
  );

  // Fetch seller's store to get storeId
  const { data: storeData } = useSWR(user && user.role === 'SELLER' ? 'seller-store' : null, () =>
    sellerAPI.getStore()
  );

  // Fetch shipments for this order
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const { data: shipments, mutate: mutateShipments } = useSWR(
    user && user.role === 'SELLER' && order ? ['order-shipments', order.id] : null,
    async () => {
      const token = localStorage.getItem('auth_token'); // Fixed: use 'auth_token' not 'token'
      const response = await fetch(`${API_URL}/shipments/order/${order!.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      return data.data || [];
    },
    {
      revalidateOnFocus: false,
    }
  );

  // Redirect non-sellers
  React.useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Set tracking number from order data
  React.useEffect(() => {
    if (order?.delivery?.trackingNumber) {
      setTrackingNumber(order.delivery.trackingNumber);
    }
  }, [order]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      await sellerAPI.updateOrderStatus(order.id, { status: newStatus });
      await mutate();
      toast.success(t('updateSuccess'));
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error?.message || t('updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!order || !trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    try {
      setUpdating(true);
      await sellerAPI.updateShippingInfo(order.id, {
        trackingNumber: trackingNumber.trim(),
        carrier: shippingCarrier.trim() || undefined,
      });
      await mutate();
      toast.success('Shipping information updated');
    } catch (error: any) {
      console.error('Failed to update shipping:', error);
      toast.error(error?.message || 'Failed to update shipping information');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      await sellerAPI.markAsShipped(order.id, {
        trackingNumber: trackingNumber.trim() || undefined,
        shippingCarrier: shippingCarrier.trim() || undefined,
      });
      await mutate();
      toast.success('Order marked as shipped');
    } catch (error: any) {
      console.error('Failed to mark as shipped:', error);
      toast.error(error?.message || 'Failed to mark order as shipped');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintPackingSlip = () => {
    setShowPackingSlip(true);
    // Delay print to allow modal to render
    setTimeout(() => {
      window.print();
    }, 100);
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{t('errorLoading')}</p>
          <Link href="/seller/orders" className="text-gold hover:text-gold/80">
            {t('backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">{t('orderNotFound')}</p>
          <Link href="/seller/orders" className="text-gold hover:text-gold/80">
            {t('backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const canUpdateStatus = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  // Allow shipping for PROCESSING orders with PAID or PENDING payment (PENDING needed for test mode)
  const canShip =
    order.status === 'PROCESSING' &&
    (order.paymentStatus === 'PAID' || order.paymentStatus === 'PENDING');

  // Use seller-specific totals from backend (proportional allocation)
  const sellerTotals = (order as any).sellerTotals || {
    subtotal: order.items.reduce((sum, item) => sum + Number(item.total), 0),
    shipping: 0,
    tax: 0,
    discount: 0,
    total: order.items.reduce((sum, item) => sum + Number(item.total), 0),
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/seller/orders"
            className="text-neutral-300 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToOrders')}
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">
                {t('orderTitle', { orderNumber: order.orderNumber })}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-neutral-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintPackingSlip}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Packing Slip
              </button>
              <StatusBadge status={order.status} type="order" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({order.items.length})
                </h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-4">
                    {item.product.heroImage ? (
                      <img
                        src={item.product.heroImage}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-black truncate">{item.product.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        Quantity: {item.quantity} × {formatCurrency(item.price, order.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        {formatCurrency(item.total, order.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Your Items Subtotal</span>
                    <span className="text-black">
                      {formatCurrency(sellerTotals.subtotal, order.currency)}
                    </span>
                  </div>
                  {sellerTotals.shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Shipping (Your Portion)</span>
                      <span className="text-black">
                        {formatCurrency(sellerTotals.shipping, order.currency)}
                      </span>
                    </div>
                  )}
                  {sellerTotals.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Tax (Your Portion)</span>
                      <span className="text-black">
                        {formatCurrency(sellerTotals.tax, order.currency)}
                      </span>
                    </div>
                  )}
                  {sellerTotals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(sellerTotals.discount, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-2 mt-2">
                    <span>Your Order Total</span>
                    <span>{formatCurrency(sellerTotals.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments Section */}
            {shipments && shipments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-neutral-200">
                  <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipments ({shipments.length})
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Track all shipments for this order
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {shipments.map((shipment: any) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      currency={order.currency}
                      onUpdate={() => {
                        mutateShipments();
                        mutate();
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="text-sm text-neutral-600 space-y-1">
                  <p className="font-medium text-black">
                    {order.user.firstName || ''} {order.user.lastName || ''}
                  </p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            {order.delivery && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Delivery Status</span>
                    <StatusBadge status={order.delivery.status} type="order" />
                  </div>
                  {order.delivery.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Tracking Number</span>
                      <span className="font-mono text-black">{order.delivery.trackingNumber}</span>
                    </div>
                  )}
                  {order.delivery.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Estimated Delivery</span>
                      <span className="text-black">
                        {formatDate(order.delivery.estimatedDelivery)}
                      </span>
                    </div>
                  )}
                  {order.delivery.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivered At</span>
                      <span className="text-green-600">
                        {formatDate(order.delivery.deliveredAt)}
                      </span>
                    </div>
                  )}
                  {order.delivery.provider && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivery Provider</span>
                      <span className="text-black">{order.delivery.provider.name}</span>
                    </div>
                  )}
                  {order.delivery.deliveryPartner && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivery Partner</span>
                      <span className="text-black">
                        {order.delivery.deliveryPartner.firstName}{' '}
                        {order.delivery.deliveryPartner.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Customer & Actions */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-black">
                    {order.user.firstName || ''} {order.user.lastName || ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <a
                    href={`mailto:${order.user.email}`}
                    className="hover:text-gold transition-colors"
                  >
                    {order.user.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Order Status Update */}
            {canUpdateStatus && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Workflow
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Current Status
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      disabled={updating}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:opacity-50"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      {/* SHIPPED and DELIVERED are set automatically via shipment workflow */}
                    </select>
                    <p className="mt-2 text-xs text-neutral-500 flex items-start gap-1.5">
                      <span className="text-gold">ℹ️</span>
                      <span>
                        To ship this order, use the <strong>"Create Shipment"</strong> button below.
                        This will generate tracking info and update the status automatically.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipment Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gold/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-black mb-1">Create Shipment</h2>
                  <p className="text-sm text-neutral-600">
                    Generate shipping labels and tracking via DHL API
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Show shipments if any exist */}
                {shipments && shipments.length > 0 ? (
                  <div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ {shipments.length} shipment{shipments.length > 1 ? 's' : ''} created
                      </p>
                    </div>
                    {/* Button to create additional shipment */}
                    <button
                      onClick={() => setShowMarkAsShippedModal(true)}
                      disabled={updating}
                      className="w-full px-4 py-2.5 bg-neutral-100 text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Create Another Shipment
                    </button>
                  </div>
                ) : (
                  /* No shipments yet - show create button */
                  <>
                    {canShip ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            📦 Ready to ship! Click below to create a shipment with DHL tracking.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowMarkAsShippedModal(true)}
                          disabled={updating}
                          className="w-full px-4 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Truck className="w-5 h-5" />
                          Create Shipment with DHL
                        </button>
                      </>
                    ) : (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-neutral-600">
                          Order must be in <strong>Processing</strong> status to create shipments
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Legacy delivery info for backward compatibility */}
                {order.delivery?.trackingNumber && (
                  <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs font-medium text-neutral-600 mb-1">Legacy Tracking</p>
                    <p className="text-sm text-neutral-700 font-mono">
                      {order.delivery.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Earnings
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Payment Status</span>
                  <StatusBadge status={order.paymentStatus} type="payment" />
                </div>
                <div className="flex justify-between text-sm border-t pt-3 mt-3">
                  <span className="text-neutral-600">Order Amount (Your Portion)</span>
                  <span className="text-black">
                    {formatCurrency(sellerTotals.total, order.currency)}
                  </span>
                </div>
                {sellerTotals.platformCommission !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      Platform Fee ({sellerTotals.commissionRate || 10}%)
                    </span>
                    <span className="text-red-600">
                      -{formatCurrency(sellerTotals.platformCommission, order.currency)}
                    </span>
                  </div>
                )}
                {sellerTotals.paymentProcessingFee !== undefined &&
                  sellerTotals.paymentProcessingFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        Payment Processing Fee ({sellerTotals.paymentProcessor || 'Stripe'}:{' '}
                        {sellerTotals.processingFeeRate || 2.9}%{' '}
                        {order.currency === 'EUR'
                          ? '+ €0.30'
                          : order.currency === 'GBP'
                            ? '+ £0.20'
                            : '+ $0.30'}
                        )
                      </span>
                      <span className="text-red-600">
                        -{formatCurrency(sellerTotals.paymentProcessingFee, order.currency)}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
                  <span className="text-black">Net Earnings</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      sellerTotals.netEarnings !== undefined
                        ? sellerTotals.netEarnings
                        : sellerTotals.total,
                      order.currency
                    )}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Amount you'll receive after all fees
                </p>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Order Notes</h2>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Packing Slip Modal */}
      {showPackingSlip && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-start justify-center p-4 no-print">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between rounded-t-lg no-print">
              <h2 className="text-lg font-semibold text-black">Packing Slip Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setShowPackingSlip(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </div>
            <PackingSlip ref={packingSlipRef} order={order} />
          </div>
        </div>
      )}

      {/* Mark as Shipped Modal */}
      {order && storeData?.id && (
        <MarkAsShippedModal
          isOpen={showMarkAsShippedModal}
          onClose={() => setShowMarkAsShippedModal(false)}
          orderId={order.id}
          storeId={storeData.id}
          items={order.items}
          currency={order.currency}
          onSuccess={() => {
            mutateShipments();
            mutate();
          }}
        />
      )}
    </div>
  );
}
