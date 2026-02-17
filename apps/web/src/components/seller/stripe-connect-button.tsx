'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { stripeConnectAPI, StripeAccountStatus } from '@/lib/api/stripe-connect';
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
  CreditCard,
  Shield,
  Zap,
} from 'lucide-react';

interface StripeConnectButtonProps {
  accountId?: string | null;
  accountStatus?: string | null;
  onConnected?: () => void;
  country?: string;
}

export default function StripeConnectButton({
  accountId,
  accountStatus,
  onConnected,
  country = 'US',
}: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check URL params for success/refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const refresh = params.get('refresh');

    if (success === 'true' && accountId) {
      // Onboarding completed, sync status
      syncStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (refresh === 'true') {
      setError('Onboarding session expired. Please try again.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch account status if we have an accountId
  useEffect(() => {
    if (accountId && accountStatus === 'active') {
      fetchStatus();
    }
  }, [accountId, accountStatus]);

  const fetchStatus = async () => {
    if (!accountId) return;

    try {
      const statusData = await stripeConnectAPI.getStatus(accountId);
      setStatus(statusData);
    } catch (err: any) {
      console.error('Failed to fetch Stripe status:', err);
    }
  };

  const syncStatus = async () => {
    if (!accountId) return;

    setIsSyncing(true);
    try {
      await stripeConnectAPI.syncAccount(accountId);
      await fetchStatus();
      if (onConnected) {
        onConnected();
      }
    } catch (err: any) {
      console.error('Failed to sync Stripe status:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeConnectAPI.createAccount({
        country,
        businessType: 'individual',
      });

      // Redirect to Stripe onboarding
      window.location.href = result.onboardingUrl;
    } catch (err: any) {
      console.error('Failed to create Stripe account:', err);
      setError(err.message || 'Failed to connect with Stripe');
      setIsLoading(false);
    }
  };

  const handleRefreshLink = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeConnectAPI.refreshLink(accountId);
      window.location.href = result.onboardingUrl;
    } catch (err: any) {
      console.error('Failed to refresh onboarding link:', err);
      setError(err.message || 'Failed to refresh link');
      setIsLoading(false);
    }
  };

  const handleDashboard = async () => {
    if (!accountId) return;

    setIsLoading(true);
    try {
      const result = await stripeConnectAPI.getDashboardLink(accountId);
      window.open(result.url, '_blank');
    } catch (err: any) {
      console.error('Failed to get dashboard link:', err);
      setError(err.message || 'Failed to open dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Not connected yet
  if (!accountId || accountStatus === 'pending' || accountStatus === 'action_required') {
    return (
      <div className="space-y-4">
        {/* Connect Button */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 mb-2">
                {accountId ? 'Complete Stripe Setup' : 'Connect with Stripe'}
              </h3>
              <p className="text-sm text-indigo-700 mb-4">
                {accountId
                  ? 'Finish setting up your Stripe account to receive automatic payouts.'
                  : 'Connect your Stripe account to receive fast, secure payouts directly to your bank.'}
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-indigo-700">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span>Instant transfers</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-700">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-700">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  <span>Automatic payouts</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={accountId ? handleRefreshLink : handleConnect}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {accountId ? 'Continue Setup' : 'Connect Stripe Account'}
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-indigo-600 mt-3">
                Powered by Stripe Connect • You'll be redirected to Stripe to complete setup
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected and active
  if (accountStatus === 'active' && status) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                Stripe Connected
                {status.payoutsEnabled && (
                  <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">
                    Payouts Enabled
                  </span>
                )}
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Your Stripe account is connected and ready for automatic payouts.
              </p>

              {/* Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.chargesEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-xs text-green-700">
                    Charges {status.chargesEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.payoutsEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-xs text-green-700">
                    Payouts {status.payoutsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.detailsSubmitted ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-xs text-green-700">
                    Details {status.detailsSubmitted ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </div>

              {/* Action Required */}
              {status.requirements.currentlyDue.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-1">Action Required</p>
                  <p className="text-xs text-yellow-700">
                    {status.requirements.currentlyDue.length} requirement(s) need attention.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDashboard}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium text-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Open Dashboard
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={syncStatus}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              <p className="text-xs text-green-600 mt-3">Account ID: {accountId}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
