'use client';

/**
 * Admin Dashboard Page
 *
 * Main dashboard with stats, charts, and recent orders
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { PaymentDashboard } from '@/components/admin/payment-dashboard';
import {
  useDashboardStats,
  useRevenueData,
  useOrdersByStatus,
  useTopProducts,
  useCustomerGrowth,
  useRecentOrders,
} from '@/hooks/use-admin';
import { format } from 'date-fns';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
const GOLD = '#CBB57B';
const CHART_COLORS = ['#CBB57B', '#1a1a1a', '#6366f1', '#10b981', '#f59e0b'];

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  pending: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  processing: { dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
  shipped: { dot: 'bg-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Shipped' },
  delivered: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Delivered',
  },
  cancelled: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
};

// Stat Card
function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  delay = 0,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  delay?: number;
}) {
  const isPositive = trend === 'up' ? change >= 0 : change < 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-xl border border-neutral-100 p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Gold left accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[#CBB57B]" />
      <div className="flex items-center justify-between pl-3">
        <div className="w-10 h-10 rounded-xl bg-[#CBB57B]/10 flex items-center justify-center">
          {icon}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {isPositive ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="pl-3">
        <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
        <p className="text-sm text-neutral-500 mt-0.5">{title}</p>
      </div>
    </motion.div>
  );
}

// Chart card wrapper
function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-xl border border-neutral-100 p-6"
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// Chart skeleton
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-100 rounded w-1/3 mb-5" />
      <div className={`bg-neutral-100 rounded-lg`} style={{ height }} />
    </div>
  );
}

// Custom tooltip for line/area charts
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-neutral-400 text-xs mb-1">
        {label ? format(new Date(label), 'MMM d, yyyy') : ''}
      </p>
      <p className="font-semibold text-neutral-900">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

function GrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-neutral-400 text-xs mb-1">
        {label ? format(new Date(label), 'MMM d, yyyy') : ''}
      </p>
      <p className="font-semibold text-neutral-900">{payload[0].value} customers</p>
    </div>
  );
}

function ProductsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-neutral-900">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toLowerCase()] ?? {
    dot: 'bg-neutral-300',
    bg: 'bg-neutral-50',
    text: 'text-neutral-600',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// Customer avatar initials
function Avatar({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email?.[0] ?? '?').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#CBB57B]/15 text-[#8a7645] text-xs font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

function DashboardContent() {
  const t = useTranslations('adminDashboard');
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: revenueData, loading: revenueLoading } = useRevenueData(30);
  const { data: ordersByStatus, loading: ordersLoading } = useOrdersByStatus();
  const { products: topProducts, loading: productsLoading } = useTopProducts(5);
  const { data: customerGrowth, loading: growthLoading } = useCustomerGrowth(30);
  const { orders: recentOrders, loading: ordersTableLoading } = useRecentOrders(10);

  const totalOrders = ordersByStatus.reduce((s: number, d: any) => s + (d.count || 0), 0);

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statsLoading ? (
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-neutral-100 p-6 animate-pulse"
              >
                <div className="h-10 w-10 bg-neutral-100 rounded-xl mb-4" />
                <div className="h-7 bg-neutral-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-neutral-100 rounded w-2/3" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                delay={0}
                title={t('stats.totalRevenue')}
                value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                change={stats?.revenueChange || 0}
                trend="up"
                icon={
                  <svg
                    className="w-5 h-5 text-[#CBB57B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                delay={0.06}
                title={t('stats.totalOrders')}
                value={(stats?.totalOrders || 0).toLocaleString()}
                change={stats?.ordersChange || 0}
                trend="up"
                icon={
                  <svg
                    className="w-5 h-5 text-[#CBB57B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                }
              />
              <StatCard
                delay={0.12}
                title={t('stats.totalCustomers')}
                value={(stats?.totalCustomers || 0).toLocaleString()}
                change={stats?.customersChange || 0}
                trend="up"
                icon={
                  <svg
                    className="w-5 h-5 text-[#CBB57B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                delay={0.18}
                title={t('stats.totalProducts')}
                value={(stats?.totalProducts || 0).toLocaleString()}
                change={stats?.productsChange || 0}
                trend="up"
                icon={
                  <svg
                    className="w-5 h-5 text-[#CBB57B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* ── Payment System Health ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            {t('sections.paymentSystem') || 'Stripe Payment Gateway'}
          </p>
          <PaymentDashboard />
        </section>

        {/* ── Analytics Row 1: Revenue + Orders Donut ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            {t('sections.analytics') || 'Analytics & Insights'}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Revenue — 2/3 width */}
            <div className="lg:col-span-2">
              {revenueLoading ? (
                <div className="bg-white rounded-xl border border-neutral-100 p-6">
                  <ChartSkeleton />
                </div>
              ) : (
                <ChartCard title={t('charts.revenue')} subtitle="Last 30 days" delay={0.1}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(new Date(v), 'MMM d')}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        width={48}
                      />
                      <Tooltip
                        content={<RevenueTooltip />}
                        cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={GOLD}
                        strokeWidth={2.5}
                        fill="url(#revGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: GOLD, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Orders by Status donut — 1/3 width */}
            <div>
              {ordersLoading ? (
                <div className="bg-white rounded-xl border border-neutral-100 p-6">
                  <ChartSkeleton height={280} />
                </div>
              ) : (
                <ChartCard title={t('charts.orders')} subtitle="By status" delay={0.15}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={ordersByStatus as any}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {ordersByStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                        <Label
                          content={({ viewBox }: any) => {
                            const cx = viewBox?.cx;
                            const cy = viewBox?.cy;
                            if (cx == null || cy == null) return null;
                            return (
                              <text textAnchor="middle" dominantBaseline="middle">
                                <tspan
                                  x={cx}
                                  y={cy - 8}
                                  fontSize={22}
                                  fontWeight={700}
                                  fill="#171717"
                                >
                                  {totalOrders}
                                </tspan>
                                <tspan x={cx} y={cy + 12} fontSize={11} fill="#9ca3af">
                                  Total
                                </tspan>
                              </text>
                            );
                          }}
                          position="center"
                        />
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => `${v} orders`}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #f0f0f0',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="mt-3 space-y-1.5">
                    {(ordersByStatus as any[]).map((d: any, i: number) => (
                      <div key={d.status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-neutral-600 capitalize">{d.status}</span>
                        </div>
                        <span className="font-semibold text-neutral-800">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </div>
          </div>
        </section>

        {/* ── Analytics Row 2: Top Products + Customer Growth ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Products */}
          {productsLoading ? (
            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <ChartSkeleton />
            </div>
          ) : (
            <ChartCard title={t('charts.topProducts')} subtitle="By revenue" delay={0.2}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + '…' : v)}
                  />
                  <Tooltip content={<ProductsTooltip />} cursor={{ fill: '#f9f9f9' }} />
                  <Bar
                    dataKey="revenue"
                    fill="url(#barGradient)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Customer Growth */}
          {growthLoading ? (
            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <ChartSkeleton />
            </div>
          ) : (
            <ChartCard title={t('charts.customerGrowth')} subtitle="Last 30 days" delay={0.25}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={customerGrowth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v), 'MMM d')}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={<GrowthTooltip />}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#growthGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* ── Recent Orders ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white rounded-xl border border-neutral-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">{t('recentOrders.title')}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Latest 10 orders</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#CBB57B] hover:text-[#a89158] transition-colors flex items-center gap-1"
            >
              {t('recentOrders.viewAll')}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            {ordersTableLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-neutral-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-50">
                    {[
                      t('table.order'),
                      t('table.customer'),
                      t('table.total'),
                      t('table.status'),
                      t('table.date'),
                      t('table.actions'),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-1 rounded">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={order.customer?.name} email={order.customer?.email} />
                          <div>
                            <p className="font-medium text-neutral-800 text-xs leading-tight">
                              {order.customer?.name || t('recentOrders.guestCustomer')}
                            </p>
                            <p className="text-neutral-400 text-xs">
                              {order.customer?.email || t('recentOrders.noEmail')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-neutral-900">
                          ${formatCurrencyAmount(order.total, 2)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-3.5 text-xs text-neutral-400">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-3.5">
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-[#CBB57B] hover:text-[#a89158] transition-colors"
                        >
                          {t('recentOrders.view')} →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.section>

        {/* ── Quick Actions ── */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            {t('sections.quickActions') || 'Quick Actions'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                href: '/admin/products/new',
                title: t('quickActions.addProduct.title'),
                desc: t('quickActions.addProduct.description'),
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                ),
              },
              {
                href: '/admin/orders',
                title: t('quickActions.processOrders.title'),
                desc: t('quickActions.processOrders.description'),
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                ),
              },
              {
                href: '/admin/analytics',
                title: t('quickActions.viewAnalytics.title'),
                desc: t('quickActions.viewAnalytics.description'),
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
            ].map(({ href, title, desc, icon }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
              >
                <Link
                  href={href}
                  className="flex items-center gap-4 bg-white rounded-xl border border-neutral-100 p-5 hover:border-[#CBB57B]/40 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#CBB57B]/10 text-[#CBB57B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#CBB57B]/20 transition-colors">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800">{title}</p>
                    <p className="text-xs text-neutral-400 truncate">{desc}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-neutral-300 group-hover:text-[#CBB57B] group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DashboardContent />
      </AdminLayout>
    </AdminRoute>
  );
}
