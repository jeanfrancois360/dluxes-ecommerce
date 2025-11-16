'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Order {
  id: string;
  orderNumber: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  estimatedDeliveryDate: string;
  createdAt: string;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#CBB57B', '#D4AF37', '#FFD700'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#CBB57B', '#D4AF37', '#FFD700'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/orders/${orderId}`);
        setOrder(response.data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = () => {
    // Implement invoice download
    console.log('Downloading invoice for order:', orderId);
  };

  const handleTrackOrder = () => {
    router.push(`/account/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-gold mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-neutral-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-lg border-2 border-neutral-200 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-black mb-2">Order Not Found</h2>
              <p className="text-neutral-600 mb-6">{error || 'We could not find your order'}</p>
              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Continue Shopping
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-lg border-2 border-neutral-200 shadow-lg p-8 md:p-12 text-center mb-8"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
            >
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            {/* Success Message */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="text-4xl font-serif font-bold text-black mb-4">Order Confirmed!</h1>
              <p className="text-lg text-neutral-600 mb-2">Thank you for your purchase</p>
              <p className="text-sm text-neutral-500 mb-6">
                Order Number: <span className="font-mono font-semibold text-gold">{order.orderNumber}</span>
              </p>
              <p className="text-sm text-neutral-600">
                A confirmation email has been sent to your email address
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
            >
              <motion.button
                onClick={handleDownloadInvoice}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border-2 border-neutral-200 rounded-lg font-semibold hover:border-gold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Invoice
              </motion.button>
              <motion.button
                onClick={handleTrackOrder}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Track Order
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Shipping Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg border-2 border-neutral-200 p-6"
            >
              <h2 className="text-xl font-serif font-bold text-black mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Shipping Address
              </h2>
              <div className="text-sm text-neutral-700 space-y-1">
                <p className="font-semibold text-black">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2 text-neutral-600">{order.shippingAddress.phone}</p>
              </div>
              {order.estimatedDeliveryDate && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">Estimated Delivery</p>
                  <p className="font-semibold text-gold">{order.estimatedDeliveryDate}</p>
                </div>
              )}
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border-2 border-neutral-200 p-6"
            >
              <h2 className="text-xl font-serif font-bold text-black mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium text-black">${order.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium text-black">
                    {order.totals.shipping === 0 ? 'Free' : `$${order.totals.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax</span>
                  <span className="font-medium text-black">${order.totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-serif font-bold pt-3 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="text-gold">${order.totals.total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg border-2 border-neutral-200 p-6 mt-8"
          >
            <h2 className="text-xl font-serif font-bold text-black mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-black">{item.name}</h4>
                    <p className="text-sm text-neutral-600 mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif font-semibold text-gold">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-neutral-500 mt-1">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Continue Shopping */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-gold to-amber-600 text-white rounded-lg font-semibold hover:from-gold/90 hover:to-amber-600/90 transition-all shadow-lg shadow-gold/20"
              >
                Continue Shopping
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-gold mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-neutral-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
