'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { OrderStatusBadge } from './order-status-badge';
import type { Order } from '@/lib/api/types';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const firstItem = order.items[0];
  const itemCount = order.items.length;

  return (
    <Link href={`/account/orders/${order.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
        className="bg-white rounded-xl border-2 border-neutral-100 hover:border-[#CBB57B] p-6 cursor-pointer transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
            <h3 className="font-bold text-lg">{order.orderNumber}</h3>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Product Preview */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100">
          {firstItem?.product?.heroImage && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={firstItem.product.heroImage}
                alt={firstItem.product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{firstItem?.product?.name || 'Product'}</p>
            <p className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Order Date</p>
            <p className="text-sm font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="font-serif text-xl font-bold">${order.total.toFixed(2)}</p>
          </div>
        </div>

        {/* View Details Button */}
        <motion.div
          whileHover={{ x: 4 }}
          className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-[#CBB57B] font-semibold text-sm"
        >
          <span>View Details</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </motion.div>
    </Link>
  );
}
