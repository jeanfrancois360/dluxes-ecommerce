'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
  wishlistCount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    image?: string;
    quantity: number;
  }>;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersResponse = await api.orders.getOrders({ limit: 5 });
      const orders = ordersResponse?.data || [];

      // Calculate stats
      const totalOrders = orders.length;
      const activeOrders = orders.filter(
        (order: any) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)
      ).length;
      const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

      // Fetch wishlist count
      const wishlistResponse = await api.get('/wishlist');
      const wishlistCount = wishlistResponse?.data?.length || 0;

      setStats({
        totalOrders,
        activeOrders,
        totalSpent,
        wishlistCount,
      });

      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-success-light text-success-dark border-success-DEFAULT';
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING':
        return 'bg-warning-light text-warning-dark border-warning-DEFAULT';
      case 'CANCELLED':
      case 'REFUNDED':
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-neutral-300 text-lg">
              Track your orders, manage your wishlist, and update your profile
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Active Orders</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-black mt-2">
                  ${stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Wishlist */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium">Wishlist Items</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.wishlistCount}</p>
              </div>
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">Recent Orders</h2>
                <Link
                  href="/account/orders"
                  className="text-sm text-gold hover:text-gold/80 font-medium inline-flex items-center gap-2"
                >
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500 mb-4">No orders yet</p>
                  <Link
                    href="/products"
                    className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => router.push(`/account/orders/${order.id}`)}
                      className="border border-neutral-200 rounded-xl p-4 hover:border-gold hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-black">{order.orderNumber}</p>
                          <p className="text-sm text-neutral-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">
                            ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto">
                        {order.items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex-shrink-0">
                            <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <span className="text-sm text-neutral-500">+{order.items.length - 3} more</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/account/orders"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="font-medium">My Orders</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/account/wishlist"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">My Wishlist</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/account/profile"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-medium">My Profile</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/account/addresses"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Addresses</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Become a Seller CTA */}
            {user?.role !== 'SELLER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
              <div className="bg-gradient-to-br from-gold to-gold/80 rounded-2xl shadow-sm p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Start Selling</h3>
                <p className="text-sm text-white/90 mb-4">
                  Join our marketplace and reach millions of customers
                </p>
                <Link
                  href="/become-seller"
                  className="inline-block w-full bg-white text-black px-4 py-3 rounded-lg hover:bg-neutral-100 transition-colors text-center font-semibold"
                >
                  Become a Seller
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
