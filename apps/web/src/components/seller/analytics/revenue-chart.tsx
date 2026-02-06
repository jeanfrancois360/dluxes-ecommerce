'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@nextpik/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface RevenueChartProps {
  data: Array<{ date: string; amount: number; orders: number }>;
  period: 'daily' | 'weekly' | 'monthly';
  total: number;
  trend: { value: number; isPositive: boolean };
  currency?: string;
  isLoading?: boolean;
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export function RevenueChart({
  data = [],
  period,
  total,
  trend,
  currency = 'USD',
  isLoading,
  onPeriodChange,
}: RevenueChartProps) {
  const t = useTranslations('components.revenueChart');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>(period);

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatXAxis = (dateString: string) => {
    try {
      if (period === 'daily') {
        return format(new Date(dateString), 'MMM dd');
      } else if (period === 'weekly') {
        // For weekly format (2024-W51), extract week number
        const weekMatch = dateString.match(/W(\d+)/);
        return weekMatch ? `W${weekMatch[1]}` : dateString;
      } else {
        return format(new Date(dateString + '-01'), 'MMM yyyy');
      }
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-32"></div>
            <div className="h-4 bg-neutral-200 rounded w-24"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-neutral-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0 || data.every(item => item.amount === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{t('revenueOverview')}</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-bold text-neutral-900">{formatCurrency(total)}</p>
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                  trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{trend.value}%</span>
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === p
                      ? 'bg-[#CBB57B] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t(p)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-500 text-sm">{t('noRevenueData')}</p>
                <p className="text-neutral-400 text-xs mt-1">
                  {t('dataWillAppear')}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CBB57B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#CBB57B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6B7280' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'amount') {
                      return [formatCurrency(Number(value)), t('revenue')];
                    }
                    return [value, t('orders')];
                  }}
                  labelFormatter={(label) => {
                    try {
                      if (period === 'daily') {
                        return format(new Date(label), 'MMMM dd, yyyy');
                      } else if (period === 'weekly') {
                        return t('week', { week: label });
                      } else {
                        return format(new Date(label + '-01'), 'MMMM yyyy');
                      }
                    } catch {
                      return label;
                    }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#CBB57B"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
