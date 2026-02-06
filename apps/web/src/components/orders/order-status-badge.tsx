'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderStatusBadgeProps {
  status: string; // Accept any string and normalize it
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ status, className, size = 'md' }: OrderStatusBadgeProps) {
  const t = useTranslations('components.orderStatusBadge');

  const STATUS_CONFIG = {
  pending: {
    label: t('pending'),
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  confirmed: {
    label: t('confirmed'),
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  processing: {
    label: t('processing'),
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  shipped: {
    label: t('shipped'),
    color: 'bg-[#CBB57B]/20 text-[#8B7355] border-[#CBB57B]',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  delivered: {
    label: t('delivered'),
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  cancelled: {
    label: t('cancelled'),
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  refunded: {
    label: t('refunded'),
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-1.5',
  lg: 'text-base px-4 py-2 gap-2',
};
  // Normalize status to lowercase to handle both uppercase and lowercase values
  const normalizedStatus = status.toLowerCase() as OrderStatus;
  const config = STATUS_CONFIG[normalizedStatus];

  // Fallback for unknown status
  if (!config) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center rounded-full font-semibold border',
          'bg-gray-100 text-gray-700 border-gray-200',
          SIZE_CLASSES[size],
          className
        )}
      >
        <span>{status}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        config.color,
        SIZE_CLASSES[size],
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </motion.div>
  );
}
