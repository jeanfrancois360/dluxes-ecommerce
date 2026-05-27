'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import PageHeader from '@/components/buyer/page-header';
import { referralApi } from '@/lib/api/referral';
import { toast } from '@/lib/utils/toast';
import {
  Gift,
  Copy,
  Check,
  Users,
  Clock,
  DollarSign,
  CreditCard,
  Share2,
  Ticket,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Link2,
  BadgeCheck,
  Zap,
} from 'lucide-react';

interface ReferralSummary {
  referralCode: string | null;
  codeActive: boolean;
  usageCount: number;
  maxUsage: number;
  storeCredit: number | string;
  totalReferrals: number;
  pending: { count: number; potentialEarnings: number | string };
  qualified: { count: number; amount: number | string };
  paid: { count: number; amount: number | string };
  expired: { count: number };
}

interface ReferralRecord {
  id: string;
  status: 'PENDING' | 'QUALIFIED' | 'PAID' | 'EXPIRED';
  rewardAmount: number | string;
  couponCode: string | null;
  createdAt: string;
  referredUserRole: string;
  referred: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Pending' },
  QUALIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', label: 'Qualified' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Paid' },
  EXPIRED: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    dot: 'bg-neutral-300',
    label: 'Expired',
  },
};

function Avatar({ name, email }: { name: string; email: string }) {
  const initials =
    name !== email
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : email.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

export default function ReferralsPage() {
  const t = useTranslations('account.referrals');
  const { user, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [redeemingCoupon, setRedeemingCoupon] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        referralApi.getReferralSummary(),
        referralApi.getReferralHistory({ limit: 50 }),
      ]);
      setSummary(summaryRes);
      setHistory(historyRes?.data || []);
    } catch {
      toast.error(t('toast.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading && user) load();
  }, [authLoading, user, load]);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(type);
    toast.success(type === 'code' ? t('toast.codeCopied') : 'Link copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await referralApi.generateReferralCode();
      await load();
    } catch {
      toast.error(t('toast.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedeemCoupon = async (code: string) => {
    try {
      setRedeemingCoupon(code);
      const result = await referralApi.redeemCoupon(code);
      toast.success(result.message || 'Coupon redeemed successfully');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to redeem coupon');
    } finally {
      setRedeemingCoupon(null);
    }
  };

  const handleShare = () => {
    if (!summary?.referralCode) return;
    const url = `${window.location.origin}/auth/register?ref=${summary.referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join NextPik',
        text: `Use my referral code ${summary.referralCode} to sign up on NextPik!`,
        url,
      });
    } else {
      copyToClipboard(url, 'link');
    }
  };

  const referralLink = summary?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://nextpik.com'}/auth/register?ref=${summary.referralCode}`
    : '';

  const storeCredit = Number(summary?.storeCredit || 0);
  const paidAmount = Number(summary?.paid?.amount || 0);
  const usageCount = summary?.usageCount ?? 0;
  const maxUsage = summary?.maxUsage ?? 0;
  const usagePct = maxUsage > 0 ? Math.min((usageCount / maxUsage) * 100, 100) : 0;

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/buyer' }, { label: t('breadcrumb') }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* ── Hero Card ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] text-white"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#CBB57B]/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#CBB57B]/5 blur-2xl" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(255,255,255,0.01)_40px,rgba(255,255,255,0.01)_41px)]" />
          </div>

          <div className="relative p-7 lg:p-9">
            {summary?.referralCode ? (
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Left: code info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-[#CBB57B]/20 flex items-center justify-center">
                      <Gift className="w-3.5 h-3.5 text-[#CBB57B]" />
                    </div>
                    <span className="text-xs font-semibold text-[#CBB57B] uppercase tracking-widest">
                      {t('yourCode')}
                    </span>
                    {summary.codeActive && (
                      <span className="ml-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl lg:text-5xl font-mono font-black tracking-[0.15em] text-white">
                      {summary.referralCode}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-400 mb-5 max-w-sm">{t('shareDesc')}</p>

                  {/* Referral link row */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-4 max-w-md">
                    <Link2 className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                    <span className="text-xs text-neutral-400 truncate flex-1">{referralLink}</span>
                    <button
                      onClick={() => copyToClipboard(referralLink, 'link')}
                      className="flex-shrink-0 text-xs text-[#CBB57B] hover:text-[#e8d49a] font-medium transition-colors"
                    >
                      {copied === 'link' ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>

                  {/* Usage bar */}
                  {maxUsage > 0 && (
                    <div className="max-w-sm">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                        <span>{usageCount} uses</span>
                        <span>{maxUsage} max</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#CBB57B] to-[#e8d49a] rounded-full transition-all duration-500"
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className="flex flex-row lg:flex-col gap-3 lg:min-w-[160px]">
                  <button
                    onClick={() => copyToClipboard(summary.referralCode!, 'code')}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#CBB57B] hover:bg-[#e8d49a] active:scale-95 text-black font-semibold px-5 py-3 rounded-xl transition-all text-sm"
                  >
                    {copied === 'code' ? (
                      <>
                        <Check className="w-4 h-4" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> {t('copy')} Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium px-5 py-3 rounded-xl transition-all text-sm border border-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('share')}
                  </button>
                </div>
              </div>
            ) : (
              /* No code yet */
              <div className="flex flex-col items-center text-center py-6 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#CBB57B]/15 flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-[#CBB57B]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('noCodeYet')}</h3>
                <p className="text-sm text-neutral-400 mb-6">{t('generateDesc')}</p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-[#CBB57B] hover:bg-[#e8d49a] active:scale-95 text-black font-semibold px-7 py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
                >
                  <Zap className="w-4 h-4" />
                  {isGenerating ? t('generating') : t('generateCode')}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: t('stats.totalReferrals'),
              value: summary?.totalReferrals ?? 0,
              icon: Users,
              format: 'number' as const,
              accent: 'text-violet-600',
              iconBg: 'bg-violet-50',
            },
            {
              label: t('stats.pending'),
              value: summary?.pending?.count ?? 0,
              icon: Clock,
              format: 'number' as const,
              accent: 'text-amber-600',
              iconBg: 'bg-amber-50',
            },
            {
              label: t('stats.earned'),
              value: paidAmount,
              icon: TrendingUp,
              format: 'currency' as const,
              accent: 'text-emerald-600',
              iconBg: 'bg-emerald-50',
            },
            {
              label: t('stats.storeCredit'),
              value: storeCredit,
              icon: CreditCard,
              format: 'currency' as const,
              accent: 'text-[#b89d5e]',
              iconBg: 'bg-[#CBB57B]/10',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <div
                    className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </div>
                <p className={`text-2xl font-black ${stat.accent}`}>
                  {stat.format === 'currency' ? `$${Number(stat.value).toFixed(2)}` : stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── History ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-neutral-100 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t('history.title')}</h3>
              {history.length > 0 && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {history.length} referral{history.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium text-neutral-700">${paidAmount.toFixed(2)}</span>
                <span>earned</span>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-neutral-300" />
              </div>
              <p className="text-sm font-semibold text-neutral-700 mb-1">{t('history.empty')}</p>
              <p className="text-xs text-neutral-400 max-w-xs">{t('history.emptyDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {history.map((ref, i) => {
                const name =
                  ref.referred.firstName || ref.referred.lastName
                    ? `${ref.referred.firstName || ''} ${ref.referred.lastName || ''}`.trim()
                    : ref.referred.email;
                const sc = STATUS_CONFIG[ref.status] ?? STATUS_CONFIG.EXPIRED;
                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50/70 transition-colors"
                  >
                    <Avatar name={name} email={ref.referred.email} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{name}</p>
                      <p className="text-xs text-neutral-400 truncate">{ref.referred.email}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>

                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-bold text-neutral-900">
                        {ref.status === 'PAID' ? `$${Number(ref.rewardAmount).toFixed(2)}` : '—'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {ref.couponCode && (
                      <div className="flex items-center gap-2 ml-2">
                        <span className="flex items-center gap-1 text-xs font-mono bg-neutral-100 px-2 py-1 rounded-lg border border-neutral-200 text-neutral-600">
                          <Ticket className="w-3 h-3" />
                          {ref.couponCode}
                        </span>
                        <button
                          onClick={() => handleRedeemCoupon(ref.couponCode!)}
                          disabled={redeemingCoupon === ref.couponCode}
                          className="text-xs font-semibold bg-black text-white px-3 py-1 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                        >
                          {redeemingCoupon === ref.couponCode ? 'Redeeming…' : 'Redeem'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-neutral-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#CBB57B]" />
            <h3 className="text-sm font-bold text-neutral-900">{t('howItWorks.title')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([1, 2, 3, 4] as const).map((step, i) => (
              <div key={step} className="relative flex flex-col items-start gap-3">
                {/* connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-4 left-[calc(100%+4px)] w-full h-px bg-neutral-100 z-0" />
                )}
                <div className="relative z-10 w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {t(`howItWorks.step${step}Title` as any)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {t(`howItWorks.step${step}Desc` as any)}
                  </p>
                </div>
                {i < 3 && (
                  <ArrowRight className="hidden sm:block lg:hidden absolute right-0 top-2 w-4 h-4 text-neutral-200" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
