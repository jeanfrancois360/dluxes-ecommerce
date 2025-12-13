'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await api.get('/seller/dashboard');
      setDashboardData(response);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error && error.includes('Store not found')) {
    return (
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
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Failed to load dashboard</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { store, products, orders } = dashboardData;

  return (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-black mt-2">
                  ${Number(orders.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">
                Avg: ${Number(orders.averageOrderValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-black mt-2">{orders.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-warning-DEFAULT font-medium">{orders.pending} Pending</span>
              <span className="text-success-DEFAULT font-medium">{orders.delivered} Delivered</span>
            </div>
          </div>

          {/* Active Products */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Active Products</p>
                <p className="text-3xl font-bold text-black mt-2">{products.active}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">{products.total} Total Products</span>
            </div>
          </div>

          {/* Store Rating */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Store Rating</p>
                <p className="text-3xl font-bold text-black mt-2">
                  {store.rating ? formatNumber(Number(store.rating), 1) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-neutral-500">{store.verified ? '✓ Verified Store' : 'Not Verified'}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">Products Overview</h2>
                <Link
                  href="/seller/products"
                  className="text-sm text-gold hover:text-gold/80 font-medium inline-flex items-center gap-2"
                >
                  Manage Products
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{products.active}</p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Draft</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{products.draft}</p>
                </div>

                <div className="p-4 bg-error-light rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-error-DEFAULT/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-error-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Out of Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{products.outOfStock}</p>
                </div>

                <div className="p-4 bg-warning-light rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-warning-DEFAULT/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-warning-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">Low Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{products.lowStock}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Total Views</p>
                    <p className="text-xl font-bold text-black">{products.totalViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Total Likes</p>
                    <p className="text-xl font-bold text-black">{products.totalLikes.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

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
  );
}
