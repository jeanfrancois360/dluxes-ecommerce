'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { adminAdvertisementsApi, type Advertisement } from '@/lib/api/admin';
import { toast } from '@/lib/utils/toast';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
import {
  Eye,
  MousePointer,
  TrendingUp,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  BarChart3,
  X,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Clock,
  AlertCircle,
} from 'lucide-react';

const PLACEMENT_LABELS: Record<string, string> = {
  HOMEPAGE_HERO: 'Homepage hero (reserved)',
  HOMEPAGE_FEATURED: 'Homepage banner',
  HOMEPAGE_SIDEBAR: 'Homepage sidebar',
  PRODUCTS_BANNER: 'Products page banner',
  PRODUCTS_INLINE: 'Homepage inline',
  PRODUCTS_SIDEBAR: 'Products page sidebar',
  CATEGORY_BANNER: 'Category page banner',
  PRODUCT_DETAIL_SIDEBAR: 'Product page sidebar',
  CHECKOUT_UPSELL: 'Checkout upsell',
  SEARCH_RESULTS: 'Search sponsored',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING_APPROVAL: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
  APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', label: 'Approved' },
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', label: 'Active' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', label: 'Rejected' },
  EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Expired' },
  PAUSED: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400', label: 'Paused' },
  DRAFT: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
  COMPLETED: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
    label: 'Completed',
  },
};

function AdvertisementsContent() {
  const t = useTranslations('adminAdvertisements');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [selectedAdAnalytics, setSelectedAdAnalytics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      let data: Advertisement[];
      if (filter === 'pending') {
        data = await adminAdvertisementsApi.getPending();
      } else {
        const statusMap: Record<string, string> = { active: 'ACTIVE', rejected: 'REJECTED' };
        const params = filter !== 'all' ? { status: statusMap[filter] } : undefined;
        data = await adminAdvertisementsApi.getAll(params);
      }
      setAds(data || []);
    } catch (error) {
      toast.error(t('messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [filter]);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await adminAdvertisementsApi.approve(id, approved);
      toast.success(approved ? t('messages.approveSuccess') : t('messages.rejectSuccess'));
      fetchAds();
    } catch (error) {
      toast.error(t('messages.updateError'));
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await adminAdvertisementsApi.toggle(id, isActive);
      const status = isActive ? t('messages.activated') : t('messages.deactivated');
      toast.success(t('messages.toggleSuccess', { status }));
      fetchAds();
    } catch (error) {
      toast.error(t('messages.toggleError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.deleteConfirm'))) return;
    try {
      await adminAdvertisementsApi.delete(id);
      toast.success(t('messages.deleteSuccess'));
      fetchAds();
    } catch (error) {
      toast.error(t('messages.deleteError'));
    }
  };

  const viewAnalytics = async (ad: Advertisement) => {
    try {
      const analytics = await adminAdvertisementsApi.getAnalytics(ad.id);
      setSelectedAd(ad);
      setSelectedAdAnalytics(analytics?.metrics || analytics);
      setShowModal(true);
    } catch (error) {
      toast.error(t('messages.analyticsError'));
    }
  };

  // Stats
  const pendingCount = ads.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const activeCount = ads.filter((a) => a.status === 'ACTIVE').length;
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);

  const filters = [
    { key: 'all' as const, label: t('filters.all'), count: ads.length },
    { key: 'pending' as const, label: t('filters.pending'), count: pendingCount },
    { key: 'active' as const, label: t('filters.active'), count: activeCount },
    {
      key: 'rejected' as const,
      label: t('filters.rejected'),
      count: ads.filter((a) => a.status === 'REJECTED').length,
    },
  ];

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Ads',
              value: ads.length,
              icon: ImageIcon,
              color: 'text-gray-700',
              bg: 'bg-gray-50',
            },
            {
              label: 'Pending Review',
              value: pendingCount,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Total Impressions',
              value: formatNumber(totalImpressions),
              icon: Eye,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Total Clicks',
              value: formatNumber(totalClicks),
              icon: MousePointer,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-px">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                filter === f.key
                  ? 'border-[#CBB57B] text-[#8B7355] bg-[#CBB57B]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    filter === f.key
                      ? 'bg-[#CBB57B]/20 text-[#8B7355]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ads List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CBB57B] mx-auto" />
              <p className="text-sm text-gray-400 mt-3">Loading advertisements...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 px-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-800 font-semibold mb-1">{t('messages.noAds')}</p>
              <p className="text-sm text-gray-400">
                Ads submitted by sellers will appear here for review.
              </p>
            </div>
          ) : (
            ads.map((ad) => {
              const sc = STATUS_CONFIG[ad.status] || STATUS_CONFIG.DRAFT;
              const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;

              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex items-stretch">
                    {/* Image */}
                    <div className="w-48 flex-shrink-0 bg-gray-100 relative">
                      {ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover min-h-[120px]"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[120px] flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {/* Status badge overlay */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} backdrop-blur-sm`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {ad.title}
                            </h3>
                            {ad.advertiser && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                by {ad.advertiser.firstName} {ad.advertiser.lastName}
                              </p>
                            )}
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                            {PLACEMENT_LABELS[ad.placement] || ad.placement}
                          </span>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-5 mt-3">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Eye className="w-4 h-4 text-gray-400" />
                            {formatNumber(ad.impressions)} views
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MousePointer className="w-4 h-4 text-gray-400" />
                            {formatNumber(ad.clicks)} clicks
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            {ctr.toFixed(1)}% CTR
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {ad.startDate
                              ? new Date(ad.startDate).toLocaleDateString()
                              : '—'} —{' '}
                            {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                        {ad.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(ad.id, false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {(ad.status === 'ACTIVE' || ad.status === 'PAUSED') && (
                          <button
                            onClick={() => handleToggle(ad.id, ad.status !== 'ACTIVE')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                          >
                            {ad.status === 'ACTIVE' ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            {ad.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                          </button>
                        )}
                        <button
                          onClick={() => viewAnalytics(ad)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/10 text-[#8B7355] rounded-lg text-sm font-medium hover:bg-[#CBB57B]/20 transition-colors border border-[#CBB57B]/30"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Analytics
                        </button>
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Link
                          </a>
                        )}
                        <div className="ml-auto">
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Analytics Modal */}
        {showModal && selectedAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{t('modal.title')}</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAdAnalytics(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {selectedAd.imageUrl ? (
                      <img
                        src={selectedAd.imageUrl}
                        alt={selectedAd.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{selectedAd.title}</h3>
                    <p className="text-sm text-gray-500">
                      {PLACEMENT_LABELS[selectedAd.placement] || selectedAd.placement}
                    </p>
                  </div>
                </div>

                {(() => {
                  const impressions = selectedAdAnalytics?.impressions ?? selectedAd.impressions;
                  const clicks = selectedAdAnalytics?.clicks ?? selectedAd.clicks;
                  const conversions = selectedAdAnalytics?.conversions ?? selectedAd.conversions;
                  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            label: t('modal.metrics.impressions'),
                            value: formatNumber(impressions),
                            icon: Eye,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                          },
                          {
                            label: t('modal.metrics.clicks'),
                            value: formatNumber(clicks),
                            icon: MousePointer,
                            color: 'text-green-600',
                            bg: 'bg-green-50',
                          },
                          {
                            label: t('modal.metrics.conversions'),
                            value: formatNumber(conversions),
                            icon: TrendingUp,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50',
                          },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                            <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                            <div className="text-xl font-bold text-gray-900">{value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-amber-700">{ctr.toFixed(2)}%</div>
                          <div className="text-xs text-amber-600 mt-0.5">
                            {t('modal.metrics.ctr')}
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                          <div className="text-xl font-bold text-indigo-700">{cvr.toFixed(2)}%</div>
                          <div className="text-xs text-indigo-600 mt-0.5">
                            {t('modal.metrics.conversionRate')}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAdAnalytics(null);
                  }}
                  className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('modal.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdvertisementsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdvertisementsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
