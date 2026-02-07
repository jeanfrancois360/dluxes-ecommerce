'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api/client';
import PageHeader from '@/components/buyer/page-header';
import StatCard from '@/components/seller/stat-card';
import QuickActionCard from '@/components/seller/quick-action-card';
import {
  ShoppingBag,
  Package,
  DollarSign,
  Heart,
  User,
  MapPin,
  CreditCard,
  Star,
  Store,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

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

  const quickActions = [
    {
      title: 'Browse Products',
      description: 'Discover new luxury items',
      icon: ShoppingBag,
      href: '/products',
    },
    {
      title: 'My Orders',
      description: 'Track your orders and deliveries',
      icon: Package,
      href: '/account/orders',
    },
    {
      title: 'My Wishlist',
      description: 'View saved items',
      icon: Heart,
      href: '/wishlist',
    },
    {
      title: 'My Profile',
      description: 'Update your account information',
      icon: User,
      href: '/account/profile',
    },
    {
      title: 'Addresses',
      description: 'Manage shipping addresses',
      icon: MapPin,
      href: '/account/addresses',
    },
    {
      title: 'Payment Methods',
      description: 'Manage your payment options',
      icon: CreditCard,
      href: '/account/payment-methods',
    },
    {
      title: 'My Reviews',
      description: 'View and manage your reviews',
      icon: Star,
      href: '/account/reviews',
    },
    {
      title: 'Following Stores',
      description: 'See stores you follow',
      icon: Store,
      href: '/account/following',
    },
    {
      title: 'My Inquiries',
      description: 'View product inquiries',
      icon: MessageSquare,
      href: '/account/inquiries',
    },
  ];

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
      const totalSpent = orders.reduce(
        (sum: number, order: any) => sum + Number(order.total || 0),
        0
      );

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.firstName || 'there'}! Track your orders, manage your wishlist, and explore new products.`}
      />

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={Package}
              subtitle={`${stats.activeOrders} active`}
              isLoading={isLoading}
              index={0}
            />
            <StatCard
              title="Active Orders"
              value={stats.activeOrders}
              icon={ShoppingBag}
              subtitle="In progress"
              isLoading={isLoading}
              index={1}
            />
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent.toFixed(2)}`}
              icon={DollarSign}
              subtitle="All time"
              isLoading={isLoading}
              index={2}
            />
            <StatCard
              title="Wishlist Items"
              value={stats.wishlistCount}
              icon={Heart}
              subtitle="Saved for later"
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

        {/* Recent Orders */}
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Recent Orders</h2>
              <Link
                href="/account/orders"
                className="text-sm text-gold hover:text-gold/80 font-medium inline-flex items-center gap-2 transition-all hover:gap-3"
              >
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            <div className="p-6">
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 mb-2 font-medium">No orders yet</p>
                  <p className="text-sm text-neutral-500 mb-6">
                    Start shopping to see your orders here
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => router.push(`/account/orders/${order.id}`)}
                      className="border border-neutral-200 rounded-lg p-5 hover:border-gold hover:shadow-md transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-black text-lg">{order.orderNumber}</p>
                          <p className="text-sm text-neutral-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black text-lg mb-1">
                            ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                          <div className="flex items-center gap-2 overflow-x-auto flex-1">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex-shrink-0">
                                <div className="w-14 h-14 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-neutral-400" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.items.length > 3 && (
                            <span className="text-sm text-neutral-500 font-medium whitespace-nowrap">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Become a Seller CTA */}
        {user?.role !== 'SELLER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-gold via-gold to-gold/90 rounded-xl shadow-lg p-8 text-white border border-gold/20 relative overflow-hidden"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">Start Selling on NextPik</h3>
                  </div>
                  <p className="text-white/95 mb-6 text-lg">
                    Join our marketplace and reach millions of customers worldwide. Turn your
                    passion into profit.
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/become-seller"
                      className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-neutral-50 transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                      Become a Seller
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
