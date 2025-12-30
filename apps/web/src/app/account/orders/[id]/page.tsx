'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { DeliveryTrackingSection } from '@/components/orders/delivery-tracking-section';
import { ReviewForm } from '@/components/reviews/review-form';
import { useOrder, useCancelOrder } from '@/hooks/use-orders';
import { useCreateReview } from '@/hooks/use-reviews';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { reviewsApi } from '@/lib/api/reviews';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const { order, isLoading, error, refetch } = useOrder(id);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();
  const { createReview, isLoading: isSubmittingReview } = useCreateReview();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [reviewableProducts, setReviewableProducts] = useState<Record<string, boolean>>({});

  // Check which products can be reviewed (for delivered orders)
  useEffect(() => {
    const checkReviewable = async () => {
      const isDelivered = order?.status?.toLowerCase() === 'delivered';
      if (isDelivered && order?.items) {
        const reviewable: Record<string, boolean> = {};
        for (const item of order.items) {
          if (item.product?.id) {
            try {
              const response = await reviewsApi.canReviewProduct(item.product.id);
              reviewable[item.product.id] = response?.data?.canReview ?? false;
            } catch {
              reviewable[item.product.id] = false;
            }
          }
        }
        setReviewableProducts(reviewable);
      }
    };
    checkReviewable();
  }, [order?.status, order?.items]);

  const handleWriteReview = (productId: string, productName: string) => {
    setSelectedProduct({ id: productId, name: productName });
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (data: { productId: string; rating: number; title?: string; comment: string; images?: File[] }) => {
    try {
      await createReview(data);
      toast.success('Review Submitted', 'Thank you for your review!');
      setShowReviewForm(false);
      setSelectedProduct(null);
      // Update reviewable products
      setReviewableProducts(prev => ({
        ...prev,
        [data.productId]: false,
      }));
    } catch (error) {
      toast.error('Review Failed', 'Failed to submit review. Please try again.');
      throw error;
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(id);
      toast.success('Order Cancelled', 'Your order has been cancelled successfully');
      refetch();
      setShowCancelConfirm(false);
    } catch (error) {
      toast.error('Cancellation Failed', 'Failed to cancel order. Please contact support.');
    }
  };

  const canCancel = order && !['DELIVERED', 'CANCELLED', 'REFUNDED', 'SHIPPED'].includes(order.status);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !order) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist'}</p>
            <Link
              href="/account/orders"
              className="inline-block px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
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
            <Link href="/account/orders" className="hover:text-gold transition-colors">Orders</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">{order.orderNumber}</span>
          </motion.div>

          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold font-['Poppins'] text-white mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-lg text-white/80">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </motion.div>

            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Tracking (if available) */}
            {order.delivery && (
              <DeliveryTrackingSection delivery={order.delivery} />
            )}

            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-neutral-100 p-6"
            >
              <h2 className="text-2xl font-bold font-['Poppins'] mb-6">Order Timeline</h2>
              <OrderTimeline timeline={order.timeline || []} status={order.status} />
            </motion.div>

            {/* Products List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border-2 border-neutral-100 p-6"
            >
              <h2 className="text-2xl font-bold font-['Poppins'] mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0"
                  >
                    {item.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product?.slug || ''}`}
                        className="font-semibold text-lg hover:text-gold transition-colors block truncate"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-500">
                          Variant: {item.variant.size || ''} {item.variant.color || ''}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity} × ${formatCurrencyAmount(item.price, 2)}
                      </p>
                      {/* Write Review Button for Delivered Orders */}
                      {order.status?.toLowerCase() === 'delivered' && item.product?.id && (
                        reviewableProducts[item.product.id] ? (
                          <button
                            onClick={() => handleWriteReview(item.product!.id, item.name)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gold hover:text-gold/80 border border-gold/30 hover:border-gold rounded-lg transition-all hover:bg-gold/5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Write Review
                          </button>
                        ) : (
                          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Reviewed
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-bold">
                        ${formatCurrencyAmount(Number(item.price) * item.quantity, 2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Order Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-neutral-50 to-white rounded-xl border-2 border-neutral-100 p-6 sticky top-24"
            >
              <h3 className="text-xl font-bold font-['Poppins'] mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${formatCurrencyAmount(order.subtotal, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${formatCurrencyAmount(order.shipping, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${formatCurrencyAmount(order.tax, 2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-serif font-bold text-gold">
                  ${formatCurrencyAmount(order.total, 2)}
                </span>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="mb-6 pb-6 border-b border-neutral-200">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shipping Address
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                    {order.shippingAddress.addressLine1}<br />
                    {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                    {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}<br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Method
                </h4>
                <p className="text-sm text-gray-600 capitalize">
                  {order.paymentMethod?.replace('_', ' ') || 'Credit Card'}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {canCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancelling}
                    className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}

                <Link
                  href="/contact"
                  className="w-full block text-center px-6 py-3 border-2 border-neutral-200 rounded-xl hover:border-gold hover:bg-gold/5 transition-all font-semibold"
                >
                  Contact Support
                </Link>

                <Link
                  href="/account/orders"
                  className="w-full block text-center px-6 py-3 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors font-semibold"
                >
                  Back to Orders
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Cancel Order?</h3>
                <p className="text-gray-600">
                  Are you sure you want to cancel order {order.orderNumber}? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
      {selectedProduct && (
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onSubmit={handleSubmitReview}
        />
      )}
    </PageLayout>
  );
}
