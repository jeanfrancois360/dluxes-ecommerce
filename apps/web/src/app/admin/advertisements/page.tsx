'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { adminAdvertisementsApi, type Advertisement } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount, formatNumber } from '@/lib/utils/number-format';
function AdvertisementsContent() {
  const t = useTranslations('adminAdvertisements');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      let data: Advertisement[];
      if (filter === 'pending') {
        data = await adminAdvertisementsApi.getPending();
      } else {
        const params = filter !== 'all' ? { status: filter.toUpperCase() } : undefined;
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
      setSelectedAd({ ...ad, ...analytics });
      setShowModal(true);
    } catch (error) {
      toast.error(t('messages.analyticsError'));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-blue-100 text-blue-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-end gap-2">
          {(['all', 'pending', 'active', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                filter === f
                  ? 'bg-[#CBB57B] text-black font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CBB57B] mx-auto" />
            </div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">{t('messages.noAds')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.ad')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.placement')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.pricing')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.performance')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{ad.title}</div>
                          {ad.advertiser && (
                            <div className="text-sm text-gray-500">
                              {ad.advertiser.firstName} {ad.advertiser.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ad.placement}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">
                          ${formatCurrencyAmount(Number(ad.price), 2)}
                        </div>
                        <div className="text-gray-500">{ad.pricingModel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ad.status)}`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>{t('table.performance.impressions', { count: ad.impressions })}</div>
                        <div>{t('table.performance.clicks', { count: ad.clicks })}</div>
                        {ad.impressions > 0 && (
                          <div className="text-gray-500">
                            {t('table.performance.ctr', {
                              rate: formatNumber((ad.clicks / ad.impressions) * 100, 1),
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ad.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id, true)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              {t('actions.approve')}
                            </button>
                            <button
                              onClick={() => handleApprove(ad.id, false)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              {t('actions.reject')}
                            </button>
                          </>
                        )}
                        {ad.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleToggle(ad.id, !ad.isActive)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {ad.isActive ? t('actions.pause') : t('actions.resume')}
                          </button>
                        )}
                        <button
                          onClick={() => viewAnalytics(ad)}
                          className="text-[#CBB57B] hover:text-[#a89158] text-sm font-medium"
                        >
                          {t('actions.analytics')}
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          {t('actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Analytics Modal */}
        {showModal && selectedAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">{t('modal.title')}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedAd.imageUrl}
                    alt={selectedAd.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{selectedAd.title}</h3>
                    <p className="text-sm text-gray-500">{selectedAd.placement}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{selectedAd.impressions}</div>
                    <div className="text-sm text-gray-500">{t('modal.metrics.impressions')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{selectedAd.clicks}</div>
                    <div className="text-sm text-gray-500">{t('modal.metrics.clicks')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{selectedAd.conversions}</div>
                    <div className="text-sm text-gray-500">{t('modal.metrics.conversions')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold">
                      {selectedAd.impressions > 0
                        ? formatNumber((selectedAd.clicks / selectedAd.impressions) * 100, 2)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-500">{t('modal.metrics.ctr')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold">
                      {selectedAd.clicks > 0
                        ? formatNumber((selectedAd.conversions / selectedAd.clicks) * 100, 2)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-500">{t('modal.metrics.conversionRate')}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('modal.close')}
              </button>
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
