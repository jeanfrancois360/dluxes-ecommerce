'use client';

/**
 * Seller Gelato Settings Page
 * Configure per-seller Gelato Print-on-Demand integration
 *
 * v2.9.0 - Per-seller Gelato integration
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import {
  sellerGelatoAPI,
  SellerGelatoSettings,
  UpdateGelatoSettingsDto,
} from '@/lib/api/seller-gelato';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Link as LinkIcon,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import PageHeader from '@/components/seller/page-header';

export default function GelatoSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  // Settings data
  const [settings, setSettings] = useState<SellerGelatoSettings | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Show password toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateGelatoSettingsDto>({
    gelatoApiKey: '',
    gelatoStoreId: '',
    gelatoWebhookSecret: '',
  });

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Fetch settings data
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsData, webhookData] = await Promise.all([
        sellerGelatoAPI.getSettings(),
        sellerGelatoAPI.getWebhookUrl(),
      ]);

      setSettings(settingsData);
      setWebhookUrl(webhookData.webhookUrl);

      // Don't populate sensitive fields - user must re-enter to update
      setFormData({
        gelatoApiKey: '',
        gelatoStoreId: settingsData.gelatoStoreId || '',
        gelatoWebhookSecret: '',
      });
    } catch (err: any) {
      console.error('Failed to fetch Gelato settings:', err);
      setError(err.message || 'Failed to load Gelato settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchSettings();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.gelatoApiKey || !formData.gelatoStoreId) {
      setTestResult({ success: false, message: 'Please enter API Key and Store ID' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await sellerGelatoAPI.testConnection({
        apiKey: formData.gelatoApiKey,
        storeId: formData.gelatoStoreId,
      });

      if (result.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Account: ${result.accountName || 'Verified'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Connection test failed',
        });
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setTestResult(null);

    try {
      // Remove empty fields
      const dataToSend: UpdateGelatoSettingsDto = {};

      if (formData.gelatoApiKey) dataToSend.gelatoApiKey = formData.gelatoApiKey;
      if (formData.gelatoStoreId) dataToSend.gelatoStoreId = formData.gelatoStoreId;
      if (formData.gelatoWebhookSecret)
        dataToSend.gelatoWebhookSecret = formData.gelatoWebhookSecret;

      await sellerGelatoAPI.updateSettings(dataToSend);
      setSuccess('Gelato settings saved and verified successfully!');

      // Clear sensitive fields after save
      setFormData((prev) => ({
        ...prev,
        gelatoApiKey: '',
        gelatoWebhookSecret: '',
      }));

      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      console.error('Failed to update Gelato settings:', err);
      setError(err.message || 'Failed to update Gelato settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;

    try {
      setError(null);
      await sellerGelatoAPI.toggleEnabled(!settings.isEnabled);
      setSuccess(
        `Gelato integration ${!settings.isEnabled ? 'enabled' : 'disabled'} successfully!`
      );
      await fetchSettings();
    } catch (err: any) {
      console.error('Failed to toggle Gelato:', err);
      setError(err.message || 'Failed to toggle Gelato integration');
    }
  };

  const handleCopyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  const isConfigured = settings?.isVerified && settings?.gelatoStoreId;

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="Gelato Integration"
        description="Connect your Gelato account to enable Print-on-Demand products"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Connection Status</h2>
              {isConfigured ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected &amp; Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
              )}

              {settings?.gelatoAccountName && (
                <p className="mt-2 text-sm text-neutral-600">
                  Account: {settings.gelatoAccountName}
                  {settings.gelatoAccountEmail && ` (${settings.gelatoAccountEmail})`}
                </p>
              )}

              {settings?.connectionError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{settings.connectionError}</p>
                </div>
              )}
            </div>

            {isConfigured && (
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-neutral-700">
                  {settings.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={handleToggleEnabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </div>
              </label>
            )}
          </div>
        </motion.div>

        {/* Alert Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm flex-1">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm flex-1">{success}</p>
            </motion.div>
          )}

          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              } border px-4 py-3 rounded-lg flex items-start gap-3`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm flex-1">{testResult.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-gold" />
            <h2 className="text-xl font-semibold text-neutral-900">API Credentials</h2>
          </div>

          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How to get your Gelato API credentials:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Go to{' '}
                    <a
                      href="https://dashboard.gelato.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Gelato Dashboard
                    </a>
                  </li>
                  <li>Navigate to Developer → API Keys</li>
                  <li>Create a new API key and copy it</li>
                  <li>Your Store ID is shown in the dashboard URL or settings</li>
                </ol>
              </div>
            </div>

            {/* Gelato API Key */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Gelato API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="gelatoApiKey"
                  value={formData.gelatoApiKey}
                  onChange={handleInputChange}
                  placeholder={settings?.gelatoApiKey || 'Enter your Gelato API key'}
                  className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                  required={!settings?.gelatoApiKey}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {settings?.gelatoApiKey && (
                <p className="mt-1 text-xs text-neutral-500">Current: {settings.gelatoApiKey}</p>
              )}
            </div>

            {/* Gelato Store ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Gelato Store ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="gelatoStoreId"
                value={formData.gelatoStoreId}
                onChange={handleInputChange}
                placeholder="Enter your Gelato Store ID"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                required={!settings?.gelatoStoreId}
              />
            </div>

            {/* Webhook Secret (Optional) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Webhook Secret <span className="text-neutral-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  name="gelatoWebhookSecret"
                  value={formData.gelatoWebhookSecret}
                  onChange={handleInputChange}
                  placeholder={
                    settings?.gelatoWebhookSecret ? '••••••••' : 'Enter webhook secret (optional)'
                  }
                  className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showWebhookSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                For additional security when configuring webhooks
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.gelatoApiKey || !formData.gelatoStoreId}
                className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Webhook Configuration */}
        {webhookUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="w-6 h-6 text-gold" />
              <h2 className="text-xl font-semibold text-neutral-900">Webhook Configuration</h2>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              Configure this webhook URL in your Gelato dashboard to receive order status updates
              automatically.
            </p>

            {/* Webhook URL Display */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-sm break-all">
                {webhookUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {copiedWebhook ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="text-sm font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Setup Instructions */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-700">
                <li>Copy the webhook URL above</li>
                <li>
                  Go to{' '}
                  <a
                    href="https://dashboard.gelato.com/developer/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline inline-flex items-center gap-1"
                  >
                    Gelato Dashboard → Developer → Webhooks
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Create a new webhook with your URL</li>
                <li>
                  Select events:{' '}
                  <code className="px-1 py-0.5 bg-neutral-200 rounded text-xs">
                    order_status_updated
                  </code>
                  ,{' '}
                  <code className="px-1 py-0.5 bg-neutral-200 rounded text-xs">
                    order_item_tracking_code_updated
                  </code>
                </li>
                <li>Save your webhook secret in the settings above (optional but recommended)</li>
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
