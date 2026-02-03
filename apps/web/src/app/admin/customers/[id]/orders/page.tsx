'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { adminCustomersApi, adminOrdersApi } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

function CustomerOrdersContent() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch customer details
        const customerData = await adminCustomersApi.getById(params.id as string);
        setCustomer(customerData);

        // Fetch customer's orders
        // For now, we'll use the customer.orders from the detail endpoint
        // In production, you might want a dedicated endpoint for paginated customer orders
        if (customerData.orders) {
          const filteredOrders = statusFilter
            ? customerData.orders.filter((order: any) => order.status === statusFilter)
            : customerData.orders;

          setOrders(filteredOrders);
          setTotal(filteredOrders.length);
          setPages(Math.ceil(filteredOrders.length / limit));
        }
      } catch (error) {
        toast.error('Failed to load customer orders');
        router.push('/admin/customers');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, router, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-neutral-600 font-medium">Loading orders...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Customer not found</p>
      </div>
    );
  }

  const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-black">Orders for {customerName}</h1>
          <p className="text-neutral-600">{customer.email}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-black">{customer._count?.orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-black">${formatCurrencyAmount(customer.totalSpent || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Avg. Order Value</p>
          <p className="text-2xl font-bold text-black">
            ${formatCurrencyAmount(customer._count?.orders > 0 ? customer.totalSpent / customer._count.orders : 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Member Since</p>
          <p className="text-2xl font-bold text-black">
            {format(new Date(customer.createdAt), 'MMM yyyy')}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-neutral-600 font-medium">No orders found</p>
            {statusFilter && (
              <p className="text-sm text-neutral-500 mt-2">Try clearing the filter</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-black">#{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      <div className="text-xs text-neutral-500">
                        {format(new Date(order.createdAt), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {order._count?.items || 0} item{order._count?.items !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-black">
                        ${formatCurrencyAmount(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
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
  );
}

export default function CustomerOrdersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CustomerOrdersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
