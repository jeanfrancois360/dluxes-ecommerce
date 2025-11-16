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
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
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
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
      {status}
    </span>
  );
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      // Check if user is seller
      if (user.role !== 'SELLER') {
        router.push('/dashboard/buyer');
        return;
      }
      fetchOrders();
    }
  }, [authLoading, user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to fetch seller's orders
      // const response = await api.get('/seller/orders');
      // setOrders(response.data);

      // Mock data for now
      setOrders([
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          total: 299.99,
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          createdAt: new Date().toISOString(),
          itemCount: 2,
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          total: 499.99,
          status: 'SHIPPED',
          paymentStatus: 'PAID',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          itemCount: 1,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orders</h1>
              <p className="text-neutral-300 mt-1">Manage orders for your products</p>
            </div>
            <Link
              href="/dashboard/seller"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-black mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 font-medium">Processing</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.processing}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 font-medium">Shipped</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.shipped}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gold mt-2">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-neutral-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
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
                        <span className="text-neutral-700">{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-black">${order.total.toFixed(2)}</span>
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
                        <Link
                          href={`/seller/orders/${order.id}`}
                          className="text-gold hover:text-gold/80 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
