'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  ArrowLeft,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  hotDealsApi,
  HotDeal,
  CATEGORY_LABELS,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  HotDealStatus,
  UrgencyLevel,
} from '@/lib/api/hot-deals';

// Urgency left-border colors
const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  NORMAL: 'border-l-gray-200',
  URGENT: 'border-l-[#CBB57B]',
  EMERGENCY: 'border-l-red-500',
};

function getTimeRemaining(
  expiresAt: string,
  t: ReturnType<typeof useTranslations>
): { text: string; isExpired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: t('expired'), isExpired: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return { text: t('hoursLeft', { hours: h, minutes: m }), isExpired: false };
  return { text: t('minutesLeft', { minutes: m }), isExpired: false };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MyDealsPage() {
  const t = useTranslations('pages.hotDealsMyDeals');
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/my-deals');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    async function fetchMyDeals() {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await hotDealsApi.getMyDeals();
        setDeals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyDeals();
  }, [isAuthenticated, t]);

  const handleMarkFulfilled = async (dealId: string) => {
    setActionLoading(dealId);
    try {
      await hotDealsApi.markFulfilled(dealId);
      toast.success(t('markedFulfilled'));
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'FULFILLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToMark'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (dealId: string) => {
    if (!confirm(t('confirmCancel'))) return;
    setActionLoading(dealId);
    try {
      await hotDealsApi.cancel(dealId);
      toast.success(t('dealCancelled'));
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'CANCELLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToCancel'));
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state — wait for auth init, then wait for deals to load
  if (!isInitialized || (isLoading && isAuthenticated)) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Redirect in progress
  if (!isAuthenticated) return null;

  // Group deals
  const activeDeals = deals.filter((d) => d.status === 'ACTIVE');
  const pendingDeals = deals.filter((d) => d.status === 'PENDING');
  const pastDeals = deals.filter((d) => ['FULFILLED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const totalResponses = deals.reduce((sum, d) => sum + (d._count?.responses || 0), 0);

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/hot-deals"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('myHotDeals')}</h1>
                  <p className="text-sm text-gray-500">{t('manageRequests')}</p>
                </div>
              </div>
              <Link
                href="/hot-deals/new"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('postNewDeal')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {deals.length > 0 && (
          <div className="bg-white border-b">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex gap-6 overflow-x-auto">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {activeDeals.length}
                    </p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {pendingDeals.length}
                    </p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">{totalResponses}</p>
                    <p className="text-xs text-gray-500">Responses</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {pastDeals.length}
                    </p>
                    <p className="text-xs text-gray-500">Past</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {deals.length === 0 && !isLoading && !error && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-[#CBB57B]/15 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Flame className="w-8 h-8 text-[#CBB57B]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noDealsYet')}</h2>
              <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">
                {t('noDealsDescription')}
              </p>
              <Link
                href="/hot-deals/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('postFirstDeal')}
              </Link>
            </div>
          )}

          {/* Pending deals */}
          {pendingDeals.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                {t('pendingPayment', { count: pendingDeals.length })}
              </h2>
              <div className="space-y-3">
                {pendingDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    actionLoading={actionLoading}
                    onCancel={handleCancel}
                    t={t}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Active deals */}
          {activeDeals.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#CBB57B]" />
                {t('activeDeals', { count: activeDeals.length })}
              </h2>
              <div className="space-y-3">
                {activeDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    actionLoading={actionLoading}
                    onMarkFulfilled={handleMarkFulfilled}
                    onCancel={handleCancel}
                    t={t}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past deals */}
          {pastDeals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {t('pastDeals', { count: pastDeals.length })}
              </h2>
              <div className="space-y-3">
                {pastDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} isPast t={t} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Mobile FAB */}
        <div className="sm:hidden fixed bottom-6 right-6">
          <Link
            href="/hot-deals/new"
            className="flex items-center justify-center w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

// Deal card component
function DealCard({
  deal,
  actionLoading,
  onMarkFulfilled,
  onCancel,
  isPast,
  t,
}: {
  deal: HotDeal;
  actionLoading?: string | null;
  onMarkFulfilled?: (id: string) => void;
  onCancel?: (id: string) => void;
  isPast?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];
  const timeInfo = getTimeRemaining(deal.expiresAt, t);
  const isThisDealLoading = actionLoading === deal.id;
  const responseCount = deal._count?.responses || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${URGENCY_BORDER[deal.urgency]} p-5 transition-all ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
            >
              {urgencyConfig.label}
            </span>
            <span className="text-xs text-gray-400">{CATEGORY_LABELS[deal.category]}</span>
          </div>

          <Link href={`/hot-deals/${deal.id}`}>
            <h3 className="text-base font-semibold text-gray-900 hover:text-[#CBB57B] transition-colors mb-1 line-clamp-1">
              {deal.title}
            </h3>
          </Link>

          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">
            {deal.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {deal.city}
              {deal.state ? `, ${deal.state}` : ''}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {t('responsesCount', { count: responseCount })}
            </span>
            {deal.status === 'ACTIVE' && !timeInfo.isExpired && (
              <span className="flex items-center gap-1 text-[#CBB57B] font-medium">
                <Clock className="w-3.5 h-3.5" />
                {timeInfo.text}
              </span>
            )}
            <span className="flex items-center gap-1">
              {t('posted')} {formatDate(deal.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:ml-2 flex-shrink-0">
          <Link
            href={`/hot-deals/${deal.id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('view')}</span>
          </Link>

          {deal.status === 'ACTIVE' && onMarkFulfilled && (
            <button
              onClick={() => onMarkFulfilled(deal.id)}
              disabled={isThisDealLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {isThisDealLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{t('fulfill')}</span>
            </button>
          )}

          {(deal.status === 'ACTIVE' || deal.status === 'PENDING') && onCancel && (
            <button
              onClick={() => onCancel(deal.id)}
              disabled={isThisDealLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isThisDealLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{t('cancel')}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
