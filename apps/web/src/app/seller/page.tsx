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
import { useTranslations } from 'next-intl';
import StatCard from '@/components/seller/stat-card';
import QuickActionCard from '@/components/seller/quick-action-card';
import PageHeader from '@/components/seller/page-header';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';

export default function SellerDashboardPage() {
  const { summary, isLoading } = useSellerDashboard();
  const t = useTranslations('sellerDashboard');
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'inquiries'>('orders');

  const quickActions = [
    {
      title: t('quickActions.addProduct.title'),
      description: t('quickActions.addProduct.description'),
      icon: PlusCircle,
      href: '/seller/products/new',
    },
    {
      title: t('quickActions.viewOrders.title'),
      description: t('quickActions.viewOrders.description'),
      icon: ShoppingCart,
      href: '/seller/orders',
    },
    {
      title: t('quickActions.manageReviews.title'),
      description: t('quickActions.manageReviews.description'),
      icon: Star,
      href: '/seller/reviews',
    },
    {
      title: t('quickActions.checkEarnings.title'),
      description: t('quickActions.checkEarnings.description'),
      icon: DollarSign,
      href: '/seller/earnings',
    },
    {
      title: t('quickActions.storeSettings.title'),
      description: t('quickActions.storeSettings.description'),
      icon: Settings,
      href: '/seller/store/settings',
    },
    {
      title: t('quickActions.advertisements.title'),
      description: t('quickActions.advertisements.description'),
      icon: Megaphone,
      href: '/seller/advertisements',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader title={t('pageTitle')} description={t('pageSubtitle')} />

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            {t('sections.keyMetrics')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('stats.totalProducts')}
              value={summary?.products.total || 0}
              icon={Package}
              subtitle={t('stats.activeProducts', { count: summary?.products.active || 0 })}
              isLoading={isLoading}
              index={0}
            />
            <StatCard
              title={t('stats.activeOrders')}
              value={summary?.orders.total || 0}
              icon={ShoppingCart}
              subtitle={t('stats.pendingOrders', { count: summary?.orders.pending || 0 })}
              isLoading={isLoading}
              index={1}
            />
            <StatCard
              title={t('stats.totalRevenue')}
              value={
                summary?.orders.totalRevenue
                  ? `$${summary.orders.totalRevenue.toFixed(2)}`
                  : '$0.00'
              }
              icon={DollarSign}
              subtitle={
                summary?.payouts.totalEarnings
                  ? t('stats.earned', { amount: summary.payouts.totalEarnings.toFixed(2) })
                  : undefined
              }
              isLoading={isLoading}
              index={2}
            />
            <StatCard
              title={t('stats.totalSales')}
              value={summary?.store.totalSales || 0}
              icon={Eye}
              subtitle={t('stats.allTime')}
              isLoading={isLoading}
              index={3}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-black mb-4">{t('sections.quickActions')}</h2>
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
              <h2 className="text-lg font-semibold text-black">{t('sections.recentActivity')}</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200">
              <nav className="flex gap-8 px-6" aria-label="Tabs">
                {[
                  { id: 'orders', label: t('tabs.recentOrders') },
                  { id: 'reviews', label: t('tabs.recentReviews') },
                  { id: 'inquiries', label: t('tabs.recentInquiries') },
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
                                  {t(`activityTypes.${activity.type}`)}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-neutral-600 text-center py-8">
                          {t('empty.noRecentActivity')}
                        </p>
                      )}
                    </>
                  )}

                  {activeTab === 'reviews' && (
                    <p className="text-neutral-600 text-center py-8">
                      {t('empty.noRecentReviews')}
                    </p>
                  )}

                  {activeTab === 'inquiries' && (
                    <p className="text-neutral-600 text-center py-8">
                      {t('empty.noRecentInquiries')}
                    </p>
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
                    {t('onboarding.title')}
                  </h3>
                  <p className="text-sm text-neutral-600">{t('onboarding.description')}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-[#CBB57B]" />
              </div>

              <a
                href="/seller/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-[#CBB57B] rounded-lg hover:bg-neutral-900 hover:text-[#D4C794] transition-all duration-200 border border-[#CBB57B]"
              >
                {t('onboarding.button')}
              </a>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
