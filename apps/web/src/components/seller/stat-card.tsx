'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  index?: number;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  isLoading = false,
  index = 0,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-neutral-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-neutral-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 transition-all duration-200 hover:shadow-md hover:border-[#CBB57B]/30"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
        <div className="p-2 bg-black/5 rounded-lg border border-[#CBB57B]/20">
          <Icon className="w-5 h-5 text-black" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold text-neutral-900">{value}</p>

        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}

        {trend && (
          <div className="flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-sm text-neutral-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
