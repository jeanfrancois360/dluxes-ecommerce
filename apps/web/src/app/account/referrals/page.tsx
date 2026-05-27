'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  AlertCircle,
  Banknote,
  Lock,
} from 'lucide-react';

type RewardType = 'STORE_CREDIT' | 'COUPON' | 'FLAT_COMMISSION';

interface ReferralSummary {
  referralCode: string | null;
  codeActive: boolean;
  usageCount: number;
  maxUsage: number;
  preferredRewardType: RewardType | null;
  storeCredit: number | string;
  totalReferrals: number;
  pending: { count: number; potentialEarnings: number | string };
  qualified: { count: number; amount: number | string };
  paid: { count: number; amount: number | string };
  expired: { count: number };
}

interface ReferralSettings {
  enabled: boolean;
  rewardType: string;
  allowUserChoice: boolean;
  buyerReward: number;
  sellerReward: number;
  currency: string;
}

const REWARD_OPTIONS: {
  value: RewardType;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'STORE_CREDIT',
    label: 'Store Credit',
    desc: 'Added directly to your wallet. Use at checkout anytime.',
    icon: DollarSign,
  },
  {
    value: 'COUPON',
    label: 'Discount Coupon',
    desc: 'A single-use coupon code for your reward amount.',
    icon: Ticket,
  },
  {
    value: 'FLAT_COMMISSION',
    label: 'Cash Commission',
    desc: 'Real cash queued for transfer (bank, Stripe, or PayPal).',
    icon: Banknote,
  },
];

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
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [redeemingCoupon, setRedeemingCoupon] = useState<string | null>(null);
  const [savingRewardType, setSavingRewardType] = useState<RewardType | null>(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const [summaryRes, historyRes, settingsRes] = await Promise.all([
          referralApi.getReferralSummary(),
          referralApi.getReferralHistory({ limit: 50 }),
          referralApi.getReferralSettings(),
        ]);
        setSummary(summaryRes);
        // handleResponse already unwraps { success, data } → returns the array directly
        setHistory(Array.isArray(historyRes) ? historyRes : (historyRes as any)?.data || []);
        setSettings(settingsRes as ReferralSettings);
      } catch {
        if (!silent) toast.error(t('toast.loadError'));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [t]
  );

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
      setGenerateError(null);
      const result = await referralApi.generateReferralCode();
      const code = result?.code;
      if (code) {
        // Immediately show the code — don't wait for a full reload
        setSummary((prev) => ({
          referralCode: code,
          codeActive: true,
          usageCount: 0,
          maxUsage: prev?.maxUsage ?? 0,
          preferredRewardType: prev?.preferredRewardType ?? null,
          storeCredit: prev?.storeCredit ?? 0,
          totalReferrals: prev?.totalReferrals ?? 0,
          pending: prev?.pending ?? { count: 0, potentialEarnings: 0 },
          qualified: prev?.qualified ?? { count: 0, amount: 0 },
          paid: prev?.paid ?? { count: 0, amount: 0 },
          expired: prev?.expired ?? { count: 0 },
        }));
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 4000);
        // Auto-copy for instant usability
        try {
          await navigator.clipboard.writeText(code);
          toast.success(`Code ${code} created and copied to clipboard!`);
        } catch {
          toast.success(`Referral code ${code} created!`);
        }
        // Background refresh — no spinner
        load(true);
      } else {
        // Fallback: full reload
        await load();
        toast.success(t('toast.codeGenerated') || 'Referral code created!');
      }
    } catch (err: any) {
      const msg = err?.message || t('toast.generateError');
      setGenerateError(msg);
      toast.error(msg);
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

  const handleSelectRewardType = async (type: RewardType) => {
    if (savingRewardType || summary?.preferredRewardType === type) return;
    try {
      setSavingRewardType(type);
      await referralApi.updatePreferredRewardType(type);
      setSummary((prev) => (prev ? { ...prev, preferredRewardType: type } : prev));
      const label = REWARD_OPTIONS.find((o) => o.value === type)?.label ?? type;
      toast.success(`Reward preference set to ${label}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save reward preference');
    } finally {
      setSavingRewardType(null);
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
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#CBB57B]/8 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#CBB57B]/5 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.015] blur-2xl" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_60px,rgba(255,255,255,0.008)_60px,rgba(255,255,255,0.008)_61px)]" />
          </div>

          <div className="relative p-7 lg:p-10">
            {summary?.referralCode ? (
              <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                {/* Left: code info */}
                <div className="flex-1 min-w-0">
                  {/* Label row */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-[#CBB57B]/20 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-[#CBB57B]" />
                    </div>
                    <span className="text-xs font-bold text-[#CBB57B] uppercase tracking-widest">
                      {t('yourCode')}
                    </span>
                    {summary.codeActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Active
                      </span>
                    )}
                    {justGenerated && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#CBB57B] bg-[#CBB57B]/15 border border-[#CBB57B]/30 px-2.5 py-1 rounded-full animate-pulse">
                        <Sparkles className="w-3 h-3" /> Just created!
                      </span>
                    )}
                  </div>

                  {/* Code block — the hero element */}
                  <div className="relative mb-5">
                    <div
                      className={[
                        'flex items-center justify-between bg-white/[0.06] border rounded-2xl px-6 py-5 transition-all duration-500',
                        justGenerated
                          ? 'border-[#CBB57B]/60 shadow-[0_0_40px_rgba(203,181,123,0.15)]'
                          : 'border-white/10',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'text-lg sm:text-xl font-mono font-bold tracking-[0.12em] transition-all duration-500',
                          justGenerated
                            ? 'text-[#e8d49a] drop-shadow-[0_0_20px_rgba(203,181,123,0.5)]'
                            : 'text-white',
                        ].join(' ')}
                      >
                        {summary.referralCode}
                      </span>
                      <button
                        onClick={() => copyToClipboard(summary.referralCode!, 'code')}
                        className={[
                          'flex-shrink-0 ml-4 flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95',
                          copied === 'code'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#CBB57B] hover:bg-[#e8d49a] text-black',
                        ].join(' ')}
                      >
                        {copied === 'code' ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-400 mb-5 max-w-md leading-relaxed">
                    {t('shareDesc')}
                  </p>

                  {/* Referral link row */}
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 mb-4 max-w-lg group hover:border-white/15 transition-colors">
                    <Link2 className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                    <span className="text-xs text-neutral-500 truncate flex-1 font-mono">
                      {referralLink}
                    </span>
                    <button
                      onClick={() => copyToClipboard(referralLink, 'link')}
                      className="flex-shrink-0 text-xs text-[#CBB57B] hover:text-[#e8d49a] font-semibold transition-colors whitespace-nowrap"
                    >
                      {copied === 'link' ? '✓ Copied' : 'Copy link'}
                    </button>
                  </div>

                  {/* Usage bar */}
                  {maxUsage > 0 && (
                    <div className="max-w-sm">
                      <div className="flex justify-between text-xs text-neutral-600 mb-1.5">
                        <span>
                          {usageCount} use{usageCount !== 1 ? 's' : ''}
                        </span>
                        <span>{maxUsage} max</span>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#CBB57B] to-[#e8d49a] rounded-full transition-all duration-700"
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: share action */}
                <div className="flex flex-row lg:flex-col gap-3 lg:min-w-[148px] lg:pt-14">
                  <button
                    onClick={handleShare}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 active:scale-95 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm border border-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('share')}
                  </button>
                </div>
              </div>
            ) : (
              /* ── No code yet — world-class empty state ── */
              <div className="flex flex-col items-center text-center py-8 max-w-lg mx-auto">
                {/* Animated icon */}
                <div className="relative w-20 h-20 mb-7">
                  <div className="absolute inset-0 rounded-2xl bg-[#CBB57B]/10 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CBB57B]/25 to-[#CBB57B]/8 border border-[#CBB57B]/20 flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-[#CBB57B]" />
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                  Turn your network into rewards
                </h3>
                <p className="text-sm text-neutral-400 mb-8 max-w-sm leading-relaxed">
                  Get a unique code, share it with friends, and earn every time someone signs up and
                  shops on NextPik.
                </p>

                {/* Feature preview */}
                <div className="grid grid-cols-3 gap-3 w-full mb-8">
                  {[
                    { icon: Zap, label: 'Instant code', desc: 'Ready in seconds' },
                    { icon: Gift, label: 'Real rewards', desc: 'Per qualified referral' },
                    { icon: TrendingUp, label: 'Live tracking', desc: 'Full dashboard' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="bg-white/5 border border-white/8 rounded-xl p-3.5 text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#CBB57B]/15 flex items-center justify-center mb-2.5">
                        <Icon className="w-3.5 h-3.5 text-[#CBB57B]" />
                      </div>
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2.5 bg-[#CBB57B] hover:bg-[#e8d49a] active:scale-95 text-black font-bold px-8 py-3.5 rounded-xl transition-all disabled:opacity-60 text-sm shadow-[0_8px_32px_rgba(203,181,123,0.25)]"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {isGenerating ? t('generating') : t('generateCode')}
                </button>

                {generateError && (
                  <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl px-4 py-3 max-w-xs text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{generateError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Reward Type Picker (shown when user has a code) ──────────────── */}
        {summary?.referralCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-neutral-100 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Reward Preference</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {settings?.allowUserChoice
                    ? 'Choose how you want to receive your referral rewards'
                    : 'Your reward type is set by the platform'}
                </p>
              </div>
              {!settings?.allowUserChoice && (
                <span className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Platform default
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REWARD_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                // Current effective preference: user's choice if set, else platform default
                const platformDefault =
                  settings?.rewardType?.toUpperCase().replace('-', '_') ?? 'STORE_CREDIT';
                const effectiveType = summary.preferredRewardType ?? platformDefault;
                const isSelected = effectiveType === opt.value;
                const isSaving = savingRewardType === opt.value;
                const disabled = !settings?.allowUserChoice || !!savingRewardType;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => settings?.allowUserChoice && handleSelectRewardType(opt.value)}
                    disabled={disabled}
                    className={[
                      'relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-black bg-black/[0.03]'
                        : 'border-neutral-100 bg-neutral-50',
                      settings?.allowUserChoice && !savingRewardType
                        ? 'hover:border-neutral-400 cursor-pointer'
                        : 'cursor-default',
                    ].join(' ')}
                  >
                    {/* Selected check */}
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}

                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${isSelected ? 'text-black' : 'text-neutral-600'}`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

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
