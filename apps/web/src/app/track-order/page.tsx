'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { OrderProgressTracker } from '@/components/orders/order-progress-tracker';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { useTrackOrder } from '@/hooks/use-orders';
import type { Order } from '@/lib/api/types';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ orderNumber?: string; email?: string }>({});
  const [hasSearched, setHasSearched] = useState(false);

  const { trackOrder, trackingData, isLoading, error } = useTrackOrder();

  const validateForm = () => {
    const newErrors: { orderNumber?: string; email?: string } = {};

    if (!orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setHasSearched(true);
    try {
      await trackOrder(orderNumber.trim(), email.trim());
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    setOrderNumber('');
    setEmail('');
    setErrors({});
    setHasSearched(false);
  };

  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('auth_token');

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-5xl font-bold mb-4">Track Your Order</h1>
            <p className="text-gray-600 text-lg">
              Enter your order number and email to track your shipment
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 mb-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Number Field */}
              <div className="relative">
                <label
                  htmlFor="orderNumber"
                  className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    orderNumber
                      ? 'text-xs top-2 text-[#CBB57B]'
                      : 'text-base top-1/2 -translate-y-1/2 text-gray-400'
                  }`}
                >
                  Order Number
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    if (errors.orderNumber) {
                      setErrors({ ...errors, orderNumber: undefined });
                    }
                  }}
                  className={`w-full px-4 ${
                    orderNumber ? 'pt-6 pb-2' : 'py-4'
                  } border-2 rounded-xl focus:outline-none focus:border-[#CBB57B] transition-all ${
                    errors.orderNumber ? 'border-red-500' : 'border-neutral-200'
                  }`}
                  placeholder={orderNumber ? '' : ' '}
                />
                {errors.orderNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.orderNumber}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    email
                      ? 'text-xs top-2 text-[#CBB57B]'
                      : 'text-base top-1/2 -translate-y-1/2 text-gray-400'
                  }`}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  className={`w-full px-4 ${
                    email ? 'pt-6 pb-2' : 'py-4'
                  } border-2 rounded-xl focus:outline-none focus:border-[#CBB57B] transition-all ${
                    errors.email ? 'border-red-500' : 'border-neutral-200'
                  }`}
                  placeholder={email ? '' : ' '}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-[#CBB57B] text-white font-semibold rounded-xl hover:bg-[#A89968] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Tracking Order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Track Order
                  </>
                )}
              </motion.button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Where to find your order number?</p>
                  <p>
                    Your order number can be found in the confirmation email we sent you after your
                    purchase. It looks like: #ORD-123456
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <svg
                    className="animate-spin w-16 h-16 text-[#CBB57B]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium">Tracking your order...</p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {!isLoading && hasSearched && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center"
              >
                <svg
                  className="w-24 h-24 text-red-300 mx-auto mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="font-serif text-2xl font-bold mb-2">Order Not Found</h3>
                <p className="text-gray-600 mb-6">
                  {error === 'Order not found'
                    ? "We couldn't find an order with that number. Please check and try again."
                    : error === 'Invalid credentials'
                    ? "The email address doesn't match our records."
                    : 'Unable to connect. Please check your internet connection.'}
                </p>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-[#CBB57B] text-white rounded-xl hover:bg-[#A89968] transition-colors font-semibold"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Success State */}
            {!isLoading && trackingData && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Order Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-serif text-3xl font-bold mb-2">
                        Order {trackingData.orderNumber}
                      </h2>
                      <p className="text-gray-600">
                        Placed on{' '}
                        {new Date(trackingData.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold self-start md:self-center ${
                        trackingData.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : trackingData.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : trackingData.status === 'cancelled' || trackingData.status === 'refunded'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {trackingData.status.charAt(0).toUpperCase() + trackingData.status.slice(1)}
                    </span>
                  </div>

                  {/* Estimated Delivery */}
                  {trackingData.estimatedDelivery && trackingData.status !== 'delivered' && (
                    <div className="bg-gradient-to-r from-[#CBB57B]/10 to-[#CBB57B]/5 border border-[#CBB57B]/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-[#CBB57B]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Estimated Delivery</p>
                          <p className="font-bold text-black">
                            {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Tracker */}
                <OrderProgressTracker
                  currentStatus={trackingData.status}
                  timeline={trackingData.timeline?.map((t: any) => ({
                    status: t.status,
                    timestamp: t.createdAt,
                  }))}
                />

                {/* Tracking Number */}
                {trackingData.trackingNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Tracking Number</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Track your package directly with the shipping carrier
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <code className="px-4 py-3 bg-gray-50 border border-neutral-200 rounded-lg font-mono text-sm flex-1">
                            {trackingData.trackingNumber}
                          </code>
                          <a
                            href={`https://www.ups.com/track?tracknum=${trackingData.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-[#CBB57B] text-white rounded-lg hover:bg-[#A89968] transition-colors text-sm font-semibold text-center whitespace-nowrap"
                          >
                            Track with Carrier
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Order Timeline */}
                {trackingData.timeline && trackingData.timeline.length > 0 && (
                  <OrderTimeline timeline={trackingData.timeline} status={trackingData.status} />
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Track Another Order
                  </button>
                  {isLoggedIn && (
                    <Link
                      href={`/account/orders/${trackingData.id}`}
                      className="flex-1 px-8 py-4 bg-[#CBB57B] text-white rounded-xl hover:bg-[#A89968] transition-colors font-semibold text-center"
                    >
                      View Full Order Details
                    </Link>
                  )}
                  {!isLoggedIn && (
                    <Link
                      href="/login"
                      className="flex-1 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold text-center"
                    >
                      Sign In for More Details
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {/* Empty State (Before Search) */}
            {!isLoading && !hasSearched && !trackingData && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-[#CBB57B]/20 to-[#CBB57B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-[#CBB57B]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl font-bold mb-2">Ready to Track Your Order?</h3>
                <p className="text-gray-600">
                  Enter your order details above to see real-time tracking information
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-600 mb-4">Need help with your order?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@luxury.com"
                className="inline-flex items-center gap-2 text-[#CBB57B] hover:text-[#A89968] font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Support
              </a>
              <a
                href="tel:+1-555-123-4567"
                className="inline-flex items-center gap-2 text-[#CBB57B] hover:text-[#A89968] font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
