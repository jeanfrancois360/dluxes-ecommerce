'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from 'axios';
import Link from 'next/link';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface OrderDetails {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    product?: {
      id: string;
      categoryId?: string;
    };
  }>;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  heroImage?: string;
}

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const t = useTranslations('checkoutSuccess');
  const tc = useTranslations('common');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderId) {
      setError(t('noOrderId'));
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/orders/${orderId}`, {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : undefined,
        });

        // Backend returns { success: true, data: order }
        const orderData = response.data.data || response.data;
        setOrder(orderData);

        // Fetch related products
        try {
          const productsResponse = await axios.get(`${API_URL}/products`, {
            params: { limit: 4, sortBy: 'popularity' },
          });
          setRelatedProducts(productsResponse.data.data || productsResponse.data || []);
        } catch (prodErr) {
          console.error('Error fetching related products:', prodErr);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-gold mb-4 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-neutral-600">{t('loadingOrder')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-black mb-2">{t('orderNotFound')}</h2>
          <p className="text-neutral-600 mb-6">{error || t('couldNotFind')}</p>
          <Link href="/account/orders"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all">{t('viewAllOrders')}</motion.button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-4">{t('thankYou')}</h1>
          <p className="text-xl text-neutral-600 mb-2">{t('orderPlaced')}</p>
          <p className="text-neutral-500">{t('orderNumber')} <span className="font-mono font-semibold text-black">{order.orderNumber}</span></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-serif font-bold text-black mb-6">{t('orderDetails')}</h2>
          <div className="space-y-4 mb-6">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-neutral-100">
                <div>
                  <p className="font-semibold text-black">{item.name}</p>
                  <p className="text-sm text-neutral-600">{t('quantity', { quantity: item.quantity })}</p>
                </div>
                <p className="font-semibold text-black">\${formatCurrencyAmount(Number(item.price) * item.quantity, 2)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t-2 border-neutral-200">
            <span className="text-lg font-semibold text-black">{t('total')}</span>
            <span className="text-2xl font-bold text-black">\${formatCurrencyAmount(Number(order.total), 2)}</span>
          </div>
        </motion.div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-serif font-bold text-black mb-4">{t('shippingAddress')}</h2>
            <div className="text-neutral-600">
              {order.shippingAddress.firstName && order.shippingAddress.lastName && (
                <p className="font-semibold text-black">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              )}
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid md:grid-cols-3 gap-4 mb-12">
          <Link href="/account/orders"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full px-6 py-4 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">{t('viewAllOrders')}</motion.button></Link>
          <Link href="/products"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full px-6 py-4 border-2 border-neutral-200 text-black font-semibold rounded-lg hover:border-gold transition-all flex items-center justify-center gap-2">{t('continueShopping')}</motion.button></Link>
          <Link href="/"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full px-6 py-4 border-2 border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:border-neutral-300 transition-all flex items-center justify-center gap-2">{t('backToHome')}</motion.button></Link>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <h2 className="text-2xl font-serif font-bold text-black mb-6 text-center">{t('youMightAlsoLike')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-square bg-neutral-100 relative">
                      {product.heroImage ? (
                        <img src={product.heroImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-black truncate">{product.name}</h3>
                      <p className="text-gold font-semibold">${formatCurrencyAmount(Number(product.price), 2)}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SuccessPageContent />
    </Suspense>
  );
}
