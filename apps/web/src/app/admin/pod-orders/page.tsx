'use client';

import { useState } from 'react';
import { usePodOrders } from '@/hooks/use-gelato';
import { gelatoApi } from '@/lib/api/gelato';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-100', text: 'text-blue-800' },
  IN_PRODUCTION: { label: 'In Production', bg: 'bg-purple-100', text: 'text-purple-800' },
  PRODUCED: { label: 'Produced', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  SHIPPED: { label: 'Shipped', bg: 'bg-green-100', text: 'text-green-800' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-neutral-100', text: 'text-neutral-600' },
  FAILED: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-800' },
};

export default function PodOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { orders, total, isLoading, refresh } = usePodOrders({
    status: statusFilter || undefined,
    limit: 50,
  });
  const [syncing, setSyncing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await gelatoApi.syncOrderStatus(id);
      toast.success('Status synced');
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to sync');
    } finally {
      setSyncing(null);
    }
  };

  const handleSubmit = async (orderId: string) => {
    if (!confirm('Submit all POD items in this order to Gelato?')) return;
    setSubmitting(orderId);
    try {
      await gelatoApi.submitAllPodItems(orderId);
      toast.success('Order submitted to Gelato');
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this POD order?')) return;
    setCancelling(id);
    try {
      await gelatoApi.cancelPodOrder(id, 'Cancelled by admin');
      toast.success('Order cancelled');
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const statusCounts = {
    IN_PRODUCTION: orders.filter((o) => o.status === 'IN_PRODUCTION').length,
    SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    FAILED: orders.filter((o) => o.status === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Print-on-Demand Orders</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage Gelato POD fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black bg-white"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: total, color: 'text-blue-600' },
          { label: 'In Production', value: statusCounts.IN_PRODUCTION, color: 'text-purple-600' },
          { label: 'Shipped', value: statusCounts.SHIPPED, color: 'text-green-600' },
          { label: 'Failed', value: statusCounts.FAILED, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-8 h-8 border-2 border-[#CBB57B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-16 text-neutral-400">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            <p>No POD orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                {['Product', 'Gelato Order ID', 'Status', 'Tracking', 'Created', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-black"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || {
                  label: order.status,
                  bg: 'bg-neutral-100',
                  text: 'text-neutral-600',
                };
                const canCancel = ['PENDING', 'SUBMITTED'].includes(order.status);
                const canSubmit = ['PENDING', 'FAILED'].includes(order.status);
                const img = order.product?.images?.[0]?.url;

                return (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image src={img} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-neutral-100 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-black line-clamp-1">
                            {order.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Order: {order.orderId.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                        {order.gelatoOrderId.slice(0, 12)}…
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.trackingNumber ? (
                        <a
                          href={order.trackingUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {order.trackingNumber}
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSync(order.id)}
                          disabled={syncing === order.id}
                          className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        >
                          {syncing === order.id ? '…' : 'Sync'}
                        </button>
                        <Link
                          href={`/admin/orders/${order.orderId}`}
                          className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          View
                        </Link>
                        {canSubmit && (
                          <button
                            onClick={() => handleSubmit(order.orderId)}
                            disabled={submitting === order.orderId}
                            className="text-xs px-3 py-1.5 border border-[#CBB57B] text-amber-700 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                          >
                            {submitting === order.orderId ? '…' : 'Submit'}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelling === order.id}
                            className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancelling === order.id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
