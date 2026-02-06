'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderProgressTrackerProps {
  currentStatus: OrderStatus;
  timeline?: Array<{
    status: OrderStatus;
    timestamp: string;
  }>;
  className?: string;
}

export function OrderProgressTracker({ currentStatus, timeline = [], className }: OrderProgressTrackerProps) {
  const t = useTranslations('components.orderProgressTracker');

  const STEPS = [
    { key: 'pending', label: t('orderPlaced'), icon: '📝' },
    { key: 'confirmed', label: t('confirmed'), icon: '✓' },
    { key: 'processing', label: t('processing'), icon: '⚙️' },
    { key: 'shipped', label: t('shipped'), icon: '📦' },
    { key: 'delivered', label: t('delivered'), icon: '🎉' },
  ];
  // Handle cancelled or refunded orders
  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return (
      <div className={cn('bg-red-50 border border-red-200 rounded-xl p-6', className)}>
        <div className="flex items-center gap-3 text-red-700">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <h3 className="font-bold text-lg">{currentStatus === 'cancelled' ? t('orderCancelled') : t('orderRefunded')}</h3>
            <p className="text-sm">
              {currentStatus === 'cancelled'
                ? t('cancelledMessage')
                : t('refundedMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStatus);

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 p-6', className)}>
      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden space-y-4">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const timelineEntry = timeline.find(t => t.status === step.key);

          return (
            <div key={step.key} className="flex gap-4">
              {/* Icon */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all',
                    isCompleted
                      ? 'bg-[#CBB57B] text-white border-[#CBB57B]'
                      : isCurrent
                      ? 'bg-white text-[#CBB57B] border-[#CBB57B] animate-pulse'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  )}
                >
                  {isCompleted ? '✓' : step.icon}
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-12 transition-all',
                      isCompleted ? 'bg-[#CBB57B]' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <h4 className={cn(
                  'font-semibold text-sm mb-1',
                  isCompleted ? 'text-black' : 'text-gray-400'
                )}>
                  {step.label}
                </h4>
                {timelineEntry && (
                  <p className="text-xs text-gray-500">
                    {new Date(timelineEntry.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const timelineEntry = timeline.find(t => t.status === step.key);

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all',
                      isCompleted
                        ? 'bg-[#CBB57B] text-white border-[#CBB57B] shadow-lg'
                        : isCurrent
                        ? 'bg-white text-[#CBB57B] border-[#CBB57B] border-4 animate-pulse'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    )}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </motion.div>

                  {/* Label */}
                  <h4 className={cn(
                    'font-semibold text-sm mt-3 text-center',
                    isCompleted ? 'text-black' : 'text-gray-400'
                  )}>
                    {step.label}
                  </h4>

                  {/* Timestamp */}
                  {timelineEntry && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(timelineEntry.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 relative" style={{ marginTop: '-40px' }}>
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="absolute inset-0 bg-[#CBB57B] rounded-full"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
