'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { OrderStatusBadge } from './order-status-badge';
import type { Order } from '@/lib/api/types';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const firstItem = order.items[0];
  const itemCount = order.items.length;

  // Get image from product or fallback to order item's stored image
  const productImage = firstItem?.product?.heroImage || firstItem?.image;
  const productName = firstItem?.product?.name || firstItem?.name || 'Product';

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
          {productImage ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-neutral-200">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Cpath fill="%239ca3af" d="M20 25h40v30H20z"/%3E%3C/svg%3E';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center border border-neutral-200">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate mb-1">{productName}</p>
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
            <p className="font-serif text-xl font-bold">${formatCurrencyAmount(order.total, 2)}</p>
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
