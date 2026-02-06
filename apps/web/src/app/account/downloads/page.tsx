'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { PageLayout } from '@/components/layout/page-layout';
import { downloadsApi, type DigitalPurchase } from '@/lib/api/downloads';
import { toast, standardToasts } from '@/lib/utils/toast';

// Format file size
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

// File type icon
function FileTypeIcon({ format }: { format: string | null }) {
  const iconClass = 'w-8 h-8';
  const type = format?.toUpperCase() || 'FILE';

  const colors: Record<string, string> = {
    PDF: 'text-red-500',
    ZIP: 'text-yellow-500',
    MP3: 'text-purple-500',
    MP4: 'text-blue-500',
    PNG: 'text-green-500',
    JPG: 'text-green-500',
    JPEG: 'text-green-500',
    DOC: 'text-blue-600',
    DOCX: 'text-blue-600',
    XLS: 'text-green-600',
    XLSX: 'text-green-600',
    PSD: 'text-indigo-500',
    AI: 'text-orange-500',
  };

  return (
    <div className={`${iconClass} ${colors[type] || 'text-neutral-400'}`}>
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
        <text x="12" y="16" fontSize="5" fontWeight="bold" textAnchor="middle" fill="currentColor">
          {type.slice(0, 3)}
        </text>
      </svg>
    </div>
  );
}

export default function MyDownloadsPage() {
  const t = useTranslations('account.downloads');
  const { user, isLoading: authLoading } = useAuth();
  const [downloads, setDownloads] = useState<DigitalPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setIsLoading(true);
        const response = await downloadsApi.getMyDownloads();
        if (response?.data) {
          setDownloads(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch downloads:', error);
        toast.error(t('toast.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchDownloads();
    }
  }, [authLoading, user]);

  const handleDownload = async (purchase: DigitalPurchase) => {
    if (!purchase.canDownload) {
      toast.error(t('toast.downloadLimit'));
      return;
    }

    try {
      setDownloadingId(purchase.productId);
      const response = await downloadsApi.getDownloadUrl(purchase.orderId, purchase.productId);

      if (response?.data?.url) {
        // Open download in new tab
        window.open(response.data.url, '_blank');
        toast.success(t('toast.downloading', { fileName: response.data.fileName }));
      } else {
        toast.error(t('toast.downloadLinkError'));
      }
    } catch (error) {
      toast.error(t('toast.downloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  // Group downloads by order
  const downloadsByOrder = downloads.reduce((acc, download) => {
    if (!acc[download.orderId]) {
      acc[download.orderId] = {
        orderNumber: download.orderNumber,
        orderDate: download.orderDate,
        items: [],
      };
    }
    acc[download.orderId].items.push(download);
    return acc;
  }, {} as Record<string, { orderNumber: string; orderDate: string; items: DigitalPurchase[] }>);

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] bg-neutral-50 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
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
            <Link href="/dashboard/buyer" className="hover:text-gold transition-colors">Account</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">{t('breadcrumb')}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-['Poppins'] text-white mb-1">
                {t('title')}
              </h1>
              <p className="text-lg text-white/80">
                {t('subtitle')}
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-gold">{downloads.length}</p>
              <p className="text-sm text-white/70">{t('stats.totalFiles')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-gold">{Object.keys(downloadsByOrder).length}</p>
              <p className="text-sm text-white/70">{t('stats.orders')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-green-400">
                {downloads.filter(d => d.canDownload).length}
              </p>
              <p className="text-sm text-white/70">{t('stats.available')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {downloads.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center"
          >
            <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold font-['Poppins'] text-black mb-2">{t('empty.title')}</h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {t('empty.description')}
            </p>
            <Link
              href="/products?productType=DIGITAL"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('empty.browseButton')}
            </Link>
          </motion.div>
        ) : (
          /* Downloads List */
          <div className="space-y-6">
            {Object.entries(downloadsByOrder).map(([orderId, orderData], orderIndex) => (
              <motion.div
                key={orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: orderIndex * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">{t('order.label')}</p>
                      <p className="font-semibold text-black">#{orderData.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500">{t('order.purchased')}</p>
                      <p className="font-medium text-black">
                        {new Date(orderData.orderDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Downloads */}
                <div className="divide-y divide-neutral-100">
                  {orderData.items.map((download) => (
                    <div key={download.productId} className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                          {download.productImage ? (
                            <img
                              src={download.productImage}
                              alt={download.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileTypeIcon format={download.digitalFileFormat} />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${download.productSlug}`}
                            className="font-semibold text-lg text-black hover:text-gold transition-colors line-clamp-1"
                          >
                            {download.productName}
                          </Link>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500">
                            {download.digitalFileFormat && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium uppercase">
                                {download.digitalFileFormat}
                              </span>
                            )}
                            {download.digitalFileSize && (
                              <span>{formatFileSize(download.digitalFileSize)}</span>
                            )}
                            {download.digitalVersion && (
                              <span>v{download.digitalVersion}</span>
                            )}
                            {download.digitalLicenseType && (
                              <span className="capitalize">{t('license', { type: download.digitalLicenseType })}</span>
                            )}
                          </div>

                          {download.digitalInstructions && (
                            <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                              {download.digitalInstructions}
                            </p>
                          )}

                          {download.digitalDownloadLimit && (
                            <p className="text-xs text-neutral-400 mt-2">
                              {t('downloadsCount', { used: download.downloadCount, limit: download.digitalDownloadLimit })}
                            </p>
                          )}
                        </div>

                        {/* Download Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleDownload(download)}
                            disabled={!download.canDownload || downloadingId === download.productId}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                              download.canDownload
                                ? 'bg-gold text-black hover:bg-gold/90'
                                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            {downloadingId === download.productId ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {t('button.downloading')}
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {t('button.download')}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
