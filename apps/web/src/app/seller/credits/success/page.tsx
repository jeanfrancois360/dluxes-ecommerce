'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, Coins, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import { creditsApi, CreditBalance } from '@/lib/api/credits';
import { useTranslations } from 'next-intl';

export default function CreditPurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('sellerCreditsSuccess');
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<CreditBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/seller/credits');
      return;
    }

    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#CBB57B', '#A89968', '#FFD700'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#CBB57B', '#A89968', '#FFD700'],
      });
    }, 50);

    // Fetch updated balance
    const fetchBalance = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const balance = await creditsApi.getBalance();
        setBalanceData(balance);
      } catch (error: any) {
        console.error('Failed to fetch balance:', error);
        setError(error.message || 'Failed to load balance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    return () => clearInterval(interval);
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#CBB57B] mx-auto mb-4" />
          <p className="text-gray-600">{t('processing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('errorTitle')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/seller/credits')}
            className="px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
          >
            {t('goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            {t('title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 mb-8"
          >
            {t('subtitle')}
          </motion.p>

          {/* Credit Balance */}
          {balanceData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-[#CBB57B] to-[#A89968] rounded-xl p-6 mb-8 text-white"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Coins className="w-6 h-6" />
                <h2 className="text-xl font-semibold">{t('newBalance')}</h2>
              </div>
              <div className="text-5xl font-bold mb-2">{balanceData.availableCredits}</div>
              <div className="text-sm opacity-90">
                {t('creditsAvailable', { count: balanceData.availableCredits })}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="opacity-90 mb-1">{t('lifetimeCredits')}</div>
                    <div className="text-lg font-semibold">{balanceData.lifetimeCredits}</div>
                  </div>
                  <div>
                    <div className="opacity-90 mb-1">{t('lifetimeUsed')}</div>
                    <div className="text-lg font-semibold">{balanceData.lifetimeUsed}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left"
          >
            <h3 className="font-semibold text-blue-900 mb-2">{t('whatCanYouDo')}</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {t('benefits.realEstate')}</li>
              <li>• {t('benefits.feature')}</li>
              <li>• {t('benefits.boost')}</li>
              <li>• {t('benefits.renew')}</li>
              <li>• {t('benefits.noExpiry')}</li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => router.push('/seller/products/new')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
            >
              <Package className="w-4 h-4" />
              {t('listProduct')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/seller/credits')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('viewHistory')}
            </button>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>{t('emailSent')}</p>
        </motion.div>
      </div>
    </div>
  );
}
