'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';
import { PageLayout } from '@/components/layout/page-layout';

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
      <PageLayout>
        <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-white mb-1">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-lg text-white/80">
                  Track your orders, manage your wishlist, and update your profile
                </p>
              </div>
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
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 border border-transparent hover:border-blue-100 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">Total Orders</p>
                <motion.p
                  key={stats.totalOrders}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-black font-['Poppins']"
                >
                  {stats.totalOrders}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Active Orders */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 border border-transparent hover:border-green-100 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">Active Orders</p>
                <motion.p
                  key={stats.activeOrders}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-black font-['Poppins']"
                >
                  {stats.activeOrders}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">Total Spent</p>
                <motion.p
                  key={stats.totalSpent}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-black font-['Poppins']"
                >
                  ${stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-gold/10 to-gold/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Wishlist */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border border-transparent hover:border-pink-100 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">Wishlist Items</p>
                <motion.p
                  key={stats.wishlistCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-black font-['Poppins']"
                >
                  {stats.wishlistCount}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black font-['Poppins']">Recent Orders</h2>
                <Link
                  href="/account/orders"
                  className="text-sm text-gold hover:text-gold/80 font-medium inline-flex items-center gap-2 transition-all hover:gap-3"
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
                      whileHover={{ x: 4, scale: 1.01 }}
                      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 300 }}
                      onClick={() => router.push(`/account/orders/${order.id}`)}
                      className="border-2 border-neutral-200 rounded-xl p-4 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all cursor-pointer bg-white"
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
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
              <h3 className="text-xl font-bold text-black mb-4 font-['Poppins']">Quick Actions</h3>
              <div className="space-y-2">
                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all group border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <span className="font-medium text-neutral-700 group-hover:text-black transition-colors">My Orders</span>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/wishlist"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-transparent transition-all group border border-transparent hover:border-pink-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-neutral-700 group-hover:text-black transition-colors">My Wishlist</span>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/account/profile"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all group border border-transparent hover:border-green-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="font-medium text-neutral-700 group-hover:text-black transition-colors">My Profile</span>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/account/addresses"
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all group border border-transparent hover:border-purple-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-neutral-700 group-hover:text-black transition-colors">Addresses</span>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Become a Seller CTA */}
            {user?.role !== 'SELLER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-gradient-to-br from-gold via-gold to-gold/90 rounded-2xl shadow-lg p-6 text-white border border-gold/20 relative overflow-hidden"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-xl font-bold font-['Poppins']">Start Selling</h3>
                  </div>
                  <p className="text-sm text-white/95 mb-4">
                    Join our marketplace and reach millions of customers worldwide
                  </p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/become-seller"
                      className="inline-block w-full bg-white text-black px-4 py-3 rounded-lg hover:bg-neutral-50 transition-all text-center font-semibold shadow-md hover:shadow-lg"
                    >
                      Become a Seller
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}
