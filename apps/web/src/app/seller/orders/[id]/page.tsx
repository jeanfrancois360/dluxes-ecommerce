'use client';

/**
 * Seller Order Details Page — World-Class Production UI
 */

import React, { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { sellerAPI, SellerOrderDetail } from '@/lib/api/seller';
import { toast } from 'sonner';
import useSWR from 'swr';
import { PackingSlip } from '@/components/seller/packing-slip';
import { MarkAsShippedModal } from '@/components/seller/mark-as-shipped-modal';
import { ShipmentCard } from '@/components/seller/shipment-card';
import { EasyPostLabelButton } from '@/components/seller/easypost-label-button';
import { ConfirmPickupModal } from '@/components/seller/confirm-pickup-modal';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  X,
  Copy,
  ExternalLink,
  Tag,
  BadgeCheck,
  Banknote,
  ShoppingBag,
  Info,
  RefreshCw,
} from 'lucide-react';

// ─── Shipping provider display map ────────────────────────────────────────────

const SHIPPING_PROVIDER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  EASYPOST: {
    label: 'EasyPost',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  EASYSHIP: {
    label: 'EasyShip',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
  },
  SENDCLOUD: {
    label: 'SendCloud',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  DHL: { label: 'DHL', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  GELATO: {
    label: 'Gelato POD',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  SELF_PICKUP: {
    label: 'Self-Pickup',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  MANUAL: { label: 'Manual', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
  ZONE: {
    label: 'Zone Rates',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
};

// ─── Status config ────────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string; ring: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-400',
    ring: 'ring-amber-200',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dot: 'bg-blue-400',
    ring: 'ring-blue-200',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    dot: 'bg-violet-400',
    ring: 'ring-violet-200',
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    dot: 'bg-indigo-400',
    ring: 'ring-indigo-200',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    dot: 'bg-red-400',
    ring: 'ring-red-200',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    dot: 'bg-gray-400',
    ring: 'ring-gray-200',
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  FAILED: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-400' },
  REFUNDED: { label: 'Refunded', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
};

// Order lifecycle steps (for timeline)
const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status, type }: { status: string; type: 'order' | 'payment' }) {
  const cfg =
    type === 'order'
      ? (ORDER_STATUS_CONFIG[status] ?? {
          label: status,
          color: 'text-gray-700',
          bg: 'bg-gray-100',
          dot: 'bg-gray-400',
          ring: '',
        })
      : (PAYMENT_STATUS_CONFIG[status] ?? {
          label: status,
          color: 'text-gray-700',
          bg: 'bg-gray-100',
          dot: 'bg-gray-400',
        });
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function OrderStatusTimeline({ status }: { status: string }) {
  const cancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const currentIdx = ORDER_STEPS.indexOf(status);

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-red-50 border border-red-100 rounded-xl">
        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">
          This order has been {status.toLowerCase()}.
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between px-1">
      {/* Background track */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 z-0" />
      {/* Filled track */}
      <div
        className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-[#CBB57B] to-amber-400 z-0 transition-all duration-700"
        style={{
          width: currentIdx <= 0 ? '0%' : `${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%`,
        }}
      />

      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const cfg = ORDER_STATUS_CONFIG[step];
        return (
          <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done
                  ? 'bg-[#CBB57B] border-[#CBB57B] shadow-md'
                  : active
                    ? 'bg-white border-[#CBB57B] shadow-lg ring-4 ring-[#CBB57B]/20'
                    : 'bg-white border-gray-200'
              }`}
            >
              {done ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : active ? (
                <div className="w-2.5 h-2.5 rounded-full bg-[#CBB57B]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold leading-tight text-center ${
                done || active ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('sellerOrderDetails');
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [showMarkAsShippedModal, setShowMarkAsShippedModal] = useState(false);
  const [showConfirmPickupModal, setShowConfirmPickupModal] = useState(false);
  const packingSlipRef = useRef<HTMLDivElement>(null);

  const {
    data: order,
    error,
    isLoading,
    mutate,
  } = useSWR<SellerOrderDetail>(
    user && user.role === 'SELLER' ? ['seller-order', resolvedParams.id] : null,
    () => sellerAPI.getOrder(resolvedParams.id),
    { revalidateOnFocus: false }
  );

  const { data: storeData } = useSWR(user && user.role === 'SELLER' ? 'seller-store' : null, () =>
    sellerAPI.getStore()
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const { data: shipments, mutate: mutateShipments } = useSWR(
    user && user.role === 'SELLER' && order ? ['order-shipments', order.id] : null,
    async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/shipments/order/${order!.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      return data.data || [];
    },
    { revalidateOnFocus: false }
  );

  React.useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') router.push('/dashboard/buyer');
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (order?.delivery?.trackingNumber) setTrackingNumber(order.delivery.trackingNumber);
  }, [order]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      await sellerAPI.updateOrderStatus(order.id, { status: newStatus });
      await mutate();
      toast.success(t('updateSuccess'));
    } catch (err: any) {
      toast.error(err?.message || t('updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!order) return;
    try {
      setUpdating(true);
      await sellerAPI.markAsShipped(order.id, {
        trackingNumber: trackingNumber.trim() || undefined,
        shippingCarrier: shippingCarrier.trim() || undefined,
      });
      await mutate();
      toast.success('Order marked as shipped');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark order as shipped');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintPackingSlip = () => {
    setShowPackingSlip(true);
    setTimeout(() => window.print(), 100);
  };

  const handleMarkReadyForPickup = async () => {
    if (!order) return;
    try {
      setUpdating(true);
      await sellerAPI.markReadyForPickup(order.id);
      await mutate();
      toast.success('Order marked as ready for pickup');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark order as ready for pickup');
    } finally {
      setUpdating(false);
    }
  };

  // ── Loading ──
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading order details…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Failed to load order</h3>
          <p className="text-sm text-gray-500 mb-6">{t('errorLoading')}</p>
          <div className="flex gap-3">
            <button
              onClick={() => mutate()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link
              href="/seller/orders"
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">{t('orderNotFound')}</h3>
          <Link
            href="/seller/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const canUpdateStatus = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const canShip =
    order.status === 'PROCESSING' &&
    (order.paymentStatus === 'PAID' || order.paymentStatus === 'PENDING');

  const sellerTotals = (order as any).sellerTotals || {
    subtotal: order.items.reduce((sum, item) => sum + Number(item.total), 0),
    shipping: 0,
    tax: 0,
    discount: 0,
    total: order.items.reduce((sum, item) => sum + Number(item.total), 0),
  };

  const netEarnings =
    sellerTotals.netEarnings !== undefined ? sellerTotals.netEarnings : sellerTotals.total;

  const customerName =
    `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer';
  const initials = customerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Orders
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPackingSlip}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Packing Slip</span>
              </button>
              <button
                onClick={() => mutate()}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Order identity */}
          <div className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {t('orderTitle', { orderNumber: order.orderNumber })}
                  </h1>
                  <button
                    onClick={() => copyToClipboard(order.orderNumber, 'Order number')}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="Copy order number"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={order.status} type="order" />
                <StatusPill status={order.paymentStatus} type="payment" />
              </div>
            </div>

            {/* Order timeline */}
            <div className="mt-5 pt-5 border-t border-gray-50">
              <OrderStatusTimeline status={order.status} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Order Items */}
            <SectionCard>
              <CardHeader
                icon={ShoppingBag}
                title={`Order Items (${order.items.length})`}
                subtitle="Products included in this order"
              />
              <div className="divide-y divide-gray-50">
                {order.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Product image */}
                    <div className="relative flex-shrink-0">
                      {item.product.heroImage ? (
                        <img
                          src={item.product.heroImage}
                          alt={item.product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                          <Package className="w-7 h-7 text-gray-300" />
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#CBB57B] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty {item.quantity} &times; {formatCurrency(item.price, order.currency)}
                      </p>
                      {(item.product as any).sku && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                          SKU: {(item.product as any).sku}
                        </p>
                      )}
                    </div>

                    {/* Line total */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.total, order.currency)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Totals footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
                <InfoRow
                  label="Items Subtotal"
                  value={formatCurrency(sellerTotals.subtotal, order.currency)}
                />
                {sellerTotals.shipping > 0 && (
                  <InfoRow
                    label="Shipping (Your Portion)"
                    value={formatCurrency(sellerTotals.shipping, order.currency)}
                  />
                )}
                {sellerTotals.tax > 0 && (
                  <InfoRow
                    label="Tax (Your Portion)"
                    value={formatCurrency(sellerTotals.tax, order.currency)}
                  />
                )}
                {sellerTotals.discount > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-emerald-600 font-medium">Discount Applied</span>
                    <span className="text-xs font-semibold text-emerald-600">
                      -{formatCurrency(sellerTotals.discount, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-900">Your Order Total</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(sellerTotals.total, order.currency)}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Shipments */}
            {shipments && shipments.length > 0 && (
              <SectionCard>
                <CardHeader
                  icon={Truck}
                  title={`Shipments (${shipments.length})`}
                  subtitle="Active shipments for this order"
                />
                <div className="p-5 space-y-4">
                  {shipments.map((shipment: any) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      currency={order.currency}
                      onUpdate={() => {
                        mutateShipments();
                        mutate();
                      }}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Checkout Shipping Method */}
            {order.shippingProvider &&
              !['SELF_PICKUP', 'GELATO'].includes(order.shippingProvider) &&
              (() => {
                const cfg = SHIPPING_PROVIDER_CONFIG[order.shippingProvider!] ?? {
                  label: order.shippingProvider,
                  color: 'text-gray-600',
                  bg: 'bg-gray-100',
                  border: 'border-gray-200',
                };
                const pd = order.shippingProviderData;
                return (
                  <SectionCard>
                    <CardHeader
                      icon={Truck}
                      title="Checkout Shipping Method"
                      subtitle="Rate the customer selected at checkout"
                      action={
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      }
                    />
                    <div className="px-5 py-4 space-y-1">
                      {pd?.name && <InfoRow label="Service" value={pd.name} />}
                      {pd?.carrier && <InfoRow label="Carrier" value={pd.carrier} />}
                      {pd?.estimatedDays !== undefined && (
                        <InfoRow
                          label="Est. Transit"
                          value={
                            typeof pd.estimatedDays === 'number'
                              ? `${pd.estimatedDays} days`
                              : String(pd.estimatedDays)
                          }
                        />
                      )}
                      {pd?.price !== undefined && pd.price > 0 && (
                        <InfoRow
                          label="Shipping Paid by Customer"
                          value={formatCurrency(pd.price, order.currency)}
                        />
                      )}
                      {!pd && (
                        <p className="text-xs text-gray-400 py-2">
                          No rate details recorded — order placed before provider tracking was
                          added.
                        </p>
                      )}
                    </div>
                  </SectionCard>
                );
              })()}

            {/* Gelato POD Fulfillment Info */}
            {order.shippingProvider === 'GELATO' && (
              <SectionCard>
                <div className="h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
                <CardHeader
                  icon={Package}
                  title="Gelato Print-on-Demand Fulfillment"
                  subtitle="Managed automatically by Gelato"
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <BadgeCheck className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-orange-800">
                        Gelato handles production &amp; shipping
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        This order was submitted to Gelato at checkout. Monitor production status in
                        your Gelato seller dashboard.
                      </p>
                    </div>
                  </div>
                  {order.shippingProviderData?.rateId && (
                    <InfoRow
                      label="Gelato Order Ref"
                      value={
                        <span className="font-mono text-[11px]">
                          {order.shippingProviderData.rateId}
                        </span>
                      }
                    />
                  )}
                </div>
              </SectionCard>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && !order.isPickup && (
              <SectionCard>
                <CardHeader
                  icon={MapPin}
                  title="Delivery Address"
                  subtitle="Where the order will be shipped"
                />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.street}</p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.city}
                        {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                        {order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ''}
                      </p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <div className="flex items-center gap-2 pt-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <a
                            href={`tel:${order.shippingAddress.phone}`}
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            {order.shippingAddress.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Pickup Info */}
            {order.isPickup && (
              <SectionCard>
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader
                  icon={MapPin}
                  title="Self-Pickup Order"
                  subtitle="Customer will collect from your store"
                />
                <div className="p-5 space-y-4">
                  {/* Pickup code */}
                  <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 text-center overflow-hidden">
                    <div className="absolute inset-0 opacity-5">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, #059669 0, #059669 1px, transparent 0, transparent 50%)',
                          backgroundSize: '12px 12px',
                        }}
                      />
                    </div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                      Pickup Code
                    </p>
                    <p className="text-4xl font-black text-emerald-700 tracking-[0.25em] font-mono">
                      {order.pickupCode}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <p className="text-xs text-emerald-600">Customer must present this code</p>
                      <button
                        onClick={() => copyToClipboard(order.pickupCode || '', 'Pickup code')}
                        className="p-1 hover:bg-emerald-100 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-emerald-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {order.pickupStore && <InfoRow label="Store" value={order.pickupStore.name} />}
                    {order.pickupStore?.pickupAddress && (
                      <InfoRow label="Pickup Location" value={order.pickupStore.pickupAddress} />
                    )}
                    {order.pickupInstructions && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Instructions</p>
                        <p className="text-xs text-amber-700 italic">{order.pickupInstructions}</p>
                      </div>
                    )}
                    {order.pickupCompletedAt && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-800">
                            Picked up successfully
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {formatDate(order.pickupCompletedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Delivery Info */}
            {order.delivery && (
              <SectionCard>
                <CardHeader
                  icon={Truck}
                  title="Delivery Information"
                  subtitle="Live tracking and delivery status"
                />
                <div className="p-5 space-y-2">
                  <InfoRow
                    label="Delivery Status"
                    value={<StatusPill status={order.delivery.status} type="order" />}
                  />
                  {order.delivery.trackingNumber && (
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-medium">Tracking Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-900">
                          {order.delivery.trackingNumber}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(order.delivery!.trackingNumber!, 'Tracking number')
                          }
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-gray-700 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )}
                  {order.delivery.estimatedDelivery && (
                    <InfoRow
                      label="Est. Delivery"
                      value={formatDate(order.delivery.estimatedDelivery)}
                    />
                  )}
                  {order.delivery.deliveredAt && (
                    <InfoRow
                      label="Delivered At"
                      value={
                        <span className="text-emerald-700 font-semibold text-xs">
                          {formatDate(order.delivery.deliveredAt)}
                        </span>
                      }
                    />
                  )}
                  {order.delivery.provider && (
                    <InfoRow label="Provider" value={order.delivery.provider.name} />
                  )}
                  {order.delivery.deliveryPartner && (
                    <InfoRow
                      label="Delivery Partner"
                      value={`${order.delivery.deliveryPartner.firstName} ${order.delivery.deliveryPartner.lastName}`}
                    />
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── Right column ───────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Customer */}
            <SectionCard>
              <CardHeader icon={User} title="Customer" />
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CBB57B] to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{customerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Buyer</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <a
                    href={`mailto:${order.user.email}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-7 h-7 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm">
                      <Mail className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#CBB57B] transition-colors" />
                    </div>
                    <span className="text-xs text-gray-700 truncate font-medium">
                      {order.user.email}
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
                  </a>
                </div>
              </div>
            </SectionCard>

            {/* Order Workflow */}
            {canUpdateStatus && (
              <SectionCard>
                <CardHeader
                  icon={Clock}
                  title="Order Workflow"
                  subtitle="Update the order status"
                />
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Current Status
                    </label>
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={updating}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] disabled:opacity-50 disabled:cursor-not-allowed appearance-none transition-all"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                      </select>
                      {updating && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-[#CBB57B] animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      To ship, use the <strong>Create Shipment</strong> card below. Tracking and
                      status update automatically.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Create Shipment — hidden for pickup orders (Pickup Management card handles those) */}
            {!order.isPickup && (
              <SectionCard className="border-[#CBB57B]/30">
                <div className="h-0.5 bg-gradient-to-r from-[#CBB57B] to-amber-400" />
                <CardHeader
                  icon={Truck}
                  title="Create Shipment"
                  subtitle="Generate labels & tracking"
                />
                <div className="p-5 space-y-4">
                  {shipments && shipments.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-800">
                            {shipments.length} shipment{shipments.length > 1 ? 's' : ''} created
                          </p>
                          {order.shippingProviderData?.name && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              Customer paid for: {order.shippingProviderData.name}
                              {order.shippingProviderData.carrier
                                ? ` via ${order.shippingProviderData.carrier}`
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMarkAsShippedModal(true)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        <Package className="w-4 h-4" />
                        Create Another Shipment
                      </button>
                    </>
                  ) : canShip ? (
                    <>
                      {/* Gelato POD — no manual shipment needed */}
                      {order.shippingProvider === 'GELATO' ? (
                        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <BadgeCheck className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-orange-800">
                              Gelato POD — no action needed here
                            </p>
                            <p className="text-xs text-orange-600 mt-1 leading-relaxed">
                              Gelato handles production and shipping directly. Check your Gelato
                              dashboard for production and tracking updates.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Checkout provider context — what the customer paid for */}
                          {order.shippingProvider &&
                            order.shippingProvider !== 'SELF_PICKUP' &&
                            (() => {
                              const cfg = SHIPPING_PROVIDER_CONFIG[order.shippingProvider!] ?? {
                                label: order.shippingProvider,
                                color: 'text-gray-600',
                                bg: 'bg-gray-100',
                                border: 'border-gray-200',
                              };
                              const pd = order.shippingProviderData;
                              return (
                                <div
                                  className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
                                >
                                  <BadgeCheck
                                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.color}`}
                                  />
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${cfg.color}`}>
                                      Customer selected: {pd?.name || cfg.label}
                                    </p>
                                    {pd && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        {cfg.label}
                                        {pd.carrier ? ` · ${pd.carrier}` : ''}
                                        {pd.estimatedDays ? ` · ${pd.estimatedDays} days` : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <p className="text-xs font-semibold text-blue-700">
                              Ready to ship — choose a method below.
                            </p>
                          </div>

                          {/* ── Tier 1: EasyPost — Multi-carrier (primary, only for EasyPost-routed orders) ── */}
                          {order.shippingProvider === 'EASYPOST' &&
                            order.shippingAddress &&
                            user &&
                            storeData && (
                              <div className="rounded-xl border border-[#CBB57B]/30 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
                                <div className="px-4 pt-3 pb-3">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-4 h-4 rounded-full bg-[#CBB57B] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                      1
                                    </span>
                                    <p className="text-xs font-bold text-gray-800">
                                      Multi-Carrier — Compare Rates & Buy Label
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mb-3 pl-6">
                                    USPS · UPS · FedEx · DHL · Canada Post · 100+ carriers via
                                    EasyPost
                                  </p>
                                  <EasyPostLabelButton
                                    orderId={order.id}
                                    sellerId={user.id}
                                    storeId={storeData.id}
                                    fromAddress={{
                                      street1: storeData.address?.street || '123 Seller St',
                                      city: storeData.address?.city || 'San Francisco',
                                      state: storeData.address?.state || 'CA',
                                      zip: storeData.address?.zipCode || '94107',
                                      country: storeData.address?.country || 'US',
                                      name: storeData.name || 'Store',
                                    }}
                                    toAddress={{
                                      street1: order.shippingAddress.street || '',
                                      city: order.shippingAddress.city,
                                      state: order.shippingAddress.state || '',
                                      zip: order.shippingAddress.zipCode || '',
                                      country: order.shippingAddress.country || 'US',
                                      name: customerName,
                                    }}
                                    parcel={{
                                      length: 12,
                                      width: 8,
                                      height: 6,
                                      weight: order.items.reduce(
                                        (sum, item) => sum + item.quantity * 16,
                                        0
                                      ),
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                          {/* ── Tier 2: Manual / Other Carrier (DHL direct, EasyShip, SendCloud, custom) ── */}
                          <div className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
                            <div className="px-4 pt-3 pb-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="w-4 h-4 rounded-full bg-gray-400 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                  2
                                </span>
                                <p className="text-xs font-bold text-gray-700">
                                  Manual Entry / Other Carrier
                                </p>
                              </div>
                              <p className="text-[10px] text-gray-500 mb-2 pl-6">
                                DHL Express · EasyShip · SendCloud (EU) · enter your own tracking
                                number
                              </p>

                              {/* Provider-specific guidance */}
                              {order.shippingProvider === 'SENDCLOUD' && (
                                <div className="flex items-start gap-2 p-2.5 bg-violet-50 border border-violet-100 rounded-lg mb-3 ml-0">
                                  <Info className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-violet-700 leading-relaxed">
                                    This order was routed via <strong>SendCloud (EU)</strong>.
                                    Create the parcel in your SendCloud dashboard, then paste the
                                    tracking number below.
                                  </p>
                                </div>
                              )}
                              {order.shippingProvider === 'EASYSHIP' && (
                                <div className="flex items-start gap-2 p-2.5 bg-cyan-50 border border-cyan-100 rounded-lg mb-3">
                                  <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-cyan-700 leading-relaxed">
                                    This order was routed via{' '}
                                    <strong>EasyShip (APAC/Global)</strong>. Create the shipment in
                                    your EasyShip dashboard, then paste the tracking number below.
                                  </p>
                                </div>
                              )}
                              {order.shippingProvider === 'DHL' && (
                                <div className="flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg mb-3">
                                  <Info className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-yellow-700 leading-relaxed">
                                    This order was routed via <strong>DHL Express</strong>. Book the
                                    shipment on DHL&apos;s website, then enter the waybill number
                                    below.
                                  </p>
                                </div>
                              )}

                              <button
                                onClick={() => setShowMarkAsShippedModal(true)}
                                disabled={updating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                              >
                                <Truck className="w-4 h-4" />
                                Enter Tracking / Create Shipment
                              </button>
                            </div>
                          </div>
                        </>
                      )}{' '}
                      {/* end Gelato ternary */}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Order must be in <strong className="text-gray-700">Processing</strong>{' '}
                        status to create a shipment.
                      </p>
                    </div>
                  )}

                  {order.delivery?.trackingNumber && (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Active Tracking
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-gray-700 font-semibold flex-1 truncate">
                          {order.delivery.trackingNumber}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(order.delivery!.trackingNumber!, 'Tracking number')
                          }
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-gray-700 transition-colors" />
                        </button>
                      </div>
                      {order.delivery.provider && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {order.delivery.provider.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Pickup Actions */}
            {order.isPickup && (
              <SectionCard className="border-emerald-200">
                <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader
                  icon={MapPin}
                  title="Pickup Management"
                  subtitle="Manage in-store pickup"
                />
                <div className="p-5 space-y-4">
                  <div className="text-center p-4 bg-emerald-50 border border-dashed border-emerald-300 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                      Pickup Code
                    </p>
                    <p className="text-3xl font-black text-emerald-700 tracking-[0.2em] font-mono">
                      {order.pickupCode}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1.5">Customer must show this code</p>
                  </div>

                  {order.status === 'PICKED_UP' ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">
                          Picked up successfully
                        </p>
                        {order.pickupCompletedAt && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {formatDate(order.pickupCompletedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : order.status === 'READY_FOR_PICKUP' ? (
                    <>
                      <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-blue-700">Waiting for customer</p>
                      </div>
                      <button
                        onClick={() => setShowConfirmPickupModal(true)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                      >
                        {updating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {updating ? 'Processing…' : 'Confirm Customer Pickup'}
                      </button>
                    </>
                  ) : order.status === 'PENDING' || order.status === 'PROCESSING' ? (
                    <>
                      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <Package className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          Prepare the order, then mark it ready for pickup.
                        </p>
                      </div>
                      <button
                        onClick={handleMarkReadyForPickup}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CBB57B] hover:bg-[#B8A060] text-black rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                      >
                        {updating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        {updating ? 'Processing…' : 'Mark Ready for Pickup'}
                      </button>
                    </>
                  ) : null}
                </div>
              </SectionCard>
            )}

            {/* Earnings */}
            <SectionCard>
              <CardHeader
                icon={Banknote}
                title="Earnings"
                subtitle="Your payout breakdown"
                action={<StatusPill status={order.paymentStatus} type="payment" />}
              />
              <div className="p-5 space-y-2">
                <InfoRow
                  label="Order Amount (Your Portion)"
                  value={formatCurrency(sellerTotals.total, order.currency)}
                />
                {sellerTotals.platformCommission !== undefined && (
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <span className="text-xs text-gray-500 font-medium">
                      Platform Fee ({sellerTotals.commissionRate || 10}%)
                    </span>
                    <span className="text-xs font-semibold text-red-500">
                      -{formatCurrency(sellerTotals.platformCommission, order.currency)}
                    </span>
                  </div>
                )}
                {sellerTotals.paymentProcessingFee !== undefined &&
                  sellerTotals.paymentProcessingFee > 0 && (
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-medium">
                        Processing Fee ({sellerTotals.paymentProcessor || 'Stripe'}:{' '}
                        {sellerTotals.processingFeeRate || 2.9}%{' '}
                        {order.currency === 'EUR'
                          ? '+ €0.30'
                          : order.currency === 'GBP'
                            ? '+ £0.20'
                            : '+ $0.30'}
                        )
                      </span>
                      <span className="text-xs font-semibold text-red-500">
                        -{formatCurrency(sellerTotals.paymentProcessingFee, order.currency)}
                      </span>
                    </div>
                  )}

                {/* Net earnings highlight */}
                <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        Net Earnings
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">After all fees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-700">
                        {formatCurrency(netEarnings, order.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Order Notes */}
            {order.notes && (
              <SectionCard>
                <CardHeader icon={Tag} title="Order Notes" />
                <div className="p-5">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      {/* ── Packing Slip Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPackingSlip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 no-print"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl no-print">
                <h2 className="text-base font-bold text-gray-900">Packing Slip Preview</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => setShowPackingSlip(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <PackingSlip ref={packingSlipRef} order={order} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark as Shipped Modal */}
      {order && storeData?.id && (
        <MarkAsShippedModal
          isOpen={showMarkAsShippedModal}
          onClose={() => setShowMarkAsShippedModal(false)}
          orderId={order.id}
          storeId={storeData.id}
          items={order.items}
          currency={order.currency}
          shippingProvider={order.shippingProvider ?? undefined}
          prefillCarrier={order.shippingProviderData?.carrier ?? undefined}
          prefillServiceName={order.shippingProviderData?.name ?? undefined}
          onSuccess={() => {
            mutateShipments();
            mutate();
          }}
        />
      )}

      {/* Confirm Pickup Modal */}
      {order && order.isPickup && (
        <ConfirmPickupModal
          isOpen={showConfirmPickupModal}
          onClose={() => setShowConfirmPickupModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          expectedPickupCode={order.pickupCode || ''}
          storeName={order.pickupStore?.name || storeData?.name || 'Store'}
          onSuccess={() => {
            mutate();
          }}
        />
      )}
    </div>
  );
}
