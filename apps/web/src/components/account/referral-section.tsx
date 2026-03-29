'use client';

import { useState } from 'react';
import { useReferralSummary, useReferralSettings } from '@/hooks/use-referral';
import { referralApi } from '@/lib/api/referral';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { Copy, Check, Share2, Gift, Clock, CheckCircle, DollarSign } from 'lucide-react';

/**
 * Referral Section Component (v2.11.0)
 * User dashboard for referral code sharing and earnings tracking
 * ZERO HARDCODED AMOUNTS - All values from API
 */

export function ReferralSection() {
  const { summary, isLoading: summaryLoading, mutate } = useReferralSummary();
  const { settings, isLoading: settingsLoading } = useReferralSettings();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isLoading = summaryLoading || settingsLoading;

  // Handle generate referral code
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await referralApi.generateReferralCode();
      mutate(); // Refresh data
    } catch (error) {
      console.error('Failed to generate referral code:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Handle copy referral code
  const handleCopy = async () => {
    if (!summary?.referralCode) return;

    const shareUrl = `${window.location.origin}/auth/register?ref=${summary.referralCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    if (!summary?.referralCode || !settings) return;

    const shareUrl = `${window.location.origin}/auth/register?ref=${summary.referralCode}`;
    const message = `Join NextPik and get ${formatCurrencyAmount(settings.buyerReward, settings.currency)} off your first order! Use my referral code: ${summary.referralCode}\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings?.enabled) {
    return null; // Don't show section if referrals are disabled
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Referral Program</h2>
          <p className="text-sm text-gray-500 mt-1">Share your code and earn rewards</p>
        </div>
        <Gift className="w-8 h-8 text-blue-600" />
      </div>

      {/* Referral Code Card */}
      {summary?.referralCode ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your Referral Code</p>
              <div className="flex items-center gap-3">
                <code className="text-3xl font-bold text-blue-600 tracking-wider">
                  {summary.referralCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Copy referral link"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            {/* Usage Stats */}
            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm text-gray-600">
                Used <span className="font-semibold text-gray-900">{summary.usageCount}</span> times
                {summary.maxUsage > 0 &&
                  ` • ${summary.maxUsage - summary.usageCount} uses remaining`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">You don't have a referral code yet</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Referral Code'}
          </button>
        </div>
      )}

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
              PENDING
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrencyAmount(
              Number(summary?.pending?.potentialEarnings || 0),
              settings.currency
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {summary?.pending?.count || 0} referrals waiting to qualify
          </p>
        </div>

        {/* Qualified */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
              QUALIFIED
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrencyAmount(Number(summary?.qualified?.amount || 0), settings.currency)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {summary?.qualified?.count || 0} qualified referrals
          </p>
        </div>

        {/* Paid */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
              PAID
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrencyAmount(Number(summary?.paid?.amount || 0), settings.currency)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{summary?.paid?.count || 0} rewards earned</p>
        </div>
      </div>

      {/* Total Store Credit */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Available Store Credit</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrencyAmount(Number(summary?.storeCredit || 0), settings.currency)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Can be used on your next purchase</p>
          </div>
          <DollarSign className="w-12 h-12 text-purple-400" />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            <p>Share your referral code with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </div>
            <p>
              They get{' '}
              <strong>{formatCurrencyAmount(settings.buyerReward, settings.currency)}</strong> off
              their first order (minimum{' '}
              {formatCurrencyAmount(settings.minOrderValue, settings.currency)})
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
            <p>
              You earn{' '}
              <strong>{formatCurrencyAmount(settings.buyerReward, settings.currency)}</strong> store
              credit after their purchase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
