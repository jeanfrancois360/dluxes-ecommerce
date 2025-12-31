'use client';

/**
 * Seller Order Details Page
 *
 * View and manage individual order from seller's store
 */

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { sellerAPI, SellerOrderDetail } from '@/lib/api/seller';
import { toast } from 'sonner';
import useSWR from 'swr';
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
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
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
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');

  // Fetch order data
  const { data: order, error, isLoading, mutate } = useSWR<SellerOrderDetail>(
    user && user.role === 'SELLER' ? ['seller-order', resolvedParams.id] : null,
    () => sellerAPI.getOrder(resolvedParams.id),
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
      toast.success('Order status updated successfully');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error?.message || 'Failed to update order status');
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
          <p className="text-red-600 mb-4">Failed to load order details</p>
          <Link href="/seller/orders" className="text-gold hover:text-gold/80">
            Back to Orders
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
          <p className="text-neutral-500 mb-4">Order not found</p>
          <Link href="/seller/orders" className="text-gold hover:text-gold/80">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const canUpdateStatus = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const canShip = order.status === 'PROCESSING' && order.paymentStatus === 'PAID';

  // Calculate seller's portion of the order
  const sellerSubtotal = order.items.reduce((sum, item) => sum + Number(item.total), 0);

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
            Back to Orders
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-neutral-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                        Quantity: {item.quantity} × {formatCurrencyAmount(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        {formatCurrencyAmount(item.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Your Items Subtotal</span>
                    <span className="text-black">{formatCurrencyAmount(sellerSubtotal)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Tax (Order Total)</span>
                      <span className="text-black">{formatCurrencyAmount(order.tax)}</span>
                    </div>
                  )}
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Shipping (Order Total)</span>
                      <span className="text-black">{formatCurrencyAmount(order.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-2 mt-2">
                    <span>Order Total</span>
                    <span>{formatCurrencyAmount(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

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
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
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
                      <span className="text-black">{formatDate(order.delivery.estimatedDelivery)}</span>
                    </div>
                  )}
                  {order.delivery.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivered At</span>
                      <span className="text-green-600">{formatDate(order.delivery.deliveredAt)}</span>
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
                        {order.delivery.deliveryPartner.firstName} {order.delivery.deliveryPartner.lastName}
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
                  <a href={`mailto:${order.user.email}`} className="hover:text-gold transition-colors">
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
                  Update Status
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Order Status
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
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Carrier (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    placeholder="e.g., FedEx, UPS, USPS"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleUpdateShipping}
                    disabled={updating || !trackingNumber.trim()}
                    className="w-full px-4 py-2 bg-neutral-100 text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Update Tracking
                  </button>
                  {canShip && (
                    <button
                      onClick={handleMarkAsShipped}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-gold text-black font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Mark as Shipped
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Status</span>
                  <StatusBadge status={order.paymentStatus} type="payment" />
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Amount</span>
                  <span className="font-semibold text-black">{formatCurrencyAmount(order.total)}</span>
                </div>
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
    </div>
  );
}
