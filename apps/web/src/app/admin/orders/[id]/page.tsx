'use client';

/**
 * Admin Order Details Page
 *
 * View and manage individual order
 */

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useAdminOrder } from '@/hooks/use-admin';
import { adminOrdersApi } from '@/lib/api/admin';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
function OrderDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { order, loading } = useAdminOrder(resolvedParams.id);
  const [updating, setUpdating] = useState(false);

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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">{format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            </div>
            <div className="p-6 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${formatCurrencyAmount(item.price * item.quantity, 2)}</p>
                    <p className="text-sm text-gray-500">${formatCurrencyAmount(item.price, 2)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${formatCurrencyAmount(order.subtotal, 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${formatCurrencyAmount(order.tax, 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">${formatCurrencyAmount(order.shipping, 2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span>${formatCurrencyAmount(order.total, 2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">{order.customer.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-sm text-gray-600">{order.customer.email}</p>
              <a
                href={`/admin/customers/${order.customer.id}`}
                className="text-sm text-[#CBB57B] hover:text-[#a89158] font-medium inline-block mt-2"
              >
                View Customer
              </a>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.paymentStatus === 'refunded'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">${formatCurrencyAmount(order.total, 2)}</span>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${order.status === 'pending' ? 'text-[#CBB57B]' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-[#CBB57B]' : 'bg-gray-300'}`} />
                <span className="text-sm">Pending</span>
              </div>
              <div className={`flex items-center gap-3 ${order.status === 'processing' ? 'text-[#CBB57B]' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${order.status === 'processing' ? 'bg-[#CBB57B]' : 'bg-gray-300'}`} />
                <span className="text-sm">Processing</span>
              </div>
              <div className={`flex items-center gap-3 ${order.status === 'shipped' ? 'text-[#CBB57B]' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${order.status === 'shipped' ? 'bg-[#CBB57B]' : 'bg-gray-300'}`} />
                <span className="text-sm">Shipped</span>
              </div>
              <div className={`flex items-center gap-3 ${order.status === 'delivered' ? 'text-[#CBB57B]' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-[#CBB57B]' : 'bg-gray-300'}`} />
                <span className="text-sm">Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
