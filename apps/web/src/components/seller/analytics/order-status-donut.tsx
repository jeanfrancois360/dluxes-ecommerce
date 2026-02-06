'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@nextpik/ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OrderStatusBreakdown {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

interface OrderStatusDonutProps {
  data: OrderStatusBreakdown;
  isLoading?: boolean;
}

const STATUS_COLORS = {
  pending: '#F59E0B',     // Orange
  processing: '#3B82F6',  // Blue
  shipped: '#8B5CF6',     // Purple
  delivered: '#10B981',   // Green
  cancelled: '#EF4444',   // Red
};

export function OrderStatusDonut({ data, isLoading }: OrderStatusDonutProps) {
  const t = useTranslations('components.orderStatusDonut');
  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-neutral-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const chartData = [
    { name: t('pending'), value: data?.pending || 0, color: STATUS_COLORS.pending },
    { name: t('processing'), value: data?.processing || 0, color: STATUS_COLORS.processing },
    { name: t('shipped'), value: data?.shipped || 0, color: STATUS_COLORS.shipped },
    { name: t('delivered'), value: data?.delivered || 0, color: STATUS_COLORS.delivered },
    { name: t('cancelled'), value: data?.cancelled || 0, color: STATUS_COLORS.cancelled },
  ].filter(item => item.value > 0); // Only show non-zero values

  const isEmpty = chartData.length === 0;
  const totalOrders = data?.total || 0;

  // Custom label renderer for center text
  const renderCenterLabel = () => {
    return (
      <g>
        <text
          x="50%"
          y="45%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-neutral-900 text-3xl font-bold"
        >
          {totalOrders}
        </text>
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-neutral-500 text-sm"
        >
          {t('totalOrders')}
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">{t('orderStatus')}</h3>
            <ShoppingCart className="h-5 w-5 text-neutral-400" />
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">{t('noOrders')}</p>
                <p className="text-neutral-400 text-xs mt-1">
                  {t('orderBreakdown')}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any, name: string) => {
                      const percentage = ((Number(value) / totalOrders) * 100).toFixed(1);
                      return [`${value} (${percentage}%)`, name];
                    }}
                  />
                  {renderCenterLabel()}
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-6 space-y-2">
                {chartData.map((item) => {
                  const percentage = ((item.value / totalOrders) * 100).toFixed(1);
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-neutral-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{item.value}</span>
                        <span className="text-xs text-neutral-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
