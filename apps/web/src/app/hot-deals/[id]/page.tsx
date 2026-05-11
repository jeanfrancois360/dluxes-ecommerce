'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Lock,
  XCircle,
  DollarSign,
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
  BudgetType,
} from '@/lib/api/hot-deals';

// ─── Urgency config ────────────────────────────────────────────────────────────

const URGENCY_THEME: Record<
  UrgencyLevel,
  {
    topBar: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    timerBg: string;
    timerText: string;
  }
> = {
  NORMAL: {
    topBar: 'bg-gray-300',
    accent: 'text-gray-600',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    timerBg: 'bg-gray-50 border-gray-200',
    timerText: 'text-gray-700',
  },
  URGENT: {
    topBar: 'bg-gradient-to-r from-[#CBB57B] to-amber-400',
    accent: 'text-[#CBB57B]',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    timerBg: 'border-[#CBB57B]/25',
    timerText: 'text-[#8B7355]',
  },
  EMERGENCY: {
    topBar: 'bg-gradient-to-r from-red-500 to-rose-400',
    accent: 'text-red-600',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    timerBg: 'bg-red-50 border-red-200',
    timerText: 'text-red-700',
  },
};

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(expiresAt: string, t: ReturnType<typeof useTranslations>) {
  const [text, setText] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isShort, setIsShort] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(24);

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setText(t('expired'));
        setIsExpired(true);
        setHoursLeft(0);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setHoursLeft(h);
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

  return { text, isExpired, isShort, hoursLeft };
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

// ─── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) return null;

  const prev = () => setActive((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActive((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
        {/* Main image */}
        <div
          className="relative aspect-video bg-gray-100 cursor-zoom-in"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[active]}
            alt={`Image ${active + 1}`}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            <ImageIcon className="w-3 h-3" />
            {active + 1}/{images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-gray-50">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  i === active
                    ? 'border-[#CBB57B]'
                    : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <img
              src={images[active]}
              alt=""
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sidebar Countdown ────────────────────────────────────────────────────────

function SidebarCountdown({
  expiresAt,
  t,
}: {
  expiresAt: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { text, isExpired, isShort, hoursLeft } = useCountdown(expiresAt, t);

  if (isExpired) return null;

  const pct = Math.min(100, Math.round((hoursLeft / 24) * 100));
  const barColor = isShort ? 'bg-red-400' : 'bg-[#CBB57B]';

  return (
    <div
      className={`rounded-xl border p-4 ${isShort ? 'bg-red-50 border-red-200' : 'bg-amber-50/60 border-[#CBB57B]/25'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-4 h-4 flex-shrink-0 ${isShort ? 'text-red-500' : 'text-[#CBB57B]'}`} />
        <p className={`text-sm font-bold ${isShort ? 'text-red-700' : 'text-[#8B7355]'}`}>{text}</p>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs ${isShort ? 'text-red-400' : 'text-[#CBB57B]/70'}`}>
        {t('expiresAutomatically')}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-[#F8F7F4]">
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-5 animate-pulse">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="flex gap-2">
                    <div className="h-7 w-20 bg-gray-200 rounded-full" />
                    <div className="h-7 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-8 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-5/6 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="animate-pulse">
                <div className="bg-white rounded-2xl h-64" />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (error || !deal) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 rounded-2xl mx-auto mb-5 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('notFound')}</h2>
            <p className="text-gray-500 text-sm mb-7">{error || t('mayBeRemoved')}</p>
            <Link
              href="/hot-deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToHotDeals')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const urgencyTheme = URGENCY_THEME[deal.urgency];
  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];
  const isEmergency = deal.urgency === 'EMERGENCY';
  const isUrgent = deal.urgency === 'URGENT';
  const isOwner = user && user.id === deal.user.id;
  const hasResponded = deal.responses?.some((r) => r.user.id === user?.id);
  const canRespond = isAuthenticated && !isOwner && deal.status === 'ACTIVE' && !hasResponded;
  const responseCount = deal._count?.responses || 0;
  const images = deal.images as string[] | undefined;
  const budget = deal.budget;
  const budgetType = deal.budgetType as BudgetType | null | undefined;

  const initials =
    `${deal.user.firstName?.[0] ?? ''}${deal.user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-[#F8F7F4]">
        {/* ── Top nav bar ───────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between">
              <Link
                href="/hot-deals"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToHotDeals')}
              </Link>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Urgency strip ─────────────────────────────────────────────────── */}
        <div className={`h-1 ${urgencyTheme.topBar}`} />

        {/* ── Content grid ──────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Main column ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Deal header card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 sm:p-7">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${urgencyTheme.badgeBg} ${urgencyTheme.badgeText}`}
                    >
                      {isEmergency && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
                      )}
                      {isUrgent && <Zap className="w-3 h-3 flex-shrink-0" />}
                      {urgencyConfig.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {CATEGORY_LABELS[deal.category]}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">
                    {deal.title}
                  </h1>

                  {/* Budget pill */}
                  {(budget || budgetType) && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          {budget
                            ? `$${budget.toFixed(2)}${budgetType === 'HOURLY' ? '/hr' : ''}`
                            : ''}
                        </span>
                        {budgetType && (
                          <span className="text-xs text-green-500 font-medium capitalize border-l border-green-200 pl-2 ml-0.5">
                            {budgetType === 'HOURLY'
                              ? 'Per hour'
                              : budgetType === 'FIXED'
                                ? 'Fixed budget'
                                : 'Negotiable'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {deal.city}
                      {deal.state ? `, ${deal.state}` : ''}
                      {deal.zipCode ? ` ${deal.zipCode}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle
                        className={`w-4 h-4 flex-shrink-0 ${responseCount > 0 ? 'text-[#CBB57B]' : 'text-gray-400'}`}
                      />
                      <span className={responseCount > 0 ? 'font-semibold text-gray-700' : ''}>
                        {t('responsesCount', { count: responseCount })}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {formatDate(deal.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Image gallery */}
              {images && images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <ImageGallery images={images} />
                </motion.div>
              )}

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7"
              >
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {t('description')}
                </h2>
                <p className="text-gray-700 text-[15px] whitespace-pre-wrap leading-relaxed">
                  {deal.description}
                </p>
              </motion.div>

              {/* Contact info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 sm:p-7">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                    {t('contactInformation')}
                  </h2>

                  {isAuthenticated ? (
                    <div className="space-y-3">
                      {/* Name */}
                      <div className="group flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-100">
                          <User className="w-4.5 h-4.5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Contact Name
                          </p>
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {deal.contactName}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <a
                        href={`tel:${deal.contactPhone}`}
                        className="group flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#CBB57B]/40 hover:bg-amber-50/30 transition-all block"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #CBB57B22, #CBB57B0D)' }}
                        >
                          <Phone className="w-4 h-4" style={{ color: '#CBB57B' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Phone
                          </p>
                          <p className="text-sm font-bold truncate" style={{ color: '#8B7355' }}>
                            {deal.contactPhone}
                          </p>
                        </div>
                        {(deal.preferredContact === 'PHONE' ||
                          deal.preferredContact === 'BOTH') && (
                          <span
                            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: 'linear-gradient(135deg, #CBB57B22, #CBB57B11)',
                              color: '#8B7355',
                              border: '1px solid #CBB57B44',
                            }}
                          >
                            ★ {t('preferred')}
                          </span>
                        )}
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:${deal.contactEmail}`}
                        className="group flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all block"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-50">
                          <Mail className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Email
                          </p>
                          <p className="text-sm font-bold text-blue-600 truncate">
                            {deal.contactEmail}
                          </p>
                        </div>
                        {(deal.preferredContact === 'EMAIL' ||
                          deal.preferredContact === 'BOTH') && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200">
                            ★ {t('preferred')}
                          </span>
                        )}
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-sm mb-4 max-w-xs">{t('logInToSee')}</p>
                      <Link
                        href={`/auth/login?redirect=/hot-deals/${dealId}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                      >
                        {t('logInToContinue')}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Already responded */}
              {hasResponded && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-green-800 font-medium text-sm">{t('alreadyResponded')}</p>
                </motion.div>
              )}

              {/* Response form */}
              {canRespond && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {!showResponseForm ? (
                    <div className="p-6">
                      <button
                        onClick={() => setShowResponseForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                        style={{ backgroundColor: '#CBB57B', color: '#000' }}
                      >
                        <Send className="w-4 h-4" />
                        {t('respondToRequest')}
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-7">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-gray-900">
                          {t('sendYourResponse')}
                        </h2>
                        <button
                          onClick={() => {
                            setShowResponseForm(false);
                            reset();
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <form onSubmit={handleSubmit(onSubmitResponse)} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none resize-none transition-colors bg-gray-50 focus:bg-white"
                          />
                          {errors.message && (
                            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.message.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            {t('yourContactInfo')}
                          </label>
                          <textarea
                            {...register('contactInfo')}
                            rows={2}
                            placeholder={t('contactPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#CBB57B]/30 focus:border-[#CBB57B] outline-none resize-none transition-colors bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResponseForm(false);
                              reset();
                            }}
                            className="flex-1 px-5 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingResponse}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#111827', color: '#fff' }}
                          >
                            {isSubmittingResponse ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            {t('sendResponse')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Responses list (owner only) */}
              {isOwner && deal.responses && deal.responses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="px-6 sm:px-7 py-5 border-b border-gray-100 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#CBB57B]" />
                    <h2 className="text-sm font-bold text-gray-900">
                      {t('responses', { count: deal.responses.length })}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {deal.responses.map((response, idx) => {
                      const isNew =
                        Date.now() - new Date(response.createdAt).getTime() < 24 * 3600 * 1000;
                      const avatarColors = [
                        'from-[#CBB57B] to-amber-400',
                        'from-violet-400 to-purple-500',
                        'from-blue-400 to-cyan-400',
                        'from-green-400 to-emerald-500',
                        'from-rose-400 to-pink-500',
                      ];
                      const gradient = avatarColors[idx % avatarColors.length];
                      return (
                        <div key={response.id} className="p-6 sm:p-7">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div
                              className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black text-white shadow-sm`}
                            >
                              {response.user.firstName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="font-bold text-gray-900 text-sm truncate">
                                    {response.user.firstName} {response.user.lastName}
                                  </p>
                                  {isNew && (
                                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 flex-shrink-0">
                                  {formatDate(response.createdAt)}
                                </p>
                              </div>
                              {/* Message */}
                              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                {response.message}
                              </p>
                              {/* Contact info sub-card */}
                              {response.contactInfo && (
                                <div
                                  className="rounded-xl p-3.5 border"
                                  style={{
                                    background: 'linear-gradient(135deg, #CBB57B08, #CBB57B04)',
                                    borderColor: '#CBB57B22',
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Phone className="w-3 h-3 text-[#CBB57B]" />
                                    <p
                                      className="text-[10px] font-bold uppercase tracking-widest"
                                      style={{ color: '#8B7355' }}
                                    >
                                      {t('contactInfo')}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap font-medium">
                                    {response.contactInfo}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6 space-y-5"
              >
                {/* Posted by */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {t('postedBy')}
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #CBB57B33, #CBB57B18)',
                        color: '#8B7355',
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {deal.user.firstName} {deal.user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(deal.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Countdown */}
                {deal.status === 'ACTIVE' && <SidebarCountdown expiresAt={deal.expiresAt} t={t} />}

                {/* Status badges for non-active */}
                {deal.status === 'FULFILLED' && (
                  <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-green-800">
                      {statusConfig.label}
                    </span>
                  </div>
                )}
                {deal.status === 'EXPIRED' && (
                  <div className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-600">
                      {statusConfig.label}
                    </span>
                  </div>
                )}
                {deal.status === 'CANCELLED' && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-700">{statusConfig.label}</span>
                  </div>
                )}

                {/* Owner: mark fulfilled */}
                {isOwner && deal.status === 'ACTIVE' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleMarkFulfilled}
                      disabled={isMarkingFulfilled}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#16a34a', color: '#fff' }}
                    >
                      {isMarkingFulfilled ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {t('markAsFulfilled')}
                    </button>
                    <p className="text-xs text-gray-400 text-center">{t('markHelper')}</p>
                  </div>
                )}

                {/* Non-owner respond CTA in sidebar */}
                {canRespond && !showResponseForm && (
                  <button
                    onClick={() => setShowResponseForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                    style={{ backgroundColor: '#CBB57B', color: '#000' }}
                  >
                    <Flame className="w-4 h-4" />I can help!
                  </button>
                )}

                {/* Stats */}
                <div
                  className={`grid gap-3 pt-1 ${budget || budgetType ? 'grid-cols-1' : 'grid-cols-2'}`}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-gray-900">{responseCount}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Responses</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black" style={{ color: '#CBB57B' }}>
                        $1
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Posted for</p>
                    </div>
                  </div>
                  {(budget || budgetType) && (
                    <div
                      className="rounded-xl p-3 text-center border"
                      style={{
                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        borderColor: '#bbf7d0',
                      }}
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-xl font-black text-green-700">
                          {budget ? `$${budget % 1 === 0 ? budget : budget.toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <p className="text-[11px] text-green-600 font-medium">
                        {budgetType === 'HOURLY'
                          ? 'Per hour'
                          : budgetType === 'FIXED'
                            ? 'Fixed budget'
                            : 'Negotiable'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
