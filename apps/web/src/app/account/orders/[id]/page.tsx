'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { DeliveryTrackingSection } from '@/components/orders/delivery-tracking-section';
import { ShipmentCard } from '@/components/seller/shipment-card';
import { ReviewForm } from '@/components/reviews/review-form';
import { useOrder, useCancelOrder } from '@/hooks/use-orders';
import { useCreateReview } from '@/hooks/use-reviews';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { reviewsApi } from '@/lib/api/reviews';
import { downloadsApi, type DigitalPurchase } from '@/lib/api/downloads';
import {
  returnsApi,
  type ReturnReason,
  RETURN_REASON_LABELS,
} from '@/lib/api/returns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, standardToasts } from '@/lib/utils/toast';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// Format file size helper
function formatFileSize(bytes: string | null): string {
  if (!bytes) return 'Unknown size';
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const { order, isLoading, error, refetch } = useOrder(id);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();
  const { createReview, isLoading: isSubmittingReview } = useCreateReview();
  const t = useTranslations('account.orderDetail');

  // Get currency symbol dynamically based on order's currency
  const currencySymbol = order?.currency ? (() => {
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: order.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0).replace(/\d/g, '').trim();
    } catch {
      return '$'; // Fallback to USD symbol
    }
  })() : '$';
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [reviewableProducts, setReviewableProducts] = useState<Record<string, boolean>>({});
  const [digitalDownloads, setDigitalDownloads] = useState<DigitalPurchase[]>([]);
  const [downloadingProductId, setDownloadingProductId] = useState<string | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [canRequestReturn, setCanRequestReturn] = useState(false);
  const [returnEligibilityReason, setReturnEligibilityReason] = useState<string | null>(null);
  const [daysRemainingForReturn, setDaysRemainingForReturn] = useState<number | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnFormData, setReturnFormData] = useState<{
    reason: ReturnReason;
    description: string;
    orderItemId?: string;
  }>({
    reason: 'CHANGED_MIND',
    description: '',
  });

  // Shipment tracking state
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  const handleReorder = async () => {
    if (!order) return;

    try {
      setIsReordering(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const response = await fetch(`${apiUrl}/orders/${order.id}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const { results } = data.data;
        if (results.added.length > 0) {
          toast.success(t('toast.reorderSuccess', { count: results.added.length }));
          // Redirect to cart
          router.push('/cart');
        } else if (results.skipped.length > 0) {
          toast.error(results.skipped[0]?.reason || 'Some items could not be added');
        }
      } else {
        toast.error(data.message || t('toast.reorderError'));
      }
    } catch (error) {
      toast.error(t('toast.reorderException'));
    } finally {
      setIsReordering(false);
    }
  };

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

  // Check if order is eligible for return
  useEffect(() => {
    const checkReturnEligibility = async () => {
      if (!order?.id) return;
      // Only check for delivered orders
      if (order.status?.toUpperCase() !== 'DELIVERED') {
        setCanRequestReturn(false);
        return;
      }
      try {
        const response = await returnsApi.canRequestReturn(order.id);
        if (response?.data) {
          setCanRequestReturn(response.data.canReturn);
          setReturnEligibilityReason(response.data.reason || null);
          setDaysRemainingForReturn(response.data.daysRemaining || null);
        }
      } catch (error) {
        console.error('Failed to check return eligibility:', error);
        setCanRequestReturn(false);
      }
    };
    checkReturnEligibility();
  }, [order?.id, order?.status]);

  // Fetch digital downloads for this order
  useEffect(() => {
    const fetchDigitalDownloads = async () => {
      if (!order?.id) return;
      // Only fetch for paid orders
      const validStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
      if (!validStatuses.includes(order.status?.toUpperCase() || '')) return;

      try {
        const response = await downloadsApi.getOrderDigitalProducts(order.id);
        if (response?.data) {
          setDigitalDownloads(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch digital downloads:', error);
      }
    };
    fetchDigitalDownloads();
  }, [order?.id, order?.status]);

  // Fetch shipments for this order
  useEffect(() => {
    const fetchShipments = async () => {
      if (!order?.id) return;

      try {
        setShipmentsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

        const response = await fetch(`${apiUrl}/shipments/order/${order.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setShipments(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch shipments:', error);
      } finally {
        setShipmentsLoading(false);
      }
    };

    fetchShipments();
  }, [order?.id]);

  const handleDigitalDownload = async (download: DigitalPurchase) => {
    if (!download.canDownload) {
      toast.error(t('toast.downloadLimit'));
      return;
    }

    try {
      setDownloadingProductId(download.productId);
      const response = await downloadsApi.getDownloadUrl(download.orderId, download.productId);

      if (response?.data?.url) {
        window.open(response.data.url, '_blank');
        toast.success(t('toast.downloading', { fileName: response.data.fileName }));
        // Refresh downloads to update count
        const refreshResponse = await downloadsApi.getOrderDigitalProducts(download.orderId);
        if (refreshResponse?.data) {
          setDigitalDownloads(refreshResponse.data);
        }
      } else {
        toast.error(t('toast.downloadLinkError'));
      }
    } catch (error) {
      toast.error(t('toast.downloadError'));
    } finally {
      setDownloadingProductId(null);
    }
  };

  const handleWriteReview = (productId: string, productName: string) => {
    setSelectedProduct({ id: productId, name: productName });
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (data: { productId: string; rating: number; title?: string; comment: string; images?: File[] }) => {
    try {
      await createReview(data);
      toast.success(t('toast.reviewSuccess'));
      setShowReviewForm(false);
      setSelectedProduct(null);
      // Update reviewable products
      setReviewableProducts(prev => ({
        ...prev,
        [data.productId]: false,
      }));
    } catch (error) {
      toast.error(t('toast.reviewError'));
      throw error;
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(id);
      standardToasts.order.cancelled();
      refetch();
      setShowCancelConfirm(false);
    } catch (error) {
      toast.error(t('toast.cancelError'));
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.id) return;

    try {
      setIsSubmittingReturn(true);
      const response = await returnsApi.createReturnRequest({
        orderId: order.id,
        reason: returnFormData.reason,
        description: returnFormData.description || undefined,
        orderItemId: returnFormData.orderItemId || undefined,
      });

      if (response?.data) {
        toast.success(t('toast.returnSuccess'));
        setShowReturnForm(false);
        setCanRequestReturn(false);
        // Redirect to returns page
        router.push('/account/returns');
      } else {
        toast.error(t('toast.returnError'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmittingReturn(false);
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
            <h2 className="text-2xl font-bold mb-2">{t('error.title')}</h2>
            <p className="text-gray-600 mb-6">{error || t('error.description')}</p>
            <Link
              href="/account/orders"
              className="inline-block px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              {t('error.backToOrders')}
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
            <Link href="/account/orders" className="hover:text-gold transition-colors">{t('breadcrumb.orders')}</Link>
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
                {t('placedOn', { date: new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })})}
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
            {/* Shipment Tracking (if available) */}
            {shipments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border-2 border-neutral-100"
              >
                <div className="p-6 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-['Poppins']">
                        {t('shipmentTracking.title')}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {t('shipmentTracking.shipmentCount', { count: shipments.length })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {shipments.map((shipment: any) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      currency={order.currency}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Legacy Delivery Tracking (if available and no shipments) */}
            {order.delivery && shipments.length === 0 && (
              <DeliveryTrackingSection delivery={order.delivery} />
            )}

            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-neutral-100 p-6"
            >
              <h2 className="text-2xl font-bold font-['Poppins'] mb-6">{t('timeline.title')}</h2>
              <OrderTimeline timeline={order.timeline || []} status={order.status} />
            </motion.div>

            {/* Products List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border-2 border-neutral-100 p-6"
            >
              <h2 className="text-2xl font-bold font-['Poppins'] mb-6">{t('items.title')}</h2>
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
                          {t('items.variant', { details: `${item.variant.attributes?.size || ''} ${item.variant.attributes?.color || ''}`.trim() })}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {t('items.quantity', { qty: item.quantity, price: `${currencySymbol}${formatCurrencyAmount(item.price, 2)}` })}
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
                            {t('items.writeReview')}
                          </button>
                        ) : (
                          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('items.reviewed')}
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-bold">
                        {currencySymbol}{formatCurrencyAmount(Number(item.price) * item.quantity, 2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Digital Downloads Section */}
            {digitalDownloads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-100 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-['Poppins']">{t('digitalDownloads.title')}</h2>
                    <p className="text-sm text-gray-600">{t('digitalDownloads.subtitle')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {digitalDownloads.map((download) => (
                    <div
                      key={download.productId}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-purple-100"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {download.productImage ? (
                          <img
                            src={download.productImage}
                            alt={download.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100">
                            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black truncate">{download.productName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                          {download.digitalFileFormat && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase font-medium">
                              {download.digitalFileFormat}
                            </span>
                          )}
                          {download.digitalFileSize && (
                            <span>{formatFileSize(download.digitalFileSize)}</span>
                          )}
                          {download.digitalDownloadLimit && (
                            <span className="text-gray-400">
                              {t('digitalDownloads.downloadsUsed', { used: download.downloadCount, limit: download.digitalDownloadLimit })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDigitalDownload(download)}
                        disabled={!download.canDownload || downloadingProductId === download.productId}
                        className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                          download.canDownload
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {downloadingProductId === download.productId ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="hidden sm:inline">{t('digitalDownloads.downloading')}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">{t('digitalDownloads.download')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <Link
                    href="/account/downloads"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                  >
                    {t('digitalDownloads.viewAll')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Order Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-neutral-50 to-white rounded-xl border-2 border-neutral-100 p-6 sticky top-24"
            >
              <h3 className="text-xl font-bold font-['Poppins'] mb-4">{t('summary.title')}</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('summary.subtotal')}</span>
                  <span className="font-medium">{currencySymbol}{formatCurrencyAmount(order.subtotal, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('summary.shipping')}</span>
                  <span className="font-medium">{currencySymbol}{formatCurrencyAmount(order.shipping, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('summary.tax')}</span>
                  <span className="font-medium">{currencySymbol}{formatCurrencyAmount(order.tax, 2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">{t('summary.total')}</span>
                <span className="text-2xl font-serif font-bold text-gold">
                  {currencySymbol}{formatCurrencyAmount(order.total, 2)}
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
                    {t('shippingAddress')}
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
                  {t('paymentMethod')}
                </h4>
                <p className="text-sm text-gray-600 capitalize">
                  {order.paymentMethod?.replace('_', ' ') || t('creditCardFallback')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Reorder Button */}
                <button
                  onClick={handleReorder}
                  disabled={isReordering}
                  className="w-full px-6 py-3 bg-gold text-black rounded-xl hover:bg-gold/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReordering ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('actions.addingToCart')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {t('actions.reorder')}
                    </>
                  )}
                </button>

                {/* Download Invoice */}
                <button
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
                    window.open(`${apiUrl}/orders/${order.id}/invoice`, '_blank');
                  }}
                  className="w-full px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('actions.downloadInvoice')}
                </button>

                {canCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancelling}
                    className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? t('actions.cancelling') : t('actions.cancelOrder')}
                  </button>
                )}

                {/* Request Return Button for Delivered Orders */}
                {order.status?.toUpperCase() === 'DELIVERED' && (
                  <div>
                    {canRequestReturn ? (
                      <button
                        onClick={() => setShowReturnForm(true)}
                        className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {t('actions.requestReturn')}
                      </button>
                    ) : returnEligibilityReason ? (
                      <div className="px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-600 text-center">
                        <p className="font-medium text-gray-900 mb-1">{t('actions.returnNotAvailable')}</p>
                        <p>{returnEligibilityReason}</p>
                      </div>
                    ) : daysRemainingForReturn !== null && daysRemainingForReturn > 0 ? (
                      <button
                        onClick={() => setShowReturnForm(true)}
                        className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {t('actions.requestReturnDays', { days: daysRemainingForReturn })}
                      </button>
                    ) : null}
                  </div>
                )}

                <Link
                  href="/contact"
                  className="w-full block text-center px-6 py-3 border-2 border-neutral-200 rounded-xl hover:border-gold hover:bg-gold/5 transition-all font-semibold"
                >
                  {t('actions.contactSupport')}
                </Link>

                <Link
                  href="/account/orders"
                  className="w-full block text-center px-6 py-3 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors font-semibold"
                >
                  {t('actions.backToOrders')}
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
                <h3 className="text-2xl font-bold mb-2">{t('cancelModal.title')}</h3>
                <p className="text-gray-600">
                  {t('cancelModal.description', { orderNumber: order.orderNumber })}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
                >
                  {t('cancelModal.keepOrder')}
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {isCancelling ? t('cancelModal.cancelling') : t('cancelModal.yesCancel')}
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

      {/* Return Request Modal */}
      <AnimatePresence>
        {showReturnForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReturnForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t('returnModal.title')}</h3>
                  <p className="text-gray-600">{t('returnModal.orderLabel', { orderNumber: order.orderNumber })}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-6">
                {/* Select Item (Optional) */}
                {order.items && order.items.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('returnModal.selectItem')}
                    </label>
                    <select
                      value={returnFormData.orderItemId || ''}
                      onChange={(e) =>
                        setReturnFormData((prev) => ({
                          ...prev,
                          orderItemId: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors"
                    >
                      <option value="">{t('returnModal.allItems')}</option>
                      {order.items.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name} (x{item.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returnModal.reasonLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnFormData.reason}
                    onChange={(e) =>
                      setReturnFormData((prev) => ({
                        ...prev,
                        reason: e.target.value as ReturnReason,
                      }))
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors"
                  >
                    {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('returnModal.detailsLabel')}
                  </label>
                  <textarea
                    value={returnFormData.description}
                    onChange={(e) =>
                      setReturnFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t('returnModal.detailsPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors resize-none"
                  />
                </div>

                {/* Return Policy Note */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('returnModal.policy.title')}
                  </h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• {t('returnModal.policy.rule1')}</li>
                    <li>• {t('returnModal.policy.rule2')}</li>
                    <li>• {t('returnModal.policy.rule3')}</li>
                    <li>• {t('returnModal.policy.rule4')}</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnForm(false)}
                    className="flex-1 px-6 py-3 border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
                  >
                    {t('returnModal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingReturn ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('returnModal.submitting')}
                      </>
                    ) : (
                      t('returnModal.submit')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
