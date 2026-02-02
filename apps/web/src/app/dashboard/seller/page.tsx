'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCompleteDashboard } from '@/hooks/use-seller-dashboard';
import { useMySubscription } from '@/hooks/use-subscription';
import { StatsCard } from '@/components/seller/analytics/stats-card';
import { RevenueChart } from '@/components/seller/analytics/revenue-chart';
import { ActivityFeed } from '@/components/seller/analytics/activity-feed';
import { OrderStatusDonut } from '@/components/seller/analytics/order-status-donut';
import { PageLayout } from '@/components/layout/page-layout';
import { DollarSign, ShoppingCart, Package, Wallet, AlertTriangle, Crown, CreditCard } from 'lucide-react';
import { formatNumber, formatCurrencyAmount } from '@/lib/utils/number-format';
import { sellerAPI, LowStockProduct } from '@/lib/api/seller';
import useSWR from 'swr';
interface DashboardData {
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
    verified: boolean;
    rating: number | null;
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    createdAt: string;
  };
  products: {
    total: number;
    active: number;
    draft: number;
    outOfStock: number;
    lowStock: number;
    totalViews: number;
    totalLikes: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Use the new dashboard hooks
  const {
    dashboard: dashboardData,
    revenue,
    orderBreakdown,
    topProducts,
    recentActivity,
    isLoading,
    hasError,
    dashboardError,
    refetch,
  } = useCompleteDashboard();

  // Fetch subscription info
  const { subscription, plan, isActive: subscriptionActive, isLoading: subLoading } = useMySubscription();

  // Fetch low stock products
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useSWR<LowStockProduct[]>(
    user?.role === 'SELLER' ? 'seller-low-stock' : null,
    () => sellerAPI.getLowStockProducts(10, 5),
    { revalidateOnFocus: false }
  );

  // Get the actual error message
  const getErrorMessage = () => {
    if (!hasError) return '';

    // Check each endpoint for errors
    const errors: string[] = [];
    if (dashboardData === undefined && hasError) errors.push('Dashboard summary');
    if (revenue === undefined && hasError) errors.push('Revenue analytics');
    if (orderBreakdown === undefined && hasError) errors.push('Order breakdown');
    if (topProducts.length === 0 && hasError) errors.push('Top products');
    if (recentActivity.length === 0 && hasError) errors.push('Recent activity');

    return errors.length > 0
      ? `Failed to load: ${errors.join(', ')}`
      : 'Failed to load dashboard data';
  };

  const error = getErrorMessage();

  // Check if the error is specifically about missing store
  const isStoreNotFoundError = dashboardError?.message?.includes('Store not found');

  // Log errors for debugging
  if (hasError) {
    console.error('Dashboard errors:', {
      dashboard: dashboardData,
      revenue,
      orderBreakdown,
      topProducts,
      recentActivity,
    });
    console.error('Dashboard error message:', dashboardError?.message);
  }

  const getStoreStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success-light text-success-dark border-success-DEFAULT';
      case 'PENDING':
        return 'bg-warning-light text-warning-dark border-warning-DEFAULT';
      case 'SUSPENDED':
      case 'REJECTED':
        return 'bg-error-light text-error-dark border-error-DEFAULT';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  if (isStoreNotFoundError) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 bg-gold/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black mb-4">No Store Found</h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              You need to create a store before you can access the seller dashboard. Start selling today!
            </p>
            <Link
              href="/become-seller"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg hover:bg-neutral-800 transition-colors font-semibold"
            >
              Create Your Store
            </Link>
          </motion.div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!dashboardData) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Failed to Load Dashboard</h2>
          <p className="text-neutral-600 mb-2">{error || 'Unable to fetch dashboard data'}</p>
          <p className="text-sm text-neutral-500 mb-6">
            {user?.role !== 'SELLER'
              ? 'You may need to create a seller store first.'
              : 'Please check the browser console for more details.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={refetch}
              className="w-full px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Retry
            </button>
            {user?.role !== 'SELLER' && (
              <Link
                href="/become-seller"
                className="block w-full px-6 py-2 border-2 border-gold text-gold rounded-lg hover:bg-gold hover:text-black transition-colors"
              >
                Become a Seller
              </Link>
            )}
          </div>
        </div>
        </div>
      </PageLayout>
    );
  }

  const { store, products, orders, payouts } = dashboardData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
                <p className="text-neutral-300 text-lg">Manage your store and track performance</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getStoreStatusColor(
                  store.status
                )}`}
              >
                {store.status}
              </span>
            </div>

            {store.status === 'PENDING' && (
              <div className="bg-warning-DEFAULT/10 border border-warning-DEFAULT rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-warning-DEFAULT flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white mb-1">Awaiting Approval</p>
                    <p className="text-sm text-neutral-300">
                      Your store is pending admin approval. You'll be notified once it's approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Store Stats - Using New StatsCard Component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(orders.totalRevenue)}
            icon={DollarSign}
            subtitle={`Avg: ${formatCurrency(orders.averageOrderValue)}`}
            color="gold"
            isLoading={isLoading}
          />
          <StatsCard
            title="Pending Orders"
            value={orders.pending}
            icon={ShoppingCart}
            subtitle={`${orders.total} total orders`}
            color="blue"
            isLoading={isLoading}
          />
          <StatsCard
            title="Active Products"
            value={products.active}
            icon={Package}
            subtitle={`${products.total} total products`}
            color="green"
            isLoading={isLoading}
          />
          <StatsCard
            title="Payout Balance"
            value={formatCurrency(payouts?.availableBalance || 0)}
            icon={Wallet}
            subtitle={`Pending: ${formatCurrency(payouts?.pendingBalance || 0)}`}
            color="purple"
            isLoading={isLoading}
          />
        </div>

        {/* Subscription Status Widget */}
        {!subLoading && subscription && plan && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#CBB57B]/10 rounded-xl">
                  <Crown className="w-6 h-6 text-[#CBB57B]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your Subscription</h2>
                  <p className="text-sm text-gray-500">{plan.name} Plan</p>
                </div>
              </div>
              <Link
                href="/seller/subscription"
                className="px-4 py-2 text-sm font-medium text-[#CBB57B] hover:bg-[#CBB57B]/5 rounded-lg transition-colors"
              >
                Manage Plan →
              </Link>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Listings */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Listings</p>
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-2xl font-bold text-gray-900">{subscription.activeListingsCount || 0}</p>
                  <p className="text-sm text-gray-500">/ {plan.maxActiveListings === -1 ? '∞' : plan.maxActiveListings}</p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      plan.maxActiveListings !== -1 && (subscription.activeListingsCount || 0) >= plan.maxActiveListings
                        ? 'bg-red-500'
                        : (subscription.activeListingsCount || 0) >= plan.maxActiveListings * 0.8
                        ? 'bg-amber-500'
                        : 'bg-[#CBB57B]'
                    }`}
                    style={{
                      width: plan.maxActiveListings === -1
                        ? '0%'
                        : `${Math.min(100, ((subscription.activeListingsCount || 0) / plan.maxActiveListings) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Featured Slots */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured Slots</p>
                  <Crown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-2xl font-bold text-gray-900">{subscription.featuredSlotsUsed || 0}</p>
                  <p className="text-sm text-gray-500">/ {plan.featuredSlotsPerMonth}</p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: plan.featuredSlotsPerMonth > 0
                        ? `${Math.min(100, ((subscription.featuredSlotsUsed || 0) / plan.featuredSlotsPerMonth) * 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Credits */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</p>
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.creditsAllocated - subscription.creditsUsed}
                  </p>
                  <p className="text-sm text-gray-500">/ {subscription.creditsAllocated}</p>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((subscription.creditsAllocated - subscription.creditsUsed) / subscription.creditsAllocated) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Upgrade CTA if near limits */}
            {plan.maxActiveListings !== -1 && (subscription.activeListingsCount || 0) >= plan.maxActiveListings * 0.8 && (
              <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Running low on listings!
                    </p>
                    <p className="text-sm text-amber-800 mb-3">
                      You've used {subscription.activeListingsCount} of {plan.maxActiveListings} active listings. Upgrade to list more products.
                    </p>
                    <Link
                      href="/seller/plans"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Revenue Chart - 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart
              data={revenue?.data || []}
              period={revenuePeriod}
              total={revenue?.total || 0}
              trend={revenue?.trend || { value: 0, isPositive: true }}
              isLoading={isLoading}
              onPeriodChange={setRevenuePeriod}
            />
          </div>

          {/* Order Status Donut - 1 column */}
          <div>
            <OrderStatusDonut
              data={orderBreakdown || {
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                total: 0,
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Low Stock Alerts Section */}
        {(lowStockProducts.length > 0 || products.lowStock > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-10"
          >
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">Low Stock Alerts</h3>
                      <p className="text-sm text-neutral-500">
                        {products.lowStock} product{products.lowStock !== 1 ? 's' : ''} running low on inventory
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/seller/products?filter=low-stock"
                    className="text-sm text-gold hover:text-gold/80 font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>

              {lowStockLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-neutral-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : lowStockProducts.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {product.heroImage ? (
                          <img
                            src={product.heroImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/seller/products/${product.id}/edit`}
                            className="font-medium text-black hover:text-gold transition-colors truncate block"
                          >
                            {product.name}
                          </Link>
                          <p className="text-sm text-neutral-500">
                            {formatCurrencyAmount(product.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            product.inventory <= 3
                              ? 'bg-red-100 text-red-700'
                              : product.inventory <= 5
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {product.inventory} left
                          </span>
                        </div>
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                  <p>No products with low stock</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Activity Feed & Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Feed - 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed
              activities={recentActivity || []}
              isLoading={isLoading}
              limit={10}
            />
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/seller/products/new"
                  className="flex items-center justify-between p-4 rounded-xl bg-gold text-white hover:bg-gold/90 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="font-semibold">Add Product</span>
                  </div>
                </Link>

                <Link
                  href="/seller/products"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="font-medium">My Products</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/orders"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="font-medium">Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {orders.pending > 0 && (
                      <span className="px-2 py-1 bg-warning-DEFAULT text-white text-xs font-semibold rounded-full">
                        {orders.pending}
                      </span>
                    )}
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/seller/store/settings"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Store Settings</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/earnings"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Earnings & Payouts</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/payout-settings"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="font-medium">Payout Settings</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/selling-credits"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-medium">Selling Credits</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/vacation-mode"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Vacation Mode</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/inquiries"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="font-medium">Inquiries</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/seller/reviews"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className="font-medium">Reviews</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-gradient-to-br from-gold to-gold/80 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Store Link</h3>
              <p className="text-sm text-white/90 mb-4">Share your store with customers</p>
              <div className="bg-white/20 rounded-lg p-3 text-sm font-mono break-all">
                /stores/{store.slug}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/stores/${store.slug}`);
                  alert('Store link copied!');
                }}
                className="mt-4 w-full bg-white text-black px-4 py-3 rounded-lg hover:bg-neutral-100 transition-colors text-center font-semibold"
              >
                Copy Link
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}
