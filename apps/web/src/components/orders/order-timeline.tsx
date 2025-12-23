'use client';

import { motion } from 'framer-motion';

interface TimelineItem {
  id?: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  icon?: string;
}

interface OrderTimelineProps {
  timeline: TimelineItem[];
  status: string;
}

const statusOrder = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'CONFIRMED':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'PROCESSING':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'SHIPPED':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case 'DELIVERED':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'CANCELLED':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'REFUNDED':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const getStatusColor = (status: string, isCurrent: boolean, isPast: boolean) => {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return 'bg-red-500 border-red-500 text-white';
  }
  
  if (isCurrent) {
    return 'bg-gold border-gold text-white animate-pulse';
  }
  
  if (isPast) {
    return 'bg-green-500 border-green-500 text-white';
  }
  
  return 'bg-white border-neutral-300 text-neutral-400';
};

const getLineColor = (isPast: boolean, status: string) => {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return 'bg-red-200';
  }
  return isPast ? 'bg-green-500' : 'bg-neutral-200';
};

export function OrderTimeline({ timeline, status }: OrderTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(status);
  const isCancelledOrRefunded = status === 'CANCELLED' || status === 'REFUNDED';

  return (
    <div className="space-y-6">
      {/* Visual Progress Bar (only for non-cancelled/refunded orders) */}
      {!isCancelledOrRefunded && (
        <div className="flex items-center justify-between mb-8">
          {statusOrder.map((step, index) => {
            const isPast = index < currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isLast = index === statusOrder.length - 1;

            return (
              <div key={step} className="flex-1 flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${getStatusColor(step, isCurrent, isPast)}`}>
                    {getStatusIcon(step)}
                  </div>
                  <div className="absolute -bottom-8 text-center w-20">
                    <p className={`text-xs font-medium ${isCurrent || isPast ? 'text-black' : 'text-neutral-400'}`}>
                      {step.replace('_', ' ')}
                    </p>
                  </div>
                </motion.div>

                {!isLast && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.1, duration: 0.5 }}
                    className={`flex-1 h-1 mx-2 transition-all duration-500 ${getLineColor(isPast, status)}`}
                    style={{ transformOrigin: 'left' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Timeline */}
      <div className="space-y-4 mt-12">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Order History
        </h3>

        {timeline.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-10 pb-6 last:pb-0"
          >
            {index < timeline.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-neutral-200" />
            )}
            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center shadow-lg shadow-gold/20 text-white">
              {getStatusIcon(item.status)}
            </div>
            <div className="bg-gradient-to-br from-neutral-50 to-white rounded-lg p-4 border border-neutral-100">
              <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </motion.div>
        ))}
        
        {timeline.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No timeline data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
