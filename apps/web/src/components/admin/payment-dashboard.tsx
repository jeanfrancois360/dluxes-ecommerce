'use client';

/**
 * Payment Dashboard Component
 *
 * Displays Stripe payment health, transaction metrics, and webhook statistics
 */

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Activity,
  RefreshCw,
} from 'lucide-react';

interface PaymentHealth {
  period: { days: number; since: string };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    disputed: number;
    successRate: string;
  };
  revenue: {
    total: number;
    average: number;
  };
  recentTransactions: Array<{
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    order: {
      orderNumber: string;
    };
  }>;
}

interface StripeStatus {
  configured: boolean;
  enabled: boolean;
  testMode: boolean;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  currency: string;
  captureMethod: string;
}

interface WebhookStats {
  period: { days: number; since: string };
  totalEvents: number;
  statusBreakdown: Record<string, number>;
  topEventTypes: Array<{ eventType: string; count: number }>;
  successRate: string;
  pendingRetries: number;
}

export function PaymentDashboard() {
  const [paymentHealth, setPaymentHealth] = useState<PaymentHealth | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const [healthRes, statusRes, webhooksRes] = await Promise.all([
        api.get('/payment/health?days=30'),
        api.get('/settings/stripe/status'),
        api.get('/payment/webhooks/statistics?days=7'),
      ]);

      // API client already unwraps the response, so statusRes contains the data directly
      if (healthRes) setPaymentHealth(healthRes);
      if (statusRes) setStripeStatus(statusRes);
      if (webhooksRes) setWebhookStats(webhooksRes);
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connection Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#CBB57B]/10">
                <CreditCard className="h-5 w-5 text-[#CBB57B]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stripe Payment Gateway</h2>
                <p className="text-sm text-gray-500">Connection status and configuration</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              {stripeStatus?.configured && stripeStatus?.enabled ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Connected</div>
                    <div className="text-sm text-gray-500">
                      {stripeStatus?.testMode ? 'Test Mode' : 'Live Mode'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Not Connected</div>
                    <div className="text-sm text-gray-500">Configure in settings</div>
                  </div>
                </>
              )}
            </div>

            {/* Configuration Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              <Activity className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Configuration</div>
                <div className="text-sm text-gray-500">
                  {stripeStatus?.hasPublishableKey && stripeStatus?.hasSecretKey
                    ? 'All keys configured'
                    : 'Incomplete setup'}
                </div>
              </div>
            </div>

            {/* Webhook Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              {stripeStatus?.hasWebhookSecret ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Webhooks Active</div>
                    <div className="text-sm text-gray-500">
                      {webhookStats?.successRate}% success rate
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Webhooks Inactive</div>
                    <div className="text-sm text-gray-500">Configure webhook secret</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm font-medium text-green-600">
              {paymentHealth?.transactions.successRate}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${paymentHealth?.revenue.total.toLocaleString() || 0}
          </h3>
          <p className="text-sm text-gray-600">Total Revenue (30 days)</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-blue-600">
              {paymentHealth?.transactions.successful || 0} success
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {paymentHealth?.transactions.total || 0}
          </h3>
          <p className="text-sm text-gray-600">Total Transactions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-purple-600">
              {stripeStatus?.currency || 'USD'}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${paymentHealth?.revenue.average.toFixed(2) || 0}
          </h3>
          <p className="text-sm text-gray-600">Average Transaction</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-sm font-medium text-red-600">
              {paymentHealth?.transactions.failed || 0} failed
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {paymentHealth?.transactions.disputed || 0}
          </h3>
          <p className="text-sm text-gray-600">Disputed Transactions</p>
        </div>
      </div>

      {/* Recent Transactions & Webhook Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {paymentHealth?.recentTransactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Order #{txn.order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${txn.amount.toFixed(2)} {txn.currency}
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          txn.status === 'SUCCEEDED'
                            ? 'text-green-600'
                            : txn.status === 'FAILED'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {txn.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!paymentHealth?.recentTransactions ||
                paymentHealth.recentTransactions.length === 0) && (
                <div className="text-center py-8 text-gray-500">No recent transactions</div>
              )}
            </div>
          </div>
        </div>

        {/* Webhook Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Webhook Health (7 days)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Success Rate */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-gray-700">Success Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {webhookStats?.successRate}%
                </span>
              </div>

              {/* Total Events */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium text-gray-700">Total Events</span>
                <span className="text-lg font-bold text-blue-600">
                  {webhookStats?.totalEvents || 0}
                </span>
              </div>

              {/* Pending Retries */}
              {(webhookStats?.pendingRetries || 0) > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                  <span className="text-sm font-medium text-gray-700">Pending Retries</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {webhookStats?.pendingRetries}
                  </span>
                </div>
              )}

              {/* Top Event Types */}
              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-gray-700 mb-3">Top Event Types</div>
                <div className="space-y-2">
                  {webhookStats?.topEventTypes.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 pr-2">
                        {event.eventType}
                      </span>
                      <span className="font-medium text-gray-900">{event.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
