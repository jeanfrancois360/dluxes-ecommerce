'use client';

/**
 * My Inquiries Page
 *
 * Shows buyer's inquiry history for REAL_ESTATE and VEHICLE products
 * with status tracking and filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/buyer/page-header';
import { useAuth } from '@/hooks/use-auth';
import { inquiriesApi, Inquiry, InquiryStatus } from '@/lib/api/inquiries';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  NEW: {
    label: 'New',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  VIEWING_SCHEDULED: {
    label: 'Viewing Scheduled',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  TEST_DRIVE_SCHEDULED: {
    label: 'Test Drive Scheduled',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  NEGOTIATING: {
    label: 'Negotiating',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  },
  CONVERTED: {
    label: 'Converted',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  CLOSED: {
    label: 'Closed',
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100',
    icon: 'M6 18L18 6M6 6l12 12',
  },
  SPAM: {
    label: 'Spam',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
};

const PRODUCT_TYPE_ICONS: Record<string, string> = {
  REAL_ESTATE:
    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  VEHICLE:
    'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16l4-4h4v4h-4m0 0H5',
};

type FilterStatus = 'all' | InquiryStatus;

export default function MyInquiriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const t = useTranslations('account.inquiries');

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/account/inquiries');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch inquiries
  useEffect(() => {
    async function fetchInquiries() {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await inquiriesApi.getMyInquiries();
        setInquiries(response.data || []);
      } catch (err: any) {
        console.error('Failed to fetch inquiries:', err);
        setError(err.message || 'Failed to load inquiries');
        toast.error('Failed to load your inquiries');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInquiries();
  }, [isAuthenticated]);

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    if (filterStatus === 'all') return inquiries;
    return inquiries.filter((inq) => inq.status === filterStatus);
  }, [inquiries, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      active: inquiries.filter((i) =>
        ['NEW', 'CONTACTED', 'VIEWING_SCHEDULED', 'TEST_DRIVE_SCHEDULED', 'NEGOTIATING'].includes(
          i.status
        )
      ).length,
      converted: inquiries.filter((i) => i.status === 'CONVERTED').length,
    };
  }, [inquiries]);

  const getProductImage = (inquiry: Inquiry) => {
    if (inquiry.product?.heroImage) return inquiry.product.heroImage;
    if (inquiry.product?.images?.[0]?.url) return inquiry.product.images[0].url;
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/dashboard/buyer' },
          { label: t('breadcrumbs.inquiries') },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl px-4 py-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold text-gold">{stats.total}</p>
              <p className="text-xs text-neutral-600">{t('total')}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold text-blue-500">{stats.active}</p>
              <p className="text-xs text-neutral-600">{t('active')}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold text-green-500">{stats.converted}</p>
              <p className="text-xs text-neutral-600">{t('converted')}</p>
            </div>
          </motion.div>
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-4 mb-8"
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gold text-black'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t('all')} ({inquiries.length})
              </button>
              {(
                [
                  'NEW',
                  'CONTACTED',
                  'VIEWING_SCHEDULED',
                  'TEST_DRIVE_SCHEDULED',
                  'NEGOTIATING',
                  'CONVERTED',
                  'CLOSED',
                ] as InquiryStatus[]
              ).map((status) => {
                const count = inquiries.filter((i) => i.status === status).length;
                if (count === 0) return null;
                const config = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? `${config.bgColor} ${config.color}`
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {config.label} ({count})
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-neutral-200 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-neutral-200 rounded w-1/3" />
                      <div className="h-4 bg-neutral-200 rounded w-1/4" />
                      <div className="h-4 bg-neutral-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-12 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
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
              </div>
              <h3 className="text-xl font-bold mb-2">{t('failedToLoad')}</h3>
              <p className="text-neutral-500 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
              >
                {t('tryAgain')}
              </button>
            </motion.div>
          ) : filteredInquiries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-12 text-center"
            >
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold font-['Poppins'] mb-2">
                {filterStatus === 'all'
                  ? t('noInquiriesYet')
                  : `No ${STATUS_CONFIG[filterStatus as InquiryStatus].label} Inquiries`}
              </h3>
              <p className="text-neutral-500 mb-8">
                {filterStatus === 'all' ? t('noInquiriesDesc') : t('noInquiriesMatch')}
              </p>
              {filterStatus === 'all' && (
                <Link
                  href="/products?type=REAL_ESTATE,VEHICLE"
                  className="inline-block px-8 py-4 bg-gold text-black font-semibold rounded-xl hover:bg-gold/90 transition-all"
                >
                  {t('browsePropertiesVehicles')}
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredInquiries.map((inquiry, index) => {
                  const statusConfig = STATUS_CONFIG[inquiry.status];
                  const productImage = getProductImage(inquiry);
                  const productTypeIcon =
                    PRODUCT_TYPE_ICONS[inquiry.product?.productType || ''] ||
                    PRODUCT_TYPE_ICONS.REAL_ESTATE;
                  const isExpanded = expandedId === inquiry.id;

                  return (
                    <motion.div
                      key={inquiry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden"
                    >
                      {/* Main Row */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                        className="p-6 cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Product Image */}
                          <div className="w-full md:w-32 h-32 relative rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                            {productImage ? (
                              <Image
                                src={productImage}
                                alt={inquiry.product?.name || 'Product'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-neutral-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d={productTypeIcon}
                                  />
                                </svg>
                              </div>
                            )}
                            {/* Product Type Badge */}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-xs text-white font-medium">
                              {inquiry.product?.productType === 'REAL_ESTATE'
                                ? t('property')
                                : t('vehicle')}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                              <div>
                                <Link
                                  href={`/products/${inquiry.product?.slug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-lg font-bold font-['Poppins'] text-neutral-800 hover:text-gold transition-colors line-clamp-1"
                                >
                                  {inquiry.product?.name || t('unknownProduct')}
                                </Link>
                                {inquiry.store && (
                                  <p className="text-sm text-neutral-500">
                                    by {inquiry.store.name}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={statusConfig.icon}
                                  />
                                </svg>
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* Message Preview */}
                            <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                              {inquiry.message}
                            </p>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {t('submitted')} {formatDate(inquiry.createdAt)}
                              </span>
                              {inquiry.respondedAt && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {t('responded')}
                                </span>
                              )}
                              {inquiry.scheduledViewing && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  {t('viewing')}: {formatDate(inquiry.scheduledViewing)}
                                </span>
                              )}
                              {inquiry.scheduledTestDrive && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                  {t('testDrive')}: {formatDate(inquiry.scheduledTestDrive)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <div className="flex items-center">
                            <motion.svg
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              className="w-5 h-5 text-neutral-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-0 border-t border-neutral-100">
                              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Your Inquiry */}
                                <div>
                                  <h4 className="font-bold text-neutral-800 mb-3">
                                    {t('yourInquiry')}
                                  </h4>
                                  <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                                    <div>
                                      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                                        {t('message')}
                                      </p>
                                      <p className="text-sm text-neutral-700">{inquiry.message}</p>
                                    </div>
                                    {inquiry.preferredContact && (
                                      <div>
                                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                                          {t('preferredContact')}
                                        </p>
                                        <p className="text-sm text-neutral-700 capitalize">
                                          {inquiry.preferredContact}
                                        </p>
                                      </div>
                                    )}
                                    {inquiry.preferredTime && (
                                      <div>
                                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                                          {t('preferredTime')}
                                        </p>
                                        <p className="text-sm text-neutral-700 capitalize">
                                          {inquiry.preferredTime}
                                        </p>
                                      </div>
                                    )}
                                    {inquiry.preApproved && (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <svg
                                          className="w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium">
                                          {t('preApprovedFinancing')}
                                        </span>
                                      </div>
                                    )}
                                    {inquiry.tradeInInterest && (
                                      <div className="flex items-center gap-2 text-blue-600">
                                        <svg
                                          className="w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium">
                                          {t('interestedInTradeIn')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status Timeline */}
                                <div>
                                  <h4 className="font-bold text-neutral-800 mb-3">
                                    {t('statusHistory')}
                                  </h4>
                                  <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                          className="w-4 h-4 text-blue-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                          />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-neutral-800">
                                          {t('inquirySubmitted')}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                          {formatDateTime(inquiry.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    {inquiry.respondedAt && (
                                      <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                          <svg
                                            className="w-4 h-4 text-purple-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-neutral-800">
                                            {t('sellerResponded')}
                                          </p>
                                          <p className="text-xs text-neutral-500">
                                            {formatDateTime(inquiry.respondedAt)}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {inquiry.status !== 'NEW' && inquiry.status !== 'CONTACTED' && (
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={`w-8 h-8 ${statusConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}
                                        >
                                          <svg
                                            className={`w-4 h-4 ${statusConfig.color}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d={statusConfig.icon}
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-neutral-800">
                                            {statusConfig.label}
                                          </p>
                                          <p className="text-xs text-neutral-500">
                                            {t('currentStatus')}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                  href={`/products/${inquiry.product?.slug}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  {inquiry.product?.productType === 'REAL_ESTATE'
                                    ? t('viewProperty')
                                    : t('viewVehicle')}
                                </Link>
                                <a
                                  href={`mailto:${inquiry.store?.name || 'seller'}?subject=Re: Inquiry for ${inquiry.product?.name}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-all"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {t('contactSeller')}
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
