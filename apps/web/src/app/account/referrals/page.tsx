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
  ChevronRight,
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
  createdAt: string;
  referredUserRole: string;
  referred: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUALIFIED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-neutral-100 text-neutral-500',
};

export default function ReferralsPage() {
  const t = useTranslations('account.referrals');
  const { user, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (!authLoading && user) {
      load();
    }
  }, [authLoading, user, load]);

  const handleCopy = async () => {
    if (!summary?.referralCode) return;
    try {
      await navigator.clipboard.writeText(summary.referralCode);
      setCopied(true);
      toast.success(t('toast.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = summary.referralCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      toast.success(t('toast.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
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

  const handleShare = () => {
    if (!summary?.referralCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join NextPik',
        text: `Use my referral code ${summary.referralCode} to sign up on NextPik!`,
        url: `${window.location.origin}/auth/register?ref=${summary.referralCode}`,
      });
    } else {
      handleCopy();
    }
  };

  const storeCredit = Number(summary?.storeCredit || 0);
  const paidAmount = Number(summary?.paid?.amount || 0);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/buyer' }, { label: t('breadcrumb') }]}
      />

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-black to-neutral-800 rounded-xl p-6 text-white"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-[#CBB57B]" />
          <h2 className="text-sm font-semibold text-[#CBB57B] uppercase tracking-wider">
            {t('yourCode')}
          </h2>
        </div>
        <p className="text-sm text-neutral-300 mb-5">{t('shareDesc')}</p>

        {summary?.referralCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3">
              <span className="text-xl font-mono font-bold tracking-widest">
                {summary.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#CBB57B] hover:bg-[#b89d5e] text-black font-medium px-4 py-3 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-sm">{copied ? t('copied') : t('copy')}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-3 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{t('share')}</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-300 mb-4">{t('noCodeYet')}</p>
            <p className="text-sm text-neutral-400 mb-5">{t('generateDesc')}</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#CBB57B] hover:bg-[#b89d5e] text-black font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {isGenerating ? t('generating') : t('generateCode')}
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t('stats.totalReferrals'),
            value: summary?.totalReferrals ?? 0,
            icon: Users,
            format: 'number',
          },
          {
            label: t('stats.pending'),
            value: summary?.pending?.count ?? 0,
            icon: Clock,
            format: 'number',
          },
          {
            label: t('stats.earned'),
            value: paidAmount,
            icon: DollarSign,
            format: 'currency',
          },
          {
            label: t('stats.storeCredit'),
            value: storeCredit,
            icon: CreditCard,
            format: 'currency',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-neutral-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-neutral-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stat.format === 'currency' ? `$${Number(stat.value).toFixed(2)}` : stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">{t('history.title')}</h3>
        </div>

        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Gift className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-700">{t('history.empty')}</p>
            <p className="text-xs text-neutral-500 mt-1">{t('history.emptyDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  {(['name', 'role', 'status', 'reward', 'date'] as const).map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                    >
                      {t(`history.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {history.map((ref) => {
                  const name =
                    ref.referred.firstName || ref.referred.lastName
                      ? `${ref.referred.firstName || ''} ${ref.referred.lastName || ''}`.trim()
                      : ref.referred.email;
                  return (
                    <tr key={ref.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-neutral-900">{name}</td>
                      <td className="px-6 py-3 text-neutral-600">
                        {t(`role.${ref.referredUserRole}` as any) || ref.referredUserRole}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ref.status] || 'bg-neutral-100 text-neutral-500'}`}
                        >
                          {t(`status.${ref.status}` as any) || ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-neutral-900">
                        {ref.status === 'PAID' ? `$${Number(ref.rewardAmount).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-3 text-neutral-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-neutral-200 rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-neutral-900 mb-5">{t('howItWorks.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([1, 2, 3, 4] as const).map((step) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {t(`howItWorks.step${step}Title` as any)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t(`howItWorks.step${step}Desc` as any)}
                </p>
              </div>
              {step < 4 && (
                <ChevronRight className="w-4 h-4 text-neutral-300 self-center hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
