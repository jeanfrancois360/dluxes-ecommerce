'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  User,
  Send,
  AlertCircle,
  Loader2,
  Flame,
  Share2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
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
  UrgencyLevel,
} from '@/lib/api/hot-deals';

// Urgency left-border colors
const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  NORMAL: 'border-l-gray-200',
  URGENT: 'border-l-[#CBB57B]',
  EMERGENCY: 'border-l-red-500',
};

// Live countdown hook
function useCountdown(expiresAt: string, t: ReturnType<typeof useTranslations>) {
  const [text, setText] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setText(t('expired'));
        setIsExpired(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setIsShort(diff < 2 * 3600000);
      setText(
        h > 0
          ? t('hoursRemaining', { hours: h, minutes: m })
          : t('minutesRemaining', { minutes: m })
      );
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt, t]);

  return { text, isExpired, isShort };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ResponseFormData {
  message: string;
  contactInfo?: string;
}

export default function HotDealDetailPage() {
  const t = useTranslations('pages.hotDealsDetail');
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<HotDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isMarkingFulfilled, setIsMarkingFulfilled] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResponseFormData>();

  useEffect(() => {
    async function fetchDeal() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await hotDealsApi.getOne(dealId);
        setDeal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeal();
  }, [dealId, t]);

  const onSubmitResponse = async (data: ResponseFormData) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/hot-deals/${dealId}`);
      return;
    }
    setIsSubmittingResponse(true);
    try {
      await hotDealsApi.respond(dealId, data);
      toast.success(t('responseSent'));
      reset();
      setShowResponseForm(false);
      const updatedDeal = await hotDealsApi.getOne(dealId);
      setDeal(updatedDeal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToSend'));
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleMarkFulfilled = async () => {
    if (!deal) return;
    setIsMarkingFulfilled(true);
    try {
      await hotDealsApi.markFulfilled(dealId);
      toast.success(t('markedFulfilled'));
      const updatedDeal = await hotDealsApi.getOne(dealId);
      setDeal(updatedDeal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('failedToMark'));
    } finally {
      setIsMarkingFulfilled(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: deal?.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 bg-gray-200 rounded" />
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex gap-2">
                  <div className="h-7 w-20 bg-gray-200 rounded-full" />
                  <div className="h-7 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-8 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('notFound')}</h2>
              <p className="text-gray-500 mb-6">{error || t('mayBeRemoved')}</p>
              <Link
                href="/hot-deals"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('backToHotDeals')}
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isOwner = user && user.id === deal.user.id;
  const hasResponded = deal.responses?.some((r) => r.user.id === user?.id);
  const canRespond = isAuthenticated && !isOwner && deal.status === 'ACTIVE' && !hasResponded;
  const responseCount = deal._count?.responses || 0;

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/hot-deals"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToHotDeals')}
              </Link>
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${URGENCY_BORDER[deal.urgency]}${isEmergency ? ' ring-1 ring-red-100' : ''}`}
              >
                {/* Badges + title */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
                    >
                      {isEmergency && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      )}
                      {urgencyConfig.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {CATEGORY_LABELS[deal.category]}
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {deal.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {deal.city}
                      {deal.state ? `, ${deal.state}` : ''}
                      {deal.zipCode ? ` ${deal.zipCode}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      {t('responsesCount', { count: responseCount })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('description')}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {deal.description}
                  </p>
                </div>

                {/* Contact info */}
                {isAuthenticated ? (
                  <div className="p-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      {t('contactInformation')}
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-800 font-medium">{deal.contactName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-gray-500" />
                        </div>
                        <a
                          href={`tel:${deal.contactPhone}`}
                          className="text-[#CBB57B] hover:text-[#b9a369] font-medium transition-colors"
                        >
                          {deal.contactPhone}
                        </a>
                        {deal.preferredContact === 'PHONE' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {t('preferred')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-gray-500" />
                        </div>
                        <a
                          href={`mailto:${deal.contactEmail}`}
                          className="text-[#CBB57B] hover:text-[#b9a369] font-medium transition-colors"
                        >
                          {deal.contactEmail}
                        </a>
                        {deal.preferredContact === 'EMAIL' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {t('preferred')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 text-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">{t('logInToSee')}</p>
                    <Link
                      href={`/auth/login?redirect=/hot-deals/${dealId}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors text-sm"
                    >
                      {t('logInToContinue')}
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Response form */}
              {canRespond && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  {!showResponseForm ? (
                    <button
                      onClick={() => setShowResponseForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      {t('respondToRequest')}
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmitResponse)}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('sendYourResponse')}
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('yourMessage')} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            {...register('message', {
                              required: t('messageRequired'),
                              minLength: { value: 20, message: t('messageMin') },
                              maxLength: { value: 500, message: t('messageMax') },
                            })}
                            rows={4}
                            placeholder={t('messagePlaceholder')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none resize-none"
                          />
                          {errors.message && (
                            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('yourContactInfo')}
                          </label>
                          <textarea
                            {...register('contactInfo')}
                            rows={2}
                            placeholder={t('contactPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResponseForm(false);
                              reset();
                            }}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingResponse}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                          >
                            {isSubmittingResponse ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                            {t('sendResponse')}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Already responded */}
              {hasResponded && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{t('alreadyResponded')}</p>
                  </div>
                </div>
              )}

              {/* Responses list (owner only) */}
              {isOwner && deal.responses && deal.responses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('responses', { count: deal.responses.length })}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {deal.responses.map((response) => (
                      <div key={response.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <p className="font-semibold text-gray-900 text-sm">
                                {response.user.firstName} {response.user.lastName}
                              </p>
                              <p className="text-xs text-gray-400 flex-shrink-0">
                                {formatDate(response.createdAt)}
                              </p>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                              {response.message}
                            </p>
                            {response.contactInfo && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                  {t('contactInfo')}
                                </p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {response.contactInfo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6 sticky top-6 space-y-6"
              >
                {/* Posted by */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {t('postedBy')}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {deal.user.firstName} {deal.user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(deal.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Live countdown */}
                {deal.status === 'ACTIVE' && <SidebarCountdown expiresAt={deal.expiresAt} t={t} />}

                {/* Owner: mark fulfilled */}
                {isOwner && deal.status === 'ACTIVE' && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleMarkFulfilled}
                      disabled={isMarkingFulfilled}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isMarkingFulfilled ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {t('markAsFulfilled')}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">{t('markHelper')}</p>
                  </div>
                )}

                {/* Fulfilled / Expired status messages */}
                {deal.status === 'FULFILLED' && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{statusConfig.label}</span>
                  </div>
                )}
                {deal.status === 'EXPIRED' && (
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-50 rounded-xl p-3">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{statusConfig.label}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Sidebar countdown component with live ticking
function SidebarCountdown({
  expiresAt,
  t,
}: {
  expiresAt: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { text, isExpired, isShort } = useCountdown(expiresAt, t);

  if (isExpired) return null;

  return (
    <div
      className={`rounded-xl p-4 ${isShort ? 'bg-red-50 border border-red-100' : 'bg-[#CBB57B]/10 border border-[#CBB57B]/20'}`}
    >
      <div className={`flex items-center gap-2 ${isShort ? 'text-red-600' : 'text-[#CBB57B]'}`}>
        <Clock className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold">{text}</p>
      </div>
      <p className={`text-xs mt-1 ${isShort ? 'text-red-400' : 'text-[#CBB57B]/70'}`}>
        {t('expiresAutomatically')}
      </p>
    </div>
  );
}
