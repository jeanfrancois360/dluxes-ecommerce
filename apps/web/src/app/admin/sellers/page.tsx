'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { Input } from '@nextpik/ui';
import { Label } from '@nextpik/ui';
import { Textarea } from '@nextpik/ui';
import { AdminLayout } from '@/components/admin/admin-layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch');
  }

  const data = await res.json();
  return data.data || data;
};

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

// Status Badge Component
function StatusBadge({ status, t }: { status: string; t: any }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
    REJECTED: 'bg-gray-50 text-gray-700 border-gray-200',
    INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const dotColors: Record<string, string> = {
    PENDING: 'bg-yellow-600',
    ACTIVE: 'bg-green-600',
    SUSPENDED: 'bg-red-600',
    REJECTED: 'bg-gray-600',
    INACTIVE: 'bg-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-gray-600'}`}></div>
      {t(`statusBadges.${status}`)}
    </span>
  );
}

export default function AdminSellersPage() {
  const t = useTranslations('adminSellers');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [suspensionNote, setSuspensionNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch stats
  const { data: stats, error: statsError } = useSWR(`${API_URL}/admin/sellers/stats`, fetcher, {
    refreshInterval: 30000,
  });

  // Fetch sellers based on active tab
  const statusFilter = activeTab === 'all' ? '' : `&status=${activeTab.toUpperCase()}`;
  const searchFilter = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

  const { data: sellersData, error: sellersError } = useSWR(
    `${API_URL}/admin/sellers?page=1&limit=50${statusFilter}${searchFilter}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const sellers = sellersData?.sellers || [];

  // Refresh data
  const refreshData = () => {
    mutate(`${API_URL}/admin/sellers/stats`);
    mutate(`${API_URL}/admin/sellers?page=1&limit=50${statusFilter}${searchFilter}`);
    toast.success(t('toasts.dataRefreshed'));
  };

  // Approve seller
  const handleApprove = async () => {
    if (!selectedSeller) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${selectedSeller.storeId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve seller');
      }

      toast.success(t('toasts.approveSuccess', { storeName: selectedSeller.storeName }));
      setShowApproveModal(false);
      setSelectedSeller(null);
      refreshData();
    } catch (error: any) {
      toast.error(error.message || t('toasts.approveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Reject seller
  const handleReject = async () => {
    if (!selectedSeller || !rejectionNote.trim()) {
      toast.error(t('toasts.rejectNoteRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${selectedSeller.storeId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionNote }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject seller');
      }

      toast.success(t('toasts.rejectSuccess', { storeName: selectedSeller.storeName }));
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectionNote('');
      refreshData();
    } catch (error: any) {
      toast.error(error.message || t('toasts.rejectFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Suspend seller
  const handleSuspend = async () => {
    if (!selectedSeller || !suspensionNote.trim()) {
      toast.error(t('toasts.suspendNoteRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${selectedSeller.storeId}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suspensionNote }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to suspend seller');
      }

      toast.success(t('toasts.suspendSuccess', { storeName: selectedSeller.storeName }));
      setShowSuspendModal(false);
      setSelectedSeller(null);
      setSuspensionNote('');
      refreshData();
    } catch (error: any) {
      toast.error(error.message || t('toasts.suspendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">{t('pageTitle')}</h1>
            <p className="text-neutral-600 mt-1">{t('pageDescription')}</p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2.5 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all flex items-center gap-2 shadow-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {t('buttons.refresh')}
          </button>
        </div>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title={t('stats.totalSellers')}
              value={stats.total || 0}
              icon={Users}
              color="from-blue-50 to-white"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatsCard
              title={t('stats.pendingApproval')}
              value={stats.pending || 0}
              icon={Clock}
              color="from-yellow-50 to-white"
              iconBg="bg-yellow-100"
              iconColor="text-yellow-600"
            />
            <StatsCard
              title={t('stats.activeSellers')}
              value={stats.active || 0}
              icon={CheckCircle}
              color="from-green-50 to-white"
              iconBg="bg-green-100"
              iconColor="text-green-600"
            />
            <StatsCard
              title={t('stats.paidSubscriptions')}
              value={stats.activeWithCredits || 0}
              icon={AlertTriangle}
              color="from-purple-50 to-white"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* Filters & Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex flex-wrap items-center justify-between p-6 gap-4">
              {/* Tabs */}
              <div className="flex space-x-1 bg-neutral-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: t('tabs.all') },
                  { key: 'pending', label: t('tabs.pending'), count: stats?.pending },
                  { key: 'active', label: t('tabs.active') },
                  { key: 'suspended', label: t('tabs.suspended') },
                  { key: 'rejected', label: t('tabs.rejected') },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-black shadow'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-white border border-neutral-300 text-black placeholder-neutral-400 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.store')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.owner')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.subscription')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.applied')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                    {t('table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-16 h-16 text-neutral-400 mb-4" />
                        <p className="text-neutral-600 font-medium text-lg">
                          {t('table.emptyState.noSellers')}
                        </p>
                        <p className="text-neutral-400 text-sm mt-1">
                          {searchTerm
                            ? t('table.emptyState.searchTip')
                            : t('table.emptyState.noApplications')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller: any) => (
                    <motion.tr
                      key={seller.storeId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-all duration-200 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-[#CBB57B]/30">
                            <span className="text-white font-bold text-sm">
                              {seller.storeName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-black group-hover:text-[#CBB57B] transition-colors">
                              {seller.storeName}
                            </div>
                            <div className="text-sm text-neutral-500">{seller.storeEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-black">
                            {seller.owner.firstName} {seller.owner.lastName}
                          </div>
                          <div className="text-sm text-neutral-500">{seller.owner.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={seller.status} t={t} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-black">
                            {t(
                              seller.creditsBalance === 1
                                ? 'table.subscription.month'
                                : 'table.subscription.months',
                              { count: seller.creditsBalance }
                            )}
                          </span>
                          {seller.creditsBalance === 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold">
                              {t('table.subscription.expired')}
                            </span>
                          )}
                          {seller.creditsBalance > 0 && seller.creditsBalance <= 2 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded text-xs font-semibold">
                              {t('table.subscription.low')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {new Date(seller.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/sellers/${seller.storeId}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
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
                            {t('buttons.view')}
                          </Link>
                          {seller.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSeller(seller);
                                  setShowApproveModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 border border-green-200 text-green-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {t('buttons.approve')}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSeller(seller);
                                  setShowRejectModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {t('buttons.reject')}
                              </button>
                            </>
                          )}
                          {seller.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedSeller(seller);
                                setShowSuspendModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('buttons.suspend')}
                            </button>
                          )}
                          {seller.status === 'SUSPENDED' && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `${API_URL}/admin/sellers/${seller.storeId}/reactivate`,
                                    {
                                      method: 'POST',
                                      headers: {
                                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                                      },
                                    }
                                  );

                                  if (!res.ok) throw new Error('Failed to reactivate');

                                  toast.success(t('toasts.reactivateSuccess'));
                                  refreshData();
                                } catch (error) {
                                  toast.error(t('toasts.reactivateFailed'));
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              {t('buttons.reactivate')}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.approve.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.approve.description', { storeName: selectedSeller?.storeName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-600">{t('modals.approve.willAutomatically')}</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>{t('modals.approve.actions.approveAccount')}</li>
              <li>{t('modals.approve.actions.approveStore')}</li>
              <li>{t('modals.approve.actions.allowProducts')}</li>
              <li>{t('modals.approve.actions.sendEmail')}</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">⚠️ {t('modals.approve.warning')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isLoading}
            >
              {t('modals.approve.cancelButton')}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading
                ? t('modals.approve.confirmButtonLoading')
                : t('modals.approve.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.reject.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.reject.description', { storeName: selectedSeller?.storeName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="rejectionNote">
                {t('modals.reject.reasonLabel')}{' '}
                <span className="text-red-500">{t('modals.reject.reasonRequired')}</span>
              </Label>
              <Textarea
                id="rejectionNote"
                placeholder={t('modals.reject.reasonPlaceholder')}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{t('modals.reject.warning')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionNote('');
              }}
              disabled={isLoading}
            >
              {t('modals.reject.cancelButton')}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isLoading || !rejectionNote.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading
                ? t('modals.reject.confirmButtonLoading')
                : t('modals.reject.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.suspend.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.suspend.description', { storeName: selectedSeller?.storeName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="suspensionNote">
                {t('modals.suspend.reasonLabel')}{' '}
                <span className="text-red-500">{t('modals.suspend.reasonRequired')}</span>
              </Label>
              <Textarea
                id="suspensionNote"
                placeholder={t('modals.suspend.reasonPlaceholder')}
                value={suspensionNote}
                onChange={(e) => setSuspensionNote(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">{t('modals.suspend.warning')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false);
                setSuspensionNote('');
              }}
              disabled={isLoading}
            >
              {t('modals.suspend.cancelButton')}
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={isLoading || !suspensionNote.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading
                ? t('modals.suspend.confirmButtonLoading')
                : t('modals.suspend.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
