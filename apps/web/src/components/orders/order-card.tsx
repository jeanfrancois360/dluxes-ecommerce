'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { OrderStatusBadge } from './order-status-badge';
import type { Order } from '@/lib/api/types';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { useTranslations } from 'next-intl';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslations('components.orderCard');
  const firstItem = order.items[0];
  const itemCount = order.items.length;
  const isPickup = order.isPickup;

  // Get image from product or fallback to order item's stored image
  const productImage = firstItem?.product?.heroImage || firstItem?.image;
  const productName = firstItem?.product?.name || firstItem?.name || 'Product';

  // Get currency symbol dynamically based on order's currency
  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: order.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .format(0)
        .replace(/\d/g, '')
        .trim();
    } catch {
      return '$'; // Fallback to USD symbol
    }
  })();

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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{t('orderNumber')}</p>
              {isPickup && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Self-Pickup
                </span>
              )}
            </div>
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
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Cpath fill="%239ca3af" d="M20 25h40v30H20z"/%3E%3C/svg%3E';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center border border-neutral-200">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate mb-1">{productName}</p>
            <p className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? t('item') : t('items')}
            </p>
          </div>
        </div>

        {/* Pickup Info */}
        {isPickup && order.pickupCode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">PICKUP CODE</p>
                <p className="text-lg font-bold text-green-600 tracking-wider">
                  {order.pickupCode}
                </p>
              </div>
              {order.status.toUpperCase() === 'READY_FOR_PICKUP' && (
                <div className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
                  READY
                </div>
              )}
            </div>
            {order.pickupStore?.name && (
              <p className="text-xs text-green-600 mt-2">📍 {order.pickupStore.name}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('orderDate')}</p>
            <p className="text-sm font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">{t('total')}</p>
            <p className="font-serif text-xl font-bold">
              {currencySymbol}
              {formatCurrencyAmount(order.total, 2)}
            </p>
          </div>
        </div>

        {/* View Details Button */}
        <motion.div
          whileHover={{ x: 4 }}
          className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-[#CBB57B] font-semibold text-sm"
        >
          <span>{t('viewDetails')}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </motion.div>
    </Link>
  );
}
