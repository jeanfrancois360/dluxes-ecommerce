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
  Trash2,
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
} from '@/lib/api/hot-deals';

// Calculate time remaining
function getTimeRemaining(expiresAt: string, t: any): { text: string; isExpired: boolean } {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return { text: t('expired'), isExpired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return { text: t('hoursLeft', { hours, minutes }), isExpired: false };
  }
  return { text: t('minutesLeft', { minutes }), isExpired: false };
}

// Format date
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/hot-deals/my-deals');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch user's deals
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
  }, [isAuthenticated]);

  // Handle mark as fulfilled
  const handleMarkFulfilled = async (dealId: string) => {
    setActionLoading(dealId);
    try {
      await hotDealsApi.markFulfilled(dealId);
      toast.success(t('markedFulfilled'));
      // Update local state
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'FULFILLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToMark'));
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel
  const handleCancel = async (dealId: string) => {
    if (!confirm(t('confirmCancel'))) return;

    setActionLoading(dealId);
    try {
      await hotDealsApi.cancel(dealId);
      toast.success(t('dealCancelled'));
      // Update local state
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: 'CANCELLED' as HotDealStatus } : d))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToCancel'));
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </PageLayout>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Group deals by status
  const activeDeals = deals.filter((d) => d.status === 'ACTIVE');
  const pendingDeals = deals.filter((d) => d.status === 'PENDING');
  const pastDeals = deals.filter((d) => ['FULFILLED', 'EXPIRED', 'CANCELLED'].includes(d.status));

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
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('myHotDeals')}</h1>
                  <p className="text-gray-600">{t('manageRequests')}</p>
                </div>
              </div>
              <Link
                href="/hot-deals/new"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('postNewDeal')}
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {deals.length === 0 && !isLoading && !error && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Flame className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noDealsYet')}</h2>
              <p className="text-gray-600 mb-6">{t('noDealsDescription')}</p>
              <Link
                href="/hot-deals/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('postFirstDeal')}
              </Link>
            </div>
          )}

          {/* Pending Deals */}
          {pendingDeals.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                {t('pendingPayment', { count: pendingDeals.length })}
              </h2>
              <div className="space-y-4">
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

          {/* Active Deals */}
          {activeDeals.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-gold" />
                {t('activeDeals', { count: activeDeals.length })}
              </h2>
              <div className="space-y-4">
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

          {/* Past Deals */}
          {pastDeals.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                {t('pastDeals', { count: pastDeals.length })}
              </h2>
              <div className="space-y-4">
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

// Deal Card Component
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
  t: any;
}) {
  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];
  const timeInfo = getTimeRemaining(deal.expiresAt, t);
  const isThisDealLoading = actionLoading === deal.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border ${
        isPast ? 'border-gray-200 opacity-75' : 'border-gray-200'
      } p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
            >
              {urgencyConfig.label}
            </span>
            <span className="text-xs text-gray-500">{CATEGORY_LABELS[deal.category]}</span>
          </div>

          <Link href={`/hot-deals/${deal.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-gold transition-colors mb-1 line-clamp-1">
              {deal.title}
            </h3>
          </Link>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deal.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {deal.city}
              {deal.state ? `, ${deal.state}` : ''}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {t('responsesCount', { count: deal._count?.responses || 0 })}
            </div>
            {deal.status === 'ACTIVE' && !timeInfo.isExpired && (
              <div className="flex items-center gap-1 text-gold">
                <Clock className="w-4 h-4" />
                {timeInfo.text}
              </div>
            )}
            <div className="flex items-center gap-1">
              {t('posted')} {formatDate(deal.createdAt)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:ml-4">
          <Link
            href={`/hot-deals/${deal.id}`}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{t('view')}</span>
          </Link>

          {deal.status === 'ACTIVE' && onMarkFulfilled && (
            <button
              onClick={() => onMarkFulfilled(deal.id)}
              disabled={isThisDealLoading}
              className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {isThisDealLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('fulfill')}</span>
            </button>
          )}

          {(deal.status === 'ACTIVE' || deal.status === 'PENDING') && onCancel && (
            <button
              onClick={() => onCancel(deal.id)}
              disabled={isThisDealLoading}
              className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isThisDealLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('cancel')}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
