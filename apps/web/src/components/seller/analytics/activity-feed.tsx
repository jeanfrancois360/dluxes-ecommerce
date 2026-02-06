'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@nextpik/ui';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Truck,
  Clock,
  LucideIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface Activity {
  id: string;
  type: 'order' | 'product' | 'payout' | 'review' | 'delivery';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  metadata?: any;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  limit?: number;
}

const getActivityIcon = (type: Activity['type']): LucideIcon => {
  const icons: Record<Activity['type'], LucideIcon> = {
    order: ShoppingCart,
    product: Package,
    payout: DollarSign,
    review: Star,
    delivery: Truck,
  };
  return icons[type] || Package;
};

const getActivityColor = (type: Activity['type']) => {
  const colors: Record<Activity['type'], { bg: string; icon: string; iconBg: string }> = {
    order: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    product: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    payout: {
      bg: 'bg-[#CBB57B]/10',
      icon: 'text-[#CBB57B]',
      iconBg: 'bg-[#CBB57B]/20',
    },
    review: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
    delivery: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100',
    },
  };
  return colors[type];
};

export function ActivityFeed({ activities = [], isLoading, limit = 10 }: ActivityFeedProps) {
  const t = useTranslations('components.activityFeed');

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayActivities = activities.slice(0, limit);
  const isEmpty = displayActivities.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">{t('recentActivity')}</h3>
            {!isEmpty && (
              <span className="text-xs text-neutral-500">
                {displayActivities.length} {displayActivities.length === 1 ? t('activity') : t('activities')}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty ? (
            <div className="py-12 text-center">
              <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">{t('noRecentActivity')}</p>
              <p className="text-neutral-400 text-xs mt-1">
                {t('activityWillAppear')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colors = getActivityColor(activity.type);
                const isLast = index === displayActivities.length - 1;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group"
                  >
                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute left-5 top-12 w-0.5 h-full bg-neutral-200 -z-10"></div>
                    )}

                    <div className="flex gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer">
                      {/* Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colors.iconBg}`}>
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-sm text-neutral-600 mt-0.5">
                              {activity.description}
                            </p>
                          </div>
                          <span className="text-xs text-neutral-500 whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Metadata badge (if any) */}
                        {activity.metadata?.status && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              activity.metadata.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-700'
                                : activity.metadata.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : activity.metadata.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {activity.metadata.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
