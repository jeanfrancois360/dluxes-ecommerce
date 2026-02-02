'use client';

import { useState } from 'react';
import { useCreditBalance, useCreditPackages } from '@/hooks/use-subscription';
import { creditsApi } from '@/lib/api/credits';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { format } from 'date-fns';
import { Coins, TrendingUp, TrendingDown, Clock, Star, Zap, Plus, History, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SellerCreditsPage() {
  const { balance, availableCredits, isLoading: balanceLoading, refresh } = useCreditBalance();
  const { packages, isLoading: packagesLoading } = useCreditPackages();
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'history'>('overview');
  const [purchasing, setPurchasing] = useState(false);

  const isLoading = balanceLoading || packagesLoading;

  // Fetch transaction history
  const fetchTransactions = async (page: number) => {
    setTransactionsLoading(true);
    try {
      const result = await creditsApi.getHistory({ page, limit: 10 });
      setTransactions(result.transactions || []);
      setTransactionsTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Load transactions when switching to history tab
  const handleTabChange = (tab: 'overview' | 'packages' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history' && transactions.length === 0) {
      fetchTransactions(1);
    }
  };

  const handlePurchasePackage = async (packageId: string) => {
    try {
      setPurchasing(true);
      const response = await creditsApi.purchase(packageId);

      // Redirect to Stripe Checkout
      if (response.sessionUrl) {
        window.location.href = response.sessionUrl;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to initiate purchase. Please try again.');
      setPurchasing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'BONUS':
      case 'REFUND':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'DEBIT':
      case 'EXPIRATION':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'BONUS':
      case 'REFUND':
        return 'text-green-600';
      case 'DEBIT':
      case 'EXPIRATION':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-gray-600">Manage your listing credits and purchase packages</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => handleTabChange('overview')}
          className={cn(
            'px-4 py-2 font-medium transition-colors relative',
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => handleTabChange('packages')}
          className={cn(
            'px-4 py-2 font-medium transition-colors relative',
            activeTab === 'packages'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Buy Credits
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={cn(
            'px-4 py-2 font-medium transition-colors relative',
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Transaction History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Credit Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Available Credits</p>
                  <h2 className="text-4xl font-bold">{availableCredits}</h2>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('packages')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Buy Credits
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <p className="text-blue-100 text-sm mb-1">Lifetime Credits</p>
                <p className="text-2xl font-semibold">{balance?.lifetimeCredits || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Used</p>
                <p className="text-2xl font-semibold">{balance?.lifetimeUsed || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Purchased</p>
                <p className="text-2xl font-semibold">{balance?.purchasedCredits || 0}</p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">How Credits Work</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Credits are used to list products on the marketplace. Different product types
                    and features may require different amounts of credits. Purchase credit packages
                    to ensure uninterrupted listings.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Earn Free Credits</h3>
                  <p className="text-sm text-green-700 leading-relaxed">
                    New sellers receive bonus credits upon registration. Additionally, credits are
                    included with your subscription plan. Upgrade your plan to get more monthly credits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Credit Usage Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Standard Product Listing</span>
                <span className="font-semibold">1 credit</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Featured Product (per day)</span>
                <span className="font-semibold">5 credits</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Premium Placement</span>
                <span className="font-semibold">10 credits</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> Larger packages offer better value per credit. Purchase in bulk to save more!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'bg-white rounded-lg border-2 p-6 relative transition-all hover:shadow-lg',
                  pkg.isPopular ? 'border-blue-500 shadow-md' : 'border-gray-200'
                )}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>

                <div className="text-center mb-6 pb-6 border-b">
                  <div className="text-4xl font-bold mb-1">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">credits</div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold mb-1">
                    ${formatCurrencyAmount(pkg.price)}
                  </div>
                  {pkg.savingsPercent > 0 && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <TrendingDown className="w-4 h-4" />
                      Save {pkg.savingsPercent}%
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePurchasePackage(pkg.id)}
                  className={cn(
                    'w-full py-3 rounded-lg font-semibold transition-colors',
                    pkg.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  )}
                >
                  Purchase Package
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Transaction History</h3>
              </div>
            </div>

            {transactionsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your credit transaction history will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              {transaction.description || transaction.action}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                              <span className={cn(
                                'text-xs px-2 py-1 rounded-full',
                                transaction.type === 'PURCHASE' || transaction.type === 'BONUS' || transaction.type === 'REFUND'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              )}>
                                {transaction.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'text-lg font-bold',
                              getTransactionColor(transaction.type)
                            )}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                            </p>
                            <p className="text-sm text-gray-500">
                              Balance: {transaction.balanceAfter}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {transactionsTotal > 10 && (
                  <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {(transactionsPage - 1) * 10 + 1} to {Math.min(transactionsPage * 10, transactionsTotal)} of {transactionsTotal} transactions
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newPage = transactionsPage - 1;
                          setTransactionsPage(newPage);
                          fetchTransactions(newPage);
                        }}
                        disabled={transactionsPage === 1}
                        className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          const newPage = transactionsPage + 1;
                          setTransactionsPage(newPage);
                          fetchTransactions(newPage);
                        }}
                        disabled={transactionsPage * 10 >= transactionsTotal}
                        className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
