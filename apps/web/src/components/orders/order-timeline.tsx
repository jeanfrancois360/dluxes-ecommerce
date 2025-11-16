'use client';

import { motion } from 'framer-motion';
import type { OrderTimeline as OrderTimelineType } from '@/lib/api/types';

interface OrderTimelineProps {
  timeline: OrderTimelineType[];
}

const STATUS_ICONS: Record<string, string> = {
  pending: '📝',
  confirmed: '✓',
  processing: '⚙️',
  shipped: '📦',
  delivered: '🎉',
  cancelled: '❌',
  refunded: '↩️',
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="font-serif text-xl font-bold mb-6">Order History</h3>

      <div className="space-y-6">
        {timeline.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#CBB57B] text-white flex items-center justify-center text-lg font-bold shadow-md">
                {STATUS_ICONS[event.status] || '•'}
              </div>

              {/* Connector */}
              {index < timeline.length - 1 && (
                <div className="w-0.5 flex-1 bg-gradient-to-b from-[#CBB57B] to-gray-200 min-h-[40px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-black capitalize">
                  {event.status.replace('_', ' ')}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(event.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
