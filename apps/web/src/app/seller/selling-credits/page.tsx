'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
  DollarSign,
  Package,
  Gift,
  MinusCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface CreditBalance {
  creditsBalance: number;
  creditsExpiresAt: string | null;
  creditsLastDeducted: string | null;
  creditsGraceEndsAt: string | null;
  canPurchase: boolean;
  isInGracePeriod: boolean;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'DEDUCTION' | 'REFUND' | 'ADJUSTMENT' | 'BONUS';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  amountPaid?: number;
  currency?: string;
  description?: string;
  createdAt: string;
}

const TRANSACTION_ICONS = {
  PURCHASE: Package,
  DEDUCTION: MinusCircle,
  REFUND: DollarSign,
  ADJUSTMENT: TrendingUp,
  BONUS: Gift,
};

const TRANSACTION_COLORS = {
  PURCHASE: 'text-green-600 bg-green-50 border-green-200',
  DEDUCTION: 'text-gray-600 bg-gray-50 border-gray-200',
  REFUND: 'text-blue-600 bg-blue-50 border-blue-200',
  ADJUSTMENT: 'text-purple-600 bg-purple-50 border-purple-200',
  BONUS: 'text-yellow-600 bg-yellow-50 border-yellow-200',
};

export default function SellingCreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch credit balance
  const { data: balanceData, error: balanceError, mutate: mutateBalance } = useSWR<{ data: CreditBalance }>(
    `${API_URL}/seller/credits`,
    fetcher,
    {
      refreshInterval: 30000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('Failed to fetch balance:', err);
        toast.error('Please log in as a seller to view credits');
      },
    }
  );

  // Fetch credit price
  const { data: priceData, error: priceError } = useSWR<{ data: { pricePerMonth: number } }>(
    `${API_URL}/seller/credits/price`,
    fetcher,
    {
      shouldRetryOnError: false,
      onError: (err) => console.error('Failed to fetch price:', err),
    }
  );

  // Fetch transaction history
  const { data: historyData, error: historyError, mutate: mutateHistory } = useSWR<{
    data: { transactions: Transaction[]; pagination: any };
  }>(`${API_URL}/seller/credits/history?page=${historyPage}&limit=10`, fetcher, {
    shouldRetryOnError: false,
    onError: (err) => console.error('Failed to fetch history:', err),
  });

  const balance = balanceData?.data;
  const price = priceData?.data?.pricePerMonth || 29.99;
  const history = historyData?.data;

  // Handle canceled purchase
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.error('Purchase canceled');
      router.replace('/seller/selling-credits');
    }
  }, [searchParams, router]);

  // Calculate days remaining
  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (selectedMonths < 1 || selectedMonths > 12) {
      toast.error('Please select between 1 and 12 months');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      toast.error('Please log in to purchase credits');
      router.push('/auth/login');
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch(`${API_URL}/seller/credits/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ months: selectedMonths }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const response = await res.json();
      const sessionUrl = response.data?.sessionUrl || response.sessionUrl;

      if (sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to start checkout');
      setIsPurchasing(false);
    }
  };

  // Error state
  if (balanceError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in as a seller to view your selling credits.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-[#CBB57B] text-white rounded-lg font-semibold hover:bg-[#A89968] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!balance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CBB57B]" />
      </div>
    );
  }

  const totalPrice = selectedMonths * price;
  const expiryDays = getDaysRemaining(balance.creditsExpiresAt);
  const graceDays = getDaysRemaining(balance.creditsGraceEndsAt);

  // Calculate dynamic max months (round up to nearest 12)
  const getMaxMonths = (currentBalance: number) => {
    if (currentBalance <= 12) return 12;
    return Math.ceil(currentBalance / 12) * 12;
  };

  const maxMonths = getMaxMonths(balance.creditsBalance);
  const progressPercent = balance.creditsBalance > 0 ? (balance.creditsBalance / maxMonths) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Selling Credits</h1>
          <p className="text-gray-600">
            Manage your monthly subscription credits to keep your products active
          </p>
        </motion.div>

        {/* Grace Period Alert */}
        <AnimatePresence>
          {balance.isInGracePeriod && graceDays !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-1">
                    Your credits have been depleted!
                  </h3>
                  <p className="text-red-700 mb-3">
                    Your products are currently inactive. You have{' '}
                    <span className="font-bold">{graceDays} day{graceDays !== 1 ? 's' : ''}</span>{' '}
                    remaining in your grace period before they are permanently suspended.
                  </p>
                  <button
                    onClick={() => {
                      const element = document.getElementById('purchase-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Purchase Credits Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credit Balance Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#CBB57B] to-[#A89968] rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Credit Balance</h2>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Current Balance</div>
              <motion.div
                key={balance.creditsBalance}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold"
              >
                {balance.creditsBalance}
              </motion.div>
              <div className="text-sm opacity-90">month{balance.creditsBalance !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 opacity-90">
              <span>Available Credits</span>
              <span>{balance.creditsBalance} of {maxMonths} months ({progressPercent.toFixed(0)}%)</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>

          {/* Sub Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm opacity-90">Expires On</span>
              </div>
              <div className="text-lg font-semibold">
                {balance.creditsExpiresAt
                  ? formatDate(balance.creditsExpiresAt)
                  : 'No expiry'}
              </div>
              {expiryDays !== null && expiryDays > 0 && (
                <div className="text-sm opacity-75">in {expiryDays} days</div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm opacity-90">Last Deducted</span>
              </div>
              <div className="text-lg font-semibold">
                {balance.creditsLastDeducted
                  ? formatDate(balance.creditsLastDeducted)
                  : 'Never'}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm opacity-90">Status</span>
              </div>
              <div className="text-lg font-semibold">
                {balance.isInGracePeriod
                  ? 'Grace Period'
                  : balance.creditsBalance > 0
                  ? 'Active'
                  : 'Depleted'}
              </div>
              {balance.isInGracePeriod && graceDays !== null && (
                <div className="text-sm opacity-75">{graceDays} days left</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Purchase Credits Section */}
        <motion.div
          id="purchase-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Credits</h2>

          {/* Month Selection Grid */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select number of months (${price.toFixed(2)}/month)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((months) => (
                <motion.button
                  key={months}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMonths(months)}
                  className={`
                    relative py-4 px-3 rounded-xl border-2 font-semibold transition-all
                    ${
                      selectedMonths === months
                        ? 'bg-[#CBB57B] text-white border-[#CBB57B] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#CBB57B]'
                    }
                  `}
                >
                  {months}
                  <div className="text-xs mt-1 opacity-75">
                    {months === 1 ? 'month' : 'months'}
                  </div>
                  {selectedMonths === months && (
                    <motion.div
                      layoutId="selected-month"
                      className="absolute inset-0 border-2 border-[#CBB57B] rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Price Calculation */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center text-lg mb-2">
              <span className="text-gray-600">Price per month</span>
              <span className="font-semibold">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg mb-2">
              <span className="text-gray-600">Selected months</span>
              <span className="font-semibold">× {selectedMonths}</span>
            </div>
            <div className="border-t border-gray-300 my-3" />
            <div className="flex justify-between items-center text-2xl">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-[#CBB57B]">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || !balance.canPurchase}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg
              flex items-center justify-center gap-3 transition-all
              ${
                isPurchasing || !balance.canPurchase
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#CBB57B] text-white hover:bg-[#A89968] shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Purchase {selectedMonths} Month{selectedMonths > 1 ? 's' : ''} - $
                {totalPrice.toFixed(2)}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!balance.canPurchase && (
            <p className="text-sm text-red-600 text-center mt-3">
              Your account must be approved before purchasing credits
            </p>
          )}
        </motion.div>

        {/* Transaction History */}
        {history && history.transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>

            <div className="space-y-4">
              {history.transactions.map((transaction) => {
                const Icon = TRANSACTION_ICONS[transaction.type];
                const colorClass = TRANSACTION_COLORS[transaction.type];
                const isPositive = transaction.type === 'PURCHASE' || transaction.type === 'BONUS' || transaction.type === 'ADJUSTMENT';

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border-2 rounded-xl p-4 ${colorClass}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {transaction.description || `${transaction.type.toLowerCase()} transaction`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}
                              {transaction.amount}
                            </div>
                            <div className="text-sm text-gray-600">
                              {transaction.balanceBefore} → {transaction.balanceAfter}
                            </div>
                            {transaction.amountPaid && (
                              <div className="text-xs text-gray-500 mt-1">
                                ${Number(transaction.amountPaid).toFixed(2)} {transaction.currency}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {history.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: history.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setHistoryPage(page)}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors
                      ${
                        historyPage === page
                          ? 'bg-[#CBB57B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
