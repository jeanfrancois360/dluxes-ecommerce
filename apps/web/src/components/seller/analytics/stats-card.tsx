'use client';

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@nextpik/ui';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'gold' | 'red';
  isLoading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    gradient: 'bg-gradient-to-br from-blue-50 via-blue-50/50 to-white',
    icon: 'text-white',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30',
    border: 'border-blue-100',
  },
  green: {
    gradient: 'bg-gradient-to-br from-emerald-50 via-green-50/50 to-white',
    icon: 'text-white',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30',
    border: 'border-emerald-100',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-purple-50 via-purple-50/50 to-white',
    icon: 'text-white',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30',
    border: 'border-purple-100',
  },
  gold: {
    gradient: 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white',
    icon: 'text-white',
    iconBg: 'bg-gradient-to-br from-[#CBB57B] to-[#A89460] shadow-lg shadow-[#CBB57B]/30',
    border: 'border-amber-100',
  },
  red: {
    gradient: 'bg-gradient-to-br from-red-50 via-rose-50/50 to-white',
    icon: 'text-white',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30',
    border: 'border-red-100',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'gold',
  isLoading,
  onClick,
}: StatsCardProps) {
  const colors = colorClasses[color];

  if (isLoading) {
    return (
      <Card className={cn('border-none shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-neutral-200 rounded w-24"></div>
              <div className="h-10 w-10 bg-neutral-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-neutral-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'shadow-sm transition-all duration-200',
          onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
          colors.gradient,
          colors.border,
          'border'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <div className={cn('p-2.5 rounded-lg', colors.iconBg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-neutral-900">{value}</p>

            <div className="flex items-center gap-2">
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                  trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                )}>
                  {trend.isPositive ? (
                    <ArrowUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}

              {(subtitle || trend?.label) && (
                <p className="text-xs text-neutral-500">
                  {trend?.label || subtitle}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
