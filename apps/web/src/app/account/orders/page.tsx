'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import { OrderCard } from '@/components/orders/order-card';
import { useOrders } from '@/hooks/use-orders';
import Link from 'next/link';

export default function OrdersPage() {
  const t = useTranslations('account.orders');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { orders, total, totalPages, isLoading, error, refetch } = useOrders({
    page,
    limit: 9,
    status: selectedStatus || undefined,
    sortBy,
  });

  // Filter orders by search query (client-side for order number search)
  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/account" className="hover:text-gold transition-colors">Account</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">Orders</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-['Poppins'] text-white mb-1">{t('title')}</h1>
              <p className="text-lg text-white/80">{t('subtitle')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent bg-white"
            >
              <option value="">{t('allStatus')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="processing">{t('processing')}</option>
              <option value="shipped">{t('shipped')}</option>
              <option value="delivered">{t('delivered')}</option>
              <option value="cancelled">{t('cancelled')}</option>
              <option value="refunded">{t('refunded')}</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
              className="px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent bg-white"
            >
              <option value="recent">{t('mostRecent')}</option>
              <option value="oldest">{t('oldestFirst')}</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-bold text-lg mb-2">{t('failedToLoad')}</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-[#CBB57B] text-white rounded-xl hover:bg-[#A89968] transition-colors"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="font-serif text-2xl font-bold mb-2">{t('noOrdersYet')}</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? t('noOrdersMatch')
                : t('startShopping')}
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            >
              {t('browseProducts')}
            </Link>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-neutral-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('previous')}
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-semibold transition-colors ${
                        page === i + 1
                          ? 'bg-[#CBB57B] text-white'
                          : 'border border-neutral-200 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-neutral-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
