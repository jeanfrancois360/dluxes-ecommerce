'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { toast, standardToasts } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { Price } from '@/components/price';
import { CartPageSkeleton } from '@/components/loading/skeleton';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const {
    items = [],
    totals,
    freeShippingEnabled = false,
    freeShippingThreshold = 200,
    taxCalculationMode = 'disabled',
    taxRate = 0,
    cartCurrency = 'USD',
    updateQuantity,
    removeItem,
    isLoading
  } = useCart() || {};
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Only show skeleton on initial load
    if (!isLoading) {
      setInitialLoading(false);
    }
  }, [isLoading]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(id, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeItem(id);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  // Show skeleton on initial load
  if (initialLoading && isLoading) {
    return (
      <PageLayout>
        <CartPageSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
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
            <span className="text-white font-medium">Cart</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-['Poppins'] text-white mb-1">
                Shopping Cart
              </h1>
              <p className="text-lg text-white/80 flex items-center gap-2">
                <span className="font-semibold text-gold">{items.length}</span>
                <span>item{items.length !== 1 ? 's' : ''} in your cart</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen py-12">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">

          {items.length === 0 ? (
            /* Empty Cart */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-12 text-center"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-100 rounded-full mb-6">
                <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-black mb-2">Your cart is empty</h2>
              <p className="text-neutral-600 mb-8">Add some luxury items to get started</p>
              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all"
                >
                  Continue Shopping
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            /* Cart with Items */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex gap-6">
                        {/* Product Image */}
                        <div className="relative w-32 h-32 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Link href={`/products/${item.slug || item.productId}`} className="text-lg font-semibold text-black hover:text-gold transition-colors">
                                {item.name}
                              </Link>
                              {item.brand && <p className="text-sm text-neutral-600">{item.brand}</p>}
                              {item.sku && <p className="text-xs text-neutral-500 mt-1">SKU: {item.sku}</p>}
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              aria-label="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-3 bg-neutral-100 rounded-lg p-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center font-semibold text-black">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-white rounded transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              {/* 🔒 Use locked price (priceAtAdd) if available, otherwise convert USD price */}
                              <Price
                                amount={Number(item.priceAtAdd !== undefined ? item.priceAtAdd : item.price) * item.quantity}
                                fromCurrency={item.currencyAtAdd || 'USD'}
                                className="text-2xl font-bold text-black block"
                              />
                              {item.quantity > 1 && (
                                <p className="text-sm text-neutral-500">
                                  <Price
                                    amount={Number(item.priceAtAdd !== undefined ? item.priceAtAdd : item.price)}
                                    fromCurrency={item.currencyAtAdd || 'USD'}
                                    className="inline"
                                  /> each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Continue Shopping */}
                <Link href="/products">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full mt-4 px-6 py-4 bg-neutral-100 text-black font-semibold rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Continue Shopping
                  </motion.button>
                </Link>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6 sticky top-24">
                  <h2 className="text-2xl font-serif font-bold text-black mb-6">Order Summary</h2>

                  {/* Summary Details */}
                  <div className="space-y-4 py-4 border-y border-neutral-200">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal ({totals.itemCount} items)</span>
                      {/* 🔒 Totals are already in cart currency - no conversion needed */}
                      <Price amount={totals.subtotal} fromCurrency={cartCurrency} className="font-semibold text-black" />
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Shipping</span>
                      <span className="text-sm text-neutral-500 italic">
                        Calculated at checkout
                      </span>
                    </div>
                    {taxCalculationMode !== 'disabled' && (
                      <div className="flex justify-between text-neutral-600">
                        <span>Tax</span>
                        <span className="text-sm text-neutral-500 italic">
                          Calculated at checkout
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-4">
                    <span className="text-lg font-semibold text-black">Subtotal</span>
                    <div className="text-right">
                      <Price amount={totals.subtotal} fromCurrency={cartCurrency} className="text-3xl font-bold text-black" />
                      <p className="text-xs text-neutral-500 mt-1">Taxes and shipping at checkout</p>
                    </div>
                  </div>

                  {/* Free Shipping Message */}
                  {freeShippingEnabled && totals.subtotal < freeShippingThreshold && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-blue-900">Free shipping available!</p>
                          <p className="text-blue-700 mt-1">
                            Add <Price amount={freeShippingThreshold - totals.subtotal} className="font-semibold inline" /> more to qualify for free shipping.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {freeShippingEnabled && totals.subtotal >= freeShippingThreshold && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="font-medium text-green-900">You qualify for free shipping! 🎉</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full px-6 py-4 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-gold/90 transition-all shadow-lg hover:shadow-xl mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </motion.button>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Secure Checkout
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Money-Back Guarantee
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Free Returns
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      24/7 Support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
