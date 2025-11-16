'use client';

/**
 * Seller Order Details Page
 *
 * View and manage individual order from seller's store
 */

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  customer: Customer;
  shippingAddress: ShippingAddress;
  createdAt: string;
  trackingNumber?: string;
}

export default function SellerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'SELLER') {
        router.push('/dashboard/buyer');
        return;
      }
      fetchOrderDetails();
    }
  }, [authLoading, user, resolvedParams.id]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call
      // const response = await api.get(`/seller/orders/${resolvedParams.id}`);
      // setOrder(response.data);

      // Mock data
      const mockOrder: Order = {
        id: resolvedParams.id,
        orderNumber: `ORD-${resolvedParams.id}`,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        items: [
          {
            id: '1',
            name: 'Luxury Watch',
            image: '/images/placeholder.jpg',
            quantity: 1,
            price: 299.99,
          },
        ],
        subtotal: 299.99,
        tax: 24.00,
        shipping: 9.99,
        total: 333.98,
        customer: {
          id: 'cust1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        createdAt: new Date().toISOString(),
        trackingNumber: '',
      };
      setOrder(mockOrder);
      setTrackingNumber(mockOrder.trackingNumber || '');
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      // TODO: Implement API call
      // await api.put(`/seller/orders/${order.id}/status`, { status: newStatus });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Order status updated successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTracking = async () => {
    if (!order || !trackingNumber.trim()) return;

    try {
      setUpdating(true);
      // TODO: Implement API call
      // await api.put(`/seller/orders/${order.id}/tracking`, { trackingNumber });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Tracking number added successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Failed to add tracking:', error);
      alert('Failed to add tracking number');
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

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Order not found</p>
          <Link href="/seller/orders" className="text-gold hover:text-gold/80">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/seller/orders"
            className="text-neutral-300 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <p className="text-neutral-300 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </p>
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
                <h2 className="text-lg font-semibold text-black">Order Items</h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-black">{item.name}</h3>
                      <p className="text-sm text-neutral-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-black">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-neutral-500">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="text-black">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax</span>
                  <span className="text-black">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="text-black">${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Shipping Address</h2>
              <div className="text-sm text-neutral-600">
                <p className="font-medium text-black mb-2">{order.customer.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Status */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Customer</h2>
              <div className="space-y-2">
                <p className="font-medium text-black">{order.customer.name}</p>
                <p className="text-sm text-neutral-600">{order.customer.email}</p>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Order Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:opacity-50"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Payment Status</label>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Shipping Tracking</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleAddTracking}
                  disabled={updating || !trackingNumber.trim()}
                  className="w-full px-4 py-2 bg-gold text-black font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Saving...' : 'Update Tracking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
