'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, Calendar, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/seller/selling-credits');
      return;
    }

    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

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

    // Verify and process purchase using session_id
    const fetchPurchaseInfo = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      // Retry up to 5 times with exponential backoff
      let attempts = 0;
      const maxAttempts = 5;

      const verifyPurchase = async (): Promise<void> => {
        try {
          const res = await fetch(
            `${API_URL}/seller/credits/verify-session?session_id=${sessionId}`,
            {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            }
          );

          const data = await res.json();

          if (res.ok && data.success) {
            // Successfully verified and processed
            setPurchaseData(data.data);
            setIsLoading(false);
            return;
          } else if (data.message?.includes('Payment not completed')) {
            // Payment not completed yet, retry
            if (attempts >= maxAttempts) {
              setError('Payment verification timed out. Please check your credit history.');
              setIsLoading(false);
              return;
            }

            // Wait with exponential backoff (2s, 4s, 8s, 16s, 32s)
            attempts++;
            const delay = Math.min(2000 * Math.pow(2, attempts - 1), 32000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return verifyPurchase();
          } else {
            // Other error
            setError(data.message || 'Failed to verify purchase. Please check your credit history.');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to verify purchase:', error);

          if (attempts >= maxAttempts) {
            setError('Unable to verify purchase. Please check your credit history or contact support.');
            setIsLoading(false);
            return;
          }

          // Retry with exponential backoff
          attempts++;
          const delay = Math.min(2000 * Math.pow(2, attempts - 1), 32000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return verifyPurchase();
        }
      };

      await verifyPurchase();
    };

    fetchPurchaseInfo();

    return () => clearInterval(interval);
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#CBB57B] mx-auto mb-4" />
          <p className="text-gray-600">Processing your purchase...</p>
          <p className="text-sm text-gray-500 mt-2">Waiting for payment confirmation...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
            Payment Successful!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 mb-8"
          >
            Your subscription has been added to your account
          </motion.p>

          {/* Purchase Details */}
          {purchaseData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-[#CBB57B] to-[#A89968] rounded-xl p-6 mb-8 text-white"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-xl font-semibold">New Subscription Balance</h2>
              </div>
              <div className="text-5xl font-bold mb-2">
                {purchaseData.creditsBalance}
              </div>
              <div className="text-sm opacity-90">
                month{purchaseData.creditsBalance !== 1 ? 's' : ''}
              </div>

              {purchaseData.creditsExpiresAt && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-center gap-2 text-sm opacity-90 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Valid Until</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatDate(purchaseData.creditsExpiresAt)}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left"
          >
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your products are now active and visible to buyers</li>
              <li>• Credits will be automatically deducted on the 1st of each month</li>
              <li>• You'll receive a notification when your balance is low</li>
              <li>• You can purchase more credits at any time</li>
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
              onClick={() => router.push('/seller/products')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
            >
              Manage Products
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/seller/selling-credits')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              View Credit History
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
          <p>A confirmation email has been sent to your registered email address</p>
        </motion.div>
      </div>
    </div>
  );
}
