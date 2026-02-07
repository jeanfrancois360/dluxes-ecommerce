'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  PlusCircle,
  Star,
  Settings,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import StatCard from '@/components/seller/stat-card';
import QuickActionCard from '@/components/seller/quick-action-card';
import PageHeader from '@/components/seller/page-header';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';

export default function SellerDashboardPage() {
  const { summary, isLoading } = useSellerDashboard();
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'inquiries'>('orders');

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Create and list a new product',
      icon: PlusCircle,
      href: '/seller/products/new',
    },
    {
      title: 'View Orders',
      description: 'Manage your orders and fulfillment',
      icon: ShoppingCart,
      href: '/seller/orders',
    },
    {
      title: 'Manage Reviews',
      description: 'Respond to customer reviews',
      icon: Star,
      href: '/seller/reviews',
    },
    {
      title: 'Check Earnings',
      description: 'View earnings and payouts',
      icon: DollarSign,
      href: '/seller/earnings',
    },
    {
      title: 'Store Settings',
      description: 'Update your store information',
      icon: Settings,
      href: '/seller/store/settings',
    },
    {
      title: 'Advertisements',
      description: 'Promote your products',
      icon: Megaphone,
      href: '/seller/advertisements',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your seller performance."
      />

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={summary?.products.total || 0}
              icon={Package}
              subtitle={`${summary?.products.active || 0} active`}
              isLoading={isLoading}
              index={0}
            />
            <StatCard
              title="Active Orders"
              value={summary?.orders.total || 0}
              icon={ShoppingCart}
              subtitle={`${summary?.orders.pending || 0} pending`}
              isLoading={isLoading}
              index={1}
            />
            <StatCard
              title="Total Revenue"
              value={
                summary?.orders.totalRevenue
                  ? `$${summary.orders.totalRevenue.toFixed(2)}`
                  : '$0.00'
              }
              icon={DollarSign}
              subtitle={
                summary?.payouts.totalEarnings
                  ? `$${summary.payouts.totalEarnings.toFixed(2)} earned`
                  : undefined
              }
              isLoading={isLoading}
              index={2}
            />
            <StatCard
              title="Total Sales"
              value={summary?.store.totalSales || 0}
              icon={Eye}
              subtitle="All time"
              isLoading={isLoading}
              index={3}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={action.title} {...action} index={index} />
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-black">Recent Activity</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200">
              <nav className="flex gap-8 px-6" aria-label="Tabs">
                {[
                  { id: 'orders', label: 'Recent Orders' },
                  { id: 'reviews', label: 'Recent Reviews' },
                  { id: 'inquiries', label: 'Recent Inquiries' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      relative py-4 text-sm font-medium border-b-2 transition-colors duration-200
                      ${
                        activeTab === tab.id
                          ? 'border-black text-black'
                          : 'border-transparent text-neutral-600 hover:text-black'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTab === 'orders' && (
                    <>
                      {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {summary.recentActivity.map((activity: any, index: number) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200 border border-transparent hover:border-[#CBB57B]/20"
                            >
                              <div>
                                <p className="font-medium text-black">{activity.title}</p>
                                <p className="text-sm text-neutral-600">{activity.description}</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`
                                    inline-block px-2 py-1 text-xs rounded-full
                                    ${
                                      activity.type === 'order'
                                        ? 'bg-blue-100 text-blue-800'
                                        : activity.type === 'review'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-purple-100 text-purple-800'
                                    }
                                  `}
                                >
                                  {activity.type}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-neutral-600 text-center py-8">No recent activity</p>
                      )}
                    </>
                  )}

                  {activeTab === 'reviews' && (
                    <p className="text-neutral-600 text-center py-8">No recent reviews</p>
                  )}

                  {activeTab === 'inquiries' && (
                    <p className="text-neutral-600 text-center py-8">No recent inquiries</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Onboarding Progress (if applicable) */}
        {summary && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#CBB57B]/10 to-[#B8A068]/10 rounded-lg border border-[#CBB57B]/20 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    Grow Your Business
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Complete your onboarding to unlock all features
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-[#CBB57B]" />
              </div>

              <a
                href="/seller/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all duration-200 border border-[#CBB57B]"
              >
                View Onboarding
              </a>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
